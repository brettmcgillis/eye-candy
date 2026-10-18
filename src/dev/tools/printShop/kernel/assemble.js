import {
  analyzeSolid,
  castRay,
  castRayHits,
  faceNormal,
  standingStability,
} from './checks';
import clipMesh from './clip';
import createCsg from './csg';
import { latticeMesh, latticeSolid } from './lattice';
import { markSolids, surfaceFrame, surfaceHeights } from './marks';
import { bounds, scaleMesh } from './mesh';
import { cylinder, flaredStem, torus } from './primitives';
import { PROFILES } from './profiles';
import solidify, { FACE_BACK, FACE_EDGE, FACE_FRONT } from './solidify';
import { levelHem, tiltPositions } from './stance';
import { findFolds, removeSmallIslands } from './surface';

const AXES = { depth: 2, height: 1, width: 0 };

function fitScale(positions, { size, sizeAxis }) {
  const box = bounds(positions);
  const extent =
    sizeAxis === 'longest' ? Math.max(...box.size) : box.size[AXES[sizeAxis]];
  return size / extent;
}

// Mounts hang off a vertical axis: the piece's own (`mountAxis`, its x/z),
// else through the highest point. The axis's last hit is the top of the piece.
function mountTop(surface, axis) {
  let x;
  let z;
  if (axis) {
    [x, z] = axis;
  } else {
    let best = 0;
    for (let i = 1; i < surface.positions.length / 3; i += 1) {
      if (surface.positions[i * 3 + 1] > surface.positions[best * 3 + 1]) {
        best = i;
      }
    }
    x = surface.positions[best * 3];
    z = surface.positions[best * 3 + 2];
  }
  const below = bounds(surface.positions).min[1] - 1;
  const hits = castRay(surface, [x, below, z], [0, 1, 0]);
  return { hits: hits.map((d) => below + d), x, z };
}

const PART = { back: 1, edge: 2, front: 0, mark: 4, mount: 3 };

// Where a stem meets the piece: the axis's last hit, lowered to the lowest
// of a ring of hits around it so a pad that wide sits in the wall all round.
function padHeight(surface, top, floor, padRadius, wall) {
  const attach = top.hits.at(-1);
  let padTop = attach;
  for (let k = 0; k < 12; k += 1) {
    const angle = (k / 12) * Math.PI * 2;
    const hits = castRay(
      surface,
      [
        top.x + Math.cos(angle) * padRadius,
        floor,
        top.z + Math.sin(angle) * padRadius,
      ],
      [0, 1, 0]
    );
    if (hits.length) {
      const nearest = hits.reduce((best, d) =>
        Math.abs(floor + d - attach) < Math.abs(floor + best - attach)
          ? d
          : best
      );
      padTop = Math.min(padTop, floor + nearest);
    }
  }
  return padTop + wall * 0.25;
}

const mount = (solid) => ({ ...solid, part: PART.mount });

const STEM_MOUNTS = ['base', 'socket', 'rest'];

// A flat-bottomed platform hung inside the top of the piece: the seat for a
// stand's flat top ("rest") and the place an inside signature lies flat.
function insidePad(surface, top, floor, radius, options) {
  const padTop = padHeight(surface, top, floor, radius, options.wall);
  const thickness = Math.max(2.5, options.signatureDepth * 4);
  return { radius, top: padTop, underside: padTop - thickness };
}

