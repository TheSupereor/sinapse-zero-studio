import {makeProject} from '@canvas-commons/core';

import exploded from './scenes/exploded?scene';

/*
 * Exploded view of a 3D assembly drawn as technical line art (spike).
 * The model is FreeCAD's AssemblyExample exported as glTF.
 */
export default makeProject({
  scenes: [exploded],
  variables: {theme: 'blueprint', locale: 'en'},
});
