import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, splitIds, workspacePath } from '../transport';
import {
	asItems,
	buildBody,
	collection,
	locator,
	workspaceId,
	type ActionResult,
} from './helpers';

const MEMBERSHIP = { nullable: ['role'], dates: ['effectiveAt'] };

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const base = workspacePath(workspaceId(ctx, itemIndex), '/bundles');

	switch (operation) {
		case 'getAll':
			return { data: asItems(await apiRequest(ctx, 'GET', base)) };

		case 'get':
			return {
				data: asItems(await apiRequest(ctx, 'GET', `${base}/${locator(ctx, 'bundle', itemIndex)}`)),
			};

		case 'create': {
			const body = {
				name: ctx.getNodeParameter('name', itemIndex) as string,
				...buildBody(collection(ctx, 'options', itemIndex), {
					nullable: ['color'],
					lists: ['fileIds'],
				}),
			};
			return { data: asItems(await apiRequest(ctx, 'POST', base, { body })) };
		}

		case 'update': {
			const body = buildBody(collection(ctx, 'updateFields', itemIndex), { nullable: ['color'] });
			return {
				data: asItems(
					await apiRequest(ctx, 'PATCH', `${base}/${locator(ctx, 'bundle', itemIndex)}`, { body }),
				),
			};
		}

		case 'delete':
			return {
				data: asItems(
					await apiRequest(ctx, 'DELETE', `${base}/${locator(ctx, 'bundle', itemIndex)}`),
				),
			};

		case 'addFiles': {
			const fileIds = splitIds(ctx.getNodeParameter('fileIds', itemIndex) as string, 'ds_');
			if (!fileIds.length) {
				throw new NodeOperationError(
					ctx.getNode(),
					'No valid file IDs given. File IDs start with "ds_".',
					{ itemIndex },
				);
			}
			const body = {
				fileIds,
				...buildBody(collection(ctx, 'options', itemIndex), MEMBERSHIP),
			};
			return {
				data: asItems(
					await apiRequest(ctx, 'POST', `${base}/${locator(ctx, 'bundle', itemIndex)}/files`, {
						body,
					}),
				),
			};
		}

		case 'updateFile': {
			const bundleId = locator(ctx, 'bundle', itemIndex);
			const fileId = ctx.getNodeParameter('fileId', itemIndex) as string;
			const body = buildBody(collection(ctx, 'updateFields', itemIndex), MEMBERSHIP);
			return {
				data: asItems(
					await apiRequest(ctx, 'PATCH', `${base}/${bundleId}/files/${fileId}`, { body }),
				),
			};
		}

		case 'removeFile': {
			const bundleId = locator(ctx, 'bundle', itemIndex);
			const fileId = ctx.getNodeParameter('fileId', itemIndex) as string;
			return {
				data: asItems(await apiRequest(ctx, 'DELETE', `${base}/${bundleId}/files/${fileId}`)),
			};
		}

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown bundle operation: ${operation}`);
	}
}
