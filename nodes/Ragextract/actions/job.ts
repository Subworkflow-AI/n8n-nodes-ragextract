import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, apiRequestAllItems, workspacePath } from '../transport';
import { asItems, collection, locator, workspaceId, type ActionResult } from './helpers';

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const workspace = workspaceId(ctx, itemIndex);

	switch (operation) {
		case 'getAll': {
			const options = collection(ctx, 'options', itemIndex);
			const returnAll = ctx.getNodeParameter('returnAll', itemIndex, false) as boolean;
			const qs: IDataObject = {
				statuses: ((options.statuses as string[]) ?? []).join(','),
				offset: options.offset ?? 0,
			};
			const path = workspacePath(workspace, '/jobs');

			if (returnAll) return { data: await apiRequestAllItems(ctx, 'GET', path, { qs }) };

			qs.limit = ctx.getNodeParameter('limit', itemIndex, 50) as number;
			return { data: asItems(await apiRequest(ctx, 'GET', path, { qs })) };
		}

		case 'get':
			return {
				data: asItems(
					await apiRequest(
						ctx,
						'GET',
						workspacePath(workspace, `/jobs/${locator(ctx, 'job', itemIndex)}`),
					),
				),
			};

		case 'cancel':
			return {
				data: asItems(
					await apiRequest(
						ctx,
						'POST',
						workspacePath(workspace, `/jobs/${locator(ctx, 'job', itemIndex)}/cancel`),
					),
				),
			};

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown job operation: ${operation}`);
	}
}
