# ADR-0002: Manual first, automation as an option

**Date:** 2026-11-05 · **Status:** accepted

## Context

Episodes are edited by hand in the Canvas Commons editor. Automation, such as Whisper-based sync, should be an option, never a requirement.

## Decision

1. **The manual workflow is the main path** ([guide](../guide.md)). No scene, component or template may depend on an automation script.
2. **One source of truth.** Automation, when it exists, writes to **the same files the editor uses**: `timeEvents[].targetTime` in each scene's `.meta`. There is no second timing format. Running automation and then dragging by hand keeps working; the last writer wins.
3. **Where it lives.** Optional scripts go in `tools/` (Python, managed with `uv`) behind their own `pnpm` commands. Installing `tools/` or not never affects `pnpm dev`.

## Facts verified in a spike (Canvas Commons 0.4.0)

**Scene `.meta`:**

```json
{"version": 0, "timeEvents": [{"name": "end", "targetTime": 0.6}], "seed": 3672189177}
```

- **Relative times.** `targetTime` is **relative to the scene start**. With a 0.6 s `appear()` before `waitUntil('end')`, the editor recorded 0.6.
- **Direct effect.** Changing `targetTime` from 0.6 to 3.0 made the exported video exactly 2.4 s longer.

**Export:** the WebCodecs exporter mixes the project `audio` and `sound()` calls into the MP4 (AAC, 48 kHz).

## Planned automation (not implemented)

`pnpm sync <episode>` would:
1. transcribe `audio/narration.wav` with faster-whisper (word timestamps);
2. align it with the text of `script.md` (difflib over normalized text);
3. turn every `[event]` into a time relative to the start of its `## scene:`;
4. write the result into the `.meta` files;
5. generate `subtitles.srt` with the script's spelling.

Implementation note: with faster-whisper 1.2.1 and the latest PyAV, audio decoding breaks (`av.open(metadata_errors=...)`). Decode with ffmpeg (`imageio-ffmpeg`) and pass a numpy array instead.
