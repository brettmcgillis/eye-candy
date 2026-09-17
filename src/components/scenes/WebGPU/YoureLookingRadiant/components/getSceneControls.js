import { folder } from 'leva';

import {
  glassControls,
  lightControls,
  lookControls,
  motionControls,
  particleControls,
  roleControls,
} from '@modules/radiantSwarm';

// One level of folders, ordered by how often you reach for them. Sizes are
// fractions of field height so nothing needs retuning when the window changes.
// Every control is shared with the 3D scene.
export default function getSceneControls(p) {
  return {
    Particles: folder(particleControls(p), { collapsed: false }),
    Roles: folder(roleControls(p), { collapsed: false }),
    Glass: folder(glassControls(p), { collapsed: false }),
    Motion: folder(motionControls(p), { collapsed: true }),
    Light: folder(lightControls(p), { collapsed: true }),
    Look: folder(lookControls(p), { collapsed: true }),
  };
}
