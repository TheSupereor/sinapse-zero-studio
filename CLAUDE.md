# CLAUDE.md — synapticon-studio

Estúdio de vídeos instrutivos (série BT da Synapticon Laboratories) sobre **Canvas Commons 0.4.0**,
o fork comunitário do Motion Canvas. É um monorepo pnpm, e o idioma do projeto é português (pt-BR).

## Princípios

- **Manual primeiro.** O usuário edita no editor (`pnpm dev`, localhost:9000) e sincroniza arrastando eventos (`waitUntil`) sobre a onda da narração. Automação (Whisper etc.) é **opcional** e escreve nos mesmos `.meta`. Nunca crie dependência de script para uma cena funcionar.
- **Sem fork do motor.** Ajustes no Canvas Commons vão em `pnpm patch`. Não edite `node_modules`. Ver `docs/adr/0001`.
- **Cores só pelo tema:** use `useTema()`, nunca hex nas cenas. Os temas são `blueprint` (escuro) e `laboratorio` (claro).
- **Humor:** registro seco, à la Portal/Half-Life, mas **sem nenhum** nome, personagem, fala ou marca desses jogos (`docs/tom-de-voz.md`).
- **Estrutura Telecurso:** situação → conceito → retomada (de episódios anteriores, não só do último) → encerramento.

## Comandos

```
pnpm install | pnpm dev | pnpm typecheck | pnpm novo <id>
```

## Mapa

- `packages/brand/src`: tokens (de `~/.claude/skills/synapticon-pdf/kit/paleta`), `temas.ts` (`useTema`), `tipografia.ts`, `assets.ts` (logo, ícones recoloríveis, ornamentos).
- `packages/components/src`:
  - `base/`: Fundo, Callout, Grifo/Moldura, Anunciador, Cartao, Grafico, PrintZoom, Marca/Icone;
  - `eletronica/`: Componente (pinos), símbolos, Fio, Osciloscopio;
  - `templates/blocos.tsx`: abertura, capitulo, retomada, encerramento;
  - `tempo.ts`.
- `studio/mostruario/cenas`: exemplo de uso de cada componente. **Atualize quando criar componente.**
- `studio/episodios/<id>/<id>.ts`: projeto do episódio. O nome do arquivo = nome do MP4 em `studio/output/`.

## Armadilhas já encontradas (Canvas Commons ≠ Motion Canvas 3)

- **Âncora:** `offset` **não existe**; use `anchor` / `anchorX` / `anchorY`, com a mesma semântica.
- **Assets assíncronos:** antes de ler `Img.naturalSize()` e afins, faça `yield node` dentro do gerador, senão aparece o erro "Tried to access an asynchronous property before the node was ready".
- **Tipos:** os `tsconfig` precisam de `skipLibCheck: true`, porque as declarações do pacote têm erros. Pacotes fora do `studio` precisam de `types: ["vite/client", "@canvas-commons/core/project"]`.
- **Projetos novos:** um arquivo de projeto novo só aparece depois de reiniciar o `pnpm dev`, porque a lista é lida na inicialização.
- **Tempo dos eventos:** o `targetTime` no `.meta` é relativo ao início da cena.
- **Tempo no desenho:** em `drawShape`, use `this.view().globalTime()`. `useTime()` não funciona fora de threads.
- **Exportação:** o WebCodecs gera MP4 H.264 + AAC, já com `audio` e `sound()` mixados. O FFmpeg está descontinuado.
- **Política de supply-chain do pnpm:** ela recusa versões recentes. Fixe versões com mais de 2 semanas e não adicione `minimumReleaseAgeExclude`.

## Verificação visual (para o agente)

- **Navegador:** o Vivaldi headless trava ao criar contexto. Use o Chromium headless do Playwright (`PLAYWRIGHT_BROWSERS_PATH`) com `launchPersistentContext`.
- **Render:** abra `http://localhost:9000/<projeto>`, clique no botão **RENDER** e inspecione `studio/output/`. Para frames rápidos, use temporariamente o exportador *Image sequence* com fps e escala menores no `.meta` do projeto, e **restaure depois**.
