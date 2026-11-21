// Snapshots the repo's tracked files into the add-on, so the template has one source of truth.
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';

const root = join(import.meta.dir, '../../..');
const skip = [/^packages\//, /^docs\//, /^CHANGELOG\.md$/, /\.png$/];

const files: Record<string, string> = {};
const symlinks: Record<string, string> = {};
for (const file of (await $`git -C ${root} ls-files`.text()).trim().split('\n')) {
	if (skip.some((pattern) => pattern.test(file))) continue;
	const absolute = join(root, file);
	if (lstatSync(absolute).isSymbolicLink()) symlinks[file] = readlinkSync(absolute);
	else files[file] = readFileSync(absolute, 'utf8');
}

const pkg = JSON.parse(files['package.json']);
const addon = await Bun.file(join(import.meta.dir, '../package.json')).json();
if (addon.version !== pkg.sveet.version) {
	throw new Error(`@nerdwerk/sv is ${addon.version} but sveet.version is ${pkg.sveet.version}`);
}
delete pkg['bun-create'];
files['package.json'] = JSON.stringify(pkg, null, '\t') + '\n';

await Bun.write(join(import.meta.dir, '../src/template.json'), JSON.stringify({ files, symlinks }));
console.log(
	`✓ packed ${Object.keys(files).length} files, ${Object.keys(symlinks).length} symlinks`
);
