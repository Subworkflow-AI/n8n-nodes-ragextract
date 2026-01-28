import type { INodeProperties } from 'n8n-workflow';

const showOnlyForJobsGetMany = {
	operation: ['getAll'],
	resource: ['jobs'],
};

export const JobsGetManyDescription: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				...showOnlyForJobsGetMany,
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		routing: {
			send: {
				type: 'query',
				property: 'limit',
			},
			output: {
				maxResults: '={{$value}}',
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForJobsGetMany,
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit'
	},
	{
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add option',
        default: {},
		displayOptions: {
			show: showOnlyForJobsGetMany,
		},
        options: [
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: {
					minValue: 0
				},
				default: 0,
				description: 'Offset of results to return'
			},
			{
				displayName: 'Statuses',
				name: 'statuses',
				type: 'multiOptions',
				options: [
					{
						name: 'Error',
						value: 'ERROR',
						description: 'Return jobs which have failed',
					},
					{
						name: 'In Progress',
						value: 'IN_PROGRESS',
						description: 'Return jobs which are currently in progress',
					},
					{
						name: 'Not Started',
						value: 'NOT_STARTED',
						description: 'Return jobs which have not started',
					},
					{
						name: 'Success',
						value: 'SUCCESS',
						description: 'Returns jobs which have completed successfully',
					}
				],
				default: [],
				description: 'The job status to filter on',
			}
		]
	}
];
