# ADR-0003: Manim later, as a video bridge

**Date:** 2026-11-05 · **Status:** deferred (structure reserved)

## Context

Canvas Commons already covers most of what the trainings need: LaTeX (MathJax), charts, curve morphing and code. Manim is stronger at 3D and heavy animated math, such as fields, coils and equation transforms.

## Decision

Don't integrate it yet. When a scene needs Manim:

1. **Python project:** create one in `manim/`, managed with `uv`, one scene per file.
2. **Render WebM with alpha:** `manim render -qh --transparent --format webm scene.py ClassName`. The output goes to `studio/episodes/<id>/manim/`.
3. **`ManimClip` component:** a Canvas Commons `Video` whose `play()` is synced to a `waitUntil`.

## Consequences

- **LaTeX setup.** Equations in Manim need a LaTeX install (MiKTeX). Use Canvas Commons' `Latex` while it is enough.
- **No editing inside the clip.** A Manim clip is a finished video, not an editable node; timing inside it is changed in Python.
