# Roadmap

From the first components to a published training series. This file is the project tracker, shared by the author and the coding agent:
- **Ticking items:** tick a box when an item is done, and add the date.
- **Recording decisions:** when a decision changes the plan, record it in [§ 6](#6-decision-log). Architecture decisions also get an ADR in `docs/adr/`.

**Owners:**
- **author:** work that needs a person, such as recording narration, FreeCAD drawings, publishing and creative calls;
- **agent:** code, docs and verification, by an AI coding agent at the author's request;
- **both:** shared work.

*Last updated: 2026-11-06.*

---

## 1. The target style

The reference is a long-form tech explainer: 19 minutes, voice-over, motion graphics. What makes it work:

- **The narration drives everything.**
  - An off-screen voice and nobody on camera.
  - An informal tone with jokes.
  - A hook in the first 15 seconds, then the problem, and only then the explanation.
  - Every spoken sentence has a matching image on screen.
- **Almost no cuts.** There are only 11 hard cuts in 19 minutes. The rest is continuous animation: a chart drawing itself point by point, 8 GPUs becoming 64, a box opening into a diagram. It is animation built from scratch, not edited footage.
- **A consistent look.**
  - A near-black background with only two accent colors over gray.
  - Clean type, and labels tied to objects by thin leader lines.
  - Simple isometric illustrations.
- **Real documents as proof.** Screenshots of posts, READMEs and tables zoom in, with passages highlighted in orange.
- **Comic relief.** A mascot and the occasional joke beat. For this series, the deadpan SYS//A terminal plays that role, with no copyrighted memes or characters ([voice and tone](docs/voice-and-tone.md)).

## 2. Production pipeline (per episode)

Each step is in the order it happens. The [guide](docs/guide.md) has the how-to.

1. **Two-column script.** One side holds what is said, the other what is shown ([script format](docs/script-format.md)). The BT texts were written to be read, so they must be rewritten for speech: short sentences, one idea per sentence.
2. **Record the narration before animating.** The animation follows the audio, never the reverse.
   - **Equipment:** the author's voice, a USB microphone and Audacity.
   - **Cleanup:** optionally clean the recording with a speech enhancer.
   - **Export:** see `studio/template/audio/README.md`.
3. **Design system.** The palette, the fonts and a kit of reusable pieces for electronics: animated current, schematic symbols, an oscilloscope, a datasheet card, a V×I chart. *Built:* `packages/brand`, `packages/components`.
4. **Animate in Canvas Commons.** Write scenes in TypeScript; the editor shows the narration waveform on the timeline.
5. **Sync by hand.** Drag each `waitUntil` event pill onto the right word. Automation can do this later, but it stays optional.
6. **Finish.** There are two options:
   - **MP4:** export straight from the editor; narration and sound effects are mixed in.
   - **Video editor:** export a PNG sequence and finish in DaVinci Resolve. That is where the narration, a quiet music bed, subtle sound effects and subtitles go.
   - **Transitions:** opaque ones can be MP4; overlays must be PNG with alpha ([guide § 11](docs/guide.md#11-exporting)).
7. **Subtitles.** Write them from the script text. Whisper-based timing is planned as an option.

### Per-episode checklist

Copy this into the episode's `script.md` and tick as you go:

```markdown
- [ ] Script rewritten for speech, in two columns, with [event] markers   (both)
- [ ] Narration recorded and exported as audio/narration.wav            (author)
- [ ] Scenes built from the template and components                     (both)
- [ ] Events synced to the narration in the editor                      (author)
- [ ] Technical drawings exported from FreeCAD, if the episode uses one (author)
- [ ] Exported (MP4, or PNG sequence for Resolve)                       (author)
- [ ] Finished: music bed, sound effects, subtitles                     (author)
- [ ] Published                                                         (author)
```

## 3. Adapting the style to the BT series

The reference structure matches the lesson format of the BT training texts:

- **Hook = situation.** The intern wires the LED straight to the 9 V battery and burns it out. The explanation comes after.
- **Explain the why.** Animate the current rising out of control: that shows why the resistor is needed, instead of just stating it.
- **Recap.** Close by tying back to earlier trainings, not only the last one ("remember the datasheet from BT-00?").
- **Humor.** Use the dry, institutional register ("the cost will be deducted from your salary"). It fits the informal narration, and the joke never replaces the explanation.

## 4. Effort and scope

- **Cost.** Animation from scratch is expensive: a 19-minute video like the reference likely took dozens of hours.
- **Start short.** Aim for **2–4 minute episodes** first, and reuse kit pieces between episodes.
- **Speed-up.** Work speeds up noticeably from the third episode on, once the kit covers most scenes.

## 5. Milestones

### Done

- [x] **M0: skeleton and spike** (2026-11-05). Verified on the installed engine:
  - event times live in each scene's `.meta`, relative to the scene start;
  - one editor serves many projects;
  - Bahnschrift renders;
  - the MP4 export includes audio.
- [x] **M1: brand** (2026-11-05). Palette, `blueprint`/`lab` themes, typography, logos and icons from the Synapticon kit.
- [x] **M2: visual components** (2026-11-05). Background, Callout, highlights, Announcer (SYS//A), StatCard, Chart, ScreenshotZoom.
- [x] **M3: electronics** (2026-11-05). Schematic symbols with named pins, Wire with animated current, Oscilloscope.
- [x] **M4: episode templates** (2026-11-05). Opening, chapter, recap and closing blocks, the episode template and `pnpm new`. Sync is manual; Whisper was moved to "later" (§ 6).
- [x] **M5: docs** (2026-11-05). Guide, component reference, voice and tone, script format, ADRs 0001–0003, CLAUDE.md.
- [x] **Public release prep** (2026-11-05). English throughout, episodes git-ignored (ADR-0004), MIT license with brand assets excluded, README with media.
- [x] **Presets** (2026-11-05):
  - `TechDrawing` for FreeCAD SVGs, including CSS styles and `<text>`;
  - `drawingInterstitial`, a loading screen with a drawing sheet;
  - the `panelWipe` scene transition and the `stinger` overlay with alpha;
  - `en`/`pt-BR` locales.

- [x] **Spike: 3D exploded views** (2026-11-06). `packages/three` (`ModelView`), `studio/presets/exploded`, `pnpm export-model`. Results:
  - **Rendering:** three.js renders inside Canvas Commons and exports to MP4. Rendering took 93 s for 9.5 s of video in headless software GL; a real GPU is much faster.
  - **Export:** FreeCAD's glTF keeps one named node per part. Headless export needs explicit tessellation, and glTF is in metres.
  - **Line art:** screen-space edges give outlines of curved surfaces, creases and part boundaries, with hidden lines removed.
  - **Animation:** explosion, camera and callouts tracking parts are all signals.
- [x] **3D line styles and guides** (2026-11-06). Line art now comes from mesh edges (creases, plus silhouettes of curved surfaces) instead of screen-space edge detection:
  - **Styles:** see-through parts with hidden lines dashed (default), X-ray, plain line drawing and solid, all from two signals (`fillOpacity`, `hiddenLines`) that can animate.
  - **Guides:** chain lines from where each part sat in its host (the nearest bigger part) to where it is now.
  - **Docs:** [guide § 10](docs/guide.md#10-exploded-views-from-freecad-3d) and the component reference.
- [x] **Published on GitHub** (2026-11-06). The 3D spike lives on the `spike/exploded-views` branch until it graduates.

### Next

- [ ] **Private episodes repository** (author). `cd studio/episodes && git init`, with a private remote.
- [ ] **First FreeCAD drawings** for interstitials (author). Export with TechDraw › Export Page as SVG, into `studio/presets/drawings/` or the episode's `images/`.
- [ ] **Graduate `ModelView` from spike** (author decides; agent implements):
  - **GUI export:** check part names with FreeCAD's *File › Export › glTF*, on one of the author's assemblies.
  - **Original model:** a preset built from one of the author's assemblies, which the README can also show (FreeCAD's example model stays out of git).
  - **Explosion polish:** sequenced explosions (part groups one after another) and rotation while exploding.
  - **README:** a highlight with media.
  - **Merge:** `spike/exploded-views` into `main`.
- [ ] **Pilot: BT-01 LED, about 90 s** (both, when the author schedules it).
  - Rewrite the script in two columns.
  - Build it with `pnpm new bt-01-led --locale pt-BR`.
  - Record the narration, sync, export.
  - This pilot tests the whole pipeline end to end.

### Later, optional

- [ ] **`pnpm sync`** (agent). Whisper transcription aligned to `script.md` writes event times into the `.meta` files, and subtitles (`.srt`) come from the script text ([ADR-0002](docs/adr/0002-optional-automation.md)).
- [ ] **More presets** (agent). A lower third, an iris transition (the code is already in [guide § 8.2](docs/guide.md#82-writing-a-scene-transition)), a chapter stinger with a code label.
- [ ] **Manim bridge** (agent). A `ManimClip` for heavy 3D or math scenes ([ADR-0003](docs/adr/0003-manim-bridge.md)).
- [ ] **Project mascot** (author). Only if SYS//A isn't enough; it must be an original design.

## 6. Decision log

| Date | Decision | Why / where |
|---|---|---|
| 2026-11-05 | Animate in code with **Canvas Commons**, not After Effects or Remotion | Built for narration-synced explainers, free (MIT), visual timeline. Remotion needs a company license above 3 employees; After Effects means manual keyframing |
| 2026-11-05 | **No fork**: Canvas Commons as a pinned dependency | Motion Canvas is dormant; Canvas Commons is the active fork ([ADR-0001](docs/adr/0001-canvas-commons-without-fork.md)) |
| 2026-11-05 | Narration in the **author's own voice**, no synthetic voice | Author's choice |
| 2026-11-05 | **Manual first**, no Whisper in v1; automation optional | Editing by hand keeps creative control; automation stays an option ([ADR-0002](docs/adr/0002-optional-automation.md)) |
| 2026-11-05 | **Manim later**, as a WebM-alpha bridge | Canvas Commons covers most needs ([ADR-0003](docs/adr/0003-manim-bridge.md)) |
| 2026-11-05 | Humor in the **Portal/Half-Life register**, no IP | [voice and tone](docs/voice-and-tone.md) |
| 2026-11-05 | Repository in **English** and public; **episodes private** | Open to an international audience; the framework is shared, the content is not ([ADR-0004](docs/adr/0004-public-framework-private-episodes.md)) |
| 2026-11-05 | Export: **MP4** for opaque clips, **PNG + alpha** for overlays and Resolve masters | H.264 has no alpha ([guide § 11](docs/guide.md#11-exporting)) |
| 2026-11-05 | Scripts and episodes are written **on request only** | The author keeps control of the content |
| 2026-11-06 | 3D exploded views with **three.js inside Canvas Commons**, in a separate package (`@synapticon/three`) | Keeps timing editable and synced to narration. Blender + Freestyle stays the fallback for hero shots |
| 2026-11-06 | 3D line art from **mesh edges**, not screen-space edge detection; default look **see-through, hidden lines dashed** | Parts read as wireframe drawings, without walls. Geometric edges can be drawn behind surfaces and dashed, which screen-space edges cannot |
