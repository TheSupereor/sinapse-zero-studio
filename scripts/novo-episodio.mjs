#!/usr/bin/env node
// Cria um episódio novo a partir de studio/episodios/_modelo.
// Uso: pnpm novo bt-01-led
import {cpSync, existsSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];

if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error('Uso: pnpm novo <id>   (minúsculas, números e hífens; ex.: bt-01-led)');
  process.exit(1);
}

const modelo = join(raiz, 'studio', 'episodios', '_modelo');
const destino = join(raiz, 'studio', 'episodios', id);
if (existsSync(destino)) {
  console.error(`Já existe: studio/episodios/${id}`);
  process.exit(1);
}

cpSync(modelo, destino, {recursive: true});
// O arquivo de projeto leva o nome do episódio: é ele que dá nome ao MP4 exportado.
renameSync(join(destino, '_modelo.ts'), join(destino, `${id}.ts`));
renameSync(join(destino, '_modelo.meta'), join(destino, `${id}.meta`));

// Pré-preenche o código (BT-01 a partir de "bt-01-...") no roteiro e nas cenas.
const codigo = (id.match(/^([a-z]+-\d+)/)?.[1] ?? id).toUpperCase();
for (const arquivo of [
  'roteiro.md',
  'cenas/02-abertura.tsx',
  'cenas/05-encerramento.tsx',
]) {
  const caminho = join(destino, arquivo);
  writeFileSync(caminho, readFileSync(caminho, 'utf8').replaceAll('BT-XX', codigo));
}

console.log(`Episódio criado: studio/episodios/${id}  (${codigo})`);
console.log('Se o editor (pnpm dev) já estiver aberto, reinicie-o para ele enxergar o projeto novo.');
console.log(`Endereço: http://localhost:9000/episodios/${id}/${id}`);
