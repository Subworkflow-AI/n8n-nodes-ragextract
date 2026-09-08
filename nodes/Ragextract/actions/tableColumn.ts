import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, workspacePath } from '../transport';
import {
	asItems,
	buildBody,
	collection,
	locator,
	tableId,
	workspaceId,
	type ActionResult,
} from './helpers';

const NULLABLE = ['config'];

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const base = workspacePath(
		workspaceId(ctx, itemIndex),
		`/tables/${tableId(ctx, itemIndex)}/columns`,
	);

	switch (operation) {
		case 'getAll':
			return { data: asItems(await apiRequest(ctx, 'GET', base)) };

		case 'create': {
			const body = {
				name: ctx.getNodeParameter('name', itemIndex) as string,
				prompt: ctx.getNodeParameter('prompt', itemIndex) as string,
				...buildBody(collection(ctx, 'options', itemIndex), { nullable: NULLABLE }),
			};
			return { data: asItems(await apiRequest(ctx, 'POST', base, { body })) };
		}

		case 'update': {
			const body = buildBody(collection(ctx, 'updateFields', itemIndex), { nullable: NULLABLE });
			return {
				data: asItems(
					await apiRequest(ctx, 'PATCH', `${base}/${locator(ctx, 'column', itemIndex)}`, { body }),
				),
			};
		}

		case 'delete':
			return {
				data: asItems(
					await apiRequest(ctx, 'DELETE', `${base}/${locator(ctx, 'column', itemIndex)}`),
				),
			};

		case 'run':
			return {
				data: asItems(
					await apiRequest(ctx, 'POST', `${base}/${locator(ctx, 'column', itemIndex)}/run`),
				),
			};

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown column operation: ${operation}`);
	}
}
