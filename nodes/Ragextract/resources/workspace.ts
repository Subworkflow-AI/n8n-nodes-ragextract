import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['workspace'] };

/**
 * Workspaces — the container every other `/v2` route hangs off.
 *
 * `Get Many` is the natural first call for a personal key: the key spans workspaces, and this is
 * how a workflow discovers which ones it reaches without provoking a 404 per guess. Each entry
 * carries `level` — 1 read, 2 read & write, 3 manage, and 0 when the key reaches only specific
 * tables inside the workspace and nothing else in it.
 */
export const operations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a workspace',
			description: 'Create a workspace. Organisation owners and admins only.',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a workspace',
			description: 'Get a single workspace and this key\'s level in it',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many workspaces',
			description: 'Get every workspace this API key can reach',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a workspace',
			description: 'Rename a workspace. Requires a manage-level grant.',
		},
	],
	default: 'getAll',
};

export const fields: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: { show: { ...show, operation: ['create', 'update'] } },
		default: '',
		description: 'Name of the workspace',
	},
];
