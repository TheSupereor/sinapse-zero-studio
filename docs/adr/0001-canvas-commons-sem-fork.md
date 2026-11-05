# ADR-0001 — Canvas Commons como dependência fixada, sem fork

**Data:** 2026-11-05 · **Status:** aceito

## Contexto

Queríamos uma base de animação programática com editor visual e linha do tempo sincronizada com
narração. O pedido inicial era um fork do Motion Canvas. A pesquisa mostrou o seguinte:

- O **Motion Canvas** original está parado. A última versão estável, 3.17.2, é de dez/2024; a última alpha e o último commit de código são de fev/2025. Os mantenedores atuais não têm acesso para publicar versões.
- O **Canvas Commons** é o fork comunitário ativo, com a mesma API, licença MIT e `@canvas-commons/*` 0.4.0 publicado em 22/out/2026. Na prática, tem um mantenedor principal.
- O **Revideo** também é um fork ativo, mas focado em renderização por API. O editor deixou de ser prioridade, e o editor é justamente o centro do nosso fluxo manual.

## Decisão

- **Dependência fixada:** usar `@canvas-commons/{core,2d,editor,vite-plugin,webcodecs}` com versão **exata** (0.4.0).
- **Sem fork:** não fazer fork. O código nosso vive em `packages/` (marca, componentes, templates) e em `studio/` (episódios).
- **Ajustes no motor:** usar `pnpm patch <pacote>`, com os patches versionados no repo.
- **Escape:** se os patches crescerem ou o projeto parar, trazer o Canvas Commons como submódulo git em `vendor/` e apontar os pacotes para ele.

## Consequências

- **Atualizações:** passam a ser deliberadas. Leia o changelog, suba a versão, rode o mostruário e confira visualmente.
- **Diferenças já encontradas** em relação ao Motion Canvas 3:
  - `offset` virou `anchor` (`anchorX`/`anchorY`);
  - os tipos exigem `skipLibCheck`;
  - o exportador FFmpeg foi descontinuado em favor do WebCodecs, que já mixa o áudio.
- **Plano B:** voltar ao `@motion-canvas` 3.17 é possível (API quase igual), mas exigiria desfazer as diferenças acima.
- **Política de supply-chain do pnpm:** ela recusa versões publicadas há pouco tempo. Fixe versões com pelo menos ~2 semanas em vez de criar exceções.
