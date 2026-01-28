import type { INodeProperties } from 'n8n-workflow';
import { datasetSelect } from '../../shared/descriptions';

const showOnlyForDatasetsGet = {
	operation: ['get'],
	resource: ['datasets'],
};

export const datasetsGetDescription: INodeProperties[] = [
	{
		...datasetSelect,
		displayOptions: { show: showOnlyForDatasetsGet },
	},
];
