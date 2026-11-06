# ADR-0004: Public framework, private episodes

**Date:** 2026-11-05 · **Status:** accepted

## Context

The studio is published as an open portfolio project. The episodes made with it, meaning scripts, narration, footage, timing files and renders, are content and stay private.

## Decision

- **This repository is the framework:**
  - the brand package and the component library;
  - the transitions;
  - the showcase, the preset projects and the episode template;
  - the tooling and the docs.
- **Episodes are ignored by git.** They live in `studio/episodes/`, which `.gitignore` excludes entirely. `pnpm new` creates the folder on first use. The editor still finds them through the `./episodes/*/*.ts` project glob.
- **To version episodes**, make `studio/episodes/` its own private git repository. A nested repository inside an ignored folder needs no submodule configuration.
- **Renders** (`output/`) and raw recordings (`**/audio/raw/`) are never committed.
- **Brand assets** (`packages/brand/assets`) are trademarks. They are published so the showcase renders as designed, but they are excluded from the MIT license (`NOTICE.md`).

## Consequences

- **Clean clone:** a fresh clone has no episodes. The showcase and the presets are what demonstrate the framework.
- **Mind the dependency:** a breaking change to a component can break private episodes that this repository cannot see. Keep the component API stable, and render an episode or two before changing it.
