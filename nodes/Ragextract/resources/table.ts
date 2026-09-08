import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['table'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

/**
 * Tables — user-defined typed columns × rows of files or bundles, producing extracted cells.
 *
 * `Get` returns the whole table in one call: metadata, columns, rows and cells. `Delete` archives
 * rather than destroys — columns, rows, cells and the audit trail are kept.
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
			action: 'Create a table',
			description: 'Create a table in a workspace',
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a table',
			description: 'Archive a table. Its columns, rows, cells and audit trail are kept.',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a table',
			description: 'Get a table with its columns, rows and cells',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many tables',
			description: 'Get every table in a workspace',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a table',
			description: 'Update a table\'s name, colour, locale or standing flag',
		},
	],
	default: 'getAll',
};

const tableSettings: INodeProperties[] = [
	{
		displayName: 'Color',
		name: 'color',
		type: 'color',
		default: '',
		description: 'Display colour for the table',
	},
	{
		displayName: 'Locale',
		name: 'locale',
		type: 'string',
		default: '',
		placeholder: 'e.g. de',
		description:
			'BCP-47 primary language subtag the engine answers in. Empty means English. Changing it marks every cell stale.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Name of the table',
	},
	{
		displayName: 'Standing',
		name: 'standing',
		type: 'boolean',
		default: false,
		description: 'Whether to run this table automatically against each new file uploaded to the workspace',
	},
];

export const fields: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('create') },
		default: '',
		description: 'Name of the table',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('create') },
		options: tableSettings.filter((field) => field.name !== 'name'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add field',
		default: {},
		displayOptions: { show: showFor('update') },
		options: tableSettings,
	},
];
