const FAR_AWAY = [0, -1e4, 0];

// A `smokeConfig` on a curl smoke's uniforms, lit warm near up to two
// `glowAt` points.
export default function applySmokeConfig(instance, smoke, glowAt = []) {
  const u = instance.uniforms;
  u.color.value.set(smoke.color);
  u.areaFade.value = smoke.areaFade;
  u.flameColor.value.set(smoke.glowColor);
  u.flameLight.value = smoke.glow;
  u.lightReach.value = smoke.glowReach;
  u.flameTop.value.set(...(glowAt[0] ?? FAR_AWAY));
  u.flameBottom.value.set(...(glowAt[1] ?? FAR_AWAY));
  u.curl.value = smoke.curl;
  u.hold.value = smoke.hold;
  u.curlScale.value = smoke.curlScale;
  u.curlSpeed.value = smoke.curlSpeed;
  u.emitRadius.value = smoke.emitRadius;
  u.laminar.value = smoke.laminar;
  u.life.value = smoke.life;
  u.opacity.value = smoke.opacity;
  u.rise.value = smoke.rise;
  u.size.value = smoke.size;
  u.spread.value = smoke.spread;
  u.sway.value = smoke.sway;
  instance.setSeed(smoke.seed);
}