// What each body gains from the mount. "base" is one solid: disc, stem and a
// 45° flare into the wall. "socket" and "rest" make the stand its own body:
// the stem tip seats in a blind socket hung inside the piece, or the stem
// flares to a flat top that a matching flat platform inside the piece sits on.
// A figurine's base: a disc under its feet, which sink `plinthSink` into it
// so the two print as one. The feet are whatever reaches that low.
function planPlinth(box, options, plan, shell) {
  const sink = options.plinthSink ?? 1;
  const feet = [];
  for (let i = 0; i < shell.positions.length; i += 3) {
    if (shell.positions[i + 1] <= box.min[1] + sink) {
      feet.push([shell.positions[i], shell.positions[i + 2]]);
    }
  }
  const xs = feet.map(([x]) => x);
  const zs = feet.map(([, z]) => z);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const reach = Math.max(...feet.map(([x, z]) => Math.hypot(x - cx, z - cz)));
  const radius =
    options.baseRadius ||
    Math.max(reach + 10, Math.max(box.size[0], box.size[2]) * 0.55);
  const bottom = box.min[1] + sink - options.baseHeight;
  Object.assign(plan, {
    base: { centre: [cx, bottom, cz], radius },
    stemRadiusAtBase: reach,
  });
  plan.pieceAdd.push(
    mount(cylinder(radius, options.baseHeight, { at: [cx, bottom, cz] }))
  );
  return plan;
}

function planMounts(surface, axis, box, options, warnings, shell = null) {
  const plan = {
    base: null,
    pad: null,
    pieceAdd: [],
    pieceCut: [],
    standAdd: [],
    stemRadiusAtBase: options.stemRadius,
  };
  if (options.mount === 'plinth') return planPlinth(box, options, plan, shell);
  if (!surface) return plan;
  const top = mountTop(surface, axis);
  const floor = box.min[1] - options.baseGap;
  const padRadius =
    options.restRadius ||
    Math.min(12, Math.max(options.stemRadius * 2.5, box.size[1] * 0.11));
  const hangPad = () => {
    const pad = insidePad(surface, top, floor, padRadius, options);
    plan.pad = { centre: [top.x, pad.underside, top.z], radius: padRadius };
    plan.pieceAdd.push(
      mount(
        cylinder(padRadius, pad.top - pad.underside, {
          at: [top.x, pad.underside, top.z],
        })
      )
    );
    return pad;
  };

  if (!STEM_MOUNTS.includes(options.mount)) {
    if (options.mount === 'loop') {
      const peak = top.hits.at(-1) ?? box.max[1];
      const minor = options.loopWire / 2;
      const major = options.loopRadius + minor;
      plan.pieceAdd.push(
        mount(
          torus(major, minor, {
            at: [top.x, peak + major - minor * 0.5, top.z],
          })
        )
      );
    }
    if (options.signatureInside && top.hits.length) hangPad();
    return plan;
  }

  const footprint = Math.max(box.size[0], box.size[2]);
  const radius = options.baseRadius || Math.max(15, footprint * 0.45);
  const below = floor - options.baseHeight;
  const twoPieces = options.mount !== 'base';
  plan.base = { centre: [top.x, below, top.z], radius };
  (twoPieces ? plan.standAdd : plan.pieceAdd).push(
    mount(cylinder(radius, options.baseHeight, { at: [top.x, below, top.z] }))
  );

  if (top.hits.length === 0) {
    warnings.push(
      'The stem axis misses the piece, so nothing holds it up. Fix: Mount → try Hanging loop or Stands on its hem, or Pose → Extra lean back toward 0°.'
    );
    return plan;
  }
  if (top.hits.length > 1) {
    warnings.push(
      `The stem passes through the piece ${top.hits.length - 1} time(s) below where it attaches. Fix: Pose → Extra lean or Wind (moves the skirt off the axis), or Mount → Stands on its hem.`
    );
  }
  const stemFoot = floor - options.baseHeight * 0.5;

  if (options.mount === 'base') {
    const flare = options.stemRadius * 2.5;
    const padTop = padHeight(surface, top, floor, flare, options.wall);
    plan.pieceAdd.push(
      mount(
        flaredStem(options.stemRadius, padTop - stemFoot, flare, flare, {
          at: [top.x, stemFoot, top.z],
        })
      )
    );
    if (options.signatureInside) {
      warnings.push(
        'A one-piece stand fills the inside of the head, so there is no flat spot for the inside signature. Fix: Mount → "Base + stem, two pieces (flat rest)", or Signature → untick Inside the piece.'
      );
    }
    return plan;
  }

  if (options.mount === 'rest') {
    const pad = hangPad();
    if (pad.underside - options.restGap <= floor + 2) {
      warnings.push(
        'The platform inside the piece sits almost on the base. Fix: Mount → Gap under piece (mm) up.'
      );
    }
    const standTop = pad.underside - options.restGap;
    plan.standAdd.push(
      mount(
        flaredStem(
          options.stemRadius,
          standTop - stemFoot,
          padRadius,
          padRadius - options.stemRadius,
          { at: [top.x, stemFoot, top.z] }
        )
      )
    );
    return plan;
  }

  const bore = options.stemRadius + options.socketFit;
  const sleeve = bore + Math.max(1.2, options.wall);
  const sleevePad = Math.max(sleeve * 1.8, options.stemRadius * 2.5);
  const flare = sleevePad - sleeve;
  const padTop = padHeight(surface, top, floor, sleevePad, options.wall);
  const sleeveFoot = padTop - options.socketDepth - flare;
  if (sleeveFoot <= floor) {
    warnings.push(
      'The socket is deeper than the space under the piece. Fix: Mount → Socket depth (mm) down, or Gap under piece (mm) up.'
    );
  }
  plan.pieceAdd.push(
    mount(
      flaredStem(sleeve, padTop - sleeveFoot, sleevePad, flare, {
        at: [top.x, sleeveFoot, top.z],
      })
    )
  );
  plan.pieceCut.push(
    mount(
      cylinder(bore, options.socketDepth + 1, {
        at: [top.x, sleeveFoot - 1, top.z],
      })
    )
  );
  plan.standAdd.push(
    mount(
      cylinder(
        options.stemRadius,
        sleeveFoot + options.socketDepth - options.socketFit - stemFoot,
        { at: [top.x, stemFoot, top.z] }
      )
    )
  );
  if (options.signatureInside) {
    warnings.push(
      'The socket fills the inside of the head, so there is no flat spot for the inside signature. Fix: Mount → "Base + stem, two pieces (flat rest)", or Signature → untick Inside the piece.'
    );
  }
  return plan;
}

