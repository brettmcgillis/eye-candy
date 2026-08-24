const BLOOM_BLUR_FRAGMENT = /* glsl */ `
uniform sampler2D inputBuffer;
uniform vec2 direction;
uniform vec2 resolution;
varying vec2 vUv;

void main() {
  vec2 texelSize = 1.0 / resolution;
  vec3 result = vec3(0.0);

  // 9-tap Gaussian kernel (sigma ~2.5)
  result += texture2D(inputBuffer, vUv + -4.0 * direction * texelSize).rgb * 0.0162;
  result += texture2D(inputBuffer, vUv + -3.0 * direction * texelSize).rgb * 0.0540;
  result += texture2D(inputBuffer, vUv + -2.0 * direction * texelSize).rgb * 0.1218;
  result += texture2D(inputBuffer, vUv + -1.0 * direction * texelSize).rgb * 0.1944;
  result += texture2D(inputBuffer, vUv).rgb * 0.2270;
  result += texture2D(inputBuffer, vUv +  1.0 * direction * texelSize).rgb * 0.1944;
  result += texture2D(inputBuffer, vUv +  2.0 * direction * texelSize).rgb * 0.1218;
  result += texture2D(inputBuffer, vUv +  3.0 * direction * texelSize).rgb * 0.0540;
  result += texture2D(inputBuffer, vUv +  4.0 * direction * texelSize).rgb * 0.0162;

  gl_FragColor = vec4(result, 1.0);
}
`;

export default BLOOM_BLUR_FRAGMENT;
