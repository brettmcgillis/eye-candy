import {
  Fn,
  floor,
  int,
  max,
  mix,
  mod,
  round,
  screenSize,
  screenUV,
  step,
  texture,
  uniformArray,
  vec2,
  vec3,
  vec4,
  wgslFn,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const ASCII_CHARACTERS = ' .,:-=+*%#$';

const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => v / 16
);

let asciiAtlas = null;
function getAsciiAtlas() {
  if (asciiAtlas) return asciiAtlas;
  const characterSize = 256;
  const canvas = document.createElement('canvas');
  canvas.width = characterSize * ASCII_CHARACTERS.length;
  canvas.height = characterSize;

  const context = canvas.getContext('2d');
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.font = `${characterSize}px "Space Grotesk", "MS Gothic", "Noto Sans JP", monospace`;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  [...ASCII_CHARACTERS].forEach((character, index) => {
    context.fillText(
      character,
      (index + 0.5) * characterSize,
      characterSize / 2
    );
  });

  asciiAtlas = new THREE.CanvasTexture(canvas);
  asciiAtlas.flipY = false;
  asciiAtlas.generateMipmaps = false;
  asciiAtlas.minFilter = THREE.LinearFilter;
  asciiAtlas.magFilter = THREE.LinearFilter;
  return asciiAtlas;
}

const asciiAtlasMotion = wgslFn(/* wgsl */ `
  fn asciiAtlasMotion(
    asciiTexture: texture_2d<f32>,
    inputUv: vec2f,
    grid: vec2f,
    value: f32
  ) -> f32 {
    let cellUv = fract(inputUv * grid);
    let characterIndex = clamp(
      floor(clamp(value, 0.0, 1.0) * f32(${ASCII_CHARACTERS.length - 1})),
      0.0,
      f32(${ASCII_CHARACTERS.length - 1})
    );
    let atlasUv = vec2f(
      (characterIndex + cellUv.x) / f32(${ASCII_CHARACTERS.length}),
      cellUv.y
    );
    let atlasDimensions = textureDimensions(asciiTexture);
    let atlasCoord = clamp(
      vec2i(atlasUv * vec2f(atlasDimensions)),
      vec2i(0),
      vec2i(atlasDimensions) - vec2i(1)
    );

    return textureLoad(asciiTexture, atlasCoord, 0).r;
  }
`);

export const aspectGrid = (rows) =>
  vec2(max(1, round(rows.mul(screenSize.x.div(screenSize.y)))), rows);

export const snapToGrid = (uv, grid) => floor(uv.mul(grid)).add(0.5).div(grid);

const COOL = vec3(0, 0.5, 2);
const HOT = vec3(1, 0.35, 0.5);

export function buildMaskOutput(mode, { state, scene, u }) {
  return Fn(() => {
    if (mode === 'mask') return vec4(vec3(state.sample(screenUV).g), 1);

    if (mode === 'heatmap') {
      const motionMask = state.sample(screenUV).g;
      return vec4(mix(COOL, HOT, motionMask).mul(motionMask), 1);
    }

    if (mode === 'ditheredMask') {
      const cell = floor(screenUV.mul(screenSize).div(u.pixelSize));
      const cellUV = cell.add(0.5).mul(u.pixelSize).div(screenSize);
      const motionMask = state.sample(cellUV).g;
      const bayerCell = mod(cell, 4);
      const threshold = uniformArray(BAYER_4, 'float').element(
        int(bayerCell.y.mul(4).add(bayerCell.x))
      );
      const dithered = step(threshold, motionMask).mul(step(0.1, motionMask));
      return vec4(mix(u.accentColor, vec3(1), dithered), 1);
    }

    const grid = aspectGrid(u.asciiRows);
    const motionMask = state.sample(snapToGrid(screenUV, grid)).g;
    const asciiPattern = asciiAtlasMotion({
      asciiTexture: texture(getAsciiAtlas()),
      inputUv: screenUV,
      grid,
      value: motionMask,
    });
    const background = scene.sample(screenUV).rgb.mul(0.8);
    const asciiColor = mix(u.accentColor, vec3(1), asciiPattern);
    return vec4(mix(background, asciiColor, motionMask), 1);
  })();
}
