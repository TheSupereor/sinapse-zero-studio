import * as THREE from 'three';

/*
 * Technical line art from mesh geometry. Each part becomes a set of edges, extracted once
 * when the model loads:
 *
 * - **Hard edges**: creases sharper than `crease` degrees, plus open boundaries. They are
 *   always drawn.
 * - **Smooth edges**: the edges between gently curved triangles, such as the facets of a
 *   cylinder. Each one is drawn only while it sits on the silhouette, which happens when
 *   the far vertices of its two triangles land on the same side of it on screen. That gives
 *   curved surfaces their outline from any angle.
 *
 * Edges are thick lines: one screen-aligned quad per edge, instanced, so their width is set
 * in pixels. Because they are geometry, the renderer can draw them twice against a depth
 * pre-pass of the solids: visible lines in full, and hidden lines (the ones behind a
 * surface) dimmed and dashed, as technical drawings do.
 */

export interface EdgeSource {
  geometry: THREE.BufferGeometry;
  /** Transform from the geometry into the part's local space. */
  matrix: THREE.Matrix4;
}

/** Below this angle two triangles count as coplanar, and their shared edge is never drawn. */
const FLAT = Math.cos(THREE.MathUtils.degToRad(1));

/**
 * Extracts the edges of one part, in the part's local space, as an instanced geometry for
 * `createLineMaterial`. Vertices are welded by position first, because CAD exporters write
 * one primitive per face and a face boundary would otherwise look like an open edge.
 */
