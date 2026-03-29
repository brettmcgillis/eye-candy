const BLOOM_COMPOSITE_FRAGMENT = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D bloomBuffer;
uniform float bloomIntensity;
varying vec2 vUv;

void main() {
  vec4 original = texture2D(inputBuffer, vUv);
  vec4 bloom = texture2D(bloomBuffer, vUv);
  gl_FragColor = original + bloom * bloomIntensity;
}
`;

export default BLOOM_COMPOSITE_FRAGMENT;
