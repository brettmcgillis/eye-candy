export default /* glsl */ `
float pigmentHash(uint seed) {
  uint state = seed * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return float((word >> 22u) ^ word) * (1.0 / 4294967296.0);
}
float pigmentRandom(vec2 cell, uint identity, uint salt) {
  uint key = (uint(int(cell.x)) * 374761393u) ^ (uint(int(cell.y)) * 668265263u) ^ identity;
  return pigmentHash(key + salt);
}
float pigmentNoise(vec2 coord, float seed) {
  uint identity = uint(seed) ^ paintRootSeed;
  vec2 cell = floor(coord);
  vec2 f = fract(coord);
  vec2 b = f*f*(3.0-2.0*f);
  return mix(mix(pigmentRandom(cell,identity,0u),pigmentRandom(cell+vec2(1.0,0.0),identity,0u),b.x),
    mix(pigmentRandom(cell+vec2(0.0,1.0),identity,0u),pigmentRandom(cell+vec2(1.0),identity,0u),b.x),b.y);
}
vec4 pigmentCorner(vec2 p, vec2 cell, uint identity) {
  float angle = pigmentRandom(cell, identity, 0u) * 6.283185;
  vec2 q = p - cell;
  vec2 turned = vec2(q.x * cos(angle) - q.y * sin(angle), q.x * sin(angle) + q.y * cos(angle));
  vec2 offset = (vec2(pigmentRandom(cell,identity,19u), pigmentRandom(cell,identity,73u)) - 0.5) * 0.35;
  return texture2D(paintMap, turned * 0.14 + offset + 0.5);
}
vec4 pigmentField(vec2 coord, float seed) {
  uint identity = uint(seed) ^ paintRootSeed;
  vec2 p = coord + vec2(pigmentHash(identity + 17u), pigmentHash(identity + 71u)) * 11.0;
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 b = f * f * (3.0 - 2.0 * f);
  return mix(mix(pigmentCorner(p, cell, identity), pigmentCorner(p, cell + vec2(1.0, 0.0), identity), b.x),
    mix(pigmentCorner(p, cell + vec2(0.0, 1.0), identity), pigmentCorner(p, cell + vec2(1.0), identity), b.x), b.y);
}
`;
