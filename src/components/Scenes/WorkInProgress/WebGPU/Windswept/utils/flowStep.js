// Strange-attractors mode physics: velocity is recomputed fresh each frame
// straight from the attractor's vector field (no persisted inertia) — a
// particle always moves exactly along the field at its current position.
// Pair with extraUniforms `{ b, stepSize }` (see attractorFields.js).
export default function createFlowStep(derivative) {
  return ({ position, uniforms, velocity }) => {
    const flow = derivative(position, uniforms.b).toVar();
    const step = uniforms.stepSize
      .mul(uniforms.speed)
      .mul(uniforms.frameDelta)
      .mul(60);

    position.addAssign(flow.mul(step));
    velocity.assign(flow);
  };
}
