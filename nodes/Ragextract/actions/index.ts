import * as bundle from './bundle';
import * as file from './file';
import * as job from './job';
import * as table from './table';
import * as tableCell from './tableCell';
import * as tableColumn from './tableColumn';
import * as tableRow from './tableRow';
import * as tableRun from './tableRun';
import * as workspace from './workspace';
import type { ResourceAction } from './helpers';

export const actions: Record<string, ResourceAction> = {
	bundle: bundle.execute,
	file: file.execute,
	job: job.execute,
	table: table.execute,
	tableCell: tableCell.execute,
	tableColumn: tableColumn.execute,
	tableRow: tableRow.execute,
	tableRun: tableRun.execute,
	workspace: workspace.execute,
};

export type { ActionResult, ResourceAction } from './helpers';
