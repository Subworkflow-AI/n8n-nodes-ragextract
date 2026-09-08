import type { INodeProperties } from 'n8n-workflow';
import { columnLocator } from '../shared/descriptions';

const show = { resource: ['tableColumn'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

const OUTPUT_TYPES = [
	{ name: 'Boolean', value: 'boolean' },
	{ name: 'Categorical', value: 'categorical' },
	{ name: 'Date', value: 'date' },
	{ name: 'Image', value: 'image', description: 'Answers with a region of a page rather than text' },
	{ name: 'Image List', value: 'image_list' },
	{ name: 'List Scalar', value: 'list_scalar' },
	{ name: 'Number', value: 'number' },
	{ name: 'Text Quote', value: 'text_quote' },
];

/**
 * Columns — one question, asked of every row.
 *
 * Editing a column's prompt or output type bumps its version and marks every cell stale, which is
 * why `Update` and `Run` sit next to each other: the second is usually what you want after the
 * first. Changing `config` alone (a categorical column's options, a date column's display mode)
 * stales nothing.
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
			action: 'Create a column',
			description: 'Add a column to a table',
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a column',
			description: 'Archive a column. Its cells are kept.',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many columns',
			description: 'Get every active column of a table',
		},
		{
			name: 'Run',
			value: 'run',
			action: 'Run a column',
			description: 'Run one column across every row. Spends credits per cell.',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a column',
			description: 'Update a column. Editing the prompt or output type marks every cell stale.',
		},
	],
	default: 'getAll',
};

const columnSettings: INodeProperties[] = [
	{
		displayName: 'Compositional',
		name: 'isCompositional',
		type: 'boolean',
		default: false,
		description:
			'Whether the answer spans documents rather than living in one of them. Off uses the map-reduce default.',
	},
	{
		displayName: 'Config (JSON)',
		name: 'config',
		type: 'string',
		default: '',
		placeholder: 'e.g. {"categories":["Yes","No"]}',
		description:
			'Type-specific configuration, passed through verbatim. "categories" for a categorical column, "dateDisplay" for a date one.',
	},
	{
		displayName: 'Credit Rate',
		name: 'creditRate',
		type: 'number',
		typeOptions: { minValue: 4, maxValue: 40 },
		default: 4,
		description:
			'Credits charged per cell. Valid range is 4-40; a typed column is 4, a list column around 12. Omit to let the server apply its default.',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Name of the column',
	},
	{
		displayName: 'Output Type',
		name: 'outputType',
		type: 'options',
		options: OUTPUT_TYPES,
		default: 'text_quote',
		description: 'Shape of the answer this column produces',
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'The question asked of each row',
	},
	{
		displayName: 'Sort Order',
		name: 'sortOrder',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Position of the column in the table',
	},
];

export const fields: INodeProperties[] = [
	{
		...columnLocator,
		displayOptions: { show: showFor('delete', 'run', 'update') },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('create') },
		default: '',
		description: 'Name of the column',
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		displayOptions: { show: showFor('create') },
		default: '',
		description: 'The question asked of each row',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('create') },
		options: columnSettings.filter((field) => !['name', 'prompt'].includes(field.name)),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add field',
		default: {},
		displayOptions: { show: showFor('update') },
		options: columnSettings,
	},
];
