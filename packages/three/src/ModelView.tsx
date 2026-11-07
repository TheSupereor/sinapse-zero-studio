import {computed, initial, Rect, RectProps, signal} from '@canvas-commons/2d';
import {
  clamp,
  DependencyContext,
  easeInOutCubic,
  SignalValue,
  SimpleSignal,
  TimingFunction,
  useScene,
  Vector2,
} from '@canvas-commons/core';
import {useTheme} from '@sinapse-zero/brand';
import * as THREE from 'three';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {buildEdges, createFillMaterial, createLineMaterial, EdgeSource, srgb} from './lines';

export interface ModelViewProps extends RectProps {
  /** URL of a .glb/.gltf file: `import model from './models/arm.glb?url'`. */
  src: SignalValue<string>;
  /** How exploded the assembly is, 0–1. Default: 0. */
  explode?: SignalValue<number>;
  /** Camera azimuth around the vertical axis, degrees. Default: 35. */
  orbit?: SignalValue<number>;
  /** Camera elevation, degrees. Default: 20. */
  elevation?: SignalValue<number>;
  /** 1 = the assembled model's longest side fills the frame height; lower values pull the camera back. Default: 1. */
  zoom?: SignalValue<number>;
  /** Line width in output pixels. Default: 2. */
  strokeWidth?: SignalValue<number>;
  /** Opacity of the surface fill. 0 = see-through parts (wireframe look). Default: 0. */
  fillOpacity?: SignalValue<number>;
  /** Opacity of hidden lines, the edges behind a surface. 0 = removed. Default: 0.4. */
  hiddenLines?: SignalValue<number>;
  /**
   * Opacity of the dashed guides. Each part's guide runs from the spot where it sat in the
   * nearest bigger part (the hole a pin came out of) to where the part is now. Default: 0.
   */
  guides?: SignalValue<number>;
  /** Hidden-line dash and gap, in output pixels. `null` draws them solid. Default: [7, 5]. */
  hiddenDash?: [number, number] | null;
  /** Guide dash pattern, in output pixels (canvas `setLineDash`). Default: a chain line, [18, 6, 3, 6]. */
  guideDash?: number[];
  /** Parts that get guides. Default: every part that moves. */
  guideParts?: string[];
  /** Angle between faces, in degrees, above which their shared edge is drawn. Default: 40. */
  crease?: number;
  /** Vertical field of view, degrees. Default: 30. */
  fov?: number;
  /**
   * Radial explosion: at explode = 1 every part moves away from the assembly center by
   * `spread` × its distance from it. Default: 1.
   */
  spread?: number;
  /**
   * Extra offsets at explode = 1, by part name, as fractions of the assembly's longest side
   * (so they don't depend on units: FreeCAD's glTF export is in metres). Added to the radial
   * explosion: use them to pull parts sideways, out of the assembly's plane.
   */
  offsets?: Record<string, [number, number, number]>;
  /** Fraction of the explosion spent staggering parts (outermost first). 0 = all at once. Default: 0.5. */
  stagger?: number;
  ease?: TimingFunction;
  /** Rotation applied to the model, degrees [x, y, z]. glTF is Y-up; use it for other conventions. */
  modelRotation?: [number, number, number];
  /** Supersampling factor of the 3D buffer (antialiasing). Default: 2. */
  quality?: number;
}

interface Part {
  name: string;
  node: THREE.Object3D;
  base: THREE.Vector3;
  /** Parent-space offset at full explosion. */
  offset: THREE.Vector3;
  /** World-space center when assembled, and its offset at full explosion. */
  center: THREE.Vector3;
  worldOffset: THREE.Vector3;
  /** The part's center in its own space, for tracking it while it moves. */
  localCenter: THREE.Vector3;
  /** The bigger part this one was mounted in, and where, in the host's space. Guides start there. */
  host: Part | null;
  dock: THREE.Vector3;
  start: number;
  /** Eased explosion progress of this part, set by `pose`. */
  progress: number;
}

