import {makeScene2D} from '@canvas-commons/2d';
import {all, createRef, waitFor, waitUntil} from '@canvas-commons/core';
import {Background, Callout} from '@sinapse-zero/components';
import {ModelView} from '@sinapse-zero/three';
import excavator from '../models/excavator.glb?url';

/*
 * The parts of FreeCAD's example all sit in one plane, so a purely radial explosion would
 * only slide them along the arm. Sideways offsets (x, as fractions of the assembly's longest
 * side) pull the hydraulic cylinders, links and pins out of that plane, so it reads as 3D.
 */
const sideways: Record<string, [number, number, number]> = {
  BasePin: [-0.25, 0, 0],
  BoomCylinderOuter: [0.2, 0, 0],
  BoomCylinderInner: [0.35, 0, 0],
  StickCylinderOuter: [0.2, 0, 0],
  StickCylinderInner: [0.35, 0, 0],
  BucketCylinderOuter: [-0.2, 0, 0],
  BucketCylinderInner: [-0.35, 0, 0],
  BucketLink1: [-0.18, 0, 0],
  BucketLink2: [0.18, 0, 0],
};

export default makeScene2D(function* (view) {
  const model = createRef<ModelView>();
  const bucket = createRef<Callout>();
  const cylinder = createRef<Callout>();

  view.add(<Background />);
  view.add(
    <ModelView
      ref={model}
      src={excavator}
      orbit={70}
      elevation={14}
      zoom={0.9}
      spread={0.6}
      offsets={sideways}
      fillOpacity={0.85}
      hiddenLines={0}
    />,
  );
  view.add(
    <Callout ref={bucket} target={() => model().pointOf('Bucket')} elbow={[-150, 150]} text={'BUCKET'} />,
  );
  view.add(
    <Callout
      ref={cylinder}
      target={() => model().pointOf('BoomCylinderInner')}
      elbow={[180, 120]}
      text={'BOOM CYLINDER ROD'}
    />,
  );

  // Assembled and solid, slowly turning.
  yield* model().orbit(45, 1.5);

  // The walls dissolve: see-through parts, hidden lines dashed.
  yield* waitUntil('see-through');
  yield* all(model().fillOpacity(0, 1), model().hiddenLines(0.4, 1), model().orbit(38, 1));

  // Explode, with chain-line guides trailing each part.
  yield* waitUntil('explode');
  model().guides(1);
  yield* all(model().explode(1, 2.4), model().orbit(30, 3), model().zoom(0.7, 2.4));
  yield* all(bucket().show(), cylinder().show());

  yield* waitUntil('assemble');
  yield* all(bucket().hide(), cylinder().hide());
  yield* all(model().explode(0, 1.6), model().orbit(45, 1.6), model().zoom(0.9, 1.6));
  yield* waitFor(0.5);
});
