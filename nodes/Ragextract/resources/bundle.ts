import type { INodeProperties } from 'n8n-workflow';
import { bundleLocator } from '../shared/descriptions';

const show = { resource: ['bundle'] };
const showFor = (...operations: string[]) => ({ ...show, operation: operations });

/**
 * Bundles — several files a table row extracts as one subject: a master contract and its
 * amendments, resolved by map-reduce with a precedence order.
 *
 * Members are addressed by file ID, not by a membership ID. Every membership change marks derived
 * cells stale in EVERY table using the bundle, not just the one you were looking at — worth knowing
 * before adding a document to a bundle used in several places.
 */
export const operations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Add Files',
			value: 'addFiles',
			action: 'Add files to a bundle',
			description: 'Add one or more files to a bundle',
		},
		{
			name: 'Create',
			value: 'create',
			action: 'Create a bundle',
			description: 'Create a bundle, optionally with its initial members',
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a bundle',
			description: 'Archive a bundle. Refused while any table row still points at it.',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a bundle',
			description: 'Get a bundle with its member files',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many bundles',
			description: 'Get every bundle in a workspace',
		},
		{
			name: 'Remove File',
			value: 'removeFile',
			action: 'Remove a file from a bundle',
			description: 'Remove one file from a bundle',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a bundle',
			description: 'Update a bundle\'s name or colour',
		},
		{
			name: 'Update File',
			value: 'updateFile',
			action: 'Update a bundle file',
			description: 'Change a member\'s precedence within the bundle',
		},
	],
	default: 'getAll',
};

/** These three fields ARE the precedence, so editing them changes the answer. */
const membershipFields: INodeProperties[] = [
	{
		displayName: 'Effective At',
		name: 'effectiveAt',
		type: 'dateTime',
		default: '',
		description: 'Precedence for the reduce step, latest first',
	},
	{
		displayName: 'Primary',
		name: 'isPrimary',
		type: 'boolean',
		default: false,
		description:
			'Whether this file is the structural anchor the others amend. A bundle has at most one.',
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'string',
		default: '',
		placeholder: 'e.g. amendment',
		description: 'Free-text label for the file\'s part in the bundle',
	},
];

export const fields: INodeProperties[] = [
	{
		...bundleLocator,
		displayOptions: {
			show: showFor('addFiles', 'delete', 'get', 'removeFile', 'update', 'updateFile'),
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('create') },
		default: '',
		description: 'Name of the bundle',
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('addFiles') },
		default: '',
		placeholder: 'e.g. ds_123456,ds_789012',
		description: 'IDs of the files to add. Comma-delimited, up to 15.',
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		required: true,
		displayOptions: { show: showFor('removeFile', 'updateFile') },
		default: '',
		placeholder: 'e.g. ds_1a2b3c4d5e6f7g8h',
		description: 'ID of the member file to act on',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('create') },
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '',
				description: 'Display colour for the bundle',
			},
			{
				displayName: 'File IDs',
				name: 'fileIds',
				type: 'string',
				default: '',
				placeholder: 'e.g. ds_123456,ds_789012',
				description: 'Initial members, saved from a second round trip. Comma-delimited, up to 15.',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: { show: showFor('addFiles') },
		// `isPrimary` applies to the first file added; a bundle has at most one structural anchor.
		options: membershipFields,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add field',
		default: {},
		displayOptions: { show: showFor('update') },
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '',
				description: 'Display colour for the bundle',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name of the bundle',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add field',
		default: {},
		displayOptions: { show: showFor('updateFile') },
		options: [
			...membershipFields,
			{
				displayName: 'Sort Order',
				name: 'sortOrder',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Tie-break for files sharing an effective date',
			},
		],
	},
];
