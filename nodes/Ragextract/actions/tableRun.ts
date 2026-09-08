import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, splitIds, waitForRun, workspacePath } from '../transport';
import { asItems, collection, tableId, workspaceId, type ActionResult } from './helpers';

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const workspace = workspaceId(ctx, itemIndex);
	const table = tableId(ctx, itemIndex);
	const base = workspacePath(workspace, `/tables/${table}/runs`);
	const options = collection(ctx, 'options', itemIndex);

	switch (operation) {
		case 'getAll':
			return { data: asItems(await apiRequest(ctx, 'GET', base)) };

		case 'get':
			return {
				data: asItems(
					await apiRequest(
						ctx,
						'GET',
						`${base}/${ctx.getNodeParameter('runId', itemIndex) as string}`,
					),
				),
			};

		case 'preview': {
			// The GET form of the selection: comma-separated, not the POST body's arrays.
			const qs: IDataObject = {
				rowIds: splitIds(options.rowIds as string).join(','),
				columnIds: splitIds(options.columnIds as string).join(','),
			};
			return { data: asItems(await apiRequest(ctx, 'GET', `${base}/preview`, { qs })) };
		}

		case 'start':
			return { data: await start(ctx, workspace, table, base, options) };

		case 'cancel':
			return {
				data: asItems(
					await apiRequest(
						ctx,
						'POST',
						`${base}/${ctx.getNodeParameter('runId', itemIndex) as string}/cancel`,
					),
				),
			};

		case 'cancelAll':
			return { data: asItems(await apiRequest(ctx, 'POST', `${base}/cancel`)) };

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown run operation: ${operation}`);
	}
}

async function start(
	ctx: IExecuteFunctions,
	workspace: string,
	table: string,
	base: string,
	options: IDataObject,
): Promise<IDataObject[]> {
	const rowIds = splitIds(options.rowIds as string);
	const columnIds = splitIds(options.columnIds as string);

	const response = await apiRequest<IDataObject>(ctx, 'POST', base, {
		body: {
			rowIds: rowIds.length ? rowIds : undefined,
			columnIds: columnIds.length ? columnIds : undefined,
		},
	});

	const result = response.data ?? {};
	const run = result.run as IDataObject | null;

	if (!((options.waitForCompletion ?? true) as boolean)) return [result];

	// A run with nothing to do — every cell overridden, or every document still ingesting — creates
	// no run at all. Polling one that was never created would time out on a success.
	if (!run?.id) return [result];

	return await waitForRun(ctx, workspace, table, run.id as string, Number(options.pollTimeout ?? 600));
}
