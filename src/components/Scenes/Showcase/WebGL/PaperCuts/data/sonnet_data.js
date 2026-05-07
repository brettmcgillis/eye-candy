import { sq } from '../utils/squareData';

// Helpers ─────────────────────────────────────────────────────────────────────
// r180: 180° rotational pair — every square at [x,y] is mirrored at [-x,-y]
function r180(size, [x, y]) {
  return [sq(size, [x, y]), sq(size, [-x, -y])];
}
// r180x4: four positions placed with 180° symmetry on both axes
function r180x4(size, [x, y]) {
  return [
    sq(size, [x, y]),
    sq(size, [-x, -y]),
    sq(size, [x, -y]),
    sq(size, [-x, y]),
  ];
}
// card: cardinal cross at a given radius
function card(size, r) {
  return [...r180(size, [0, r]), ...r180(size, [r, 0])];
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── FRAME 1: QUINTET ────────────────────────────────────────────────────────
//
// Five concentric-square clusters arranged in a plus: one at the origin,
// four at N / S / E / W. Each cluster is a stack of nested squares all
// sharing the same XY centre — the outermost shell on the bottom layer,
// each successively smaller shell on the next layer up. The clusters
// interlock: their outer shells overlap the gaps between neighbours so the
// composition reads as one interlocked cross rather than five isolated piles.
// Between clusters, small accent squares bridge the diagonal gaps.
// The whole silhouette is a rotated diamond (suits the 45° rotate preset).
//
// Cluster centres (4-fold sym):
//   C0 = [0, 0]    (origin)
//   C1 = [3, 0]    C2 = [-3, 0]    C3 = [0, 3]    C4 = [0, -3]
//
export const quintet = {
  settings: { paperDepth: 1 / 18 },
  layers: [
    // 1 (front/top) — innermost pip of every cluster + outer perimeter fringe.
    //     The smallest elements sit on the surface, closest to the viewer.
    [
      sq(0.3, [0, 0]),
      ...card(0.3, 3),
      ...r180x4(0.4, [3.75, 1.0]),
      ...r180x4(0.4, [1.0, 3.75]),
      ...card(0.4, 4.5),
      ...r180x4(0.35, [3.25, 3.25]),
    ],

    // 2 — fifth shell: near-centre rings, one step outward from the pip.
    //     Step-notch accent squares give each cluster its inner tooth.
    [
      sq(0.6, [0, 0]),
      ...card(0.6, 3),
      ...r180x4(0.5, [3.0, 1.5]),
      ...r180x4(0.5, [1.5, 3.0]),
      ...card(0.5, 3.75),
    ],

    // 3 — fourth shell: the inner-ring squares of each cluster.
    //     Accent squares at the corner sub-gaps form the second tooth.
    [
      sq(1, [0, 0]),
      ...card(1, 3),
      ...r180x4(0.5, [2.5, 1.0]),
      ...r180x4(0.5, [1.0, 2.5]),
      ...card(0.75, 2.0),
    ],

    // 4 — third shell: tighter squares inside each cluster.
    //     Diagonal bridge squares + cardinal connectors begin to interlock.
    [
      sq(1.5, [0, 0]),
      ...card(1.5, 3),
      ...r180x4(0.75, [1.5, 1.5]),
      ...card(0.5, 1.5),
    ],

    // 5 — second shell: medium squares; inter-cluster interlocking begins.
    //     Diagonal bridge squares close the gap between adjacent clusters.
    [sq(2, [0, 0]), ...card(2, 3), ...r180x4(0.75, [2.1, 2.1])],

    // 6 (back/base) — outermost shell: the largest squares form the base.
    //     These are the foundation slabs each cluster stack rests upon.
    [sq(2.5, [0, 0]), ...card(2.5, 3)],
  ],
};

// ─── FRAME 2: STAGGER ────────────────────────────────────────────────────────
//
// A herringbone / staggered-brick composition with 180° rotational symmetry.
// Large rectangular slabs (wide squares) dominate the periphery; the centre
// contains medium squares; the outermost corners carry the largest slabs.
// Every pair [x,y] / [-x,-y] is matched so the composition has rotational
// balance without 4-fold mirror symmetry — it "leans" diagonally.
//
// The key: sizes are large (3–4) at the extremes and step down toward the
// centre. Positions are offset by half-widths so edges align — the same
// brick-offset logic that makes herringbone tile patterns lock together.
// Layers reveal depth by separating the "courses" of bricks:
//   odd layers  = NE–SW diagonal slab runs
//   even layers = NW–SE diagonal slab runs
// The alternation across layers creates the characteristic woven shadow.
//
export const stagger = {
  settings: { paperDepth: 1 / 10 },
  layers: [
    // 1 (front/top) — accent fills: the surface detail sits closest to camera.
    //     Small unit squares at the residual gaps — the hand-laid "spall".
    [
      ...r180x4(0.75, [2.0, 0.75]),
      ...r180x4(0.75, [0.75, 2.0]),
      ...r180(0.75, [0, 5.75]),
      ...r180(0.75, [5.75, 0]),
    ],

    // 2 — inner NW–SE course: medium bricks one step from the surface.
    [
      ...r180(1.75, [1.25, 1.25]),
      ...r180(1.75, [-1.25, 1.25]),
      ...r180(1.5, [4.0, 2.0]),
      ...r180(1.5, [2.0, 4.0]),
    ],

    // 3 — inner NE–SW course: perpendicular companion to layer 2.
    [
      ...r180(1.75, [0, 2.0]),
      ...r180(1.75, [2.0, 0]),
      ...r180(1.5, [0, 4.25]),
      ...r180(1.5, [4.25, 0]),
    ],

    // 4 — mid NW–SE course: 2.5-size slabs run perpendicular.
    [
      ...r180(2.5, [2.0, 2.0]),
      ...r180(2.5, [-2.0, 2.0]),
      ...r180(2, [4.5, 1.25]),
      ...r180(2, [1.25, 4.5]),
    ],

    // 5 — mid NE–SW course: medium-large slabs step outward.
    [
      sq(2.5, [0, 0]),
      ...r180(2.5, [0, 3.0]),
      ...r180(2.5, [3.0, 0]),
      ...r180(2, [3.75, 3.75]),
    ],

    // 6 — outermost NW–SE course: large slabs, perpendicular run.
    [
      ...r180(3.5, [1.75, 1.75]),
      ...r180(3.5, [-1.75, 1.75]),
      ...r180(3, [5.5, 2.0]),
      ...r180(3, [2.0, 5.5]),
    ],

    // 7 (back/base) — outermost NE–SW course: the largest slabs form the base.
    //     Cardinal size-3.5 slabs just-touch at [3.5,0]/[0,3.5]; diagonal
    //     size-2 accents at [±5.5, ±3.5] fill the outer corners cleanly.
    [...r180(3.5, [0, 3.5]), ...r180(3.5, [3.5, 0]), ...r180x4(2, [5.5, 3.5])],
  ],
};

const sonnetFrames = [
  { name: 'Sonnet — Quintet', frame: quintet },
  { name: 'Sonnet — Stagger', frame: stagger },
];

export default sonnetFrames;
