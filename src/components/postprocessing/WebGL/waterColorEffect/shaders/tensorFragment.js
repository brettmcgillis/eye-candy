const TENSOR_FRAGMENT = /* glsl */ `
varying vec2 vUv;
uniform sampler2D inputBuffer;
uniform vec4 resolution;

const mat3 Gx = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);
const mat3 Gy = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);

vec4 computeStructureTensor(sampler2D tex, vec2 uv) {
  vec3 tx0y0 = texture2D(tex, uv + vec2(-1, -1) / resolution.xy).rgb;
  vec3 tx0y1 = texture2D(tex, uv + vec2(-1,  0) / resolution.xy).rgb;
  vec3 tx0y2 = texture2D(tex, uv + vec2(-1,  1) / resolution.xy).rgb;
  vec3 tx1y0 = texture2D(tex, uv + vec2( 0, -1) / resolution.xy).rgb;
  vec3 tx1y1 = texture2D(tex, uv + vec2( 0,  0) / resolution.xy).rgb;
  vec3 tx1y2 = texture2D(tex, uv + vec2( 0,  1) / resolution.xy).rgb;
  vec3 tx2y0 = texture2D(tex, uv + vec2( 1, -1) / resolution.xy).rgb;
  vec3 tx2y1 = texture2D(tex, uv + vec2( 1,  0) / resolution.xy).rgb;
  vec3 tx2y2 = texture2D(tex, uv + vec2( 1,  1) / resolution.xy).rgb;

  vec3 Sx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
            Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
            Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

  vec3 Sy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
            Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
            Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

  return vec4(dot(Sx, Sx), dot(Sy, Sy), dot(Sx, Sy), 1.0);
}

void main() {
  gl_FragColor = computeStructureTensor(inputBuffer, vUv);
}
`;

export default TENSOR_FRAGMENT;
