# synapticon-studio

Estúdio de vídeos instrutivos da **Synapticon Laboratories**: explainers com motion graphics,
narração em off e humor seco, feitos em código com o [Canvas Commons](https://canvascommons.io)
(fork comunitário do Motion Canvas) e editados à mão no editor visual dele.

## Começar

```powershell
pnpm install
pnpm dev          # editor em http://localhost:9000 (use o Vivaldi)
```

Comece pelo **mostruário** (`/mostruario/blueprint` ou `/mostruario/laboratorio`): ele tem
todos os componentes funcionando, com eventos que você pode arrastar.

| Comando | O que faz |
|---|---|
| `pnpm dev` | Abre o editor (reinicie depois de criar um episódio) |
| `pnpm novo bt-01-led` | Cria um episódio a partir do modelo |
| `pnpm typecheck` | Checa os tipos de todo o workspace |

## Estrutura

```
packages/brand        @synapticon/brand       paleta, temas (blueprint/laboratorio), fontes, logos, ícones
packages/components   @synapticon/components  componentes, símbolos de eletrônica, blocos de episódio
studio/               app do editor (Vite + Canvas Commons)
  mostruario/         vitrine de componentes nos dois temas
  episodios/_modelo/  esqueleto copiado por `pnpm novo`
docs/                 fluxo manual, componentes, tom de voz, formato de roteiro, ADRs
tools/  manim/        reservados para automação e ponte com Manim (opcionais, ainda vazios)
```

## Leia

1. [Fluxo manual](docs/fluxo-manual.md): do áudio ao MP4, tudo no editor.
2. [Componentes](docs/componentes.md): referência rápida.
3. [Tom de voz](docs/tom-de-voz.md): o humor do laboratório e o que é proibido.
4. [Formato do roteiro](docs/roteiro-formato.md).
5. Decisões: [sem fork](docs/adr/0001-canvas-commons-sem-fork.md) ·
   [automação opcional](docs/adr/0002-automacao-opcional.md) ·
   [Manim depois](docs/adr/0003-ponte-manim.md).

## Licenças

- **Código:** o nosso é privado; o Canvas Commons é MIT.
- **Fontes:** Bahnschrift, Segoe UI e Consolas são do Windows. São carregadas do sistema e não são versionadas.
- **Marca:** logos e ícones em `packages/brand/assets` são da Synapticon.
