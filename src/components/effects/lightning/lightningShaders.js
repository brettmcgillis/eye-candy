export const BOLT_VERTEX_SHADER = /* glsl */ `
attribute float aRatio;
attribute vec3 aDirection;
attribute float aSide;
attribute float aStrikeOffset;
attribute float aThickness;
attribute float aAlpha;
attribute vec3 aColor;

uniform float uTime;
uniform float uStrikeDur;
uniform float uFadeDur;
uniform float uSpread;

varying float vRatio;
varying float vStrikeOffset;
varying float vAlpha;
varying vec3 vColor;

void main() {
  float fadeT = clamp((uTime - uStrikeDur) / uFadeDur, 0.0, 1.0);
  vec3 pos = position;
  pos.xz += pos.xz * pow(fadeT, 2.0) * uSpread;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vec3 toCamera = normalize(cameraPosition - worldPos.xyz);
  vec4 nextWorld = modelMatrix * vec4(position + aDirection, 1.0);
  vec3 tangent = normalize(cross(normalize(nextWorld.xyz - worldPos.xyz), toCamera));
  worldPos.xyz += tangent * aSide * aThickness;

  vRatio = aRatio;
  vStrikeOffset = aStrikeOffset;
  vAlpha = aAlpha;
  vColor = aColor;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const BOLT_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uStrikeDur;
uniform float uFadeDur;

varying float vRatio;
varying float vStrikeOffset;
varying float vAlpha;
varying vec3 vColor;

void main() {
  float strikeT = clamp(uTime / uStrikeDur, 0.0, 1.0);
  float fadeT = clamp((uTime - uStrikeDur) / uFadeDur, 0.0, 1.0);

  float window = max(1.0 - vStrikeOffset, 0.001);
  float localT = clamp((strikeT - vStrikeOffset) / window, 0.0, 1.0);

  float reveal = step(vRatio, localT);
  float alpha = reveal * (1.0 - fadeT * fadeT) * vAlpha;

  gl_FragColor = vec4(vColor, alpha);
}
`;

export const IMPACT_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const IMPACT_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uDur;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uRadialPow;
uniform float uFadePow;

varying vec2 vUv;

void main() {
  float t = clamp(uTime / uDur, 0.0, 1.0);
  float radial = max(0.0, 1.0 - length(vUv - vec2(0.5)) * 2.0);
  float alpha =
    pow(radial, uRadialPow) * pow(1.0 - t, uFadePow) * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export const CRACK_VERTEX_SHADER = /* glsl */ `
attribute float aRatio;
attribute float aSide;
attribute float aAlpha;
attribute float aFadeMult;

varying float vRatio;
varying float vSide;
varying float vAlpha;
varying float vFadeMult;

void main() {
  vRatio = aRatio;
  vSide = aSide;
  vAlpha = aAlpha;
  vFadeMult = aFadeMult;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const CRACK_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uDelay;
uniform float uRevealDur;
uniform float uFadeDur;
uniform vec3 uCoreColor;
uniform vec3 uMidColor;
uniform vec3 uEdgeColor;

varying float vRatio;
varying float vSide;
varying float vAlpha;
varying float vFadeMult;

void main() {
  float t = max(0.0, uTime - uDelay);
  float revealT = clamp(t / uRevealDur, 0.0, 1.0);
  float fadeT = clamp((t - uRevealDur) / (uFadeDur * vFadeMult), 0.0, 1.0);

  float reveal = step(vRatio, revealT);
  float edge = 1.0 - abs(vSide);
  float core = smoothstep(0.0, 0.25, edge);
  float glow = smoothstep(0.0, 0.85, edge);

  vec3 col = mix(uEdgeColor, mix(uMidColor, uCoreColor, core), glow);
  float fade = 1.0 - fadeT * fadeT;
  float alpha = reveal * glow * fade * vAlpha;

  gl_FragColor = vec4(col, alpha);
}
`;

export const SPARK_VERTEX_SHADER = /* glsl */ `
attribute vec3 aVelocity;
attribute float aLifetime;
attribute float aSeed;

uniform float uTime;
uniform float uDelay;
uniform float uSize;
uniform float uGravity;
uniform float uDepthScale;

varying float vAge;
varying float vSeed;

void main() {
  float t = max(0.0, uTime - uDelay);
  vAge = clamp(t / aLifetime, 0.0, 1.5);
  vSeed = aSeed;

  vec3 p = position + aVelocity * t + vec3(0.0, -uGravity * t * t, 0.0);
  p.z = max(p.z, 0.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * max(0.0, 1.0 - vAge * 0.8) * (uDepthScale / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const SPARK_FRAGMENT_SHADER = /* glsl */ `
varying float vAge;
varying float vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;

  float core = max(0.0, 1.0 - r * 5.0);
  float glow = max(0.0, 1.0 - r * 2.2);

  vec3 hot = vec3(1.00, 0.92, 0.55);
  vec3 mid = vec3(1.00, 0.42, 0.05);
  vec3 cool = vec3(0.70, 0.10, 0.00);

  vec3 col = mix(cool, mix(mid, hot, core), glow);
  float fade = max(0.0, 1.0 - vAge * vAge);
  gl_FragColor = vec4(col, (core * 1.0 + glow * 0.45) * fade);
}
`;

export const SHOCKWAVE_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SHOCKWAVE_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uDelay;
uniform float uDur;
uniform float uAlphaMult;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;

void main() {
  float t = clamp((uTime - uDelay) / uDur, 0.0, 1.0);
  vec2 uvc = vUv - 0.5;
  float r = length(uvc) * 2.0;
  float ring = abs(r - t);
  float alpha =
    smoothstep(0.12, 0.0, ring) * (1.0 - t) * (1.0 - t) * uAlphaMult;

  vec3 col = mix(uColorA, uColorB, t);
  gl_FragColor = vec4(col, alpha);
}
`;