interface Rig {
  scene: THREE.Scene;
  parts: Part[];
  center: THREE.Vector3;
  radius: number;
  /** Longest side of the assembled bounding box: what `zoom = 1` fits to the frame height. */
  longest: number;
}

interface PoolEntry {
  gltf?: GLTF;
  promise: Promise<GLTF>;
  /** Edge geometry per part, by `<part index>:<crease>`, shared by every instance. */
  edges: Map<string, THREE.InstancedBufferGeometry>;
  /** Each part's host (the nearest bigger part) by index, or −1. */
  hosts?: number[];
}

const SOLIDS = 0;
const LINES = 1;

/**
 * A 3D model (e.g. a FreeCAD assembly exported as glTF) drawn as technical line art:
 * creases, outlines of curved surfaces, and hidden lines dimmed and dashed. Parts are
 * see-through by default; `fillOpacity` gives them solid faces. The explosion, the camera
 * and the line styles are signals, so they animate, scrub in the editor and sync to time
 * events like everything else.
 *
 * ```tsx
 * import arm from '../models/arm.glb?url';
 *
 * const m = createRef<ModelView>();
 * view.add(<ModelView ref={m} src={arm} />);
 * yield* all(m().explode(1, 2.5), m().guides(1, 1), m().orbit(70, 4));
 * ```
 *
 * `pointOf(name)` projects a part onto the node, so callouts can follow parts.
 */
export class ModelView extends Rect {
  @initial(0)
  @signal()
  declare public readonly explode: SimpleSignal<number, this>;

  @initial(35)
  @signal()
  declare public readonly orbit: SimpleSignal<number, this>;

  @initial(20)
  @signal()
  declare public readonly elevation: SimpleSignal<number, this>;

  @initial(1)
  @signal()
  declare public readonly zoom: SimpleSignal<number, this>;

  @initial(2)
  @signal()
  declare public readonly strokeWidth: SimpleSignal<number, this>;

  @initial(0)
  @signal()
  declare public readonly fillOpacity: SimpleSignal<number, this>;

  @initial(0.4)
  @signal()
  declare public readonly hiddenLines: SimpleSignal<number, this>;

  @initial(0)
  @signal()
  declare public readonly guides: SimpleSignal<number, this>;

  @signal()
  declare public readonly src: SimpleSignal<string, this>;

  private static readonly pool: Record<string, PoolEntry> = {};
  private static renderer: THREE.WebGLRenderer | null = null;
  private static readonly fill = createFillMaterial();
  private static readonly lines = createLineMaterial();

  private readonly camera: THREE.PerspectiveCamera;
  private readonly hiddenDash: [number, number] | null;
  private readonly guideDash: number[];
  private readonly guideParts: string[] | null;
  private readonly crease: number;
  private readonly spread: number;
  private readonly offsets: Record<string, [number, number, number]>;
  private readonly stagger: number;
  private readonly ease: TimingFunction;
  private readonly modelRotation: [number, number, number];
  private readonly quality: number;
  private readonly pixelRatio: number;
  private readonly inkHex: string;
  private readonly ink: [number, number, number];
  private readonly fillColor: [number, number, number];

  public constructor({
    hiddenDash = [7, 5],
    guideDash = [18, 6, 3, 6],
    guideParts,
    crease = 40,
    fov = 30,
    spread = 1,
    offsets = {},
    stagger = 0.5,
    ease = easeInOutCubic,
    modelRotation = [0, 0, 0],
    quality = 2,
    ...props
  }: ModelViewProps) {
    const size = useScene().getSize();
    super({width: size.x, height: size.y, ...props});
    const theme = useTheme();
    this.camera = new THREE.PerspectiveCamera(fov, 1, 1, 10);
    this.hiddenDash = hiddenDash;
    this.guideDash = guideDash;
    this.guideParts = guideParts ?? null;
    this.crease = crease;
    this.spread = spread;
    this.offsets = offsets;
    this.stagger = clamp(0, 0.95, stagger);
    this.ease = ease;
    this.modelRotation = modelRotation;
    this.quality = quality;
    this.pixelRatio = useScene().getRealSize().x / size.x;
    this.inkHex = theme.ink;
    this.ink = srgb(theme.ink);
    this.fillColor = srgb(theme.panel);
  }

