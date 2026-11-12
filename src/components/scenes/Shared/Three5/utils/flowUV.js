export default function updateFlowUV(geometry, base, phase, config) {
  const { uv } = geometry.attributes;
  const t = phase * Math.PI * 2;
  const frequency = config.flowFrequency * Math.PI * 2;
  for (let i = 0; i < uv.count; i += 1) {
    const u = base[i * 2];
    const v = base[i * 2 + 1];
    const envelope = Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
    const strength = config.flowAmount * envelope;
    let x = Math.sin(t + v * frequency) * strength;
    let y = Math.cos(t + u * frequency) * strength * 0.5;
    if (config.flowPattern === 'swirl') {
      const angle = Math.sin(t) * strength * 7;
      x = (u - 0.5) * Math.cos(angle) - (v - 0.5) * Math.sin(angle) - u + 0.5;
      y = (u - 0.5) * Math.sin(angle) + (v - 0.5) * Math.cos(angle) - v + 0.5;
    }
    if (config.flowPattern === 'ripples') {
      const dx = u - 0.5;
      const dy = v - 0.5;
      const radius = Math.hypot(dx, dy);
      const wave = Math.sin(radius * frequency - t) * strength;
      x = (dx * wave) / Math.max(0.02, radius);
      y = (dy * wave) / Math.max(0.02, radius);
    }
    uv.setXY(i, u + x, v + y);
  }
  uv.needsUpdate = true;
}
