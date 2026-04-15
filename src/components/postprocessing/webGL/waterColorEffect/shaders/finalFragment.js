const FINAL_FRAGMENT = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D watercolorTexture;
uniform sampler2D tensorTexture;
uniform int quantizeLevels;
uniform float saturation;
uniform float paperStrength;
uniform bool outlineEnabled;
uniform float outlineStrength;
uniform float outlineThreshold;
uniform float outlineSoftness;
uniform bool hatchingEnabled;
uniform float hatchScale;
uniform float hatchIntensity;
uniform float hatchThickness;
uniform float hatchRotation;
varying vec2 vUv;

vec3 ACESFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 sat(vec3 rgb, float adjustment) {
  vec3 W = vec3(0.2125, 0.7154, 0.0721);
  vec3 intensity = vec3(dot(rgb, W));
  return mix(intensity, rgb, adjustment);
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// Single-sample edge from the precomputed structure tensor (Jxx + Jyy = total gradient energy).
// ~8x cheaper than a full Sobel pass; scale by 0.577 (1/sqrt(3)) so RGB energy is
// comparable in range to a luma-only Sobel, keeping existing threshold values usable.
float tensorEdge(vec2 uv) {
  vec4 t = texture2D(tensorTexture, uv);
  return sqrt((t.r + t.g) * 0.333);
}

// Hatching stripe using a precomputed unit direction to avoid per-call sin/cos.
float hatchStripe(vec2 fragCoord, vec2 dir, float spacing, float thickness) {
  float p = dot(fragCoord, dir) / max(1.0, spacing);
  float phase = abs(fract(p) - 0.5);
  float width = clamp(thickness, 0.1, 1.5) * 0.5;
  return 1.0 - smoothstep(width, width + 0.06, phase);
}

void main() {
  vec3 color = texture2D(inputBuffer, vUv).rgb;
  vec4 watercolorColor = texture2D(watercolorTexture, vUv);
  vec3 grayscale = vec3(luma(color));

  // Color quantization
  int n = quantizeLevels;
  float x = grayscale.r;
  float qn = floor(x * float(n - 1) + 0.5) / float(n - 1);
  qn = clamp(qn, 0.2, 0.7);

  // Two-point color interpolation
  if (qn < 0.5) {
    color = mix(vec3(0.1), color.rgb, qn * 2.0);
  } else {
    color = mix(color.rgb, vec3(1.0), (qn - 0.5) * 2.0);
  }

  color = sat(color, saturation);
  color = ACESFilm(color);

  if (hatchingEnabled) {
    float value = luma(color);
    vec2 frag = gl_FragCoord.xy;
    float s = hatchScale;
    float t = hatchThickness;

    // Precompute sin/cos once (2 trig ops) then derive all three directions.
    float cosR = cos(hatchRotation);
    float sinR = sin(hatchRotation);
    // dir at +45° + rotation, -45° + rotation, 0° + rotation
    vec2 dir1 = vec2(0.70711 * (cosR - sinR), 0.70711 * (cosR + sinR));
    vec2 dir2 = vec2(0.70711 * (cosR + sinR), 0.70711 * (sinR - cosR));
    vec2 dir3 = vec2(cosR, sinR);

    float h1 = hatchStripe(frag, dir1, s, t);
    float h2 = hatchStripe(frag, dir2, s * 1.05, t);
    float h3 = hatchStripe(frag, dir3, s * 0.85, t * 0.85);

    float hatchMask = 0.0;
    hatchMask += step(value, 0.75) * h1;
    hatchMask += step(value, 0.55) * h2;
    hatchMask += step(value, 0.35) * h3;
    hatchMask = clamp(hatchMask / 3.0, 0.0, 1.0);

    color *= 1.0 - (hatchMask * hatchIntensity);
  }

  if (outlineEnabled) {
    float edge = tensorEdge(vUv);
    float ink = smoothstep(
      outlineThreshold,
      outlineThreshold + max(0.001, outlineSoftness),
      edge
    );
    color = mix(color, vec3(0.03, 0.03, 0.04), ink * outlineStrength);
  }

  vec4 outputColor = vec4(color, 1.0);
  outputColor = mix(outputColor, outputColor * watercolorColor, paperStrength);

  gl_FragColor = outputColor;
}
`;

export default FINAL_FRAGMENT;
