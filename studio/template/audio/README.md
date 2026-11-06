# Episode audio

| File | What it is | Commit it? |
|---|---|---|
| `narration.wav` | Final, cleaned-up narration. This is the track shown on the timeline. | Yes |
| `sfx/*.wav` | Sound effects (whoosh, click, the SYS//A beep) | Yes |
| `raw/` | Takes and Audacity projects (`.aup3`) | No (ignored by `.gitignore`) |

## Exporting from Audacity

1. Edit the takes in `raw/` and normalize to −1 dB. If needed, run Effect › Noise Reduction.
2. Use **File › Export Audio**: WAV, 16-bit PCM, 48000 Hz, mono, named `narration.wav`.
3. In the episode's project file (`<id>.ts`), uncomment `import narration ...` and `audio: narration`.

The editor reloads on its own. If you re-export the narration with the editor open, it updates too.

## Sound effects in a scene

```tsx
import {sound} from '@canvas-commons/core';
import click from '../audio/sfx/click.wav';

yield* waitUntil('switch-on');
sound(click).gain(-6).play();
```

Sound effects are mixed into the exported MP4 together with the narration. Image sequences
carry no audio: if you finish the episode in a video editor, place the effects there.
