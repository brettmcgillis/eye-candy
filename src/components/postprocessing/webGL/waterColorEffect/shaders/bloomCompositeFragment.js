const BLOOM_COMPOSITE_FRAGMENT = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D bloomBuffer;
uniform float bloomIntensity;
varying vec2 vUv;

void main() {
  vec3 base = texture2D(inputBuffer, vUv).rgb;
  vec3 bloom = texture2D(bloomBuffer, vUv).rgb * bloomIntensity;
  gl_FragColor = vec4(base + bloom, 1.0);
}
`;

export default BLOOM_COMPOSITE_FRAGMENT;