// Every signature placement and the body it lands on. Flat faces only take
// the mark where a viewer can read it: the base's top (in front of the stem,
// reading from the front), its underside, the flat platform inside the
// piece, and — curved — the piece's back, where the cutter bends to follow.
function planSignature(wasm, shell, plan, options, warnings, { lattice }) {
  const out = { piece: [], stand: [] };
  if (options.signature === 'none') return out;
  const standBody = ['socket', 'rest'].includes(options.mount)
    ? 'stand'
    : 'piece';
  const style = options.signatureStyle;
  const opFor = (cutOnly) => (cutOnly || style !== 'emboss' ? 'cut' : 'add');
  const place = (target, solids, cutOnly) =>
    out[target].push(...solids.map((solid) => ({ op: opFor(cutOnly), solid })));
  const clampDepth = (limit, where, fix) => {
    const depth = Math.min(options.signatureDepth, limit);
    if (depth < options.signatureDepth) {
      warnings.push(
        `${where} is too thin for a ${options.signatureDepth} mm signature; used ${depth.toFixed(2)} mm. Fix: ${fix}, or Signature → Depth per layer (mm) down.`
      );
    }
    return depth;
  };
  const noBase = (where) =>
    warnings.push(
      `The signature is set to go on the ${where}, but there is no base. Fix: Mount → a Base + stem option, or Signature → untick it.`
    );

  if (options.signatureBaseTop) {
    if (!plan.base) {
      noBase('base top');
    } else {
      const { centre, radius } = plan.base;
      const margin = 1.5;
      const room = radius - plan.stemRadiusAtBase - margin * 2;
      const size = Math.min(options.signatureSize || room * 0.9, room);
      const depth = clampDepth(
        (options.baseHeight - 1) / 2,
        'The base',
        'Mount → Base height (mm) up'
      );
      place(
        standBody,
        markSolids(wasm, options.signature, {
          depth,
          embed: 0.5,
          frame: surfaceFrame(
            [0, 1, 0],
            [
              centre[0],
              centre[1] + options.baseHeight,
              centre[2] + plan.stemRadiusAtBase + margin + size / 2,
            ],
            [0, 0, -1]
          ),
          lift: 1,
          size,
          style,
        }),
        false
      );
    }
  }

  if (options.signatureBaseUnder) {
    if (!plan.base) {
      noBase('base underside');
    } else {
      const depth = clampDepth(
        (options.baseHeight - 1) / 2,
        'The base',
        'Mount → Base height (mm) up'
      );
      place(
        standBody,
        markSolids(wasm, options.signature, {
          depth,
          frame: surfaceFrame([0, -1, 0], plan.base.centre),
          lift: 1,
          size: Math.min(
            options.signatureSize || plan.base.radius * 0.6,
            plan.base.radius * 1.3
          ),
          style: 'deboss',
        }),
        true
      );
    }
  }

  if (options.signatureInside && plan.pad) {
    const depth = clampDepth(
      1,
      'The inside platform',
      'Mount → Platform radius (mm) up'
    );
    place(
      'piece',
      markSolids(wasm, options.signature, {
        depth,
        frame: surfaceFrame([0, -1, 0], plan.pad.centre),
        lift: 1,
        size: Math.min(
          options.signatureSize || plan.pad.radius * 1.3,
          plan.pad.radius * 1.4
        ),
        style: 'deboss',
      }),
      true
    );
  }

  if (options.signatureBack) {
    if (lattice) {
      warnings.push(
        'A wireframe has no back surface to sign. Fix: Signature → untick On the back, and use the base or inside instead.'
      );
      return out;
    }
    const box = bounds(shell.positions);
    const origin = [
      plan.base?.centre[0] ?? (box.min[0] + box.max[0]) / 2,
      box.min[1] + box.size[1] * options.signatureHeight,
      box.min[2] - 10,
    ];
    const hit = castRayHits(shell, origin, [0, 0, 1])[0];
    if (!hit) {
      warnings.push(
        'The signature ray missed the back of the piece. Fix: Signature → Height on the back (0–1).'
      );
      return out;
    }
    const t = hit.triangle * 3;
    let normal = faceNormal(
      shell.positions,
      shell.indices[t],
      shell.indices[t + 1],
      shell.indices[t + 2]
    );
    if (normal[2] > 0) normal = normal.map((v) => -v);
    const point = [origin[0], origin[1], origin[2] + hit.distance];
    const depth = clampDepth(
      options.wall * 0.375,
      `A ${options.wall} mm wall`,
      'Print → Wall (mm) up, or Signature → Style "Raised"'
    );
    const frame = surfaceFrame(normal, point);
    const size = options.signatureSize || Math.max(6, box.size[1] * 0.14);
    place(
      'piece',
      markSolids(wasm, options.signature, {
        depth,
        embed: options.wall * 0.5,
        frame,
        lift: 1,
        size,
        style,
        surface: surfaceHeights(shell, frame, size * 0.6, castRayHits),
      }),
      false
    );
  }
  return out;
}

