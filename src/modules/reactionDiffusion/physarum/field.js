import {
  Fn,
  If,
  Loop,
  float,
  instanceIndex,
  instancedArray,
  int,
  ivec2,
  select,
  textureStore,
  uniform,
  vec2,
  vec4,
} from 'three/tsl';

import createFieldTexture, { readOnly, writeOnly } from '../fieldTexture';

// Physarum polycephalum — slime mould agents that lay a trail, sense it three
// ways ahead, and turn toward the strongest reading. Ported 1:1 from Nicolas
// Barradeau's implementation (https://github.com/nicoptere/physarum), itself
// following Jones 2010, "Characteristics of pattern formation and evolution in
// approximations of Physarum transport networks".
//
// The reference runs four WebGL render-target passes per frame: diffuse+decay
// the trail, steer and move the agents, splat the agents into a points buffer,
// then show the trail. Those become four compute dispatches here, in the same
// order and reading the same channels. The one non-obvious change is the splat:
// the reference draws GL_POINTS of size 1, so every agent covers exactly one
// texel with `gl_PointCoord` at its centre and deposits exactly 1.0. That is a
// scattered texture store, not a rasterisation, so it is written as one.
//
// Presents the same surface as the other two solvers — update / inject /
// reseed / outputTexture / uniforms / dispose — with `.r` of the output driving
// height or coverage and `.g` a colour coordinate.

const { PI } = Math;
const PI2 = PI * 2;
// The reference's own constants. `RAD` is named for a degrees-to-radians
// conversion but is 1/PI, so the sensor and rotation angles are in units of
// PI radians rather than degrees; its defaults are chosen against that, and
// changing it would change every angle in the reference's parameter set.
const RAD = 1 / PI;
const PHI = 1.618033988749895 * 0.1;
const SQ2 = 1.4142135623730951 * 1000;

// The trail is clamped to this floor rather than zero, so a decayed region
// still reads as faintly marked and sensors never sit on an exactly flat field.
const TRAIL_FLOOR = 0.01;

