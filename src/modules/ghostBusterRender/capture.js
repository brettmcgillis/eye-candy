import { closePinholes, ghostLattice } from '@modules/ghostBuster';

import { resolveSkin } from './skins';

export {
  aimCamera,
  createDepthCapture,
  createNormalCapture,
  depthProbe,
} from '@modules/renderStage';

// The settled cloth in world space, read back from the sim's GPU buffer.
export async function readGhostLattice(renderer, ghost, skinName) {
  const { mesh, sim } = ghost;
  const buffer = await renderer.getArrayBufferAsync(sim.posBuf.value);
  mesh.updateWorldMatrix(true, false);
  return ghostLattice({
    local: new Float32Array(buffer),
    matrixWorld: mesh.matrixWorld.elements,
    skin: resolveSkin(skinName),
  });
}

// What renderGhostSvg's `storm` reads from a storm skin's RainCloud;
// `depthOf(only)` and `normalsOf(only)` are the caller's passes at the
// plot's size.
export async function readStormPlot(renderer, storm, { depthOf, normalsOf }) {
  const { cloud } = storm;
  return {
    cloud: cloud
      ? closePinholes({
          coverage: await depthOf(cloud),
          normals: await normalsOf(cloud),
        })
      : null,
    snapshot: await storm.snapshot(renderer),
  };
}
