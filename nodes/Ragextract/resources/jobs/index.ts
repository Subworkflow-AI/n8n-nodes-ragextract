import type { INodeProperties } from 'n8n-workflow';
import { JobsGetManyDescription } from './getAll';
import { jobsGetDescription } from './get';

export const jobsDescription: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                "resource": ["jobs"]
            },
        },
        options: [
            {
                name: 'Get Many',
                value: 'getAll',
                action: 'Get jobs in a workspace',
                description: 'Get many jobs in a workspace'
            },
            {
                name: 'Get',
                value: 'get',
                action: 'Get a job',
                description: 'Get a single job in a workspace'
            }
        ],
        default: 'getAll',
    },
    ...JobsGetManyDescription,
    ...jobsGetDescription
];
