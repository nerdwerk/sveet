import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineAddon, defineAddonOptions } from 'sv';
import template from './template.json';

export default defineAddon({
	id: '@nerdwerk/sv',
	shortDescription: 'sveet: bun, SQLite, magic links, ui-sdk, Fly.io, sandboxed agents',
	homepage: 'https://github.com/nerdwerk/sveet',
	options: defineAddonOptions().build(),

	setup: ({ isKit, language, unsupported }) => {
		if (!isKit) unsupported('sveet is a SvelteKit starter');
		if (language !== 'ts') unsupported('sveet needs TypeScript (--types ts)');
	},

	run: ({ cwd, sv }) => {
		const { name } = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
		for (const [file, content] of Object.entries(template.files)) {
			// sv.file reflows blank lines in markdown, which then fails prettier --check.
			if (file.endsWith('.md')) {
				mkdirSync(dirname(join(cwd, file)), { recursive: true });
				writeFileSync(join(cwd, file), content);
			} else
				sv.file(file, () =>
					file === 'package.json'
						? content.replace('"name": "sveet"', `"name": ${JSON.stringify(name)}`)
						: content
				);
		}
		for (const file of ['.npmrc', 'src/lib/index.ts'])
			if (existsSync(join(cwd, file))) sv.removeFile(file);
		// sv.file can't create symlinks; these point skills at .agents/skills and node_modules.
		for (const [link, target] of Object.entries(template.symlinks)) {
			const path = join(cwd, link);
			mkdirSync(dirname(path), { recursive: true });
			rmSync(path, { recursive: true, force: true });
			symlinkSync(target, path);
		}
	},

	nextSteps: ({ packageManager }) => [
		...(packageManager === 'bun' ? [] : ['bun install   # sveet runs on bun']),
		'bun run sandbox   # dev server + agent in a VM (needs microsandbox; or: bun run setup && bun run dev)',
		'Open the agent at http://localhost:4096 and say: "set this project up"'
	]
});
