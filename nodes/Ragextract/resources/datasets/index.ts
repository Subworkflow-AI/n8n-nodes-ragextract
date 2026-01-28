import type { INodeProperties } from 'n8n-workflow';
import { datasetsGetManyDescription } from './getAll';
import { datasetsGetDescription } from './get';
import { datasetsGetItemsDescription } from './getItems';
import { datasetsDeleteDescription } from './delete';
import { datasetsVectorizeDescription } from './vectorize';

export const datasetsDescription: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                "resource": ["datasets"]
            },
        },
        options: [
            {
                name: 'Delete',
                value: 'delete',
                action: 'Bulk delete datasets in a workspace',
                description: 'Bulk delete many datasets in a workspace',
                routing: {
                    request: {
                        method: 'DELETE',
                        url: '=/datasets',
                    },
                },
            },
            {
                name: 'Get',
                value: 'get',
                action: 'Get a dataset',
                description: 'Get a single document',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/datasets/{{$parameter.document}}',
                    },
                },
            },
            {
                name: 'Get Items',
                value: 'getItems',
                action: 'Gets dataset items',
                description: 'Gets a page or range of pages from a document',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/datasets/{{$parameters.document}}/items',
                    },
                },
            },
            {
                name: 'Get Many',
                value: 'getAll',
                action: 'Get datasets in a workspace',
                description: 'Get many datasets in a workspace',
                routing: {
                    request: {
                        method: 'GET',
                        url: '=/datasets',
                    },
                },
            },
            {
                name: 'Vectorize',
                value: 'vectorize',
                action: 'Vectorize a document',
                description: 'Create a new vectorize job for a document',
                routing: {
                    request: {
                        method: 'POST',
                        url: '=/datasets/{{$parameters.document}}/vectorize',
                    },
                },
            },
        ],
        default: 'getAll',
    },
    ...datasetsGetDescription,
    ...datasetsGetManyDescription,
    ...datasetsGetItemsDescription,
    ...datasetsDeleteDescription,
    ...datasetsVectorizeDescription
];
