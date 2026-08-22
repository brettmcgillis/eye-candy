import { float, texture, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { textureFile } from '../../../../../../utils/appUtils';

// Baked-SDF occluders: logo artwork has no sane analytic SDF, so
// scripts/bake-occluder-sdf.mjs turns each source PNG's alpha into one tile of
// a distance-field atlas that the same marcher can trace. Tile order here is
// the script's SOURCES order and defines each shape's id offset.
export const ATLAS_SHAPES = ['Turbo Flex', 'Reversal', 'Bret', 'Bret Inner'];

const TILE_COUNT = ATLAS_SHAPES.length;
// Must match the bake script's SDF_RANGE and ART_FRACTION.
const SDF_RANGE = 0.25;
const ART_FRACTION = 0.8;

// Occluder size `r` is radius-like for every analytic shape, so the artwork
// (ART_FRACTION of its tile) has to land at ±r for a logo to read at the same
// scale as a circle of the same size.
const TILE_WORLD = 2 / ART_FRACTION;

let atlasTexture = null;

export function getOccluderAtlas() {
  if (!atlasTexture) {
    atlasTexture = new THREE.TextureLoader().load(
      textureFile('crossTalk/occluder-sdf.png')
    );
    atlasTexture.colorSpace = THREE.NoColorSpace;
    atlasTexture.generateMipmaps = false;
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.minFilter = THREE.LinearFilter;
    atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
    atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
  }
  return atlasTexture;
}

// The atlas branch of occluderSDF. `tile` is a node (shapeId - ATLAS_BASE).
// Sampled at an explicit LOD because this runs inside occluderSDF's If/ElseIf
// chain — implicit-derivative sampling isn't allowed in non-uniform control
// flow. The encoded field saturates past ±SDF_RANGE, so outside the tile the
// exact box distance takes over and a ray can't tunnel in from a distance.
export function atlasSDF(tile, p, r, boxDist) {
  const half = r.mul(TILE_WORLD * 0.5);
  const local = p.div(half.mul(2)).add(0.5).clamp(0, 1);
  // V is flipped because DesktopStage's ortho camera is Y-flipped (top=0,
  // bottom=height, so desktop pixel coords work directly) — sampled straight,
  // the artwork renders upside down.
  const uv = vec2(local.x.add(tile).div(TILE_COUNT), float(1).sub(local.y));
  const encoded = texture(getOccluderAtlas(), uv).level(0).r;
  const dist = encoded
    .sub(0.5)
    .mul(2 * SDF_RANGE * TILE_WORLD)
    .mul(r);
  return dist.max(boxDist);
}
