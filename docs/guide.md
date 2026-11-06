# Guide

This guide covers the whole workflow: setting up, creating and editing projects, building your own presets and transitions, technical drawings from FreeCAD, and exporting for a video editor. Everything is done by hand in the Canvas Commons editor. Automation is optional and comes later ([ADR-0002](adr/0002-optional-automation.md)).

- [1. Setup](#1-setup)
- [2. How Canvas Commons thinks](#2-how-canvas-commons-thinks)
- [3. The projects in this repository](#3-the-projects-in-this-repository)
- [4. Creating an episode](#4-creating-an-episode)
- [5. Editing a scene](#5-editing-a-scene)
- [6. Syncing to the narration](#6-syncing-to-the-narration)
- [7. Theme and language](#7-theme-and-language)
- [8. Presets and transitions](#8-presets-and-transitions)
- [9. Technical drawings from FreeCAD](#9-technical-drawings-from-freecad)
- [10. Exporting](#10-exporting)
- [11. Troubleshooting](#11-troubleshooting)

---

## 1. Setup

**Requirements:**
- **Node:** 20.19 or later.
- **pnpm:** 12; `corepack enable` installs the version pinned in `package.json`.
- **Browser:** a Chromium-based one (Chrome, Edge, Vivaldi…). The MP4 exporter uses WebCodecs.
- **Fonts:** Bahnschrift, Segoe UI and Consolas ship with Windows. On macOS or Linux the fallbacks in `packages/brand/src/typography.ts` are used.

```sh
pnpm install
pnpm dev          # editor on http://localhost:9000
```

The editor UI has three parts:
- **Left panel:** *Video Settings* (camera icon) holds the resolution, frame rate, exporter and the **RENDER** button.
- **Center:** the preview.
- **Bottom:** the timeline, with one bar per scene, a pill for every time event, and the audio waveform once narration is attached.

## 2. How Canvas Commons thinks

[Canvas Commons](https://canvascommons.io) is the community fork of Motion Canvas. Animations are **code**, while timing is edited **visually**.

| Concept | What it is |
|---|---|
| **Project** | A `.ts` file calling `makeProject({scenes, audio, variables})`. One project = one exported video. |
| **Scene** | A `.tsx` file calling `makeScene2D(function* (view) {...})`. It adds nodes to `view` and animates them. |
| **Node** | Something on screen: `Rect`, `Txt`, `Line`, `Img`, or one of our components (`Callout`, `Wire`…). |
| **Signal** | Every property is a function: `node.opacity()` reads it, `node.opacity(0.5)` sets it, `node.opacity(1, 0.6)` animates it over 0.6 s. A function value makes it reactive: `width={() => 600 * progress()}`. |
| **Generator** | The scene is a timeline written top to bottom. `yield*` waits for an animation; `all(...)` runs animations together, `sequence(0.1, ...)` staggers them, `delay(t, ...)` starts one later. |
| **Time event** | `yield* waitUntil('name')` pauses until a point you choose **in the editor** by dragging a pill. The position is saved in the scene's `.meta` file. |

Two consequences:
- Changing code hot-reloads the preview instantly.
- Changing timing never needs code, because you drag pills.

## 3. The projects in this repository

| Project | URL | What it is |
|---|---|---|
| `showcase/blueprint` | `/showcase/blueprint` | Every component, dark theme, English |
| `showcase/lab` | `/showcase/lab` | The same scenes, light theme, Brazilian Portuguese defaults |
| `presets/stinger` | `/presets/stinger` | Overlay transition, renders as transparent PNGs |
| `presets/interstitial` | `/presets/interstitial` | Technical-drawing loading screen, renders as MP4 |
| `template/template` | `/template/template` | The episode skeleton copied by `pnpm new` |
| `episodes/<id>/<id>` | `/episodes/<id>/<id>` | Your episodes (git-ignored; see [ADR-0004](adr/0004-public-framework-private-episodes.md)) |

The project file name becomes the exported file name, so every project file needs a unique name.

## 4. Creating an episode

```sh
pnpm new bt-01-led                          # English defaults, dark theme
pnpm new bt-01-led --locale pt-BR --theme lab
```

The command:
1. copies `studio/template` to `studio/episodes/bt-01-led`;
2. renames the project file to `bt-01-led.ts`;
3. fills in the code (`BT-01`), the theme and the language.

**Restart `pnpm dev` afterwards**, because the editor only scans for projects at startup.

```
studio/episodes/bt-01-led/
├─ bt-01-led.ts      ← the project: scene list, audio, theme, locale
├─ bt-01-led.meta    ← editor settings (exporter, fps…), written by the editor
├─ script.md         ← A/V script: narration + screen notes + [event] markers
├─ scenes/           ← one scene per .tsx, each with its own .meta (event timings)
├─ audio/            ← narration.wav, sfx/, raw/ (ignored)
└─ images/           ← screenshots, photos, datasheets
```

**Structure:** episodes follow situation → opening → concept → recap → closing.
- **More chapters:** duplicate `03-concept.tsx` for each chapter and add it to `scenes` in the project file.
- **Fewer scenes:** remove a scene from that list.

**Versioning your episodes:** `studio/episodes/` is ignored by this repository. To keep history, make it a private repository of its own:

```sh
cd studio/episodes
git init
git remote add origin <your private repo>
```

## 5. Editing a scene

A scene, annotated:

```tsx
import {makeScene2D} from '@canvas-commons/2d';
import {all, createRef, waitUntil} from '@canvas-commons/core';
import {Background, Battery, LED, Wire, appear} from '@synapticon/components';

export default makeScene2D(function* (view) {
  // 1. Build the frame. Refs let you reach nodes later.
  const battery = createRef<Battery>();
  const led = createRef<LED>();
  const wire = createRef<Wire>();

  view.add(<Background />);
  view.add(
    <>
      <Battery ref={battery} x={-300} />
      <LED ref={led} x={300} />
      {/* Pins follow position and rotation, so the wire stays attached. */}
      <Wire ref={wire} points={() => [battery().pin('pos'), led().pin('a')]} end={0} />
    </>,
  );

  // 2. Animate, top to bottom.
  yield* appear(battery());
  yield* wire().end(1, 0.8);               // draw the wire

  // 3. Wait for a moment you place in the editor.
  yield* waitUntil('switch-on');
  yield* all(wire().energize(), led().turnOn());

  yield* waitUntil('end');
});
```

Habits that keep scenes easy to change:
- **Start invisible.** Components are created hidden (`opacity={0}`, `end={0}`) and revealed by a method (`show()`, `trace()`, `plot()`).
- **One event per beat.** Use one `waitUntil` per narration beat, named after what happens (`switch-on`, not `event3`).
- **Shared timing.** Use `pace.fast | normal | slow` and `easings.enter | exit | move` instead of loose numbers, so the video keeps one rhythm.
- **Theme colors only.** Take colors from `useTheme()`, never hex values.
- **Look before you write.** The showcase (`studio/showcase/scenes`) has a working example of every component, and [components.md](components.md) is the API reference.

You can also skip the components and animate raw nodes: `node().position([x, y], 0.6)`, `node().opacity(0, 0.3)`, `node().rotation(90, 1)`. The components are shortcuts, not a requirement.

## 6. Syncing to the narration

1. **Record.** `audio/README.md` explains the Audacity export: WAV, 48 kHz, mono, `narration.wav`.
2. **Attach it.** In `<id>.ts`, uncomment `import narration …` and `audio: narration`. The waveform appears on the timeline.
3. **Place the events.** Play, find the word where an animation should start, and **drag that event's pill** onto it. The editor writes the time into `scenes/<scene>.meta`; commit those files, because they hold your sync work.

Details that matter:
- **Times are relative to the scene start.** Editing one scene never shifts the events of another.
- **Late events.** An event placed *before* the previous animation finishes cannot wait: the next animation simply starts late. Drag the pill later, or shorten the previous animation.
- **Editor-controlled durations.** `useDuration('name')` gives a pill with a handle you can stretch:
  ```tsx
  yield* chart().curve(f).end(1, useDuration('draw-curve'));
  ```
- **Sound effects** fire at an exact point and are mixed into the MP4:
  ```tsx
  yield* waitUntil('burn');
  sound(pop).play();
  yield* led().burnOut();
  ```
- **Audio offset.** If the narration needs to start earlier or later, change *audio offset* in Video Settings.

## 7. Theme and language

Both are project variables:

```ts
export default makeProject({
  scenes: [...],
  variables: {theme: 'blueprint', locale: 'pt-BR'},
});
```

- **`theme`:** `blueprint` (dark drafting table) or `lab` (white test chamber). Components read it through `useTheme()`. If a scene never uses a hex value, switching themes restyles the whole episode.
- **`locale`:** `en` or `pt-BR`. It only changes the **default** text of the templates: the opening overline, the recap label, the closing lines and the interstitial status. Every template option that takes text overrides it. To add a language, extend `strings` in `packages/components/src/strings.ts`.

## 8. Presets and transitions

A **preset** here is a reusable piece of animation with a fixed look and a few options. There are three kinds, and they build on each other:

| Kind | Where it lives | Used as | Examples |
|---|---|---|---|
| **Block**: a generator that adds, animates and cleans up nodes | `packages/components/src/templates`, `.../transitions` | `yield* block(view, {...})` inside any scene | `opening`, `chapter`, `drawingInterstitial`, `stinger` |
| **Scene transition**: a generator built on `useTransition` | `packages/components/src/transitions` | first line of a scene | `panelWipe` |
| **Preset project**: a tiny project that renders a block on its own | `studio/presets` | exported, then dropped into a video editor | `presets/stinger`, `presets/interstitial` |

### 8.1 Writing a block

Every block follows the same four steps. Here is a minimal "warning banner":

```tsx
// packages/components/src/templates/warning.tsx
import {Rect, Txt, View2D} from '@canvas-commons/2d';
import {createRef, ThreadGenerator, waitUntil} from '@canvas-commons/core';
import {fonts, sizes, useTheme} from '@synapticon/brand';
import {appear, pace, vanish} from '../timing';

export interface WarningOptions {
  text: string;
  /** Exit event. Give every block a default and let callers rename it. */
  event?: string;
}

export function* warning(view: View2D, {text, event = 'warning-out'}: WarningOptions): ThreadGenerator {
  const theme = useTheme();
  const banner = createRef<Rect>();

  // 1. Add the nodes, invisible.
  view.add(
    <Rect ref={banner} y={380} padding={[20, 40]} layout fill={theme.amber} radius={6} opacity={0}>
      <Txt text={text} fontFamily={fonts.display} fontSize={sizes.label} fill={theme.background} />
    </Rect>,
  );

  // 2. Enter on its own.
  yield* appear(banner(), pace.normal);
  // 3. Wait for an event the editor can move.
  yield* waitUntil(event);
  // 4. Leave and clean up after itself.
  yield* vanish(banner(), pace.fast);
  banner().remove();
}
```

Then export it from `packages/components/src/index.ts`, add an example to a showcase scene, and use it: `yield* warning(view, {text: 'Do not lick the bench supply.'})`.

Rules that make blocks composable:
- **Colors and text.** Take colors from `useTheme()` and default text from `useStrings()`.
- **Exit event.** Always have an exit event with a default name, overridable with `event`, so one scene can use the block twice.
- **Cleanup.** Remove what you added, so the scene is clean when the block returns.
- **Shared state.** If other nodes should follow the block's progress, expose a signal (as `TechDrawing.progress` does) instead of a callback.

### 8.2 Writing a scene transition

`useTransition` lets you alter the canvas **before the new scene draws**; the previous scene stays rendered underneath. The callback receives the 2D context in **real pixels** with the origin at the top-left, inside a save/restore. So clipping is enough for most reveals. An iris:

```tsx
import {useScene2D} from '@canvas-commons/2d';
import {createSignal, easeInOutCubic, ThreadGenerator, useTransition} from '@canvas-commons/core';

export function* iris(duration = 0.8): ThreadGenerator {
  const real = useScene2D().getRealSize();
  const radius = createSignal(0);
  const end = useTransition(ctx => {
    ctx.beginPath();
    ctx.arc(real.x / 2, real.y / 2, radius(), 0, Math.PI * 2);
    ctx.clip();
  });
  yield* radius(Math.hypot(real.x, real.y) / 2, duration, easeInOutCubic);
  end(); // always call it, or the scene stays clipped
}
```

Use it as the first animation of a scene, after the scene has added its nodes:

```tsx
export default makeScene2D(function* (view) {
  view.add(<Background />);
  yield* iris();
  // ...
});
```

`panelWipe` (`packages/components/src/transitions/panelWipe.tsx`) does the same with a moving rectangle, and adds an accent bar node on the edge. That is the pattern for decorated transitions: the clip comes from `useTransition`, the decoration is an ordinary node in the new scene, removed at the end.

### 8.3 Turning a block into a preset project

When the transition should be used **in a video editor** instead, give it its own project:

1. **Scene:** `studio/presets/scenes/my-preset.tsx` calls the block. Add `<Background />` only if the result should be opaque.
2. **Project:** `studio/presets/my-preset.ts` lists that scene (copy `stinger.ts`).
3. **Exporter:** `studio/presets/my-preset.meta`. Copy `stinger.meta` for transparent PNGs, or `interstitial.meta` for MP4.
4. **Restart and render:** restart `pnpm dev`, open `/presets/my-preset` and click RENDER.

### 8.4 The two transitions that ship

- **`panelWipe({direction, duration, barWidth})`:** a scene transition for finishing **inside** Canvas Commons.
- **`stinger(view, {direction, travel, hold, label})`:** an overlay for finishing **in a video editor**.
  - A panel with accent edges covers the frame, holds, then uncovers it.
  - Total length = `2 × travel + hold`. Cut between your clips in the **middle of the hold**: 0.6 s, or frame 18 at 30 fps, with the defaults.

## 9. Technical drawings from FreeCAD

`TechDrawing` plots an SVG line by line, with a pen tip following the stroke. `drawingInterstitial` puts it on an engineering sheet with zones, a title block and a progress bar: a loading screen between chapters.

### Exporting from FreeCAD

1. **Make the drawing.** In the **TechDraw** workbench, create a page, insert your views and add dimensions.
   - Pick a blank template. The interstitial draws its own border and title block, so a template frame would appear twice.
2. **Export it** with **TechDraw › Export Page as SVG**.
3. **Crop it (optional).** In Inkscape, *Edit › Resize Page to Selection* removes the empty sheet around the views, which makes the drawing fill the frame better. Save as *Plain SVG*.
4. **Add it to the project.** Put the file in `studio/presets/drawings/`, or in an episode's `images/`.

### Using it

```tsx
import bracket from '../drawings/my-part.svg?raw';

yield* drawingInterstitial(view, {
  drawing: bracket,
  title: 'LED mounting bracket',
  code: 'BT-01-003',
  duration: 4,
  drawingProps: {lineScale: 1.8, concurrency: 4},
});
```

Or use the drawing alone, anywhere:

```tsx
const d = createRef<TechDrawing>();
view.add(<TechDrawing ref={d} svg={bracket} fit={[1400, 700]} />);
yield* d().plot(4);
```

### What it does to the SVG, and what it doesn't

- **Styles are resolved.** CAD exports often style lines through CSS classes, which the Canvas Commons parser ignores. `TechDrawing` resolves every shape's computed style first and removes `<style>` blocks, so they cannot leak into the editor page.
- **Text is rebuilt.** The parser drops `<text>`, so dimension values are re-created as `Txt` nodes, rotations included. They use the display font (Bahnschrift, close to ISO 3098 lettering).
- **Colors are mapped** (`recolor`, on by default):
  - dark → theme ink;
  - near-white → removed (sheet backgrounds, text masks);
  - anything else → theme accent.

  That is what makes black-on-white CAD output readable on the dark theme.
- **Weights.** `lineScale` (default 1.5) and `textScale` (default 1.4) compensate for CAD line weights and 3.5 mm lettering, which look thin once a whole sheet fits a 1080p frame.
- **Order and rhythm.** `order` sets the drawing order: `document` (default, usually view by view), `left-to-right` or `top-to-bottom`. `concurrency` sets roughly how many lines draw at once; 1 = a single pen.
- **Progress signal.** Everything hangs off one `progress` signal, so the plot scrubs in the editor, and other elements can follow it (`width={() => 600 * d().progress()}`).
- **Not supported:**
  - **Fill patterns and clip paths.** Use geometric (PAT) hatching rather than SVG pattern hatching.
  - **Multi-line text.** Text with several `<tspan>` lines is joined into one line.

## 10. Exporting

Exporter settings live in *Video Settings* and are saved in the project's `.meta`. RENDER writes to `studio/output/`.

### Which format

| | **Video (WebCodecs)** | **Image sequence (PNG)** |
|---|---|---|
| Output | `output/<project>.mp4`, H.264 + AAC | `output/<project>/000000.png…` |
| Audio | Narration and `sound()` effects mixed in | None |
| Transparency | No: H.264 has no alpha channel | Yes, when the background is *none* |
| Quality | Lossy, good at "high"/"very high" | Lossless |
| Size | Small | ~50–200 KB per frame of flat motion graphics: a 10-minute episode at 30 fps is roughly 1–4 GB |
| Best for | Finishing in Canvas Commons; reviews; opaque full-frame clips | Masters for a video editor; anything that overlays other footage |

**Rule of thumb:**
- **Opaque, full-frame clips** export well as MP4, because nothing behind them needs to show through. That covers a whole episode, an interstitial, or a chapter card that fills the screen.
- **Overlays** must be image sequences with a transparent background. That covers a stinger, a lower third, or a callout over camera footage. An MP4 overlay would be a black rectangle.

### Image sequences for a video editor

1. **Exporter:** in Video Settings, set *exporter* to **Image sequence**, *file type* to **png**.
2. **Background:** for transparency, set *background* to **none** and don't add `<Background />` in the scene.
3. **Group by scene (optional):** writes one folder per scene, handy when each scene becomes its own clip.
4. **Clear the folder first:** delete the old `output/<project>/` before re-rendering. The exporter overwrites frames by number, so if the new version is shorter, stale frames from the old one stay at the end.
5. **Import it.**
   - **DaVinci Resolve:** the Media Pool shows a numbered sequence as a single clip, alpha included.
   - **Premiere Pro:** *File › Import*, select the first frame and tick **Image Sequence**.
   - In both, set the clip's frame rate to the project's (30 fps by default).
6. **Add the audio separately.** Put `narration.wav` at frame 0, shifted by the *audio offset* if you used one. `sound()` effects are not in the sequence: place them in the editor, or render an MP4 as an audio reference.

Some editors prefer a single file. Wrap a sequence into ProRes 4444, which keeps alpha, with ffmpeg:

```sh
ffmpeg -framerate 30 -i output/stinger/%06d.png -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le stinger.mov
```

### MP4 settings

- **Video quality:** "high" is the default; use "very high" for masters.
- **Realtime encode:** encodes about twice as fast for a small size cost. Fine for reviews.
- **Range:** in Video Settings, exports only part of the timeline. Useful to review one scene.

## 11. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| A new episode or preset doesn't show up | The editor scans projects at startup. Restart `pnpm dev`. |
| "504 (Outdated Optimize Dep)" on first load | Vite re-optimized dependencies. Reload the page. |
| "Tried to access an asynchronous property before the node was ready" | You read an image's size before it loaded. `yield node` (or `yield* screenshot().loaded()`) first. |
| `offset` does not exist | Canvas Commons renamed it: use `anchor` / `anchorX` / `anchorY`. |
| An animation starts late, out of sync | Its event sits before the previous animation ends. Drag the pill later. |
| Re-rendered sequence has leftover frames at the end | Delete `output/<project>/` before rendering a shorter version. |
| `pnpm install` refuses a brand-new package version | pnpm's supply-chain policy (`minimumReleaseAge`). Pin a version at least two weeks old; do not add exclusions. |
| Fonts look different | Bahnschrift, Segoe UI and Consolas come from Windows. Elsewhere the fallbacks in `typography.ts` apply. |
