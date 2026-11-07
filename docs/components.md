# Components

Import components from `@sinapse-zero/components` and tokens from `@sinapse-zero/brand`. Every component has a working example in `studio/showcase/scenes/`.

The pattern is always the same:
1. the component is created **still or invisible**;
2. a generator method (`*show`, `*say`, `*plot`…) animates it;
3. you call that method after a `waitUntil('event')`.

Every method takes its duration as the last argument.

## Visual basics

| Component | What for | Main methods |
|---|---|---|
| `Background` | Theme background + drafting grid | `reveal()` |
| `Callout` | Label with a leader line to a point (`target` can be a function) | `show()`, `hide()` |
| `HighlightBar` | Highlighter stroke sweeping a passage (position = left edge) | `sweep()`, `erase()` |
| `HighlightBox` | Outline box that traces itself | `trace()`, `erase()` |
| `Announcer` | The **SYS//A** terminal: types text with a cursor | `appear()`, `say(t)`, `append(t)`, `clear()`, `vanish()` |
| `StatCard` | Big number + label + caption ("2.0 V") | `countTo(from, to, dur, format)` |
| `Chart` | Axes, self-drawing curves, marks with guides | `reveal()`, `plot(f)`, `curve(f)`, `markAt(x, y)`, `point(x, y)` |
| `ScreenshotZoom` | Screenshot that zooms and highlights (regions in image pixels) | `focus(region \| null)`, `highlightRegion(region)` |
| `TechDrawing` | SVG technical drawing that plots itself line by line | `plot(dur)`, `erase()`, signal `progress` |
| `LogoMark` | Discreet logo in a corner | — |
| `BrandIcon` | Pictogram from the kit, recolored (`icon`: battery, voltage, soldering…) | — |

### TechDrawing options

| Prop | Default | |
|---|---|---|
| `svg` | — | SVG markup: `import d from './part.svg?raw'` |
| `fit` | — | `[w, h]` box to fit, keeping the aspect ratio |
| `recolor` | `true` | dark → ink, near-white → removed, other → accent |
| `lineScale` / `textScale` | `1.5` / `1.4` | thicken CAD lines and lettering for video |
| `order` | `'document'` | or `'left-to-right'`, `'top-to-bottom'` |
| `concurrency` | `6` | about how many lines draw at once (1 = one pen) |
| `pen` | `true` | glowing pen tip on the active line |
| `texts` | `true` | rebuild `<text>` elements (dimensions) as `Txt` |

See [guide § 9](guide.md#9-technical-drawings-from-freecad) for the FreeCAD workflow.

## Electronics

**Conventions:**
- Symbols follow IEC 60617. They are drawn horizontally, with pins at x = ±80; rotate them with `rotation={90}`.
- `pin('name')` returns the pin's position in the parent's space, so wires and symbols need the **same parent**.

| Symbol | Pins | Extras |
|---|---|---|
| `Resistor` | `a`, `b` | `standard: 'iec' \| 'ansi'` |
| `Diode` | `a` (anode), `k` (cathode) | |
| `LED` | `a`, `k` | signal `brightness` (0–1); `turnOn()`, `turnOff()`, `burnOut()` |
| `Capacitor` | `a`, `b` | |
| `Battery` | `pos`, `neg` | long plate = + |
| `Ground` | `gnd` | |
| `Switch` | `a`, `b` | signal `closed` (0–1); `close()`, `open()` |

**`Wire`** is a line with **current dots that move on their own**, from the first point to the last.
- **Switching:** `energize()` and `deenergize()` animate the `current` signal (0–1).
- **Speed:** `speed` is in px/s; a negative value reverses the direction.
- **Manual control:** set `phase` to move the dots yourself.

```tsx
<Wire points={() => [battery().pin('pos'), [battery().pin('pos').x, -250], sw().pin('a')]} />
```

**`Oscilloscope`** shows a screen with a waveform that scrolls on its own.
- **Waves:** ready-made ones live in `waves`: `sine`, `square`, `dc` and `halfWave`.
- **Signal:** the `gain` signal (0–1) "switches it on".

## Episode blocks

Generator functions you call inside any scene: `yield* chapter(view, {...})`. Each one enters, waits for its exit event, then leaves and cleans up.

| Block | Exit event | Options |
|---|---|---|
| `opening` | `opening-out` | `code`, `title`, `overline?` |
| `chapter` | `chapter-out` | `number`, `title`, `subtitle?` |
| `recap` | `recap-out` | `code`, `title`, `reminder`, `label?` |
| `closing` | `closing-out` | `code`, `next?`, `lines?` |
| `drawingInterstitial` | `interstitial-out` | `drawing`, `title`, `code?`, `scale?`, `sheet?`, `messages?`, `duration?`, `drawingProps?` |

To use the same block twice in one scene, pass `event: 'another-name'`.

## Transitions

| Transition | Kind | Use |
|---|---|---|
| `panelWipe({direction, duration, barWidth, color})` | Scene transition (`useTransition`) | First line of a scene; the new scene sweeps in behind an accent bar |
| `stinger(view, {direction, travel, hold, label, showLogo})` | Overlay block | Render on a transparent background for a video editor; cut in the middle of `hold` |

Writing your own: [guide § 8](guide.md#8-presets-and-transitions).

## 3D (spike)

`ModelView` comes from `@sinapse-zero/three`, a separate package so the 2D library stays free of three.js. It draws a glTF assembly as technical line art and explodes it.

| Member | Default | |
|---|---|---|
| `src` | — | `import m from './models/arm.glb?url'` |
| `explode` | `0` | signal: 0 = assembled, 1 = exploded |
| `orbit` / `elevation` / `zoom` | `35` / `20` / `1` | signals: the camera |
| `fillOpacity` / `hiddenLines` | `0` / `0.4` | signals: solid faces, and the opacity of hidden lines |
| `guides` | `0` | signal: opacity of the dashed guides between parts and their hosts |
| `strokeWidth` | `2` | signal: line width, px |
| `hiddenDash` / `guideDash` | `[7, 5]` / `[18, 6, 3, 6]` | dash patterns, px; `hiddenDash={null}` = solid |
| `spread` / `offsets` / `stagger` | `1` / `{}` / `0.5` | how parts move apart |
| `guideParts` / `crease` / `fov` / `modelRotation` / `quality` | | see the guide |
| `pointOf(name)` | | a part's current position on screen, for `Callout` targets |
| `partNames()` | | the parts found in the model |

See [guide § 10](guide.md#10-exploded-views-from-freecad-3d) for exporting from FreeCAD, the line styles and the explosion.

## Rhythm

- **Durations:** `pace.fast`, `pace.normal` and `pace.slow` are 0.3, 0.6 and 1.2 s. Use them instead of loose numbers.
- **Easings:** `easings.enter`, `easings.exit` and `easings.move` are named curves.
- **Helpers:** `appear(node)` fades a node in with a slight rise; `vanish(node)` fades it out.

## Theme, typography and language

- **Colors:** `useTheme()` returns the color roles: `background`, `grid`, `panel`, `rule`, `ink`, `muted`, `faint`, `accent`, `cyan`, `amber` and `red`.
- **Theme choice:** the project picks it with `variables: {theme: 'blueprint' | 'lab'}`.
- **Fonts:** `fonts.display`, `fonts.body` and `fonts.mono` are Bahnschrift, Segoe UI and Consolas, all from the system. Sizes are in `sizes.*` and weights in `weights.*`.
- **Language:** `useStrings()` returns the template defaults for `variables: {locale: 'en' | 'pt-BR'}`.
