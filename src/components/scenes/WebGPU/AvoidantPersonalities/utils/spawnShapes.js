import { If, cos, ivec2, sin, vec2 } from 'three/tsl';

// The four emitters. A shape returns both a point on its outline and the
// outward normal there, because the normal is what gives a freshly spawned
// agent a heading that reads as leaving the shape rather than crossing it.
export const SHAPE_OPTIONS = ['Circle', 'Square', 'Triangle', 'X'];

const TAU = Math.PI * 2;

// Vertices at 90/210/330 degrees, wound counter-clockwise, so the outward
// normal of an edge running (dx, dy) is (dy, -dx).
const TRIANGLE = [
  [0, 1],
  [-0.8660254, -0.5],
  [0.8660254, -0.5],
];

function circle(t, point, normal) {
  const angle = t.mul(TAU);
  const p = vec2(cos(angle), sin(angle));
  point.assign(p);
  normal.assign(p);
}

function square(t, point, normal) {
  const u = t.mul(4).toVar();
  const edge = u.floor().toVar();
  const s = u.fract().mul(2).sub(1).toVar();

  If(edge.lessThan(1), () => {
    point.assign(vec2(s, -1));
    normal.assign(vec2(0, -1));
  })
    .ElseIf(edge.lessThan(2), () => {
      point.assign(vec2(1, s));
      normal.assign(vec2(1, 0));
    })
    .ElseIf(edge.lessThan(3), () => {
      point.assign(vec2(s.negate(), 1));
      normal.assign(vec2(0, 1));
    })
    .Else(() => {
      point.assign(vec2(-1, s.negate()));
      normal.assign(vec2(-1, 0));
    });
}

function triangle(t, point, normal) {
  const u = t.mul(3).toVar();
  const edge = u.floor().toVar();
  const f = u.fract().toVar();

  const emit = (from, to) => {
    const a = vec2(from[0], from[1]);
    const b = vec2(to[0], to[1]);
    const dir = b.sub(a);
    point.assign(a.add(dir.mul(f)));
    normal.assign(vec2(dir.y, dir.x.negate()).normalize());
  };

  If(edge.lessThan(1), () => emit(TRIANGLE[0], TRIANGLE[1]))
    .ElseIf(edge.lessThan(2), () => emit(TRIANGLE[1], TRIANGLE[2]))
    .Else(() => emit(TRIANGLE[2], TRIANGLE[0]));
}

// An X has no interesting outline — its two strokes are the shape. Points run
// from the centre out along each of the four arms, and the arm direction is
// the normal, so the strokes shed lines sideways as well as off the tips.
function cross(t, point, normal) {
  const u = t.mul(4).toVar();
  const angle = u
    .floor()
    .mul(Math.PI / 2)
    .add(Math.PI / 4);
  const dir = vec2(cos(angle), sin(angle));
  point.assign(dir.mul(u.fract()));
  normal.assign(dir);
}

// Written as plain functions rather than Fn(...) so the branches build straight
// into the caller's stack — the agent kernel is the only consumer, and keeping
// the nodes in one scope is what keeps codegen honest.
export function outlineSample(t, shape, point, normal) {
  If(shape.lessThan(0.5), () => circle(t, point, normal))
    .ElseIf(shape.lessThan(1.5), () => square(t, point, normal))
    .ElseIf(shape.lessThan(2.5), () => triangle(t, point, normal))
    .Else(() => cross(t, point, normal));
}

// Unit-shape space to sim texels: the shape is sized against the short axis so
// it keeps its proportions whatever the window is doing, then rotated and
// centred.
export function toGrid(point, gridSize, uniforms) {
  const angle = uniforms.shapeRotation;
  const c = cos(angle);
  const s = sin(angle);
  const rotated = vec2(
    point.x.mul(c).sub(point.y.mul(s)),
    point.x.mul(s).add(point.y.mul(c))
  );

  return rotated
    .mul(gridSize.y.mul(uniforms.shapeSize).mul(0.5))
    .add(gridSize.mul(0.5))
    .add(vec2(uniforms.shapeOffsetX, uniforms.shapeOffsetY).mul(gridSize.y));
}

export const clampCoord = (coord, width, height) =>
  ivec2(coord.x.clamp(0, width - 1), coord.y.clamp(0, height - 1));

export const angleOf = (v) => v.y.atan(v.x);

// Shortest signed turn between two headings. WGSL's fract is x - floor(x), so
// this folds negative differences correctly without a branch.
export const wrapAngle = (a) =>
  a.add(Math.PI).div(TAU).fract().mul(TAU).sub(Math.PI);

export const unitVector = (angle) => vec2(cos(angle), sin(angle));

export const safeNormalize = (v, fallback) => {
  const length = v.length().toVar();
  return length.greaterThan(1e-5).select(v.div(length), fallback);
};
