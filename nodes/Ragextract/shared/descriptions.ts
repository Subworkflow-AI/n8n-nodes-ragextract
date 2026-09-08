import type { INodeProperties } from 'n8n-workflow';

/**
 * Properties shared across resources.
 *
 * `/v2` nests every route under `/workspaces/:workspaceId`, so the workspace locator belongs to
 * almost every operation — but it is declared per-resource-group rather than once with a `hide`
 * clause. n8n's `hide` is ANY-of, not all-of: `hide: { resource: ['workspace'], operation:
 * ['getAll'] }` would hide the locator on EVERY resource's Get Many, not just the workspace one.
 * Two `show` blocks state the same intent and cannot be read the other way.
 */

/** Resources whose routes live inside a table, and which therefore always need one. */
const TABLE_CHILD_RESOURCES = ['tableCell', 'tableColumn', 'tableRow', 'tableRun'];

/** Every resource whose routes are nested under a workspace, other than workspace itself. */
const WORKSPACE_SCOPED_RESOURCES = ['bundle', 'file', 'job', 'table', ...TABLE_CHILD_RESOURCES];

const workspaceLocatorBase: INodeProperties = {
	displayName: 'Workspace',
	name: 'workspace',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The workspace to act in',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a workspace...',
			typeOptions: {
				searchListMethod: 'searchWorkspaces',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. wks_1a2b3c4d5e6f7g8h',
		},
	],
};

/**
 * Shown for every resource that needs one.
 *
 * Listing and creating workspaces are the only two operations that cannot know a workspace, so the
 * `workspace` resource gets its own narrower block.
 */
export const workspaceLocator: INodeProperties[] = [
	{
		...workspaceLocatorBase,
		displayOptions: { show: { resource: WORKSPACE_SCOPED_RESOURCES } },
	},
	{
		...workspaceLocatorBase,
		displayOptions: { show: { resource: ['workspace'], operation: ['get', 'update'] } },
	},
];

const tableLocatorBase: INodeProperties = {
	displayName: 'Table',
	name: 'table',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The table to act on',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a table...',
			typeOptions: {
				searchListMethod: 'searchTables',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. rev_1a2b3c4d5e6f7g8h',
		},
	],
};

/** Same split, for the table: its own Create and Get Many have no table to point at. */
export const tableLocator: INodeProperties[] = [
	{
		...tableLocatorBase,
		displayOptions: { show: { resource: TABLE_CHILD_RESOURCES } },
	},
	{
		...tableLocatorBase,
		displayOptions: { show: { resource: ['table'], operation: ['delete', 'get', 'update'] } },
	},
];

export const fileLocator: INodeProperties = {
	displayName: 'File',
	name: 'file',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The ingested file to act on',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a file...',
			typeOptions: {
				searchListMethod: 'searchFiles',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. ds_1a2b3c4d5e6f7g8h',
		},
	],
};

export const bundleLocator: INodeProperties = {
	displayName: 'Bundle',
	name: 'bundle',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The bundle to act on',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a bundle...',
			typeOptions: {
				searchListMethod: 'searchBundles',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. bndl_1a2b3c4d5e6f7g8h',
		},
	],
};

export const jobLocator: INodeProperties = {
	displayName: 'Job',
	name: 'job',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The ingest job to act on',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a job...',
			typeOptions: {
				searchListMethod: 'searchJobs',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. dsj_1a2b3c4d5e6f7g8h',
		},
	],
};

export const columnLocator: INodeProperties = {
	displayName: 'Column',
	name: 'column',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The table column to act on',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a column...',
			typeOptions: {
				searchListMethod: 'searchColumns',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. rcol_1a2b3c4d5e6f7g8h',
		},
	],
};

export const rowLocator: INodeProperties = {
	displayName: 'Row',
	name: 'row',
	type: 'resourceLocator',
	required: true,
	default: { mode: 'list', value: '' },
	description: 'The table row to act on',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a row...',
			typeOptions: {
				searchListMethod: 'searchRows',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. rrow_1a2b3c4d5e6f7g8h',
		},
	],
};

/** Reusable option entries for `collection` properties. */

export const shareTtlOption: INodeProperties = {
	displayName: 'File Share Expiry (Seconds)',
	name: 'expiresInSeconds',
	type: 'number',
	typeOptions: { minValue: 60 },
	default: 600,
	description: 'How long the signed share link returned with each file or page stays valid',
};

export const offsetOption: INodeProperties = {
	displayName: 'Offset',
	name: 'offset',
	type: 'number',
	typeOptions: { minValue: 0 },
	default: 0,
	description: 'Number of results to skip before returning the first one',
};

export const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'sort',
	type: 'string',
	default: '',
	placeholder: 'e.g. -createdAt',
	description: 'Sort by property, prefixed with "-" for descending. Comma-delimited.',
};

export function returnAll(show: Record<string, string[]>): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: { show },
			default: false,
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			displayOptions: { show: { ...show, returnAll: [false] } },
			typeOptions: { minValue: 1, maxValue: 100 },
			default: 50,
			description: 'Max number of results to return',
		},
	];
}

export function withBinary(show: Record<string, string[]>): INodeProperties {
	return {
		displayName: 'Download Files',
		name: 'shouldDownloadBinary',
		type: 'boolean',
		displayOptions: { show },
		default: true,
		description:
			'Whether to fetch each result\'s page through its share link and attach it as binary data',
	};
}
