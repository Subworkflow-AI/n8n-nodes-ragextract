import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['tableCell'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

/**
 * Cells — one column's answer about one row.
 *
 * A human override is kept ALONGSIDE the AI value, never replacing it, and a rerun will not touch
 * an overridden cell. That is the whole point of the two override operations: correcting a cell is
 * durable, and clearing the correction hands the cell back to the model.
 */
export const operations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Clear Override',
			value: 'clearOverride',
			action: 'Clear a cell override',
			description: 'Remove a human correction, handing the cell back to the model',
		},
		{
			name: 'Get Events',
			value: 'getEvents',
			action: 'Get cell events',
			description: 'Append-only audit of every override set and cleared on a cell',
		},
		{
			name: 'Get Facts',
			value: 'getFacts',
			action: 'Get cell facts',
			description:
				'For a bundle row, one fact per member document in precedence order — the "why" behind the answer',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many cells',
			description: 'Get every cell of a table',
		},
		{
			name: 'Set Override',
			value: 'setOverride',
			action: 'Set a cell override',
			description: 'Record a human correction alongside the AI value',
		},
	],
	default: 'getAll',
};

export const fields: INodeProperties[] = [
	{
		displayName: 'Cell ID',
		name: 'cellId',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('clearOverride', 'getEvents', 'getFacts', 'setOverride') },
		default: '',
		placeholder: 'e.g. rcel_1a2b3c4d5e6f7g8h',
		description: 'ID of the cell to act on',
	},
	{
		displayName: 'Value (JSON)',
		name: 'value',
		type: 'json',
		required: true,
		displayOptions: { show: showFor('setOverride') },
		default: '{\n  "type": "text",\n  "value": ""\n}',
		description:
			'The corrected value, matching the column\'s output type: an object of type and value for a typed column, an array of image regions for an image one',
	},
];
