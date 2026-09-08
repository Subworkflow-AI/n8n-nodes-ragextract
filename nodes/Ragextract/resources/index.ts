import type { INodeProperties } from 'n8n-workflow';
import * as bundle from './bundle';
import * as file from './file';
import * as job from './job';
import * as table from './table';
import * as tableCell from './tableCell';
import * as tableColumn from './tableColumn';
import * as tableRow from './tableRow';
import * as tableRun from './tableRun';
import * as workspace from './workspace';

const modules = [bundle, file, job, table, tableCell, tableColumn, tableRow, tableRun, workspace];

/**
 * Operation selectors first, then every operation's fields.
 *
 * n8n renders properties in declaration order, so grouping this way is what puts Resource →
 * Operation → Workspace → Table above the operation-specific fields in the panel, instead of
 * burying the two locators between whichever resources happen to sort around them.
 */
export const operationProperties: INodeProperties[] = modules.map((module) => module.operations);
export const fieldProperties: INodeProperties[] = modules.flatMap((module) => module.fields);
