# CLAUDE.md

Guidance for AI coding agents working in this repository; Claude Code loads it automatically. People should start with the [README](README.md) and the [guide](docs/guide.md).

sinapse-zero-studio is a pnpm monorepo for narrated explainer videos (the Sinapse Zero BT training series), built on **Canvas Commons 0.4.0**, the community fork of Motion Canvas. Code and docs are in English; the episodes are narrated in Brazilian Portuguese (`locale: 'pt-BR'`).

**Start with `ROADMAP.md`**, the project tracker: the production pipeline, milestones with owners, and the decision log. Tick an item with the date when it is done, and log every decision that changes the plan.

## Principles

- **Manual first.** The author edits in the editor (`pnpm dev`, localhost:9000) and syncs by dragging time events (`waitUntil`) over the narration waveform. Automation (Whisper, etc.) is optional and writes to the same `.meta` files, so every scene works without it.
- **Public framework, private episodes.** `studio/episodes/` is git-ignored (ADR-0004): episode content, renders and recordings stay out of commits. Write episodes and scripts only when the author asks.
- **No engine fork.** Engine fixes go through `pnpm patch`, leaving `node_modules` untouched. See `docs/adr/0001`.
- **Colors only from the theme:** `useTheme()`, never hex in scenes. Themes: `blueprint` (dark), `lab` (light).
- **Template text only from `useStrings()`:** add every new default string to both `en` and `pt-BR` in `strings.ts`.
- **Humor:** dry, in the Portal/Half-Life register, with original names, characters and lines only, and no trademarks from those games (`docs/voice-and-tone.md`).
- **Episode structure:** situation → opening → concept → recap (of earlier episodes, not only the last one) → closing.

## Commands

```
pnpm install | pnpm dev | pnpm typecheck | pnpm new <id> [--locale en|pt-BR] [--theme blueprint|lab]
```

## Map

- `packages/brand/src`: `tokens.ts`, `themes.ts` (`useTheme`), `typography.ts`, `assets.ts` (logo, recolorable icons, ornaments).
- `packages/components/src`:
  - `base/`: Background, Callout, HighlightBar/HighlightBox, Announcer, StatCard, Chart, ScreenshotZoom, TechDrawing, LogoMark/BrandIcon;
  - `electronics/`: Part (pins), symbols, Wire, Oscilloscope;
  - `templates/`: blocks (opening, chapter, recap, closing), interstitial (`drawingInterstitial`);
  - `transitions/`: panelWipe (scene transition), stinger (overlay);
  - `strings.ts` (`useStrings`, locales), `timing.ts`.
- `packages/three/src` (spike): `ModelView` draws a glTF assembly as technical line art, with signals for explosion, camera, fill, hidden lines and guides, and `pointOf(part)` for callouts. `lines.ts` extracts crease and silhouette edges per part and draws them as instanced thick lines, visible and hidden (dashed) against a depth pre-pass. glTF comes from `pnpm export-model` (`tools/freecad/export_gltf.py`). Guide § 10.
- `studio/showcase/scenes`: an example of every component. **Update it when you add a component.**
- `studio/presets/`: standalone preset projects. `stinger.meta` exports transparent PNGs, `interstitial.meta` exports MP4; `drawings/` holds sample SVGs.
- `studio/template/`: copied by `pnpm new` into `studio/episodes/<id>/`. The project file name = the exported file name.

## Gotchas (Canvas Commons ≠ Motion Canvas 3)

- **Anchors:** `offset` **does not exist**; use `anchor` / `anchorX` / `anchorY`, with the same semantics.
- **Async assets:** `yield node` before reading `Img.naturalSize()` and the like, or you get "Tried to access an asynchronous property before the node was ready".
- **Types:** the tsconfigs need `skipLibCheck: true`. Packages outside `studio` also need `types: ["vite/client", "@canvas-commons/core/project"]`.
- **New projects:** a new project file only shows up after restarting `pnpm dev`.
- **Event timing:** `targetTime` in a scene `.meta` is relative to the scene start.
- **Time while drawing:** in `drawShape`, use `this.view().globalTime()`; `useTime()` only works inside threads.
- **Export:** the WebCodecs exporter writes MP4 H.264 + AAC with `audio` and `sound()` mixed in, and **never alpha**. Overlays need the Image sequence exporter (PNG) with background `none`. The image exporter overwrites by frame number, so stale frames survive a shorter re-render.
- **SVG parsing:** the parser reads inline styles and attributes only (not CSS classes), ignores `<text>`, and keeps the markup in a live DOM container, so a `<style>` would leak into the page. `TechDrawing` handles all three; reuse its `prepareSvg` approach for other SVG inputs.
- **Transitions:** `useTransition` callbacks get the context in real pixels, origin top-left, inside save/restore.
- **Shadowed members:** don't name component members after Node members (`scale`, `draw`, `margin`, `closed` on Curves…). For example, `*draw()` would override `Node.draw(context)`.
- **3D (`ModelView`):**
  - **One context:** all instances share one WebGL context, because browsers cap live contexts and scenes rebuild on every reload.
  - **Units:** glTF is in metres, so part offsets are fractions of the model's longest side.
  - **Headless export:** freecadcmd must `tessellate()` shapes before `Import.export`, or every node is skipped.
  - **Colors:** shader colors are raw sRGB (`srgb()`), bypassing three's color management.
  - **One primitive per face:** CAD glTF splits every face into its own primitive, so `buildEdges` welds vertices across a part's meshes; otherwise every face boundary is an open edge.
  - **Line meshes are part children:** their geometry is a unit quad, so compute bounding boxes and neighbours *before* adding them (`rig()` does), never with `Box3.setFromObject` on a part afterwards.
  - **Stencil:** three's `WebGLRenderer` has `stencil: false` by default; the line passes need it, so the shared renderer sets it.
- **pnpm supply-chain policy:** it refuses recent versions. Pin versions older than 2 weeks; never add `minimumReleaseAgeExclude`.

## Visual verification

- **Browser:** drive the editor with Playwright's Chromium headless shell (`PLAYWRIGHT_BROWSERS_PATH`) and `launchPersistentContext`. Desktop browsers in headless mode can crash when creating the rendering context.
- **Render:** open `http://localhost:9000/<project>`, click **RENDER**, and inspect `studio/output/` (extract frames with the ffmpeg bundled in `imageio-ffmpeg`).
- **README media:** `docs/media/` is generated from showcase and preset renders. Regenerate it when a component's look changes.
