# Script format (`script.md`)

The script is a Markdown file in A/V (audio/visual) format that lives in the episode folder. It serves you while recording and syncing by hand, and later the optional automation, so it follows a few simple rules.

```markdown
---
code: BT-01
title: LED
recalls: [BT-00]
theme: blueprint
---

# BT-01 — LED

## scene: 01-situation

> visual: empty bench; the intern (off screen) wires the LED straight to the 9 V battery.

[switch-on] The intern connected the LED directly to the battery.
[burn] For about a tenth of a second, it worked.

> visual: SYS//A appears at the bottom.

[sys] Component damaged.

## scene: 02-opening

[opening-out]
```

## Rules

| Element | Meaning |
|---|---|
| `## scene: <name>` | Starts a scene. The name is the file in `scenes/`, without `.tsx`. |
| Plain text line | Narration, exactly as you will say it. |
| `> visual: ...` | Screen note: what is shown. Not spoken. |
| `[event]` | Sync point. The same name goes in a `waitUntil('event')` in that scene. It sits **before** the word where the animation starts. |

## Why the markers live in the text

- **When syncing by hand:** while dragging the `switch-on` pill in the editor, you know exactly which word it belongs to.
- **For the planned automation:** a Whisper-based sync would align these words to the recording and write the times into the same `.meta` files the editor uses. You can still correct them by hand afterwards. See [ADR-0002](adr/0002-optional-automation.md).
