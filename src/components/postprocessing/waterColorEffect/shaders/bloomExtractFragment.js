const BLOOM_EXTRACT_FRAGMENT = /* glsl */ `
uniform sampler2D inputBuffer;
uniform float luminanceThreshold;
uniform float luminanceSmoothing;
varying vec2 vUv;

float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec4 texel = texture2D(inputBuffer, vUv);
  float lum = luminance(texel.rgb);
  float knee = luminanceThreshold * luminanceSmoothing;
  float soft = lum - luminanceThreshold + knee;
  soft = clamp(soft, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float contrib = max(soft, lum - luminanceThreshold) / max(lum, 1e-4);
  gl_FragColor = vec4(texel.rgb * max(contrib, 0.0), 1.0);
}
`;

export default BLOOM_EXTRACT_FRAGMENT;
