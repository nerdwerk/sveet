// The CLI comes via bunx: as a dependency it hoists an older @better-auth/core that breaks the build.
import { $ } from 'bun';

const output = 'src/lib/server/db/auth.schema.ts';
await $`bunx --bun @better-auth/cli@latest generate --config src/lib/server/auth-schema.config.ts --output ${output} --yes`;
await $`bunx prettier --write ${output}`.quiet();

// The CLI drops these DB defaults; the seed and tests insert users without timestamps.
const now = ".default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)";
let source = (await Bun.file(output).text()).replace(
	/(\b(?:createdAt|updatedAt): integer\('(?:created|updated)_at', \{ mode: 'timestamp_ms' \}\))(?!\s*\.default)/g,
	`$1${now}`
);
if (!/import \{[^}]*\bsql\b[^}]*\} from 'drizzle-orm'/.test(source)) {
	source = source.replace(
		/import \{([^}]*)\} from 'drizzle-orm';/,
		"import {$1, sql } from 'drizzle-orm';"
	);
}
await Bun.write(output, source);
await $`bunx prettier --write ${output}`.quiet();
console.log(`✓ ${output} — now: bun run db:generate`);
