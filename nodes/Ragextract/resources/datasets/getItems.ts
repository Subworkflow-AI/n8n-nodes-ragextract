import type { INodeProperties } from 'n8n-workflow';
import { datasetSelect } from '../../shared/descriptions';

const showOnlyForDatasetsGetItems = {
    operation: ['getItems'],
    resource: ['datasets'],
};

export const datasetsGetItemsDescription: INodeProperties[] = [
    {
        ...datasetSelect,
        required: true,
        displayOptions: {
            show: showOnlyForDatasetsGetItems
        }
    },
    {
        displayName: 'Row',
        name: 'row',
        type: 'options',
        displayOptions: {
            show: showOnlyForDatasetsGetItems
        },
        options: [
            { name: 'Pdf', value: 'pdf' },
            { name: 'jpg', value: 'jpg' }
        ],
        default: 'pdf',
        description: 'Page format. eg. "pdf" or "jpg"',
    },
    {
        displayName: 'Cols (Optional)',
        name: 'cols',
        type: 'string',
        displayOptions: {
            show: showOnlyForDatasetsGetItems
        },
        default: '',
        description: 'Specific a page or range of pages (eg. "1:5") to return. Comma-delimited,',
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
            show: {
                ...showOnlyForDatasetsGetItems,
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
            show: showOnlyForDatasetsGetItems,
        },
        default: false,
        description: 'Whether to return all results or only up to a given limit'
    },
    {
        displayName: 'With Binary?',
        name: 'shouldDownloadBinary',
        type: 'boolean',
        displayOptions: {
            show: showOnlyForDatasetsGetItems,
        },
        default: true,
        description: 'Return the binary file associated with each result. Turn off for JSON only.'
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        displayOptions: {
            show: showOnlyForDatasetsGetItems
        },
        placeholder: 'Add option',
        default: {},
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
