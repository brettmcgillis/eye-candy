// Strange-attractors mode physics: velocity is recomputed fresh each frame
// straight from the attractor's vector field (no persisted inertia) — a
// particle always moves exactly along the field at its current position.
// `paramNames` (from the attractor's registry entry) says which extraUniforms
// to spread into `derivative` and in what order, so this stays generic
// across attractors with different param counts. Pair with extraUniforms
// `{ stepSize, ...one uniform per paramNames entry }` (see attractorFields.js).
export default function createFlowStep(derivative, paramNames) {
  return ({ position, uniforms, velocity }) => {
    const args = paramNames.map((name) => uniforms[name]);
    const flow = derivative(position, ...args).toVar();
    const step = uniforms.stepSize
      .mul(uniforms.speed)
      .mul(uniforms.frameDelta)
      .mul(60);

    position.addAssign(flow.mul(step));
    velocity.assign(flow);
  };
}