export function buildEdges(sources: EdgeSource[], creaseDegrees: number): THREE.InstancedBufferGeometry {
  // 1. Gather positions in part space and weld them.
  const raw: number[] = [];
  const corners: number[] = [];
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const {geometry, matrix} of sources) {
    const position = geometry.getAttribute('position');
    const base = raw.length / 3;
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(matrix);
      raw.push(v.x, v.y, v.z);
      box.expandByPoint(v);
    }
    const index = geometry.getIndex();
    const count = index ? index.count : position.count;
    for (let i = 0; i < count; i++) corners.push(base + (index ? index.getX(i) : i));
  }

  const tolerance = Math.max(box.getSize(v).length() * 1e-5, 1e-9);
  const ids = new Map<string, number>();
  const points: number[] = [];
  const weld = new Int32Array(raw.length / 3);
  for (let i = 0; i < weld.length; i++) {
    const x = raw[3 * i];
    const y = raw[3 * i + 1];
    const z = raw[3 * i + 2];
    const key = `${Math.round(x / tolerance)},${Math.round(y / tolerance)},${Math.round(z / tolerance)}`;
    let id = ids.get(key);
    if (id === undefined) {
      id = points.length / 3;
      ids.set(key, id);
      points.push(x, y, z);
    }
    weld[i] = id;
  }

  // 2. Triangle normals, and the triangles on each side of every edge.
  const vertexCount = points.length / 3;
  const normals: number[] = [];
  const edges = new Map<number, number[]>(); // key → [lo, hi, third, face, third, face, ...]
  const p = (i: number) => new THREE.Vector3(points[3 * i], points[3 * i + 1], points[3 * i + 2]);
  const addEdge = (a: number, b: number, third: number, face: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const key = lo * vertexCount + hi;
    let entry = edges.get(key);
    if (!entry) edges.set(key, (entry = [lo, hi]));
    entry.push(third, face);
  };
  for (let t = 0; t + 2 < corners.length; t += 3) {
    const a = weld[corners[t]];
    const b = weld[corners[t + 1]];
    const c = weld[corners[t + 2]];
    if (a === b || b === c || a === c) continue;
    const pa = p(a);
    const normal = p(b).sub(pa).cross(p(c).sub(pa));
    if (normal.lengthSq() === 0) continue;
    normal.normalize();
    const face = normals.length / 3;
    normals.push(normal.x, normal.y, normal.z);
    addEdge(a, b, c, face);
    addEdge(b, c, a, face);
    addEdge(c, a, b, face);
  }

  // 3. Classify.
  const crease = Math.cos(THREE.MathUtils.degToRad(creaseDegrees));
  const hard: [number, number][] = [];
  const smooth: [number, number, number, number][] = [];
  for (const e of edges.values()) {
    if (e.length !== 6) {
      hard.push([e[0], e[1]]); // open boundary, or more than two faces meet
      continue;
    }
    const f0 = 3 * e[3];
    const f1 = 3 * e[5];
    const cos = normals[f0] * normals[f1] + normals[f0 + 1] * normals[f1 + 1] + normals[f0 + 2] * normals[f1 + 2];
    if (cos < crease) hard.push([e[0], e[1]]);
    else if (cos < FLAT) smooth.push([e[0], e[1], e[2], e[4]]);
  }

  // 4. Instance attributes. Hard edges are chained so dashes run continuously along them.
  const segments = [
    ...chain(hard, p).map(([a, b, d0, d1]) => ({a, b, c0: a, c1: a, d0, d1})),
    ...smooth.map(([a, b, c0, c1]) => ({a, b, c0, c1, d0: 0, d1: p(a).distanceTo(p(b))})),
  ];
  const start = new Float32Array(segments.length * 3);
  const end = new Float32Array(segments.length * 3);
  const control0 = new Float32Array(segments.length * 3);
  const control1 = new Float32Array(segments.length * 3);
  const distance = new Float32Array(segments.length * 2);
  segments.forEach((s, i) => {
    for (let k = 0; k < 3; k++) {
      start[3 * i + k] = points[3 * s.a + k];
      end[3 * i + k] = points[3 * s.b + k];
      control0[3 * i + k] = points[3 * s.c0 + k];
      control1[3 * i + k] = points[3 * s.c1 + k];
    }
    distance[2 * i] = s.d0;
    distance[2 * i + 1] = s.d1;
  });

  const geometry = new THREE.InstancedBufferGeometry();
  // A unit quad: x = side of the line (−1, 1), y = which end (0 = start, 1 = end).
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3));
  geometry.setAttribute('aStart', new THREE.InstancedBufferAttribute(start, 3));
  geometry.setAttribute('aEnd', new THREE.InstancedBufferAttribute(end, 3));
  geometry.setAttribute('aControl0', new THREE.InstancedBufferAttribute(control0, 3));
  geometry.setAttribute('aControl1', new THREE.InstancedBufferAttribute(control1, 3));
  geometry.setAttribute('aDistance', new THREE.InstancedBufferAttribute(distance, 2));
  geometry.instanceCount = segments.length;
  return geometry;
}

/** Orders hard edges into polylines and measures the distance along each one. */
function chain(hard: [number, number][], p: (i: number) => THREE.Vector3): [number, number, number, number][] {
  const incident = new Map<number, number[]>();
  hard.forEach(([a, b], i) => {
    for (const vertex of [a, b]) {
      const list = incident.get(vertex);
      if (list) list.push(i);
      else incident.set(vertex, [i]);
    }
  });
  const used = new Uint8Array(hard.length);
  const out: [number, number, number, number][] = [];
  const walk = (from: number) => {
    let vertex = from;
    let travelled = 0;
    for (;;) {
      const next = incident.get(vertex)!.find(e => !used[e]);
      if (next === undefined) return;
      used[next] = 1;
      const [a, b] = hard[next];
      const to = a === vertex ? b : a;
      const length = p(vertex).distanceTo(p(to));
      out.push([vertex, to, travelled, travelled + length]);
      travelled += length;
      vertex = to;
    }
  };
  // Start at the ends and junctions of polylines, then pick up the closed loops.
  for (const [vertex, list] of incident) if (list.length !== 2) list.forEach(() => walk(vertex));
  hard.forEach(([a], i) => !used[i] && walk(a));
  return out;
}

/** Premultiplied-alpha "over": the WebGL canvas is composited into the 2D canvas as premultiplied. */
function premultiplied(material: THREE.ShaderMaterial) {
  material.blending = THREE.CustomBlending;
  material.blendSrc = THREE.OneFactor;
  material.blendDst = THREE.OneMinusSrcAlphaFactor;
  material.blendSrcAlpha = THREE.OneFactor;
  material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  return material;
}

