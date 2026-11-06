#!/usr/bin/env node
// Exports a FreeCAD document to glTF for ModelView (one named node per part).
// Usage:
//   pnpm export-model <in.FCStd> <out.glb>
//   pnpm model:example        # FreeCAD's AssemblyExample → studio/presets/models/excavator.glb
// Set FREECAD_CMD to the freecadcmd executable if it is not found automatically.
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'tools', 'freecad', 'export_gltf.py');

const freecad = findFreeCAD();
if (!freecad) fail('freecadcmd not found. Install FreeCAD 1.x or set FREECAD_CMD.');

let [input, output] = process.argv.slice(2);
if (input === '--example') {
  const examples = join(dirname(dirname(freecad)), 'data', 'examples', 'AssemblyExample.FCStd');
  if (!existsSync(examples)) fail(`FreeCAD example not found: ${examples}`);
  input = examples;
  output = join(root, 'studio', 'presets', 'models', 'excavator.glb');
}
if (!input || !output) fail('Usage: pnpm export-model <in.FCStd> <out.glb>');
input = resolve(input);
output = resolve(output);
mkdirSync(dirname(output), {recursive: true});

// freecadcmd treats extra arguments as files to open, so arguments go in through -c.
const code = `import sys; sys.argv = ['export_gltf', ${JSON.stringify(input)}, ${JSON.stringify(output)}]; exec(open(${JSON.stringify(script)}, encoding='utf-8').read())`;
const run = spawnSync(freecad, ['-c', code], {encoding: 'utf8'});
const log = `${run.stdout ?? ''}${run.stderr ?? ''}`
  .split(/\r?\n/)
  .filter(line => line.trim() && !line.includes('%'))
  .join('\n');
console.log(log);
if (run.status !== 0 || !existsSync(output)) fail('Export failed.');

function findFreeCAD() {
  if (process.env.FREECAD_CMD) return process.env.FREECAD_CMD;
  const programFiles = process.env.ProgramFiles ?? 'C:\\Program Files';
  if (!existsSync(programFiles)) return null;
  const installs = readdirSync(programFiles)
    .filter(name => /^FreeCAD/i.test(name))
    .sort()
    .reverse();
  for (const name of installs) {
    const candidate = join(programFiles, name, 'bin', 'freecadcmd.exe');
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