// Colour per triangle corner: textured parts keep their baked colours, flat
// ones (the base, the signature) their part colour, so a base never picks up
// streaks from the foot whose vertices it shares.
const FLAT_PARTS = new Set(['mark', 'mount']);
const hexRgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

function cornerColorsOf(model, parts) {
  if (!model.vertexColors) return null;
  const { indices, triPart, vertexColors } = model;
  const out = new Float32Array(indices.length * 3);
  for (let t = 0; t < indices.length / 3; t += 1) {
    const part = parts[triPart[t]];
    const flat = FLAT_PARTS.has(part?.id) ? hexRgb(part.color) : null;
    for (let k = 0; k < 3; k += 1) {
      const v = indices[t * 3 + k];
      for (let c = 0; c < 3; c += 1) {
        out[(t * 3 + k) * 3 + c] = flat ? flat[c] : vertexColors[v * 3 + c];
      }
    }
  }
  return out;
}

function shiftModel(model, shift) {
  return {
    ...model,
    positions: Float64Array.from(
      model.positions,
      (value, i) => value + shift[i % 3]
    ),
  };
}

// Each body on its own bed: centred over the origin, lowest point at zero.
export function seatModel(model) {
  const box = bounds(model.positions);
  return shiftModel(model, [
    -(box.min[0] + box.max[0]) / 2,
    -box.min[1],
    -(box.min[2] + box.max[2]) / 2,
  ]);
}

