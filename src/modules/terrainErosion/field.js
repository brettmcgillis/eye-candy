import { Fn, texture, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import buildHeightField, {
  domeBase,
  paintedBase,
  proceduralBase,
} from './heightField';
import { detailNoise } from './noise';
import brushDelta from './paintBrush';
import createFieldSampling from './sampling';

function createTarget(resolution) {
  const target = new THREE.RenderTarget(resolution, resolution, {
    type: THREE.FloatType,
  });

  target.texture.magFilter = THREE.LinearFilter;
  target.texture.minFilter = THREE.LinearFilter;
  target.texture.generateMipmaps = false;
  target.texture.wrapS = THREE.ClampToEdgeWrapping;
  target.texture.wrapT = THREE.ClampToEdgeWrapping;
  target.texture.colorSpace = THREE.NoColorSpace;

  return target;
}

// fragmentNode, never colorNode: a colour output is clamped to non-negative on
// write even into a float target, and the painted base stores a signed gradient
// in two of its channels. Clamping it flattened every region whose slope pointed
// down-left, which the erosion filter then had no slope to lay gullies along.
function bakePass(node) {
  const material = new THREE.NodeMaterial();

  material.fragmentNode = node;
  material.blending = THREE.NoBlending;
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;

  return material;
}

// The eroded terrain as baked float targets: the height field, the supplemental
// detail noise, and a painted base to erode when the scene is in paint mode.
// Everything downstream — the raymarcher, a displaced mesh, a rain probe —
// reads these rather than re-running the filter, which is why the reference
// splits it into buffers in the first place.
export default function createErosionField({ resolution = 1024, uniforms }) {
  const heightTarget = createTarget(resolution);
  const detailTarget = createTarget(resolution);

  // Fixed bindings both ways, rather than swapping a texture node's value: the
  // stroke always reads slot 0 and writes slot 1, and a copy returns it, so the
  // height bake reads one known slot. Matches how the solvers in this repo
  // ping-pong their fields.
  const paintTargets = [createTarget(resolution), createTarget(resolution)];
  const paintFront = texture(paintTargets[0].texture);
  const paintBack = texture(paintTargets[1].texture);

  const texel = uniform(1 / resolution);
  const brush = {
    cursor: uniform(new THREE.Vector2(0.5, 0.5)),
    radius: uniform(0.2),
    rate: uniform(0),
  };

  const fieldPoint = () => uv().add(uniforms.scrollInt);

  const erodePass = (baseFor) =>
    bakePass(
      Fn(() => {
        const p = fieldPoint().toVar();
        const { base, fadeTarget } = baseFor(p);

        return buildHeightField({ base, fadeTarget, p, uniforms });
      })()
    );

  const proceduralPass = erodePass((p) => proceduralBase(p, uniforms));
  const paintedPass = erodePass((p) => paintedBase(paintFront.sample(p)));
  const domePass = erodePass((p) => domeBase(p, uniforms));

  const detailPass = bakePass(Fn(() => vec4(detailNoise(fieldPoint()), 1))());

  const strokePass = bakePass(
    Fn(() => {
      const previous = paintFront.sample(uv()).xyz.toVar();
      const stroke = brushDelta(uv(), brush.cursor, brush.radius).toVar();
      const painted = previous.add(stroke.mul(brush.rate)).toVar();

      painted.x.assign(painted.x.clamp(0, 1));

      return vec4(painted, 1);
    })()
  );

  const returnPass = bakePass(Fn(() => paintBack.sample(uv()))());

  const seedPass = bakePass(Fn(() => vec4(domeBase(uv(), uniforms).base, 1))());

  const HEIGHT_PASSES = {
    dome: domePass,
    painted: paintedPass,
    procedural: proceduralPass,
  };

  const quad = new THREE.QuadMesh(proceduralPass);
  const materials = [
    proceduralPass,
    paintedPass,
    domePass,
    detailPass,
    strokePass,
    returnPass,
    seedPass,
  ];

  function run(renderer, material, target) {
    const previous = renderer.getRenderTarget?.() || null;

    quad.material = material;
    renderer.setRenderTarget(target);
    quad.render(renderer);
    renderer.setRenderTarget(previous);
  }

  const sampling = createFieldSampling({
    detailTexture: detailTarget.texture,
    heightTexture: heightTarget.texture,
    scrollFrac: uniforms.scrollFrac,
    texel,
  });

  return {
    ...sampling,

    setBrush({ radius, rate, u, v }) {
      brush.cursor.value.set(u, v);
      brush.radius.value = radius;
      brush.rate.value = rate;
    },

    detailTexture: detailTarget.texture,
    heightTexture: heightTarget.texture,
    resolution,
    texel,

    bakeDetail(renderer) {
      run(renderer, detailPass, detailTarget);
    },

    bakeHeight(renderer, mode = 'procedural') {
      run(renderer, HEIGHT_PASSES[mode] ?? proceduralPass, heightTarget);
    },

    seedPaint(renderer) {
      run(renderer, seedPass, paintTargets[0]);
    },

    paint(renderer) {
      run(renderer, strokePass, paintTargets[1]);
      run(renderer, returnPass, paintTargets[0]);
    },

    dispose() {
      materials.forEach((material) => material.dispose());
      heightTarget.dispose();
      detailTarget.dispose();
      paintTargets.forEach((target) => target.dispose());
    },
  };
}
