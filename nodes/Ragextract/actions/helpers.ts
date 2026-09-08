import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import type { ApiEnvelope } from '../transport';

/** What one resource's handler produces for one input item. */
export type ActionResult = {
	data: IDataObject[];
	/** Fetch each result's page through its share link and attach it as binary data. */
	downloadBinary?: boolean;
};

export type ResourceAction = (
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
) => Promise<ActionResult>;

/** Resolves a resourceLocator to the bare ID, whichever mode the author picked. */
export function locator(ctx: IExecuteFunctions, name: string, itemIndex: number): string {
	return ctx.getNodeParameter(name, itemIndex, undefined, { extractValue: true }) as string;
}

export function workspaceId(ctx: IExecuteFunctions, itemIndex: number): string {
	return locator(ctx, 'workspace', itemIndex);
}

export function tableId(ctx: IExecuteFunctions, itemIndex: number): string {
	return locator(ctx, 'table', itemIndex);
}

export function collection(
	ctx: IExecuteFunctions,
	name: string,
	itemIndex: number,
): IDataObject {
	return ctx.getNodeParameter(name, itemIndex, {}) as IDataObject;
}

/**
 * Normalises an API envelope into the rows this node emits.
 *
 * The acknowledgement endpoints (every delete, and removing a bundle file) answer with no `data` at
 * all, so they would otherwise emit nothing and make a successful delete indistinguishable from a
 * no-op downstream.
 */
export function asItems(envelope: ApiEnvelope<unknown>): IDataObject[] {
	const { data } = envelope;
	if (Array.isArray(data)) return data as IDataObject[];
	if (data && typeof data === 'object') return [data as IDataObject];
	return [{ success: envelope.success, total: envelope.total ?? 0 }];
}

/**
 * Builds a request body from a collection parameter.
 *
 * Empty strings become `null` for the fields the API declares nullable — a author who adds "Color"
 * and leaves it blank means "no colour", and sending `''` would store an empty string instead.
 * Comma-delimited fields become arrays, and `dateTime` fields become the epoch milliseconds the API
 * reads.
 */
export function buildBody(
	source: IDataObject,
	spec: {
		nullable?: string[];
		lists?: string[];
		dates?: string[];
	} = {},
): IDataObject {
	const body: IDataObject = {};

	for (const [key, value] of Object.entries(source)) {
		if (value === undefined) continue;

		if (spec.lists?.includes(key)) {
			const ids = String(value)
				.split(',')
				.map((part) => part.trim())
				.filter(Boolean);
			if (ids.length) body[key] = ids;
			continue;
		}

		if (spec.dates?.includes(key)) {
			if (value === '' || value === null) {
				body[key] = null;
			} else {
				const epoch = new Date(value as string).getTime();
				if (!Number.isNaN(epoch)) body[key] = epoch;
			}
			continue;
		}

		if (value === '' || value === null) {
			if (spec.nullable?.includes(key)) body[key] = null;
			continue;
		}

		body[key] = value;
	}

	return body;
}
