import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDatasetsGetMany = {
	operation: ['getAll'],
	resource: ['datasets'],
};

export const datasetsGetManyDescription: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				...showOnlyForDatasetsGetMany,
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForDatasetsGetMany,
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add option',
        default: {},
        displayOptions: {
            show: showOnlyForDatasetsGetMany
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
				description: 'Offset of results to return',
			},
            {
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				typeOptions: {
					minValue: 0
				},
				default: '',
				description: 'Sort results by property eg. "createdAt" or "-createdAt". Comma-delimited.',
			},
			{
				displayName: 'File Share Expiry (Seconds)',
				name: 'expiresInSeconds',
				type: 'string',
				typeOptions: {
					minValue: 60
				},
				default: '',
				description: 'The expiry duration in seconds for the dataset file share link',
			},
        ]
    }
];
