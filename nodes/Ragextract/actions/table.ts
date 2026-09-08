import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, workspacePath } from '../transport';
import { asItems, buildBody, collection, tableId, workspaceId, type ActionResult } from './helpers';

const NULLABLE = ['color', 'locale'];

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const workspace = workspaceId(ctx, itemIndex);
	const base = workspacePath(workspace, '/tables');

	switch (operation) {
		case 'getAll':
			return { data: asItems(await apiRequest(ctx, 'GET', base)) };

		case 'get':
			// One call for the whole table — metadata, columns, rows and cells — so it stays one item.
			return { data: asItems(await apiRequest(ctx, 'GET', `${base}/${tableId(ctx, itemIndex)}`)) };

		case 'create': {
			const body = {
				name: ctx.getNodeParameter('name', itemIndex) as string,
				...buildBody(collection(ctx, 'options', itemIndex), { nullable: NULLABLE }),
			};
			return { data: asItems(await apiRequest(ctx, 'POST', base, { body })) };
		}

		case 'update': {
			const body = buildBody(collection(ctx, 'updateFields', itemIndex), { nullable: NULLABLE });
			return {
				data: asItems(
					await apiRequest(ctx, 'PATCH', `${base}/${tableId(ctx, itemIndex)}`, { body }),
				),
			};
		}

		case 'delete':
			return {
				data: asItems(await apiRequest(ctx, 'DELETE', `${base}/${tableId(ctx, itemIndex)}`)),
			};

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown table operation: ${operation}`);
	}
}
