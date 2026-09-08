import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, workspacePath } from '../transport';
import { asItems, workspaceId, type ActionResult } from './helpers';

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	switch (operation) {
		case 'getAll':
			return { data: asItems(await apiRequest(ctx, 'GET', '/workspaces')) };

		case 'get':
			return {
				data: asItems(
					await apiRequest(ctx, 'GET', workspacePath(workspaceId(ctx, itemIndex))),
				),
			};

		case 'create': {
			const name = ctx.getNodeParameter('name', itemIndex) as string;
			return { data: asItems(await apiRequest(ctx, 'POST', '/workspaces', { body: { name } })) };
		}

		case 'update': {
			const name = ctx.getNodeParameter('name', itemIndex) as string;
			return {
				data: asItems(
					await apiRequest(ctx, 'PATCH', workspacePath(workspaceId(ctx, itemIndex)), {
						body: { name },
					}),
				),
			};
		}

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown workspace operation: ${operation}`);
	}
}