// Seats the bodies on the bed, checks each one and writes the report; shared
// by sheets and solids.
function finishPrint({
  bodies,
  floorY: floor,
  folds,
  islands,
  lattice,
  options,
  parts,
  piece,
  scale,
  sheet = true,
  stance,
  started,
  tipFix,
  unmerged = false,
  warnings,
}) {
  let floorY = floor;
  // The assembly sits on the bed as a whole; exports re-seat each body.
  const all = bounds(
    Float64Array.from(
      bodies.flatMap((body) => Array.from(body.model.positions))
    )
  );
  const shift = [
    -(all.min[0] + all.max[0]) / 2,
    -all.min[1],
    -(all.min[2] + all.max[2]) / 2,
  ];
  if (floorY != null) floorY += shift[1];
  bodies.forEach((body) => {
    Object.assign(body, {
      model: {
        ...shiftModel(body.model, shift),
        parts,
        cornerColors: piece.vertexColors
          ? cornerColorsOf(body.model, parts)
          : null,
        vertexColors: null,
      },
    });
    Object.assign(body, { analysis: analyzeSolid(body.model) });
  });
  const foldSpots = folds.spots.map((spot) => spot.map((v, k) => v + shift[k]));
  const { analysis } = bodies[0];
  const profile = PROFILES[options.profile];

  bodies.forEach((body) => {
    const a = body.analysis;
    if (unmerged && body.id === 'piece') {
      // Overlaid struts are many shells by design until a print merges them.
    } else if (!a.watertight) {
      warnings.push(
        `${body.label}: not watertight (${a.openEdges} open, ${a.nonManifoldEdges} non-manifold, ${a.flippedEdges} flipped edges). Fix: Surface → Detail per cloth cell up or down one step, or Print → Drop specks under higher; if it persists it is a bug, report it.`
      );
    }
    if (a.shells > 1 && !(unmerged && body.id === 'piece')) {
      warnings.push(
        `${body.label}: ${a.shells} separate shells, so it will print as loose pieces. Fix: Print → Loose pieces "Drop", Print → Drop specks under higher, or check the mount reaches the piece.`
      );
    }
    if (Math.max(...a.bounds.size) > profile.maxSide) {
      warnings.push(
        `${body.label}: longest side ${Math.max(...a.bounds.size).toFixed(0)} mm exceeds ${profile.label}'s ~${profile.maxSide} mm build volume. Fix: Print → Size (mm) down, or a Material with a bigger build (Nylon / Full colour).`
      );
    }
  });
  const strutWidth = lattice ? lattice.radius * 2 : null;
  if (lattice && strutWidth < profile.minWall) {
    warnings.push(
      `Wires ${strutWidth.toFixed(2)} mm thick are under ${profile.label}'s ${profile.minWall} mm minimum. Fix: Surface → Wire radius (mm) to at least ${(profile.minWall / 2).toFixed(2)}, or Print → Size (mm) up.`
    );
  } else if (lattice || !sheet) {
    // The wall setting only applies to a thickened sheet.
  } else if (options.wall < profile.minWall) {
    warnings.push(
      `Wall ${options.wall} mm is under ${profile.label}'s ${profile.minWall} mm minimum. Fix: Print → Wall (mm) to at least ${profile.minWall}, or pick another Material.`
    );
  } else if (options.wall < profile.recommendedWall) {
    warnings.push(
      `Wall ${options.wall} mm is printable in ${profile.label} but under the ${profile.recommendedWall} mm it is happiest at. Fix: Print → Wall (mm) to ${profile.recommendedWall}.`
    );
  }
  if (folds.spots.length) {
    warnings.push(
      `${folds.spots.length} spot(s) (red dots) where folds of the sheet come within ${folds.closest.toFixed(2)} mm, closer than the ${options.wall} mm wall, so the skins fuse there. Fix: ${options.wall > profile.minWall ? `Print → Wall (mm) down toward ${profile.minWall}, ` : ''}Print → Size (mm) up, or Pose → Settle time / Wind / Hands for a different drape. Fine to leave if the fused spots are acceptable.`
    );
  }

  let stability = null;
  if (floorY != null) {
    stability = standingStability(
      bodies[0].model.positions,
      analysis.centroid,
      floorY
    );
    if (!stability.stable)
      warnings.push(
        `Its centre of mass is outside its footprint, so it will tip over. Fix: ${tipFix}`
      );
  }

  const summarize = (a) => ({
    ...a,
    areaCm2: a.area / 100,
    volumeCm3: a.volume / 1000,
  });
  return {
    bodies: bodies.map(({ id, label, model }) => ({ id, label, model })),
    report: {
      analysis: summarize(analysis),
      bodies: bodies.map((body) => ({
        analysis: summarize(body.analysis),
        id: body.id,
        label: body.label,
      })),
      buildMs: Date.now() - started,
      folds: { ...folds, spots: foldSpots },
      islandsRemoved: islands.removed,
      piece: piece.stats ?? {},
      pieces: islands.pieces,
      profile: { id: options.profile, ...profile },
      scale,
      stability,
      stance,
      unmerged,
      warnings,
    },
  };
}

