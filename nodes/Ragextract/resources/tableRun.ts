import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['tableRun'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

const selectionFields: INodeProperties[] = [
	{
		displayName: 'Column IDs',
		name: 'columnIds',
		type: 'string',
		default: '',
		placeholder: 'e.g. rcol_123456,rcol_789012',
		description: 'Restrict the run to these columns. Comma-delimited, up to 100.',
	},
	{
		displayName: 'Row IDs',
		name: 'rowIds',
		type: 'string',
		default: '',
		placeholder: 'e.g. rrow_123456,rrow_789012',
		description: 'Restrict the run to these rows. Comma-delimited, up to 500.',
	},
];

/**
 * Runs — extraction over a selection of cells.
 *
 * TWO THINGS TO KNOW BEFORE `Start`:
 *
 *   - It spends credits, per cell, and `Preview` prices exactly the same selection beforehand for
 *     nothing.
 *   - Given both rows and columns, the selection is their UNION: every cell of those rows, plus
 *     every cell of those columns.
 *
 * A rerun never clobbers a cell carrying a human override, and skips rows whose documents are still
 * ingesting — so the cell count that comes back is what was actually started, not what was asked
 * for, and `skippedRowIds` says which rows fell out.
 */
export const operations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Cancel',
			value: 'cancel',
			action: 'Cancel a run',
			description:
				'Stop one run. Cells already extracting finish and bill, so this means "stop starting new ones".',
		},
		{
			name: 'Cancel All',
			value: 'cancelAll',
			action: 'Cancel all runs',
			description: 'Stop every run in flight for a table. Cancelling nothing is a success.',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a run',
			description: 'Get a single run and its progress',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many runs',
			description: 'Get every run of a table',
		},
		{
			name: 'Preview',
			value: 'preview',
			action: 'Preview a run',
			description: 'What a run would cost in credits and how many cells it would start. Charges nothing.',
		},
		{
			name: 'Start',
			value: 'start',
			action: 'Start a run',
			description: 'Queue the cells of a selection for extraction. Spends credits per cell.',
		},
	],
	default: 'start',
};

export const fields: INodeProperties[] = [
	{
		displayName: 'Run ID',
		name: 'runId',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('cancel', 'get') },
		default: '',
		placeholder: 'e.g. rrun_1a2b3c4d5e6f7g8h',
		description: 'ID of the run to act on',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('preview') },
		options: selectionFields,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('start') },
		options: [
			...selectionFields,
			{
				displayName: 'Poll Timeout (Seconds)',
				name: 'pollTimeout',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 600,
				description: 'Maximum time to wait when waiting for completion',
			},
			{
				displayName: 'Wait For Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				description:
					'Whether to wait for the run and return the table\'s cells. Off returns the run immediately.',
			},
		],
	},
];
