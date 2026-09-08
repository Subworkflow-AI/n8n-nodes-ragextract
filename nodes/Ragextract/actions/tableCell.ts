import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';
import { apiRequest, workspacePath } from '../transport';
import { asItems, tableId, workspaceId, type ActionResult } from './helpers';

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const base = workspacePath(
		workspaceId(ctx, itemIndex),
		`/tables/${tableId(ctx, itemIndex)}/cells`,
	);

	if (operation === 'getAll') {
		return { data: asItems(await apiRequest(ctx, 'GET', base)) };
	}

	const cellId = ctx.getNodeParameter('cellId', itemIndex) as string;

	switch (operation) {
		case 'setOverride': {
			const raw = ctx.getNodeParameter('value', itemIndex) as string | object;
			// The API takes the typed value itself, not a JSON string — an override sent as a string
			// would be stored as a text answer whatever the column's output type says.
			const value =
				typeof raw === 'string'
					? jsonParse<IDataObject>(raw, { errorMessage: 'Value is not valid JSON' })
					: (raw as IDataObject);
			return {
				data: asItems(
					await apiRequest(ctx, 'PUT', `${base}/${cellId}/override`, { body: { value } }),
				),
			};
		}

		case 'clearOverride':
			return { data: asItems(await apiRequest(ctx, 'DELETE', `${base}/${cellId}/override`)) };

		case 'getEvents':
			return { data: asItems(await apiRequest(ctx, 'GET', `${base}/${cellId}/events`)) };

		case 'getFacts':
			return { data: asItems(await apiRequest(ctx, 'GET', `${base}/${cellId}/facts`)) };

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown cell operation: ${operation}`);
	}
}
