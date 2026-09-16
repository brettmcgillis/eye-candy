import * as THREE from 'three/webgpu';

import { MAX_CELLS, layoutText } from './charset';
import { fontCellAspect, getTechnique, normalizeFont } from './font';

// One material per technique; everything else — the font's glyphs, its
// parameters, the text — is uniform data, so `update` never recompiles.
// `size` is the plane size (world units, one text row = 1 unit tall) that
// shows the text undistorted.
export default function createGlyphMaterial(
  font,
  { maxCells = MAX_CELLS, text = '' } = {}
) {
  const techniqueId = font.technique;
  const technique = getTechnique(techniqueId);
  const uniforms = technique.createUniforms(
    maxCells,
    normalizeFont(font).params
  );
  const material = new THREE.MeshBasicNodeMaterial({ toneMapped: false });
  material.colorNode = technique.buildNode(uniforms);

  let current = { font, text };
  let layout = null;
  let size = { height: 1, width: 1 };

  function update(next = {}) {
    current = { ...current, ...next };
    const resolved = normalizeFont(current.font);
    if (resolved.technique !== techniqueId) {
      throw new Error(
        `This material renders "${techniqueId}" fonts; got "${resolved.technique}".`
      );
    }
    layout = layoutText(current.text, {
      lineGap: resolved.params.lineGap,
      maxCells,
    });
    technique.writeUniforms(uniforms, resolved, layout);
    size = {
      height: layout.rows,
      width: layout.cols * fontCellAspect(resolved),
    };
    return { layout, size };
  }

  update();

  return {
    dispose: () => material.dispose(),
    get layout() {
      return layout;
    },
    material,
    get size() {
      return size;
    },
    technique: techniqueId,
    update,
  };
}