  /** Names of the parts found in the model (empty until it has loaded). */
  public partNames(): string[] {
    return this.rig()?.parts.map(p => p.name) ?? [];
  }

  /**
   * Where a part's center currently appears, in this node's local space. Reactive: use it
   * as a callout target, `target={() => model().pointOf('Bucket')}`.
   */
  public pointOf(name: string): Vector2 {
    const rig = this.rig();
    const part = rig?.parts.find(p => p.name === name);
    if (!rig || !part) return Vector2.zero;
    this.pose(rig);
    return this.project(part.node.localToWorld(part.localCenter.clone()));
  }

  /** Projects a world-space point onto this node's local space. */
  public project(point: THREE.Vector3): Vector2 {
    const ndc = point.clone().project(this.camera);
    const size = this.computedSize();
    return new Vector2((ndc.x * size.x) / 2, (-ndc.y * size.y) / 2);
  }

  @computed()
  private entry(): PoolEntry {
    const url = this.src();
    let entry = ModelView.pool[url];
    if (!entry) {
      const pending: PoolEntry = {promise: new GLTFLoader().loadAsync(url), edges: new Map()};
      pending.promise.then(gltf => (pending.gltf = gltf));
      entry = ModelView.pool[url] = pending;
    }
    if (!entry.gltf) DependencyContext.collectPromise(entry.promise);
    return entry;
  }

  /** Builds this instance's scene from the shared model: parts, centers, edges, explosion offsets. */
  @computed()
  private rig(): Rig | null {
    const entry = this.entry();
    if (!entry.gltf) return null;

    const root = entry.gltf.scene.clone(true);
    const [rx, ry, rz] = this.modelRotation.map(THREE.MathUtils.degToRad);
    root.rotation.set(rx, ry, rz);
    const scene = new THREE.Scene().add(root);
    scene.updateMatrixWorld(true);

    // Parts = children of the first node that branches (exporters wrap them in a root).
    let container: THREE.Object3D = root;
    while (container.children.length === 1) container = container.children[0];

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    const dimensions = box.getSize(new THREE.Vector3());
    const longest = Math.max(dimensions.x, dimensions.y, dimensions.z);

    const parts = container.children.map((node, index): Part & {index: number; distance: number} => {
      const partCenter = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
      const worldOffset = partCenter.clone().sub(center).multiplyScalar(this.spread);
      const explicit = this.offsets[node.name];
      if (explicit) {
        worldOffset.add(new THREE.Vector3(...explicit).multiplyScalar(longest).applyQuaternion(root.quaternion));
      }
      const parent = node.parent!;
      const from = parent.worldToLocal(partCenter.clone());
      const to = parent.worldToLocal(partCenter.clone().add(worldOffset));
      return {
        name: node.name,
        node,
        index,
        base: node.position.clone(),
        offset: to.sub(from),
        center: partCenter,
        worldOffset,
        localCenter: node.worldToLocal(partCenter.clone()),
        host: null,
        dock: partCenter.clone(),
        distance: partCenter.distanceTo(center),
        start: 0,
        progress: 0,
      };
    });
    // Outermost parts leave first.
    const order = [...parts].sort((a, b) => b.distance - a.distance);
    order.forEach((part, i) => (part.start = order.length > 1 ? (i / (order.length - 1)) * this.stagger : 0));

    entry.hosts ??= findHosts(parts);
    parts.forEach((part, i) => {
      const host = parts[entry.hosts![i]];
      if (!host) return;
      part.host = host;
      part.dock = host.node.worldToLocal(part.center.clone());
    });

    // Edges last, so they don't count in the bounding boxes and neighbours above.
    for (const part of parts) {
      const lines = new THREE.Mesh(this.edgesOf(entry, part.node, part.index), ModelView.lines);
      lines.frustumCulled = false;
      lines.layers.set(LINES);
      part.node.add(lines);
    }

    return {scene, parts, center, radius, longest};
  }