export default function createPhysarumField({
  agentCount = 262144,
  height,
  width,
}) {
  const uniforms = {
    // Shared name with the other two solvers so one control drives any of them.
    fieldContrast: uniform(1),
    injectStrength: uniform(0),
    physarumDecay: uniform(0.9),
    physarumRotationAngle: uniform(4),
    physarumSensorAngle: uniform(2),
    physarumSensorDistance: uniform(12),
    physarumStepSize: uniform(1.1),
    seedCenterX: uniform(0.5),
    seedCenterY: uniform(0.5),
    seedRadius: uniform(0.06),
    seedSalt: uniform(0),
    // 1 scatters agents across the whole domain (the reference's `random`),
    // 0 gathers them into a disc (its double-click). Set on the CPU.
    seedUniform: uniform(1),
    time: uniform(0),
  };

  // x, y are the agent's normalised position; z its heading as a fraction of a
  // turn. w is unused, and kept so the buffer stays vec4-aligned.
  const agents = instancedArray(agentCount, 'vec4');

  const trails = [
    createFieldTexture(width, height),
    createFieldTexture(width, height),
  ];
  // Where the agents splat themselves. Rewritten from empty every frame, so it
  // carries this frame's occupancy only and never needs a pair.
  const pointsTexture = createFieldTexture(width, height);
  const outputTexture = createFieldTexture(width, height);

  const resolution = vec2(width, height);

  const gridCoord = () =>
    ivec2(int(instanceIndex.mod(width)), int(instanceIndex.div(width)));

  // The domain is a torus in the reference — every lookup and every move goes
  // through `fract`. Integer coordinates here get the same treatment.
  const wrapped = (c) =>
    ivec2(c.x.add(width).mod(width), c.y.add(height).mod(height));

  const texelOf = (uv) => wrapped(ivec2(uv.fract().mul(resolution)));

  const rand = (coordinate) =>
    coordinate
      .mul(uniforms.time.add(PHI))
      .distance(vec2(PHI, PI * 0.1))
      .tan()
      .mul(SQ2)
      .fract();

  // Trail diffusion and decay: a 3x3 box blur of the trail, fed by this
  // frame's agent splats. The red channel carries the raw splat and the green
  // the accumulated trail, and the blur mixes red in at full weight and green
  // at half, which is what makes a fresh mark spread faster than an old one.
  function diffusePass(from, to) {
    const read = readOnly(trails[from]);
    const points = readOnly(pointsTexture);
    const write = writeOnly(trails[to]);

    return Fn(() => {
      const coord = gridCoord();
      const pos = points.load(coord).r;

      const weight = 1 / 9;
      const col = float(0).toVar();
      Loop({ end: 2, name: 'j', start: -1, type: 'int' }, ({ j }) => {
        Loop({ end: 2, name: 'i', start: -1, type: 'int' }, ({ i }) => {
          const val = read.load(wrapped(coord.add(ivec2(i, j))));
          col.addAssign(val.r.mul(weight).add(val.g.mul(weight * 0.5)));
        });
      });

      const decay = uniforms.physarumDecay;
      textureStore(
        write,
        coord,
        vec4(pos.mul(decay), col.mul(decay), 0.5, 1).clamp(TRAIL_FLOOR, 1)
      );
    })().compute(width * height);
  }

  // Steer and step. Each agent reads the trail at three points ahead of it and
  // turns by the rotation angle toward whichever sensor is strongest.
  function agentPass(from) {
    const read = readOnly(trails[from]);

    return Fn(() => {
      const val = agents.element(instanceIndex).toVar();

      const SA = uniforms.physarumSensorAngle.mul(RAD);
      const RA = uniforms.physarumRotationAngle.mul(RAD);
      // Sensor distance and step size are given in texels, so they scale with
      // the field rather than with the domain.
      const SO = uniforms.physarumSensorDistance.div(resolution);
      const SS = uniforms.physarumStepSize.div(resolution);

      const angle = val.z.mul(PI2).toVar();

      const sense = (a) =>
        read.load(texelOf(val.xy.add(vec2(a.cos(), a.sin()).mul(SO)))).g;

      const FL = sense(angle.sub(SA)).toVar();
      const F = sense(angle).toVar();
      const FR = sense(angle.add(SA)).toVar();

      // The reference leads with an empty branch for "straight ahead is
      // already strongest, hold the heading"; inverting that into a guard says
      // the same thing without emitting an empty block.
      const straightBest = F.greaterThan(FL).and(F.greaterThan(FR));

      If(straightBest.not(), () => {
        If(F.lessThan(FL).and(F.lessThan(FR)), () => {
          // A trail on both sides and none ahead: pick a side at random.
          angle.addAssign(
            select(rand(val.xy).greaterThan(0.5), RA, RA.negate())
          );
        })
          .ElseIf(FL.lessThan(FR), () => {
            angle.addAssign(RA);
          })
          .ElseIf(FL.greaterThan(FR), () => {
            angle.subAssign(RA);
          });
      });

      val.xy.addAssign(vec2(angle.cos(), angle.sin()).mul(SS));
      val.xy.assign(val.xy.fract());
      val.z.assign(angle.div(PI2));

      agents.element(instanceIndex).assign(val);
    })().compute(agentCount);
  }

  const clearPointsWrite = writeOnly(pointsTexture);
  const clearPoints = Fn(() => {
    textureStore(clearPointsWrite, gridCoord(), vec4(0, 0, 0, 1));
  })().compute(width * height);

  // One texel per agent at full strength, matching the reference's size-1
  // points. Overlapping agents overwrite rather than accumulate, which is what
  // an unblended point draw does too.
  const depositWrite = writeOnly(pointsTexture);
  const depositPass = Fn(() => {
    const at = agents.element(instanceIndex).xy;
    textureStore(depositWrite, texelOf(at), vec4(1, 0, 0, 1));
  })().compute(agentCount);

  function shapePass(from) {
    const read = readOnly(trails[from]);
    const write = writeOnly(outputTexture);

    return Fn(() => {
      const coord = gridCoord();
      const trail = read.load(coord);
      const shaped = trail.g.mul(uniforms.fieldContrast).clamp(0, 1);

      // `.r` drives height and culling, `.g` is the colour coordinate. The
      // splat channel serves as the latter: it marks where agents are right
      // now, so colour tracks the live front rather than the settled trail.
      textureStore(write, coord, vec4(shaped, trail.r, 0, 1));
    })().compute(width * height);
  }

  // Scatters agents and gives each a random heading. `seedUniform` picks
  // between the reference's two placements: spread over the whole domain, or
  // gathered into a disc at the seed centre.
  const scatterPass = Fn(() => {
    const id = float(instanceIndex).add(uniforms.seedSalt);
    const a = rand(vec2(id, id.mul(0.37))).mul(PI2);
    const r = rand(vec2(id.mul(1.7), id)).mul(uniforms.seedRadius);

    const disc = vec2(
      uniforms.seedCenterX.add(a.cos().mul(r)),
      uniforms.seedCenterY.add(a.sin().mul(r))
    );
    const spread = vec2(rand(vec2(id, id.add(7))), rand(vec2(id.add(13), id)));

    const at = select(uniforms.seedUniform.greaterThan(0.5), spread, disc);
    const keep = agents.element(instanceIndex).xy;
    // On an inject only the chosen share of agents relocate; the rest carry on
    // from wherever they were, so a drop feeds the pattern instead of resetting
    // it. A reseed passes strength 1 and moves every agent.
    const moved = rand(vec2(id.add(31), id.mul(0.13)))
      .lessThan(uniforms.injectStrength)
      .select(at.fract(), keep);

    agents
      .element(instanceIndex)
      .assign(vec4(moved, rand(vec2(id.mul(2.3), id.add(5))), 1));
  })().compute(agentCount);

  const clearTrails = [0, 1].map((index) => {
    const write = writeOnly(trails[index]);
    return Fn(() => {
      textureStore(write, gridCoord(), vec4(TRAIL_FLOOR, TRAIL_FLOOR, 0.5, 1));
    })().compute(width * height);
  });

  const diffusePasses = [diffusePass(0, 1), diffusePass(1, 0)];
  const agentPasses = [agentPass(1), agentPass(0)];
  const shapePasses = [shapePass(1), shapePass(0)];

  // Which half of the trail pair the last diffuse wrote into.
  let phase = 0;
  let seeded = false;

  function scatter(renderer, { centerX, centerY, radius, strength }) {
    if (centerX !== undefined) uniforms.seedCenterX.value = centerX;
    if (centerY !== undefined) uniforms.seedCenterY.value = centerY;
    if (radius !== undefined) uniforms.seedRadius.value = radius;
    uniforms.injectStrength.value = strength;
    uniforms.seedSalt.value = Math.random() * 1000;
    renderer.compute(scatterPass);
  }

  function reset(renderer, { centerX, centerY, radius } = {}) {
    // A radius that already covers the domain is the reference's "all agents
    // everywhere" reseed; anything smaller is its disc.
    uniforms.seedUniform.value =
      (radius ?? uniforms.seedRadius.value) >= 1 ? 1 : 0;
    scatter(renderer, { centerX, centerY, radius, strength: 1 });
    clearTrails.forEach((pass) => renderer.compute(pass));
    phase = 0;
    seeded = true;
  }

  function update(renderer, time = 0) {
    if (!seeded) reset(renderer, { radius: 1 });
    uniforms.time.value = time;

    renderer.compute(diffusePasses[phase]);
    phase = 1 - phase;

    renderer.compute(agentPasses[phase]);
    renderer.compute(clearPoints);
    renderer.compute(depositPass);
    renderer.compute(shapePasses[phase]);
  }

  return {
    dispose: () =>
      [...trails, pointsTexture, outputTexture].forEach((texture) =>
        texture.dispose()
      ),
    fieldTexture: trails[0],
    // The reference's click-drag draw: move a share of the agents into a disc
    // at the given point. Same call shape as the other two solvers', which is
    // what lets a scene swap between them.
    inject: (
      renderer,
      { centerX = 0.5, centerY = 0.5, radius, strength = 1 } = {}
    ) => {
      uniforms.seedUniform.value = 0;
      scatter(renderer, { centerX, centerY, radius, strength });
    },
    outputTexture,
    reseed: reset,
    uniforms,
    update,
  };
}
