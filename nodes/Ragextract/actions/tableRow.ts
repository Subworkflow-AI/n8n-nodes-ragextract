import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, workspacePath } from '../transport';
import { asItems, locator, tableId, workspaceId, type ActionResult } from './helpers';

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const base = workspacePath(workspaceId(ctx, itemIndex), `/tables/${tableId(ctx, itemIndex)}/rows`);

	switch (operation) {
		case 'getAll':
			return { data: asItems(await apiRequest(ctx, 'GET', base)) };

		case 'create': {
			const body = {
				subjectType: ctx.getNodeParameter('subjectType', itemIndex) as string,
				subjectId: ctx.getNodeParameter('subjectId', itemIndex) as string,
			};
			return { data: asItems(await apiRequest(ctx, 'POST', base, { body })) };
		}

		case 'delete':
			return {
				data: asItems(await apiRequest(ctx, 'DELETE', `${base}/${locator(ctx, 'row', itemIndex)}`)),
			};

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown row operation: ${operation}`);
	}
}
