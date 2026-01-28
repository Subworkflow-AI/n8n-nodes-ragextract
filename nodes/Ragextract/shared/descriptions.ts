import type { INodeProperties } from 'n8n-workflow';

export const datasetSelect: INodeProperties = {
	displayName: 'Dataset',
	name: 'dataset',
	type: 'resourceLocator',
	default: {
		mode: 'list',
		value: '',
	},
	modes: [
		{
			displayName: 'Dataset',
			name: 'list',
			type: 'list',
			placeholder: 'Select an Dataset...',
			typeOptions: {
				searchListMethod: 'getDatasets',
				searchable: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'name',
			type: 'string',
			placeholder: 'e.g. ds_123456789',
			url: '=https://api.ragextract.com/v1/datasets/{{$value}}'
		}
	]
}

export const jobsSelect: INodeProperties = {
	displayName: 'Jobs',
	name: 'job',
	type: 'resourceLocator',
	default: {
		mode: 'list',
		value: '',
	},
	modes: [
		{
			displayName: 'Job',
			name: 'list',
			type: 'list',
			placeholder: 'Select an Job...',
			typeOptions: {
				searchListMethod: 'getJobs',
				searchable: false,
			},
		},
		{
			displayName: 'By ID',
			name: 'name',
			type: 'string',
			placeholder: 'e.g. dsj_123456789',
			url: '=https://api.ragextract.com/v1/jobs/{{$value}}'
		}
	]
}
