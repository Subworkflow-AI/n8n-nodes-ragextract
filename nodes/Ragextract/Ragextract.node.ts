import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { actions } from './actions';
import * as listSearch from './methods/listSearch';
import { fieldProperties, operationProperties } from './resources';
import { tableLocator, workspaceLocator } from './shared/descriptions';
import { CREDENTIAL_NAME, downloadShare } from './transport';

/**
 * The Ragextract node, speaking `/v2`.
 *
 * `/v2` nests every resource under `/workspaces/:workspaceId`, so the workspace is a node parameter
 * rather than a property of the credential — one personal key (`psk_`) reaches every workspace its
 * owner can, and a workflow picks which one per operation. A workspace key (`sk_`) also works,
 * pinned to the single workspace it belongs to.
 */
export class Ragextract implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ragextract',
		name: 'ragextract',
		// The Ragextract mark, from ragextract-marketing/public/favicon{,-dark}.svg. Same geometry
		// in both; only the fill changes — brand red #FF2B2B on a light canvas, white on a dark one.
		icon: {
			light: 'file:../../icons/ragextract.svg',
			dark: 'file:../../icons/ragextract.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Document processing, search and extraction with the Ragextract API',
		defaults: {
			name: 'Ragextract',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: CREDENTIAL_NAME,
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Bundle', value: 'bundle' },
					{ name: 'File', value: 'file' },
					{ name: 'Job', value: 'job' },
					{ name: 'Table', value: 'table' },
					{ name: 'Table Cell', value: 'tableCell' },
					{ name: 'Table Column', value: 'tableColumn' },
					{ name: 'Table Row', value: 'tableRow' },
					{ name: 'Table Run', value: 'tableRun' },
					{ name: 'Workspace', value: 'workspace' },
				],
				default: 'file',
			},
			...operationProperties,
			...workspaceLocator,
			...tableLocator,
			...fieldProperties,
		],
	};

	methods = {
		listSearch,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			try {
				const action = actions[resource];
				if (!action) {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex,
					});
				}

				const result = await action(this, operation, itemIndex);

				for (const json of result.data) {
					const entry: INodeExecutionData = { json, pairedItem: { item: itemIndex } };
					if (result.downloadBinary) {
						const binary = await downloadShare(this, json);
						if (binary) entry.binary = { data: binary };
					}
					returnData.push(entry);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
