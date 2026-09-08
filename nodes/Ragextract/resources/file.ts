import type { INodeProperties } from 'n8n-workflow';
import {
	fileLocator,
	offsetOption,
	returnAll,
	shareTtlOption,
	sortOption,
	withBinary,
} from '../shared/descriptions';

const show = { resource: ['file'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

/**
 * Files — what `/v1` called datasets.
 *
 * ONE INGEST VERB. `/v1` made callers choose between `extract` (parse only) and `vectorize` (parse
 * and embed); `/v2` always does both, so `Upload` is the whole ingest surface and there is no
 * re-vectorize operation to forget. Files over 100MB transparently switch to a multipart session —
 * the workflow author does not choose that either.
 */
export const operations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete files',
			description: 'Delete one or more files. All-or-nothing: an unknown ID deletes nothing.',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a file',
			description: 'Get a single file',
		},
		{
			name: 'Get Item',
			value: 'getItem',
			action: 'Get a file item',
			description: 'Get a single page of a file',
		},
		{
			name: 'Get Items',
			value: 'getItems',
			action: 'Get many file items',
			description: 'Get a page or range of pages from a file',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many files',
			description: 'Get many files in a workspace',
		},
		{
			name: 'Search',
			value: 'search',
			action: 'Search files',
			description: 'Semantic search over the ingested files in a workspace',
		},
		{
			name: 'Share',
			value: 'share',
			action: 'Share a file item',
			description: 'Mint a signed, expiring link to one page of one file',
		},
		{
			name: 'Upload',
			value: 'upload',
			action: 'Upload a file',
			description: 'Upload a file or URL and ingest it',
		},
	],
	default: 'upload',
};

const uploadFields: INodeProperties[] = [
	{
		displayName: 'Property Name or URL',
		name: 'dataPropertyNameOrUrl',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('upload') },
		default: 'data',
		description:
			'File to upload. Accepts a binary property name (e.g. data) or a public URL. Base64 is not accepted.',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('upload') },
		options: [
			{
				displayName: 'Chunk Size (MB)',
				name: 'chunkSizeMb',
				type: 'number',
				typeOptions: { minValue: 5, maxValue: 100 },
				default: 10,
				description:
					'Part size for the multipart upload path, used automatically for files over 100 MB',
			},
			{
				displayName: 'File Expiry (Days)',
				name: 'expiresInDays',
				type: 'number',
				typeOptions: { minValue: -1 },
				default: 1,
				description: 'Number of days until the file expires. Set to -1 to never expire.',
			},
			{
				displayName: 'Poll Timeout (Seconds)',
				name: 'pollTimeout',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 600,
				description: 'Maximum time to wait when waiting for completion',
			},
			{
				displayName: 'Wait For Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				description:
					'Whether to wait for the ingest job and return the finished file. Off returns the job immediately.',
			},
		],
	},
];

const listFields: INodeProperties[] = [
	...returnAll(showFor('getAll')),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('getAll') },
		options: [
			offsetOption,
			shareTtlOption,
			sortOption,
			{
				displayName: 'Types',
				name: 'types',
				type: 'multiOptions',
				options: [
					{ name: 'Audio', value: 'audio' },
					{ name: 'Doc', value: 'doc' },
					{ name: 'Image', value: 'image' },
					{ name: 'Image List', value: 'image_list' },
					{ name: 'Video', value: 'video' },
				],
				default: [],
				description: 'Filter by file type',
			},
		],
	},
];

const itemFields: INodeProperties[] = [
	{
		displayName: 'Page Format',
		name: 'row',
		type: 'options',
		displayOptions: { show: showFor('getItems') },
		options: [
			{ name: 'JPG', value: 'jpg' },
			{ name: 'PDF', value: 'pdf' },
		],
		default: 'pdf',
		description: 'Which rendering of each page to return',
	},
	{
		displayName: 'Pages',
		name: 'cols',
		type: 'string',
		displayOptions: { show: showFor('getItems') },
		default: '',
		placeholder: 'e.g. 1,3,5:9',
		description: 'Pages or page ranges to return. Comma-delimited. Empty returns every page.',
	},
	...returnAll(showFor('getItems')),
	{
		displayName: 'File Item ID',
		name: 'fileItemId',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('getItem', 'share') },
		default: '',
		placeholder: 'e.g. dss_1a2b3c4d5e6f7g8h',
		description: 'ID of the page to act on',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('getItems') },
		options: [offsetOption, shareTtlOption, sortOption],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('get', 'getItem') },
		options: [shareTtlOption],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('share') },
		options: [
			{
				displayName: 'Expires In (Seconds)',
				name: 'expiresIn',
				type: 'number',
				typeOptions: { minValue: 60 },
				default: 600,
				description: 'How long the minted share link stays valid',
			},
		],
	},
];

const searchFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'queryText',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('search') },
		default: '',
		description: 'Text to search for',
	},
	{
		displayName: 'Query Image URL',
		name: 'queryImage',
		type: 'string',
		displayOptions: { show: showFor('search') },
		default: '',
		description: 'Optional image URL to search with, alongside or instead of the query text',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: showFor('search') },
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('search') },
		options: [
			{
				displayName: 'File IDs',
				name: 'fileIds',
				type: 'string',
				default: '',
				placeholder: 'e.g. ds_123456,ds_789012',
				description:
					'Restrict the search to these files. Comma-delimited, up to 100. Empty searches the whole workspace.',
			},
			shareTtlOption,
		],
	},
];

export const fields: INodeProperties[] = [
	{
		...fileLocator,
		displayOptions: { show: showFor('get', 'getItem', 'getItems') },
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('delete') },
		default: '',
		placeholder: 'e.g. ds_123456,ds_789012',
		description: 'IDs of the files to delete. Comma-delimited, up to 100.',
	},
	...uploadFields,
	...listFields,
	...itemFields,
	...searchFields,
	withBinary(showFor('getItem', 'getItems', 'search')),
];