// The whole pipeline from a printable's piece to a print model and report:
// scale to size, trim and clean the sheet, thicken it, add the mount, check.
// A piece that is already closed solids (a posed figurine): scaled, unioned
// with its mount and signature, and — standing on its own — its feet cut
// flat so it has something to stand on.
function assembleSolids(printable, piece, options, env, started) {
  const warnings = [...(piece.warnings ?? [])];
  if (!env.manifold) {
    throw new Error('Solid pieces need env.manifold (manifold-3d).');
  }
  const slots = [PART.front, PART.back, PART.edge];
  const solidParts = piece.solidParts ?? [];
  const slotOf = new Map(
    solidParts.map((part, i) => [part.id, slots[i] ?? i + 2])
  );
  const parts = [];
  solidParts.forEach((part) => {
    parts[slotOf.get(part.id)] = part;
  });
  parts[PART.mount] = {
    color: piece.mountColor ?? '#d0d0d0',
    id: 'mount',
    label: 'Base',
  };
  parts[PART.mark] = {
    color: piece.markColor ?? '#202020',
    id: 'mark',
    label: 'Signature',
  };

  const scale = fitScale(
    Float64Array.from(piece.solids.flatMap((c) => Array.from(c.positions))),
    options
  );
  const components = piece.solids.map((c) => ({
    colors: c.colors,
    indices: c.indices,
    part: slotOf.get(c.part),
    positions: c.positions.map((v) => v * scale),
  }));
  const shell = { colors: [], indices: [], positions: [], triPart: [] };
  components.forEach((c) => {
    const offset = shell.positions.length / 3;
    shell.positions.push(...c.positions);
    shell.colors.push(...(c.colors ?? []));
    c.indices.forEach((v) => shell.indices.push(v + offset));
    for (let t = 0; t < c.indices.length / 3; t += 1)
      shell.triPart.push(c.part);
  });
  const box = bounds(shell.positions);
  const plan = planMounts(null, null, box, options, warnings, shell);

  const csg = createCsg(env.manifold, parts);
  const signature = planSignature(
    env.manifold,
    shell,
    plan,
    options,
    warnings,
    {
      lattice: null,
    }
  );
  const marks = (op) =>
    signature.piece
      .filter((entry) => entry.op === op)
      .map((entry) => csg.solidOfManifold(entry.solid, PART.mark));
  // A model part can be a hollow shell (the camera head, which the pigeon's
  // head sits inside without touching): drop its cavities so it prints
  // solid and fuses with whatever is inside it.
  const filled = (solid) => {
    const shells = solid.decompose();
    const outer = shells.filter((part) => part.volume() > 0);
    return outer.length === shells.length
      ? solid
      : env.manifold.Manifold.compose(outer);
  };
  let body = env.manifold.Manifold.union([
    ...components.map((c) => filled(csg.solidOf(c))),
    ...plan.pieceAdd.map(csg.solidOf),
    ...marks('add'),
  ]);
  const cuts = marks('cut');
  if (cuts.length) body = body.subtract(env.manifold.Manifold.union(cuts));

  let floorY = null;
  if (options.mount === 'none') {
    floorY = box.min[1] + (options.footTrim ?? 0);
    body = body.trimByPlane([0, 1, 0], floorY);
  }
  // Model bits that only nearly touch (a camera's screw heads) come out as
  // specks; with Loose pieces "Drop" only the main body is kept.
  const pieces = body
    .decompose()
    .filter((part) => Math.abs(part.volume()) > 1e-3);
  const largest = Math.max(...pieces.map((part) => part.volume()));
  const kept =
    options.loose === 'drop'
      ? pieces.filter((part) => part.volume() === largest)
      : pieces;
  if (pieces.length > 1) body = env.manifold.Manifold.compose(kept);

  return finishPrint({
    bodies: [{ id: 'piece', label: printable.label, model: csg.toModel(body) }],
    floorY,
    folds: { closest: null, spots: [] },
    islands: { pieces: kept.length, removed: pieces.length - kept.length },
    lattice: null,
    options,
    parts,
    piece,
    scale,
    sheet: false,
    stance: null,
    started,
    tipFix: 'Mount → Base under it, or Mount → Flatten the feet (mm) up.',
    warnings,
  });
}

