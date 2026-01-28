import type { INodeProperties } from 'n8n-workflow';
import { workspaceSearchDescription } from './search';
import { workspaceExtractDescription } from './extract';
import { workspaceVectorizeDescription } from './vectorize';

export const workspaceDescription: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["workspace"]
            }
        },
        options: [
            {
                name: 'Extract',
                value: 'extract',
                action: 'Extract a document',
                description: 'Upload a document for extract',
                routing: {
                    request: {
                        method: 'POST',
                        url: '=/extract',
                    },
                },
            },
            {
                name: 'Vectorize',
                value: 'vectorize',
                action: 'Vectorize a document',
                description: 'Upload a document for vectorize',
                routing: {
                    request: {
                        method: 'POST',
                        url: '=/vectorize',
                    },
                },
            },
            {
                name: 'Search',
                value: 'search',
                action: 'Search documents',
                description: 'Similarity Search over one or more documents in workspace',
                routing: {
                    request: {
                        method: 'POST',
                        url: '=/search',
                    },
                },
            },
        ],
        default: 'extract',
    },
    ...workspaceExtractDescription,
    ...workspaceVectorizeDescription,
    ...workspaceSearchDescription
];