/**
 * Flat fill for the solids. It also writes the depth that sorts lines into visible and
 * hidden; the polygon offset pushes surfaces back so lines lying on them stay in front.
 */
export function createFillMaterial(): THREE.ShaderMaterial {
  return premultiplied(
    new THREE.ShaderMaterial({
      uniforms: {uColor: {value: new THREE.Vector3()}, uOpacity: {value: 1}},
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 4,
      vertexShader: /* glsl */ `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          gl_FragColor = vec4(uColor * uOpacity, uOpacity);
        }`,
    }),
  );
}

/**
 * Thick lines for `buildEdges` geometry. Each pixel is drawn at most once per frame (the
 * stencil counts it), so joints and crossings of dimmed lines don't get darker spots.
 */
export function createLineMaterial(): THREE.ShaderMaterial {
  const material = premultiplied(
    new THREE.ShaderMaterial({
      uniforms: {
        uResolution: {value: new THREE.Vector2(1, 1)},
        uWidth: {value: 2},
        uColor: {value: new THREE.Vector3(1, 1, 1)},
        uOpacity: {value: 1},
        /** Dash and gap in world units; a dash of 0 draws solid lines. */
        uDash: {value: new THREE.Vector2(0, 0)},
      },
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute vec3 aStart;
        attribute vec3 aEnd;
        attribute vec3 aControl0;
        attribute vec3 aControl1;
        attribute vec2 aDistance;
        uniform vec2 uResolution;
        uniform float uWidth;
        varying float vDistance;

        vec2 toScreen(vec4 clip) {
          return (clip.xy / clip.w * 0.5 + 0.5) * uResolution;
        }

        void main() {
          mat4 mvp = projectionMatrix * modelViewMatrix;
          vec4 start = mvp * vec4(aStart, 1.0);
          vec4 end = mvp * vec4(aEnd, 1.0);
          vec2 s = toScreen(start);
          vec2 e = toScreen(end);
          vec2 along = e - s;

          // Hard edges have both controls on the edge. Smooth ones show only on the silhouette.
          bool hard = aControl0 == aControl1;
          vec2 across = vec2(-along.y, along.x);
          float side0 = dot(toScreen(mvp * vec4(aControl0, 1.0)) - s, across);
          float side1 = dot(toScreen(mvp * vec4(aControl1, 1.0)) - s, across);
          if (!hard && side0 * side1 <= 0.0) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // outside the clip volume: skipped
            return;
          }

          float len = length(along);
          vec2 dir = len > 1e-4 ? along / len : vec2(1.0, 0.0);
          vec2 normal = vec2(-dir.y, dir.x);
          bool atEnd = position.y > 0.5;
          vec4 clip = atEnd ? end : start;
          // Square caps, so consecutive segments overlap at the joints.
          vec2 offset = (normal * position.x + dir * (atEnd ? 1.0 : -1.0)) * uWidth * 0.5;
          clip.xy += offset / uResolution * 2.0 * clip.w;
          gl_Position = clip;
          vDistance = (atEnd ? aDistance.y : aDistance.x) * length(modelMatrix[0].xyz);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform vec2 uDash;
        varying float vDistance;
        void main() {
          if (uDash.x > 0.0 && mod(vDistance, uDash.x + uDash.y) > uDash.x) discard;
          gl_FragColor = vec4(uColor * uOpacity, uOpacity);
        }`,
    }),
  );
  material.stencilWrite = true;
  material.stencilFunc = THREE.EqualStencilFunc;
  material.stencilRef = 0;
  material.stencilZPass = THREE.IncrementStencilOp;
  return material;
}

/**
 * Hex → raw sRGB components. The shaders write their output untouched, so colors must not
 * go through three's color management (which would convert them to linear).
 */
export function srgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map(c => c + c).join('') : value;
  const n = parseInt(full.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
