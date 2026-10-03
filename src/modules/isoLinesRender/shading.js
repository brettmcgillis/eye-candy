import {
  clamp,
  cos,
  float,
  floor,
  int,
  ivec2,
  max,
  min,
  mix,
  sRGBTransferEOTF,
  select,
  texture,
  textureLoad,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export const COLOR_MODE_IDS = { cosine: 0, palette: 1, ramp: 2 };

function dataTexture(data, width, height, format) {
  const tex = new THREE.DataTexture(
    data,
    width,
    height,
    format,
    THREE.FloatType
  );
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const blankField = () =>
  dataTexture(new Float32Array([0.5, 0.5, 0.5, 0.5]), 2, 2, THREE.RedFormat);
const blankColor = () =>
  dataTexture(new Float32Array(16).fill(1), 2, 2, THREE.RGBAFormat);

// Every uniform and texture the materials share. Texture nodes are copied
// when sampled, so each one a material makes is registered and swapped by
// hand when the field's grid changes size.
export function createShading() {
  const u = {
    aspect: uniform(1),
    background: uniform(new THREE.Color('#000000')),
    colorMode: uniform(0, 'int'),
    cosineFreq: uniform(12),
    cosinePhase: uniform(0),
    cosineSpread: uniform(2.1),
    cutoff: uniform(1),
    hasImage: uniform(0),
    imageColor: uniform(0),
    levelOffset: uniform(0),
    levels: uniform(20),
    lineColor: uniform(new THREE.Color('#ffffff')),
    lineHeight: uniform(0.06),
    lineThickness: uniform(0.008),
    lineTint: uniform(0),
    lineWidth: uniform(2),
    nx: uniform(2),
    ny: uniform(2),
    outlineColor: uniform(new THREE.Color('#000000')),
    outlineWidth: uniform(1),
    pixelRatio: uniform(1),
    rampHigh: uniform(new THREE.Color('#ffffff')),
    rampLow: uniform(new THREE.Color('#000000')),
    relief: uniform(1.2),
    rise: uniform(1),
    time: uniform(0),
    trailFade: uniform(0.7),
    trailSpan: uniform(1),
  };
  const textures = {
    color: { nodes: [], tex: blankColor() },
    field: { nodes: [], tex: blankField() },
    palette: { nodes: [], tex: null },
  };
  const neutralPalette = dataTexture(
    new Float32Array([1, 1, 1, 1]),
    1,
    1,
    THREE.RGBAFormat
  );

  const register = (name, node) => {
    textures[name].nodes.push(node);
    return node;
  };
  const load = (name, coord) =>
    register(name, textureLoad(textures[name].tex, coord));

  // Bilinear over the grid's vertices, exactly as the CPU contours assume.
  const bilinear = (name, du, dv) => {
    const p = vec2(
      clamp(du, 0, 1).mul(u.nx).min(u.nx.sub(1e-3)),
      clamp(dv, 0, 1).mul(u.ny).min(u.ny.sub(1e-3))
    );
    const i = floor(p);
    const f = p.sub(i);
    const x0 = int(i.x);
    const y0 = int(i.y);
    const a = load(name, ivec2(x0, y0));
    const b = load(name, ivec2(x0.add(1), y0));
    const c = load(name, ivec2(x0, y0.add(1)));
    const d = load(name, ivec2(x0.add(1), y0.add(1)));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  };

  const fieldAt = (du, dv) => bilinear('field', du, dv).x;

  // The level colour at field value t, linear: the reference's cosine
  // palette, a gradients.json palette or a ramp; then toward the source's
  // own colour by imageColor.
  const colorAt = (t, du, dv) => {
    const x = t.mul(u.cosineFreq).add(u.cosinePhase);
    const cosine = sRGBTransferEOTF(
      vec3(
        cos(x).mul(0.5).add(0.5),
        cos(x.add(u.cosineSpread)).mul(0.5).add(0.5),
        cos(x.sub(u.cosineSpread)).mul(0.5).add(0.5)
      )
    );
    const palette = register(
      'palette',
      texture(textures.palette.tex ?? neutralPalette, vec2(clamp(t, 0, 1), 0.5))
    ).rgb;
    const ramp = mix(u.rampLow, u.rampHigh, clamp(t, 0, 1));
    const base = select(
      u.colorMode.equal(COLOR_MODE_IDS.cosine),
      cosine,
      select(u.colorMode.equal(COLOR_MODE_IDS.palette), palette, ramp)
    );
    const source = sRGBTransferEOTF(clamp(bilinear('color', du, dv).rgb, 0, 1));
    return mix(base, source, u.imageColor.mul(u.hasImage));
  };

  const lineColorAt = (t, du, dv) =>
    mix(colorAt(t, du, dv), u.lineColor, u.lineTint);

  const levelValue = (k) => float(k).add(u.levelOffset).div(u.levels);

  // A level's height as the rig draws it: never below 0, capped by the
  // build, scaled by the relief and the rise.
  const heightOf = (z01) =>
    min(max(z01, 0), u.cutoff).mul(u.relief).mul(u.rise);

  const shading = {
    colorAt,
    fieldAt,
    heightOf,
    levelValue,
    lineColorAt,
    textures,
    u,

    neutralPalette,
    palette: null,
    paletteName: undefined,

    setTexture(name, tex) {
      const slot = textures[name];
      if (slot.tex === tex) return;
      const previous = slot.tex;
      slot.tex = tex;
      slot.nodes.forEach((node) => {
        // eslint-disable-next-line no-param-reassign
        node.value = tex ?? neutralPalette;
      });
      if (previous && previous !== neutralPalette && name !== 'palette') {
        previous.dispose();
      }
    },

    // Rewrites a grid texture in place, or replaces it when its size moved.
    upload(name, data, width, height, format) {
      const { tex } = textures[name];
      const same =
        tex.image.width === width &&
        tex.image.height === height &&
        tex.image.data.length === data.length;
      if (same) {
        tex.image.data.set(data);
        tex.needsUpdate = true;
      } else {
        shading.setTexture(name, dataTexture(data, width, height, format));
      }
    },

    dispose() {
      textures.field.tex?.dispose();
      textures.color.tex?.dispose();
      shading.palette?.dispose();
      neutralPalette.dispose();
    },
  };
  return shading;
}
