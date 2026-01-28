import type { INodeProperties } from 'n8n-workflow';

const showOnlyForWorkspaceExtract = {
    operation: ['extract'],
    resource: ['workspace'],
};

export const workspaceExtractDescription: INodeProperties[] = [
    {
        displayName: 'Property Name or URL',
        name: 'dataPropertyNameOrUrl',
        type: 'string',
        required: true,
        displayOptions: {
            show: showOnlyForWorkspaceExtract
        },
        default: 'data',
        description: 'File to upload. Accepts a binary property name (eg. data) or public URL. Base64 is not accepted.',
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add option',
        default: {},
        displayOptions: {
            show: showOnlyForWorkspaceExtract
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
                displayName: 'Dataset Expiry (Days)',
                name: 'expiresInDays',
                type: 'number',
                typeOptions: { minValue: -1 },
                default: 1,
                description: 'The number of days until the dataset is expired. Set to -1 to never expire.',
            },
        ]
    }
];
