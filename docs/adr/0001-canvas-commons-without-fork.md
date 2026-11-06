# ADR-0001: Canvas Commons as a pinned dependency, not a fork

**Date:** 2026-11-05 · **Status:** accepted

## Context

We wanted programmatic animation with a visual editor and a timeline that syncs to narration. The first idea was to fork Motion Canvas. Research showed:

- **Motion Canvas** has stalled. The last stable release, 3.17.2, dates from December 2024; the last alpha and the last code commit from February 2025. The current maintainers cannot publish releases.
- **Canvas Commons** is the active community fork: same API, MIT license, `@canvas-commons/*` 0.4.0 published on 2026-10-22. In practice it has one main maintainer.
- **Revideo** is also an active fork, but it focuses on API-driven rendering and no longer prioritizes the editor. The editor is the center of our manual workflow.

## Decision

- **Pinned dependency:** use `@canvas-commons/{core,2d,editor,vite-plugin,webcodecs}` at an **exact** version (0.4.0).
- **No fork:** our code lives in `packages/` (brand, components, templates, transitions) and in `studio/` (projects).
- **Engine fixes:** use `pnpm patch <package>`, with the patches committed to the repository.
- **Way out:** if the patches grow or the project stalls, vendor Canvas Commons as a git submodule in `vendor/` and point the packages at it.

## Consequences

- **Upgrades are deliberate.** Read the changelog, bump the version, render the showcase and check it visually.
- **Differences from Motion Canvas 3 found so far:**
  - `offset` became `anchor` (`anchorX`/`anchorY`);
  - the bundled type declarations need `skipLibCheck`;
  - the FFmpeg exporter was dropped in favor of WebCodecs, which mixes the audio in.
- **Fallback:** going back to `@motion-canvas` 3.17 is possible (nearly the same API), but would mean undoing the differences above.
- **Supply chain:** pnpm's policy refuses versions published very recently. Pin versions that are at least ~2 weeks old instead of adding exceptions.
