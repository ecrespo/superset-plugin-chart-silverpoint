// After tsc: the thumbnails beside the compiled plugins.
import { cpSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const slug of readdirSync(`${root}src/plugins`)) cpSync(`${root}src/plugins/${slug}/images`, `${root}lib/plugins/${slug}/images`, { recursive: true });
console.log('lib/: thumbnails copied');
