import type { INodeProperties } from 'n8n-workflow';
import { datasetSelect } from '../../shared/descriptions';

const showOnlyForDatasetsVectorize = {
    operation: ['vectorize'],
    resource: ['datasets'],
};

export const datasetsVectorizeDescription: INodeProperties[] = [
    {
        ...datasetSelect,
        displayOptions: { show: showOnlyForDatasetsVectorize },
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add option',
        default: {},
        displayOptions: {
            show: showOnlyForDatasetsVectorize
        },
        options: [
            {
                displayName: 'Wait For Completion',
                name: 'waitForCompletion',
                type: 'boolean',
                default: true,
                description: 'Whether to wait for completion of the job',
            },
            {
                displayName: 'Poll Timeout',
                name: 'pollTimeout',
                type: 'number',
                default: 600,
                description: 'Maximum wait time if waiting for completion',
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
