import type { INodeProperties } from 'n8n-workflow';
import { jobLocator, offsetOption, returnAll } from '../shared/descriptions';

const show = { resource: ['job'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

/**
 * Ingest jobs.
 *
 * `Cancel` is a POST in `/v2`, not `/v1`'s DELETE: the job row survives a cancel and is exactly
 * what a workflow polls afterwards, so "destroy the record" was never what it meant.
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
			action: 'Cancel a job',
			description: 'Cancel a job that has not finished. The job row survives.',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a job',
			description: 'Get a single job',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many jobs',
			description: 'Get many jobs in a workspace',
		},
	],
	default: 'getAll',
};

export const fields: INodeProperties[] = [
	{
		...jobLocator,
		displayOptions: { show: showFor('cancel', 'get') },
	},
	...returnAll(showFor('getAll')),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('getAll') },
		options: [
			offsetOption,
			{
				displayName: 'Statuses',
				name: 'statuses',
				type: 'multiOptions',
				options: [
					{ name: 'Error', value: 'ERROR', description: 'Jobs which have failed' },
					{ name: 'In Progress', value: 'IN_PROGRESS', description: 'Jobs currently running' },
					{ name: 'In Queue', value: 'IN_QUEUE', description: 'Jobs waiting for a free slot' },
					{ name: 'Not Started', value: 'NOT_STARTED', description: 'Jobs which have not started' },
					{ name: 'Success', value: 'SUCCESS', description: 'Jobs which completed successfully' },
				],
				default: [],
				description: 'Filter by job status',
			},
		],
	},
];