export default async function assemblePrint(printable, options, env = {}) {
  const started = Date.now();
  const piece = await printable.build(options, env);
  if (piece.solids) {
    return assembleSolids(printable, piece, options, env, started);
  }
  const warnings = [...(piece.warnings ?? [])];
  let scale = fitScale(piece.surface.positions, options);
  let surface = scaleMesh(piece.surface, scale, ['rest']);

  const { lattice } = piece;
  if (lattice && options.mount === 'hem') {
    warnings.push(
      'A wireframe has no hem to stand on, so it is printed without a mount. Fix: Mount → a Base + stem option or Hanging loop, or Surface → Wireframe "Off".'
    );
  }

  let floorY = null;
  let stance = null;
  if (options.mount === 'hem' && !lattice) {
    let trim = options.hemTrim;
    if (options.hemLevel) {
      stance = levelHem(surface, { minTrim: options.hemTrim });
      if (stance) {
        surface = {
          ...surface,
          positions: tiltPositions(
            surface.positions,
            stance.tiltX,
            stance.tiltZ
          ),
        };
        trim = stance.trim;
      } else {
        warnings.push(
          'No stance within 30° of tilt and 40 mm of trim keeps it upright; trimmed flat as set. Fix: Pose → Hands "At rest" and Wind 0, or Mount → a Base + stem option.'
        );
      }
    }
    floorY = bounds(surface.positions).min[1] + trim;
    const field = new Float64Array(surface.positions.length / 3);
    for (let v = 0; v < field.length; v += 1) {
      field[v] = surface.positions[v * 3 + 1] - floorY;
    }
    surface = clipMesh(surface, field);
    // The size asked for is the size of what stands, not of what was cut.
    const refit = fitScale(surface.positions, options);
    surface = scaleMesh(surface, refit, ['rest']);
    floorY *= refit;
    scale *= refit;
    if (stance) stance.trim *= refit;
  }

  const islands = removeSmallIslands(surface, options.minIsland, {
    largestOnly: options.loose === 'drop',
  });
  surface = islands.mesh;
  const folds =
    surface.attributes.rest && !lattice
      ? findFolds(surface, surface.attributes.rest.array, options.wall)
      : { closest: null, spots: [] };

  // A wireframe's struts stand in for the thickened sheet. The preview lays
  // them over each other (instant); a print unions them into one solid.
  const strut = lattice ? latticeMesh(lattice, scale, lattice.radius) : null;
  const solid = lattice
    ? {
        faces: new Uint8Array(strut.indices.length / 3).fill(FACE_BACK),
        indices: strut.indices,
        positions: strut.positions,
        vertexColors: piece.vertexColors ? strut.colors : null,
      }
    : solidify(surface, options.wall, {
        colors: piece.vertexColors ? { back: 'back', front: 'front' } : null,
      });
  if (floorY != null) {
    for (let i = 1; i < solid.positions.length; i += 3) {
      solid.positions[i] = Math.max(solid.positions[i], floorY);
    }
  }

  const mountColor = piece.parts.mount?.color ?? piece.parts.back.color;
  const parts = [
    { ...piece.parts.front, id: 'front' },
    { ...piece.parts.back, id: 'back' },
    { ...piece.parts.edge, id: 'edge' },
    { color: mountColor, id: 'mount', label: 'Mount' },
    {
      color: piece.parts.mark?.color ?? piece.parts.front.color,
      id: 'mark',
      label: 'Signature',
    },
  ];
  const partOf = {
    [FACE_BACK]: PART.back,
    [FACE_EDGE]: PART.edge,
    [FACE_FRONT]: PART.front,
  };
  const shell = {
    colors: solid.vertexColors,
    indices: solid.indices,
    positions: solid.positions,
    triPart: Uint8Array.from(solid.faces, (face) => partOf[face]),
  };

  const axis = piece.mountAxis?.map((value) => value * scale);
  const plan = planMounts(
    surface,
    axis,
    bounds(solid.positions),
    options,
    warnings
  );
  const mergeStruts = Boolean(lattice) && !env.previewLattice;
  const csgNeeded =
    mergeStruts ||
    plan.pieceAdd.length > 0 ||
    plan.standAdd.length > 0 ||
    options.signature !== 'none';
  if (csgNeeded && !env.manifold) {
    throw new Error('Mounts and signatures need env.manifold (manifold-3d).');
  }

  const bodies = [];
  if (!csgNeeded) {
    bodies.push({
      id: 'piece',
      label: printable.label,
      model: { ...shell, vertexColors: shell.colors },
    });
  } else {
    const csg = createCsg(env.manifold, parts);
    const signature = planSignature(
      env.manifold,
      shell,
      plan,
      options,
      warnings,
      { lattice }
    );
    const markOf = (entries, op) =>
      entries
        .filter((entry) => entry.op === op)
        .map((entry) => csg.solidOfManifold(entry.solid, PART.mark));
    const build = (adds, cuts) => {
      let body = env.manifold.Manifold.union(adds);
      if (cuts.length) body = body.subtract(env.manifold.Manifold.union(cuts));
      // Faces that only graze each other leave zero-volume slivers behind.
      const pieces = body.decompose();
      if (pieces.length > 1) {
        body = env.manifold.Manifold.compose(
          pieces.filter((part) => Math.abs(part.volume()) > 1e-3)
        );
      }
      return csg.toModel(body);
    };
    bodies.push({
      id: 'piece',
      label: printable.label,
      model: build(
        [
          mergeStruts
            ? csg.solidOfManifold(
                latticeSolid(env.manifold, lattice, scale, lattice.radius),
                PART.back
              )
            : csg.solidOf(shell),
          ...plan.pieceAdd.map(csg.solidOf),
          ...markOf(signature.piece, 'add'),
        ],
        [...plan.pieceCut.map(csg.solidOf), ...markOf(signature.piece, 'cut')]
      ),
    });
    if (plan.standAdd.length) {
      bodies.push({
        id: 'stand',
        label: 'Stand',
        model: build(
          [
            ...plan.standAdd.map(csg.solidOf),
            ...markOf(signature.stand, 'add'),
          ],
          markOf(signature.stand, 'cut')
        ),
      });
    }
  }

  return finishPrint({
    bodies,
    floorY,
    folds,
    islands,
    lattice,
    options,
    parts,
    piece,
    scale,
    stance,
    started,
    tipFix:
      'Mount → turn on Level it to stand, raise Trim at least (mm), or switch Mount to a Base + stem option.',
    unmerged: Boolean(lattice) && !mergeStruts,
    warnings,
  });
}
