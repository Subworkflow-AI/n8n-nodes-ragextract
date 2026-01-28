import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDatasetsDelete = {
    operation: ['delete'],
    resource: ['datasets'],
};

export const datasetsDeleteDescription: INodeProperties[] = [
    {
        displayName: 'Dataset IDs',
        name: 'datasetIds',
        type: 'string',
        required: true,
        displayOptions: {
            show: showOnlyForDatasetsDelete,
        },
        default: '',
        description: 'Filter by Dataset IDs. Comma-delimited.',
    },
];
