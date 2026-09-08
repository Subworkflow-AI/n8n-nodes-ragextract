import type { INodeProperties } from 'n8n-workflow';
import { rowLocator } from '../shared/descriptions';

const show = { resource: ['tableRow'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

/**
 * Rows — the subjects a table's columns are asked about.
 *
 * A row points at either a single file or a bundle, and `Delete` is a hard delete: the row's cells,
 * their events and their facts go with it.
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
			action: 'Create a row',
			description: 'Add a file or bundle to a table as a row',
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a row',
			description: 'Delete a row along with its cells, events and facts',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many rows',
			description: 'Get every row of a table',
		},
	],
	default: 'getAll',
};

export const fields: INodeProperties[] = [
	{
		...rowLocator,
		displayOptions: { show: showFor('delete') },
	},
	{
		displayName: 'Subject Type',
		name: 'subjectType',
		type: 'options',
		required: true,
		displayOptions: { show: showFor('create') },
		options: [
			{ name: 'Bundle', value: 'bundle' },
			{ name: 'File', value: 'file' },
		],
		default: 'file',
		description: 'Whether the row is one file or a bundle of files',
	},
	{
		displayName: 'Subject ID',
		name: 'subjectId',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('create') },
		default: '',
		placeholder: 'e.g. ds_1a2b3c4d5e6f7g8h',
		description: 'ID of the file or bundle this row extracts from',
	},
];
