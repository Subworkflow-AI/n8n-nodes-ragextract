import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { apiRequest, createForm, workspacePath } from './index';

/** Above this the single-shot upload is refused by the API and a multipart session is used instead. */
export const SINGLE_SHOT_LIMIT_BYTES = 100 * 1024 * 1024;

export const DEFAULT_CHUNK_SIZE_BYTES = 10 * 1024 * 1024;

/** Parts in flight. Four is what the SDK uses; more only wins races against the write rate limit. */
const CONCURRENCY = 4;

type UploadSessionPart = { etag: string; partNumber: number };

export type MultipartUploadOpts = {
	fileName: string;
	fileExt: string;
	fileType: string;
	expiresInDays?: number;
	chunkSize?: number;
};

/**
 * The four-call multipart protocol: start, append × N, end.
 *
 * `/v2` nests all of it under the workspace's files, and `end` is the call that creates the ingest
 * job — so its response, not `start`'s, is what the caller polls. A half-finished session holds an
 * R2 multipart upload open, hence the best-effort abort: failing to clean up must not replace the
 * error the workflow author actually needs to see.
 */
export async function uploadMultipart(
	ctx: IExecuteFunctions,
	workspaceId: string,
	buffer: Buffer,
	opts: MultipartUploadOpts,
): Promise<IDataObject> {
	const base = workspacePath(workspaceId, '/files');
	const chunkSize = opts.chunkSize && opts.chunkSize > 0 ? opts.chunkSize : DEFAULT_CHUNK_SIZE_BYTES;

	const startFields = [
		{ field: 'fileName', value: opts.fileName },
		{ field: 'fileExt', value: opts.fileExt },
		{ field: 'fileType', value: opts.fileType },
	];
	// No `jobType`: /v2 has one ingest verb and the endpoint does not accept the parameter.
	if (opts.expiresInDays !== undefined) {
		startFields.push({ field: 'expiresInDays', value: String(opts.expiresInDays) });
	}

	const started = await apiRequest<{ key: string }>(ctx, 'POST', `${base}/upload_session/start`, {
		body: createForm(startFields),
		json: false,
	});
	const key = started.data?.key;
	if (!key) throw new Error("Upload session did not return a 'key'.");

	try {
		const parts = await appendAll(ctx, base, key, buffer, chunkSize);
		const ended = await apiRequest<IDataObject>(ctx, 'POST', `${base}/upload_session/end`, {
			body: createForm([
				{ field: 'key', value: key },
				{ field: 'parts', value: JSON.stringify(parts) },
			]),
			json: false,
		});
		if (!ended.data) throw new Error(ended.error ?? 'Upload completed but no ingest job was queued.');
		return ended.data;
	} catch (error) {
		await apiRequest(ctx, 'POST', `${base}/upload_session/abort`, {
			body: createForm([{ field: 'key', value: key }]),
			json: false,
			maxRetries: 1,
		}).catch(() => undefined);
		throw error;
	}
}

async function appendAll(
	ctx: IExecuteFunctions,
	base: string,
	key: string,
	buffer: Buffer,
	chunkSize: number,
): Promise<UploadSessionPart[]> {
	const partCount = Math.ceil(buffer.byteLength / chunkSize);
	const parts: UploadSessionPart[] = [];
	let next = 0;

	const worker = async () => {
		for (let index = next++; index < partCount; index = next++) {
			const partNumber = index + 1;
			const chunk = buffer.subarray(index * chunkSize, (index + 1) * chunkSize);
			const response = await apiRequest<UploadSessionPart>(
				ctx,
				'POST',
				`${base}/upload_session/append`,
				{
					body: createForm([
						{ field: 'key', value: key },
						{ field: 'partNumber', value: String(partNumber) },
						{ field: 'file', value: chunk, fileName: `${key}_${partNumber}` },
					]),
					json: false,
				},
			);
			const part = response.data;
			if (!part?.etag) throw new Error(`Part ${partNumber} response is missing 'etag'.`);
			parts.push({ etag: part.etag, partNumber: part.partNumber ?? partNumber });
		}
	};

	await Promise.all(Array.from({ length: Math.min(CONCURRENCY, partCount) }, worker));

	// R2 completes a multipart upload only with the parts in order.
	return parts.sort((a, b) => a.partNumber - b.partNumber);
}
