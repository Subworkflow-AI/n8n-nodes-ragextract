/**
 * Checks that a build actually produced the files package.json points n8n at.
 *
 * This exists because of a real near-miss: `n8n-node build` cleans dist and then runs tsc, and an
 * incremental cache that survived the clean convinced tsc every output was already current. It
 * emitted nothing, printed "Build successful", and `npm publish` packed a tarball of 5 files with
 * no compiled node in it. Only npm's 2FA prompt stopped it reaching the registry.
 *
 * `incremental` is gone, so that exact cause cannot recur — but "the build said it worked" was the
 * part that failed, and lint plus build cannot check their own output. This can.
 *
 * Runs on `npm publish` via prepublishOnly. Dependency-free on purpose: a verification step that
 * needs its own install is one more thing that can be the reason a release is wrong.
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = process.cwd();

const problems = [];
const checks = [];

const fail = (message) => problems.push(message);
const pass = (message) => checks.push(message);

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

/** Every path package.json promises n8n, and the icons those files reference. */
const entries = [
	...(pkg.n8n?.nodes ?? []).map((file) => ({ file, kind: 'node' })),
	...(pkg.n8n?.credentials ?? []).map((file) => ({ file, kind: 'credential' })),
];

if (entries.length === 0) fail('package.json declares no n8n nodes or credentials');

for (const { file, kind } of entries) {
	const absolute = path.join(root, file);

	if (!existsSync(absolute)) {
		fail(`${kind} entry is missing from the build: ${file}`);
		continue;
	}
	// A file that exists but holds nothing is the same failure wearing a disguise.
	if (statSync(absolute).size < 200) {
		fail(`${kind} entry is suspiciously small (${statSync(absolute).size} bytes): ${file}`);
		continue;
	}

	let instance;
	try {
		const exported = require(absolute);
		const Ctor = Object.values(exported).find((value) => typeof value === 'function');
		if (!Ctor) {
			fail(`${kind} entry exports no class: ${file}`);
			continue;
		}
		instance = new Ctor();
	} catch (error) {
		fail(`${kind} entry could not be loaded: ${file} — ${error.message}`);
		continue;
	}

	const icon = instance.icon ?? instance.description?.icon;
	const iconPaths = typeof icon === 'string' ? { icon } : (icon ?? {});
	for (const [variant, value] of Object.entries(iconPaths)) {
		if (typeof value !== 'string' || !value.startsWith('file:')) continue;
		const resolved = path.resolve(path.dirname(absolute), value.slice('file:'.length));
		if (!existsSync(resolved)) {
			fail(`${kind} ${variant} icon does not resolve: ${value} (from ${file})`);
		}
	}

	const name = instance.name ?? instance.description?.name;
	if (!name) fail(`${kind} entry has no name: ${file}`);
	else pass(`${kind} ${name} loads, icons resolve`);
}

// The node's parameters are the whole surface; an empty list means the descriptions did not build.
const nodeFile = pkg.n8n?.nodes?.[0];
if (nodeFile && existsSync(path.join(root, nodeFile))) {
	try {
		const exported = require(path.join(root, nodeFile));
		const Ctor = Object.values(exported).find((value) => typeof value === 'function');
		const description = new Ctor().description;
		const resources = description.properties.find((p) => p.name === 'resource')?.options ?? [];
		const operations = description.properties
			.filter((p) => p.name === 'operation')
			.reduce((total, p) => total + (p.options?.length ?? 0), 0);

		if (resources.length === 0) fail('node declares no resources');
		if (operations === 0) fail('node declares no operations');
		if (operations < resources.length) {
			fail(`node has ${resources.length} resources but only ${operations} operations`);
		}
		if (resources.length && operations) {
			pass(`${resources.length} resources, ${operations} operations`);
		}
	} catch (error) {
		fail(`could not inspect the node description — ${error.message}`);
	}
}

for (const message of checks) console.log(`  ✓ ${message}`);

if (problems.length) {
	console.error('\nBuild verification FAILED:');
	for (const problem of problems) console.error(`  ✗ ${problem}`);
	console.error('\nRun `npm run build` and check dist/ before publishing.\n');
	process.exit(1);
}

console.log('  ✓ build verified\n');