  /** The part's edge geometry, built once per model and shared by every instance. */
  private edgesOf(entry: PoolEntry, node: THREE.Object3D, index: number) {
    const key = `${index}:${this.crease}`;
    let edges = entry.edges.get(key);
    if (!edges) {
      const toPart = node.matrixWorld.clone().invert();
      const sources: EdgeSource[] = [];
      node.traverse(child => {
        if (child instanceof THREE.Mesh) {
          sources.push({geometry: child.geometry, matrix: toPart.clone().multiply(child.matrixWorld)});
        }
      });
      edges = buildEdges(sources, this.crease);
      entry.edges.set(key, edges);
    }
    return edges;
  }

  /** Applies the explosion and the camera for the current signal values. */
  private pose(rig: Rig) {
    const explode = this.explode();
    const span = 1 - this.stagger;
    for (const part of rig.parts) {
      part.progress = this.ease(clamp(0, 1, (explode - part.start) / span));
      part.node.position.copy(part.base).addScaledVector(part.offset, part.progress);
    }
    rig.scene.updateMatrixWorld(true);

    const size = this.computedSize();
    const camera = this.camera;
    camera.aspect = size.x / Math.max(1, size.y);
    // View-independent fit, so framing never "breathes" while orbiting.
    const fit = rig.longest / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = fit / Math.max(0.05, this.zoom());
    const azimuth = THREE.MathUtils.degToRad(this.orbit());
    const elevation = THREE.MathUtils.degToRad(this.elevation());
    camera.position.set(
      rig.center.x + distance * Math.cos(elevation) * Math.sin(azimuth),
      rig.center.y + distance * Math.sin(elevation),
      rig.center.z + distance * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.near = Math.max(distance * 0.01, distance - rig.radius * 4);
    camera.far = distance + rig.radius * 4;
    camera.lookAt(rig.center);
    camera.updateProjectionMatrix();
  }

  protected override drawShape(context: CanvasRenderingContext2D) {
    super.drawShape(context);
    const rig = this.rig();
    if (!rig) return;
    this.pose(rig);

    const size = this.computedSize();
    const scale = this.pixelRatio * this.quality;
    const width = Math.max(1, Math.round(size.x * scale));
    const height = Math.max(1, Math.round(size.y * scale));
    const renderer = ModelView.gpu(width, height);
    const camera = this.camera;
    const lineWidth = this.strokeWidth() * scale;
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);

    // Solids: depth first, then a fill of the nearest surface only (so it never doubles up).
    const fill = ModelView.fill;
    const fillOpacity = this.fillOpacity();
    fill.polygonOffsetFactor = 1 + lineWidth / 2;
    (fill.uniforms.uColor.value as THREE.Vector3).set(...this.fillColor);
    fill.uniforms.uOpacity.value = fillOpacity;
    rig.scene.overrideMaterial = fill;
    camera.layers.set(SOLIDS);
    fill.colorWrite = false;
    fill.depthWrite = true;
    renderer.render(rig.scene, camera);
    if (fillOpacity > 0) {
      fill.colorWrite = true;
      fill.depthWrite = false;
      renderer.render(rig.scene, camera);
    }
    rig.scene.overrideMaterial = null;

    // Lines: visible ones in full, then hidden ones (behind a surface) dimmed and dashed.
    const lines = ModelView.lines;
    const u = lines.uniforms;
    (u.uResolution.value as THREE.Vector2).set(width, height);
    u.uWidth.value = lineWidth;
    (u.uColor.value as THREE.Vector3).set(...this.ink);
    camera.layers.set(LINES);
    lines.depthFunc = THREE.LessEqualDepth;
    u.uOpacity.value = 1;
    (u.uDash.value as THREE.Vector2).set(0, 0);
    renderer.render(rig.scene, camera);

    const hidden = this.hiddenLines();
    if (hidden > 0) {
      lines.depthFunc = THREE.GreaterDepth;
      u.uOpacity.value = hidden;
      // Output pixels → world units at the model's center, so dashes keep their size on screen.
      const worldPerPixel = (2 * camera.position.distanceTo(rig.center) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / size.y;
      const [dash, gap] = this.hiddenDash ?? [0, 0];
      (u.uDash.value as THREE.Vector2).set(dash * worldPerPixel, gap * worldPerPixel);
      renderer.render(rig.scene, camera);
    }

    // Guides under the model, so solid parts cover them and see-through parts don't.
    this.drawGuides(context, rig);
    context.drawImage(renderer.domElement, 0, 0, width, height, -size.x / 2, -size.y / 2, size.x, size.y);
  }

  /** Dashed lines from where each part sat in its host to where it is now. */
  private drawGuides(context: CanvasRenderingContext2D, rig: Rig) {
    const opacity = this.guides();
    if (opacity <= 0) return;
    context.save();
    context.globalAlpha *= clamp(0, 1, opacity);
    context.strokeStyle = this.inkHex;
    context.lineWidth = this.strokeWidth() * 0.6;
    context.setLineDash(this.guideDash);
    context.beginPath();
    for (const part of rig.parts) {
      if (this.guideParts && !this.guideParts.includes(part.name)) continue;
      const dock = part.host ? part.host.node.localToWorld(part.dock.clone()) : part.center;
      const from = this.project(dock);
      const to = this.project(part.node.localToWorld(part.localCenter.clone()));
      if (from.sub(to).magnitude < 4) continue;
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
    }
    context.stroke();
    context.restore();
  }

  /**
   * One WebGL context shared by every ModelView: browsers cap the number of live
   * contexts, and scenes are rebuilt on every reload.
   */
  private static gpu(width: number, height: number) {
    if (!ModelView.renderer) {
      ModelView.renderer = new THREE.WebGLRenderer({
        canvas: document.createElement('canvas'),
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
        stencil: true,
      });
      ModelView.renderer.setPixelRatio(1);
      ModelView.renderer.autoClear = false;
    }
    const renderer = ModelView.renderer;
    const current = renderer.getSize(new THREE.Vector2());
    if (current.x !== width || current.y !== height) renderer.setSize(width, height, false);
    return renderer;
  }
}

/**
 * For each part, the bigger part with geometry closest to its center: the one it is mounted
 * in, as a pin is in a bracket. The biggest part has none (−1). Size is the bounding-box diagonal.
 */
function findHosts(parts: {node: THREE.Object3D; center: THREE.Vector3}[]): number[] {
  const v = new THREE.Vector3();
  const clouds = parts.map(part => {
    const points: number[] = [];
    part.node.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const position = child.geometry.getAttribute('position');
      const step = Math.max(1, Math.floor(position.count / 2000));
      for (let i = 0; i < position.count; i += step) {
        v.fromBufferAttribute(position, i).applyMatrix4(child.matrixWorld);
        points.push(v.x, v.y, v.z);
      }
    });
    return points;
  });
  const sizes = parts.map(part => new THREE.Box3().setFromObject(part.node).getSize(v).length());

  return parts.map((part, i) => {
    let best = -1;
    let bestDistance = Infinity;
    clouds.forEach((cloud, j) => {
      if (sizes[j] <= sizes[i]) return;
      for (let k = 0; k < cloud.length; k += 3) {
        const d = (cloud[k] - part.center.x) ** 2 + (cloud[k + 1] - part.center.y) ** 2 + (cloud[k + 2] - part.center.z) ** 2;
        if (d < bestDistance) {
          bestDistance = d;
          best = j;
        }
      }
    });
    return best;
  });
}
