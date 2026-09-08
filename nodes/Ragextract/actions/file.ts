import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	apiRequest,
	apiRequestAllItems,
	createForm,
	splitIds,
	waitForIngest,
	workspacePath,
	type FormField,
} from '../transport';
import {
	DEFAULT_CHUNK_SIZE_BYTES,
	SINGLE_SHOT_LIMIT_BYTES,
	uploadMultipart,
} from '../transport/upload';
import { asItems, collection, locator, workspaceId, type ActionResult } from './helpers';

export async function execute(
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<ActionResult> {
	const workspace = workspaceId(ctx, itemIndex);
	const options = collection(ctx, 'options', itemIndex);

	switch (operation) {
		case 'upload':
			return { data: [await upload(ctx, workspace, options, itemIndex)] };

		case 'getAll': {
			const returnAll = ctx.getNodeParameter('returnAll', itemIndex, false) as boolean;
			const qs: IDataObject = {
				offset: options.offset ?? 0,
				sort: options.sort,
				types: ((options.types as string[]) ?? []).join(','),
				expiresInSeconds: options.expiresInSeconds,
			};
			const path = workspacePath(workspace, '/files');

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
						workspacePath(workspace, `/files/${locator(ctx, 'file', itemIndex)}`),
						{ qs: { expiresInSeconds: options.expiresInSeconds } },
					),
				),
			};

		case 'getItems': {
			const fileId = locator(ctx, 'file', itemIndex);
			const returnAll = ctx.getNodeParameter('returnAll', itemIndex, false) as boolean;
			const qs: IDataObject = {
				row: ctx.getNodeParameter('row', itemIndex, 'pdf') as string,
				cols: ctx.getNodeParameter('cols', itemIndex, '') as string,
				offset: options.offset ?? 0,
				sort: options.sort,
				expiresInSeconds: options.expiresInSeconds,
			};
			const path = workspacePath(workspace, `/files/${fileId}/items`);
			const downloadBinary = ctx.getNodeParameter(
				'shouldDownloadBinary',
				itemIndex,
				false,
			) as boolean;

			if (returnAll) {
				return { data: await apiRequestAllItems(ctx, 'GET', path, { qs }), downloadBinary };
			}

			qs.limit = ctx.getNodeParameter('limit', itemIndex, 50) as number;
			return { data: asItems(await apiRequest(ctx, 'GET', path, { qs })), downloadBinary };
		}

		case 'getItem': {
			const fileId = locator(ctx, 'file', itemIndex);
			const fileItemId = ctx.getNodeParameter('fileItemId', itemIndex) as string;
			return {
				data: asItems(
					await apiRequest(
						ctx,
						'GET',
						workspacePath(workspace, `/files/${fileId}/items/${fileItemId}`),
						{ qs: { expiresInSeconds: options.expiresInSeconds } },
					),
				),
				downloadBinary: ctx.getNodeParameter('shouldDownloadBinary', itemIndex, false) as boolean,
			};
		}

		case 'delete': {
			const fileIds = splitIds(ctx.getNodeParameter('fileIds', itemIndex) as string, 'ds_');
			if (!fileIds.length) {
				throw new NodeOperationError(
					ctx.getNode(),
					'No valid file IDs given. File IDs start with "ds_".',
					{ itemIndex },
				);
			}
			return {
				data: asItems(
					await apiRequest(ctx, 'DELETE', workspacePath(workspace, '/files'), {
						body: { fileIds },
					}),
				),
			};
		}

		case 'search': {
			const text = ctx.getNodeParameter('queryText', itemIndex) as string;
			const imageUrl = ctx.getNodeParameter('queryImage', itemIndex, '') as string;
			// A bare string is the text-only shape the API documents; the object form is only
			// needed once an image is in play.
			const query = imageUrl ? { text, image_url: imageUrl } : text;
			const fileIds = splitIds(options.fileIds as string, 'ds_');

			return {
				data: asItems(
					await apiRequest(ctx, 'POST', workspacePath(workspace, '/search'), {
						body: {
							query,
							limit: ctx.getNodeParameter('limit', itemIndex, 50) as number,
							fileIds: fileIds.length ? fileIds : undefined,
							expiresInSeconds: options.expiresInSeconds,
						},
					}),
				),
				downloadBinary: ctx.getNodeParameter('shouldDownloadBinary', itemIndex, false) as boolean,
			};
		}

		case 'share': {
			const fileItemId = ctx.getNodeParameter('fileItemId', itemIndex) as string;
			return {
				data: asItems(
					await apiRequest(ctx, 'POST', workspacePath(workspace, `/share/${fileItemId}`), {
						// `expiresIn`, not `expiresInSeconds` — this one endpoint spells it differently.
						body: { expiresIn: options.expiresIn },
					}),
				),
			};
		}

		default:
			throw new NodeOperationError(ctx.getNode(), `Unknown file operation: ${operation}`);
	}
}

/**
 * Ingest — `/v2`'s single verb.
 *
 * A URL is handed to the service to fetch; a binary property is uploaded. Anything over the API's
 * 100MB single-shot limit switches to a multipart session automatically, because the alternative is
 * a workflow that works in testing and fails on the one large document it was built for.
 */
async function upload(
	ctx: IExecuteFunctions,
	workspace: string,
	options: IDataObject,
	itemIndex: number,
): Promise<IDataObject> {
	const source = ctx.getNodeParameter('dataPropertyNameOrUrl', itemIndex) as string;
	const isUrl = /^https?:\/\//i.test(source);
	const expiresInDays = options.expiresInDays as number | undefined;

	let job: IDataObject | undefined;

	if (isUrl) {
		const fields: FormField[] = [{ field: 'url', value: source }];
		if (expiresInDays !== undefined) {
			fields.push({ field: 'expiresInDays', value: String(expiresInDays) });
		}
		const response = await apiRequest<IDataObject>(
			ctx,
			'POST',
			workspacePath(workspace, '/files'),
			{ body: createForm(fields), json: false },
		);
		job = response.data;
	} else {
		const binary = ctx.helpers.assertBinaryData(itemIndex, source);
		const buffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, source);
		const fileName = binary.fileName ?? 'untitled.bin';
		const mimeType = binary.mimeType ?? 'application/octet-stream';

		if (buffer.byteLength > SINGLE_SHOT_LIMIT_BYTES) {
			const chunkSizeMb = options.chunkSizeMb as number | undefined;
			job = await uploadMultipart(ctx, workspace, buffer, {
				fileName,
				fileExt: binary.fileExtension ?? fileName.split('.').pop() ?? '',
				fileType: mimeType,
				expiresInDays,
				chunkSize: chunkSizeMb ? chunkSizeMb * 1024 * 1024 : DEFAULT_CHUNK_SIZE_BYTES,
			});
		} else {
			const fields: FormField[] = [
				{ field: 'file', value: buffer, fileName, contentType: mimeType },
			];
			if (expiresInDays !== undefined) {
				fields.push({ field: 'expiresInDays', value: String(expiresInDays) });
			}
			const response = await apiRequest<IDataObject>(
				ctx,
				'POST',
				workspacePath(workspace, '/files'),
				{ body: createForm(fields), json: false },
			);
			job = response.data;
		}
	}

	if (!job) {
		throw new NodeOperationError(ctx.getNode(), 'Upload did not return an ingest job.', {
			itemIndex,
		});
	}

	const waitForCompletion = (options.waitForCompletion ?? true) as boolean;
	if (!waitForCompletion) return job;

	return await waitForIngest(
		ctx,
		workspace,
		job,
		Number(options.pollTimeout ?? 600),
		options.expiresInSeconds as number | undefined,
	);
}
