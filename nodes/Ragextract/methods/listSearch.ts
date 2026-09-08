import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, workspacePath } from '../transport';

/**
 * Dropdowns for the resource locators.
 *
 * `/v2` has no search parameter on any listing endpoint, so the typed filter is applied here. The
 * two paginated listings (files, jobs) page through `offset`; the rest are unpaginated collections
 * the API returns whole.
 */

const PAGE_SIZE = 50;

/** Resolves the workspace the dropdown should look inside, from the locator above it in the panel. */
function currentWorkspaceId(ctx: ILoadOptionsFunctions): string {
	const value = ctx.getCurrentNodeParameter('workspace', { extractValue: true }) as string;
	if (!value) {
		throw new NodeOperationError(ctx.getNode(), 'Select a workspace first.');
	}
	return value;
}

function currentTableId(ctx: ILoadOptionsFunctions): string {
	const value = ctx.getCurrentNodeParameter('table', { extractValue: true }) as string;
	if (!value) {
		throw new NodeOperationError(ctx.getNode(), 'Select a table first.');
	}
	return value;
}

function matches(filter: string | undefined, ...haystack: Array<string | undefined>): boolean {
	if (!filter) return true;
	const needle = filter.toLowerCase();
	return haystack.some((value) => value?.toLowerCase().includes(needle));
}

/** One page of a paginated listing. The cursor is the next offset, as n8n hands it back verbatim. */
async function paginated(
	ctx: ILoadOptionsFunctions,
	path: string,
	qs: IDataObject,
	paginationToken: string | undefined,
	toItem: (row: IDataObject) => INodeListSearchItems,
	filter?: string,
): Promise<INodeListSearchResult> {
	const offset = Number(paginationToken ?? 0);
	const response = await apiRequest<IDataObject[]>(ctx, 'GET', path, {
		qs: { ...qs, offset, limit: PAGE_SIZE },
	});
	const rows = response.data ?? [];
	const results = rows.map(toItem).filter((item) => matches(filter, item.name, String(item.value)));

	return {
		results,
		paginationToken: rows.length < PAGE_SIZE ? undefined : String(offset + PAGE_SIZE),
	};
}

export async function searchWorkspaces(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const response = await apiRequest<IDataObject[]>(this, 'GET', '/workspaces');
	const results = (response.data ?? [])
		.map((row) => ({
			// `level` 0 means the key reaches only specific tables inside the workspace, so a
			// workspace-level operation there will 403 — worth seeing before selecting it.
			name: `${row.name as string}${row.level === 0 ? ' (tables only)' : ''}`,
			value: row.id as string,
		}))
		.filter((item) => matches(filter, item.name, item.value));
	return { results };
}

export async function searchFiles(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await paginated(
		this,
		workspacePath(currentWorkspaceId(this), '/files'),
		// No share links needed to fill a dropdown, and minting one per row is not free.
		{ sort: '-createdAt', expiresInSeconds: 0 },
		paginationToken,
		(row) => ({
			name: `${row.fileName as string}.${row.fileExt as string}`,
			value: row.id as string,
		}),
		filter,
	);
}

export async function searchJobs(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await paginated(
		this,
		workspacePath(currentWorkspaceId(this), '/jobs'),
		{},
		paginationToken,
		(row) => ({
			name: `${row.id as string} — ${row.type as string} (${row.status as string})`,
			value: row.id as string,
		}),
		filter,
	);
}

export async function searchTables(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const response = await apiRequest<IDataObject[]>(
		this,
		'GET',
		workspacePath(currentWorkspaceId(this), '/tables'),
	);
	const results = (response.data ?? [])
		.map((row) => ({ name: row.name as string, value: row.id as string }))
		.filter((item) => matches(filter, item.name, item.value));
	return { results };
}

export async function searchBundles(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const response = await apiRequest<IDataObject[]>(
		this,
		'GET',
		workspacePath(currentWorkspaceId(this), '/bundles'),
	);
	const results = (response.data ?? [])
		.map((row) => ({ name: row.name as string, value: row.id as string }))
		.filter((item) => matches(filter, item.name, item.value));
	return { results };
}

export async function searchColumns(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const workspaceId = currentWorkspaceId(this);
	const tableId = currentTableId(this);
	const response = await apiRequest<IDataObject[]>(
		this,
		'GET',
		workspacePath(workspaceId, `/tables/${tableId}/columns`),
	);
	const results = (response.data ?? [])
		.map((row) => ({
			name: `${row.name as string} (${row.outputType as string})`,
			value: row.id as string,
		}))
		.filter((item) => matches(filter, item.name, item.value));
	return { results };
}

export async function searchRows(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const workspaceId = currentWorkspaceId(this);
	const tableId = currentTableId(this);
	const response = await apiRequest<IDataObject[]>(
		this,
		'GET',
		workspacePath(workspaceId, `/tables/${tableId}/rows`),
	);
	const results = (response.data ?? [])
		.map((row) => ({
			// A row has no name of its own — it IS its subject, so that is what identifies it.
			name: `${row.subjectType as string}: ${row.subjectId as string}`,
			value: row.id as string,
		}))
		.filter((item) => matches(filter, item.name, item.value));
	return { results };
}
