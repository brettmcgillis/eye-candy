import { convertToTexture, screenUV, texture } from 'three/tsl';

import MemoryNode from './MemoryNode';
import { buildGlyphAtlas, buildSdfAtlas } from './atlas';
import { ASCII_BLEND_MODES, blendLayer } from './blend';
import buildInkBleed from './inkBleed';
import buildAscii from './kernel';
import {
  ASCII_COLOR_MODES,
  ASCII_DEFAULTS,
  ASCII_NOISE_MODES,
  DEFAULT_CHARSET,
  DEFAULT_EDGE_CHARS,
  createUniforms,
  resolveOptions,
  updateUniforms,
} from './shared';

export {
  ASCII_BLEND_MODES,
  ASCII_COLOR_MODES,
  ASCII_DEFAULTS,
  ASCII_NOISE_MODES,
  DEFAULT_CHARSET as ASCII_CHARSET,
  DEFAULT_EDGE_CHARS as ASCII_EDGE_CHARS,
};

// Rebuild (call again) when a baked option changes; everything else goes
// through updateAsciiUniforms.
export const ASCII_BAKED = ['charset', 'edgeChars', 'asciiBlend', 'bleedBlend'];

// Port of Niccolò Fanton's morphing-ascii-shader: AsciiEffect → InkBleed,
// with MemoryGrid as a node. `initFromSource` starts the memory on the
// picture instead of the reference's blank white page.
export function ascii(textureNode, options = {}) {
  const values = resolveOptions(options);
  const u = createUniforms(values);

  const glyph = buildGlyphAtlas(values.charset);
  const edge = buildGlyphAtlas(values.edgeChars);
  const sdf = buildSdfAtlas(values.charset);
  u.glyphCount.value = glyph.count;
  u.edgeCount.value = edge.count;

  const memoryNode = new MemoryNode(
    textureNode,
    u,
    Boolean(options.initFromSource)
  );
  const memoryTexture = memoryNode.getTextureNode();
  const sample = (uv) => textureNode.sample(uv).level(0);

  const asciiNode = buildAscii({
    atlases: {
      edge: texture(edge.texture),
      glyph: texture(glyph.texture),
      sdf: texture(sdf.texture),
    },
    memory: (uv) => memoryTexture.sample(uv).level(0),
    sample,
    u,
  });
  const layer = convertToTexture(
    blendLayer(values.asciiBlend, sample(screenUV), asciiNode, u.asciiOpacity)
  );
  const colorNode = blendLayer(
    values.bleedBlend,
    layer.sample(screenUV),
    buildInkBleed(layer, u),
    u.bleedOpacity
  );

  return {
    colorNode,
    uniforms: u,
    setDelta(dt) {
      memoryNode.dt.value = dt;
    },
    reset() {
      memoryNode.reset();
    },
    dispose() {
      memoryNode.dispose();
      layer.dispose?.();
      glyph.texture.dispose();
      edge.texture.dispose();
      sdf.texture.dispose();
    },
  };
}

export function updateAsciiUniforms(uniforms, values) {
  updateUniforms(uniforms, values);
}
