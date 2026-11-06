#!/usr/bin/env node
// Creates a new episode from studio/template.
// Usage: pnpm new <id> [--locale en|pt-BR] [--theme blueprint|lab]
//   e.g. pnpm new bt-01-led --locale pt-BR
import {cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const usage = 'Usage: pnpm new <id> [--locale en|pt-BR] [--theme blueprint|lab]   (id: lowercase, digits and hyphens, e.g. bt-01-led)';

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {locale: {type: 'string', default: 'en'}, theme: {type: 'string', default: 'blueprint'}},
  });
} catch (error) {
  console.error(`${error.message}\n${usage}`);
  process.exit(1);
}
const {
  positionals: [id],
  values: {locale, theme},
} = parsed;

if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) fail(usage);
if (!['en', 'pt-BR'].includes(locale)) fail(`Unknown locale "${locale}". Use en or pt-BR.`);
if (!['blueprint', 'lab'].includes(theme)) fail(`Unknown theme "${theme}". Use blueprint or lab.`);

const template = join(root, 'studio', 'template');
const episodes = join(root, 'studio', 'episodes');
const target = join(episodes, id);
if (existsSync(target)) fail(`Already exists: studio/episodes/${id}`);

mkdirSync(episodes, {recursive: true});
cpSync(template, target, {recursive: true});
// The project file is named after the episode: that name becomes the exported file name.
renameSync(join(target, 'template.ts'), join(target, `${id}.ts`));
renameSync(join(target, 'template.meta'), join(target, `${id}.meta`));

// Fill in the code (BT-01 from "bt-01-...") and the project variables.
const code = (id.match(/^([a-z]+-\d+)/)?.[1] ?? id).toUpperCase();
const edits = {
  [`${id}.ts`]: text =>
    text.replace("theme: 'blueprint'", `theme: '${theme}'`).replace("locale: 'en'", `locale: '${locale}'`),
  'script.md': text => text.replaceAll('EP-XX', code).replace('theme: blueprint', `theme: ${theme}`),
  'scenes/02-opening.tsx': text => text.replaceAll('EP-XX', code),
  'scenes/04-recap.tsx': text => text.replaceAll('EP-XX', code),
  'scenes/05-closing.tsx': text => text.replaceAll('EP-XX', code),
};
for (const [file, edit] of Object.entries(edits)) {
  const path = join(target, file);
  writeFileSync(path, edit(readFileSync(path, 'utf8')));
}

console.log(`Episode created: studio/episodes/${id}  (${code}, ${theme}, ${locale})`);
console.log('If the editor (pnpm dev) is already running, restart it so it picks up the new project.');
console.log(`Then open: http://localhost:9000/episodes/${id}/${id}`);

function fail(message) {
  console.error(message);
  process.exit(1);
}
