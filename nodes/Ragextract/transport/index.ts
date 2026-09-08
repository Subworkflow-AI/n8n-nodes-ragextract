import type {
	IBinaryData,
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

export const CREDENTIAL_NAME = 'ragextractApi';
export const DEFAULT_HOST = 'https://api.ragextract.com';

/**
 * The only API version this node speaks.
 *
 * `/v2` nests every resource under `/workspaces/:workspaceId` and authenticates with a personal key
 * (`psk_`), so the workspace is a parameter of the node rather than a property of the credential.
 * A workspace key (`sk_`) also reaches `/v2`, pinned to the one workspace it belongs to.
 */
const API_VERSION = 'v2';

export type RagextractContext = IExecuteFunctions | ILoadOptionsFunctions;

/** Every `/v2` response is this envelope. `total` is the size of the PAGE, not of the collection. */
export type ApiEnvelope<T> = {
	success: boolean;
	error?: string;
	total?: number;
	data?: T;
	offset?: number;
	limit?: number;
};

export type RequestOptions = {
	qs?: IDataObject;
	body?: IDataObject | FormData;
	/** False for multipart form bodies, which must not be JSON-encoded. */
	json?: boolean;
	/** Attempts when the API rate-limits (429). 1 surfaces the 429 immediately. */
	maxRetries?: number;
};

export async function getBaseUrl(ctx: RagextractContext): Promise<string> {
	const credentials = await ctx.getCredentials(CREDENTIAL_NAME);
	const host = ((credentials.baseUrl as string) || DEFAULT_HOST).trim().replace(/\/+$/, '');
	return `${host}/${API_VERSION}`;
}

/**
 * One request against `/v2`.
 *
 * Errors are re-thrown as `NodeApiError` so the API's own `{ success: false, error }` message
 * reaches the workflow author — a 402 for exhausted credits and a 403 for an under-scoped key are
 * the two failures a caller most needs to read, and an opaque "request failed" hides both.
 */
export async function apiRequest<T = IDataObject>(
	ctx: RagextractContext,
	method: IHttpRequestMethods,
	path: string,
	options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
	const baseUrl = await getBaseUrl(ctx);
	const requestOptions: IHttpRequestOptions = {
		url: `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
		method,
		json: options.json ?? true,
	};
	if (options.qs !== undefined) requestOptions.qs = pruneEmpty(options.qs);
	if (options.body !== undefined) requestOptions.body = options.body;

	const maxAttempts = options.maxRetries ?? DEFAULT_MAX_RETRIES;
	for (let attempt = 1; ; attempt++) {
		try {
			return (await ctx.helpers.httpRequestWithAuthentication.call(
				ctx,
				CREDENTIAL_NAME,
				requestOptions,
			)) as ApiEnvelope<T>;
		} catch (error) {
			// Safe to replay: rate limiting is middleware ahead of every handler, so a 429 means the
			// operation did not run. This is what lets a multipart upload finish at all — the API's
			// write limit is 15/min and every part is a write, so a large file WILL be throttled
			// part-way through. Deliberately not extended to 5xx, where the handler may have run.
			if (attempt < maxAttempts && statusOf(error) === 429) {
				await sleep(retryDelayMs(error, attempt));
				continue;
			}
			throw new NodeApiError(ctx.getNode(), error as never);
		}
	}
}

/** Ten attempts with the backoff below spans roughly four minutes — about four rate-limit windows. */
const DEFAULT_MAX_RETRIES = 10;
const MAX_BACKOFF_MS = 60_000;

function statusOf(error: unknown): number | undefined {
	const candidate = error as {
		statusCode?: number;
		httpCode?: number | string;
		response?: { status?: number };
	};
	const raw = candidate?.statusCode ?? candidate?.response?.status ?? candidate?.httpCode;
	return raw === undefined ? undefined : Number(raw);
}

/**
 * Honours `Retry-After` when the API sends one, otherwise backs off exponentially from ~1s, capped
 * at one full rate-limit window. The jitter matters: a multipart upload has several parts in
 * flight, and without it every rejected part wakes at the same instant and collides again.
 */
function retryDelayMs(error: unknown, attempt: number): number {
	const headers = (error as { response?: { headers?: Record<string, string> } })?.response?.headers;
	const retryAfter = Number(headers?.['retry-after'] ?? headers?.['Retry-After']);
	if (Number.isFinite(retryAfter) && retryAfter >= 0) return retryAfter * 1000;
	return Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS) + Math.floor(Math.random() * 500);
}

/**
 * Follows `offset`/`limit` until a short page comes back.
 *
 * The listing envelope's `total` counts the page, not the collection, so there is nothing to
 * compare a running count against — a page smaller than the requested limit is the only end-of-list
 * signal `/v2` gives. `MAX_PAGES` stops a runaway loop if a future endpoint ever pads its pages.
 */
export async function apiRequestAllItems<T = IDataObject>(
	ctx: RagextractContext,
	method: IHttpRequestMethods,
	path: string,
	options: RequestOptions = {},
): Promise<T[]> {
	const PAGE_SIZE = 100;
	const MAX_PAGES = 500;

	const results: T[] = [];
	let offset = Number(options.qs?.offset ?? 0);

	for (let page = 0; page < MAX_PAGES; page++) {
		const response = await apiRequest<T[]>(ctx, method, path, {
			...options,
			qs: { ...options.qs, offset, limit: PAGE_SIZE },
		});
		const items = response.data ?? [];
		results.push(...items);
		if (items.length < PAGE_SIZE) break;
		offset += PAGE_SIZE;
	}

	return results;
}

/** Drops keys the API would reject or ignore, so optional node fields can be passed through blind. */
export function pruneEmpty(input: IDataObject): IDataObject {
	const output: IDataObject = {};
	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value) && value.length === 0) continue;
		output[key] = value;
	}
	return output;
}

/** Splits a comma-delimited node field into ids, optionally keeping only one prefix. */
export function splitIds(value: string | string[] | undefined, prefix?: string): string[] {
	if (!value) return [];
	const parts = Array.isArray(value) ? value : value.split(',');
	const ids = parts.map((part) => String(part).trim()).filter(Boolean);
	return prefix ? ids.filter((id) => id.startsWith(prefix)) : ids;
}

export function workspacePath(workspaceId: string, suffix = ''): string {
	return `/workspaces/${workspaceId}${suffix}`;
}

/* ── polling ──────────────────────────────────────────────────────────────── */

const TERMINAL_JOB_STATUSES = ['SUCCESS', 'ERROR'];
/** A run has one terminal state an ingest job cannot reach: someone stopped it. */
const TERMINAL_RUN_STATUSES = [...TERMINAL_JOB_STATUSES, 'CANCELED'];

const POLL_INTERVAL_MS = 2000;

async function pollUntilTerminal(
	ctx: IExecuteFunctions,
	path: string,
	terminal: string[],
	timeoutSeconds: number,
	label: string,
): Promise<IDataObject> {
	const deadline = Date.now() + timeoutSeconds * 1000;
	let last: IDataObject | undefined;

	while (Date.now() < deadline) {
		await sleep(POLL_INTERVAL_MS);
		const response = await apiRequest<IDataObject>(ctx, 'GET', path);
		last = response.data;
		const status = last?.status as string | undefined;
		if (status && terminal.includes(status)) return last as IDataObject;
	}

	// Deliberately an error rather than the last snapshot: a caller that treats "still running" as
	// "finished" reads an empty result as an empty document.
	throw new NodeOperationError(
		ctx.getNode(),
		`Timed out after ${timeoutSeconds}s waiting for ${label} to finish. Raise "Poll Timeout", or turn "Wait For Completion" off and poll it in a later node.`,
	);
}

/** Waits for an ingest job, then returns the file it produced. */
export async function waitForIngest(
	ctx: IExecuteFunctions,
	workspaceId: string,
	job: IDataObject,
	timeoutSeconds: number,
	shareTtlSeconds?: number,
): Promise<IDataObject> {
	const jobId = job.id as string | undefined;
	if (!jobId?.startsWith('dsj_')) return job;

	const finished = await pollUntilTerminal(
		ctx,
		workspacePath(workspaceId, `/jobs/${jobId}`),
		TERMINAL_JOB_STATUSES,
		timeoutSeconds,
		`job ${jobId}`,
	);

	// `POST W/files` answers with `fileId`, but `GET W/jobs/:jobId` still answers with `datasetId` —
	// it is /v1's handler, mounted unchanged. Read both rather than depending on which one replied.
	const fileId = (finished.fileId ?? finished.datasetId ?? job.fileId ?? job.datasetId) as
		| string
		| undefined;
	if (!fileId) return finished;

	const file = await apiRequest<IDataObject>(
		ctx,
		'GET',
		workspacePath(workspaceId, `/files/${fileId}`),
		{ qs: shareTtlSeconds ? { expiresInSeconds: shareTtlSeconds } : undefined },
	);
	return file.data ?? finished;
}

/** Waits for a table run, then returns the table's cells. */
export async function waitForRun(
	ctx: IExecuteFunctions,
	workspaceId: string,
	tableId: string,
	runId: string,
	timeoutSeconds: number,
): Promise<IDataObject[]> {
	await pollUntilTerminal(
		ctx,
		workspacePath(workspaceId, `/tables/${tableId}/runs/${runId}`),
		TERMINAL_RUN_STATUSES,
		timeoutSeconds,
		`run ${runId}`,
	);
	const cells = await apiRequest<IDataObject[]>(
		ctx,
		'GET',
		workspacePath(workspaceId, `/tables/${tableId}/cells`),
	);
	return cells.data ?? [];
}

/* ── binary ───────────────────────────────────────────────────────────────── */

const MIME_BY_ROW: Record<string, string> = {
	pdf: 'application/pdf',
	jpg: 'image/jpeg',
};

/**
 * Fetches the page behind a file item's signed share link.
 *
 * Items carry `row` — the format the page was rendered to — so the extension and MIME type come
 * from the item rather than from a guess. `embedding_image` rows have no useful binary and fall
 * through to the octet-stream default.
 */
export async function downloadShare(
	ctx: IExecuteFunctions,
	item: IDataObject,
): Promise<IBinaryData | undefined> {
	const share = item.share as { url?: string } | undefined;
	if (!share?.url) return undefined;

	const row = (item.row as string) ?? 'pdf';
	const mimeType = MIME_BY_ROW[row] ?? 'application/octet-stream';
	const extension = row in MIME_BY_ROW ? row : 'bin';

	const buffer = (await ctx.helpers.httpRequest.call(ctx, {
		url: share.url,
		method: 'GET',
		encoding: 'arraybuffer',
	})) as Buffer;

	return await ctx.helpers.prepareBinaryData(buffer, `${item.id}.${extension}`, mimeType);
}

/* ── multipart form bodies ────────────────────────────────────────────────── */

export type FormField = {
	/** Named `field` rather than `name`: the n8n node lint rule reads a `name`/`value` pair as a node parameter. */
	field: string;
	value: string | number | Buffer;
	fileName?: string;
	contentType?: string;
};

export function createForm(fields: FormField[]): FormData {
	if (typeof FormData === 'undefined' || typeof Blob === 'undefined') {
		throw new Error('FormData and Blob are not available in this runtime environment');
	}
	const form = new FormData();
	for (const field of fields) {
		if (typeof field.value === 'string' || typeof field.value === 'number') {
			form.append(field.field, String(field.value));
		} else {
			form.append(
				field.field,
				new Blob([new Uint8Array(field.value)], { type: field.contentType }),
				field.fileName ?? 'untitled.bin',
			);
		}
	}
	return form;
}
