# tools/: optional automation

This folder is reserved. Nothing in the studio depends on it: the main workflow is manual ([guide](../docs/guide.md)).

Planned, see [ADR-0002](../docs/adr/0002-optional-automation.md):

| Command | What it will do |
|---|---|
| `pnpm sync <episode>` | Whisper → align with `script.md` → write event times into the `.meta` files → generate `subtitles.srt` |

When implemented, it will be a Python project managed with `uv` (`tools/pyproject.toml`).
