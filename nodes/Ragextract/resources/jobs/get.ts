import type { INodeProperties } from 'n8n-workflow';
import { jobsSelect } from '../../shared/descriptions';

const showOnlyForJobsGet = {
	operation: ['get'],
	resource: ['jobs'],
};

export const jobsGetDescription: INodeProperties[] = [
	{
		...jobsSelect,
		displayOptions: { show: showOnlyForJobsGet },
	},
];
