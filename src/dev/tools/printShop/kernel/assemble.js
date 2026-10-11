import {
  analyzeSolid,
  castRay,
  castRayHits,
  faceNormal,
  standingStability,
} from './checks';
import clipMesh from './clip';
import createCsg from './csg';
import { markSolids, surfaceFrame } from './marks';
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

// What each body gains from the mount. A fused stand is one solid with the
// piece: disc, stem, and a 45° flare into the wall. A removable one is its
// own body whose stem tip seats in a blind socket hung inside the piece.
function planMounts(surface, axis, box, options, warnings) {
  const plan = { base: null, pieceAdd: [], pieceCut: [], standAdd: [] };
  if (options.mount === 'loop') {
    const top = mountTop(surface, axis);
    const peak = top.hits.at(-1) ?? box.max[1];
    const minor = options.loopWire / 2;
    const major = options.loopRadius + minor;
    plan.pieceAdd.push(
      mount(
        torus(major, minor, { at: [top.x, peak + major - minor * 0.5, top.z] })
      )
    );
    return plan;
  }
  if (options.mount !== 'base') return plan;

  const top = mountTop(surface, axis);
  const floor = box.min[1] - options.baseGap;
  const footprint = Math.max(box.size[0], box.size[2]);
  const radius = options.baseRadius || Math.max(15, footprint * 0.45);
  const below = floor - options.baseHeight;
  const disc = mount(
    cylinder(radius, options.baseHeight, { at: [top.x, below, top.z] })
  );
  plan.base = { centre: [top.x, below, top.z], radius };
  const removable = options.standJoin === 'removable';
  (removable ? plan.standAdd : plan.pieceAdd).push(disc);

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

  if (!removable) {
    const padRadius = options.stemRadius * 2.5;
    const padTop = padHeight(surface, top, floor, padRadius, options.wall);
    plan.pieceAdd.push(
      mount(
        flaredStem(
          options.stemRadius,
          padTop - stemFoot,
          padRadius,
          padRadius,
          {
            at: [top.x, stemFoot, top.z],
          }
        )
      )
    );
    return plan;
  }

  const bore = options.stemRadius + options.socketFit;
  const sleeve = bore + Math.max(1.2, options.wall);
  const padRadius = Math.max(sleeve * 1.8, options.stemRadius * 2.5);
  const flare = padRadius - sleeve;
  const padTop = padHeight(surface, top, floor, padRadius, options.wall);
  const sleeveFoot = padTop - options.socketDepth - flare;
  if (sleeveFoot <= floor) {
    warnings.push(
      'The socket is deeper than the space under the piece. Fix: Mount → Socket depth (mm) down, or Gap under piece (mm) up.'
    );
  }
  plan.pieceAdd.push(
    mount(
      flaredStem(sleeve, padTop - sleeveFoot, padRadius, flare, {
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
  return plan;
}

// The signature's prisms and which body they go on: the base's underside
// (always cut, so the stand still sits flat) and/or the piece's back.
function planSignature(wasm, shell, plan, options, warnings) {
  const out = { piece: [], stand: [] };
  if (options.signature === 'none') return out;
  const onBase = options.signaturePlace !== 'piece';
  const onPiece = options.signaturePlace !== 'base';

  if (onBase && !plan.base) {
    warnings.push(
      'The signature is set to go on the stand base, but there is no base. Fix: Signature → On "The piece", or Mount → Printed base + stem.'
    );
  } else if (onBase) {
    const depth = Math.min(
      options.signatureDepth,
      (options.baseHeight - 1) / 2
    );
    if (depth < options.signatureDepth) {
      warnings.push(
        `The base is too thin for a ${options.signatureDepth} mm signature; cut ${depth.toFixed(2)} mm. Fix: Mount → Base height (mm) up, or Signature → Depth (mm) down.`
      );
    }
    const solids = markSolids(wasm, options.signature, {
      depth,
      frame: surfaceFrame([0, -1, 0], plan.base.centre),
      lift: 1,
      size: Math.min(
        options.signatureSize || plan.base.radius * 0.6,
        plan.base.radius * 1.3
      ),
      style: 'deboss',
    });
    const target = options.standJoin === 'removable' ? 'stand' : 'piece';
    out[target].push(...solids.map((solid) => ({ op: 'cut', solid })));
  }

  if (onPiece) {
    const box = bounds(shell.positions);
    const origin = [
      plan.base?.centre[0] ?? (box.min[0] + box.max[0]) / 2,
      box.min[1] + box.size[1] * options.signatureHeight,
      box.min[2] - 10,
    ];
    const hit = castRayHits(shell, origin, [0, 0, 1])[0];
    if (!hit) {
      warnings.push(
        'The signature ray missed the back of the piece. Fix: Signature → Height on the piece, or On "Stand base".'
      );
    } else {
      const t = hit.triangle * 3;
      let normal = faceNormal(
        shell.positions,
        shell.indices[t],
        shell.indices[t + 1],
        shell.indices[t + 2]
      );
      if (normal[2] > 0) normal = normal.map((v) => -v);
      const point = [origin[0], origin[1], origin[2] + hit.distance];
      const limit = options.wall * 0.375;
      const depth = Math.min(options.signatureDepth, limit);
      if (depth < options.signatureDepth) {
        warnings.push(
          `A ${options.signatureDepth} mm signature would go most of the way through a ${options.wall} mm wall; used ${depth.toFixed(2)} mm. Fix: Signature → Depth (mm) down, Style "Raised", or Print → Wall (mm) up.`
        );
      }
      const solids = markSolids(wasm, options.signature, {
        depth,
        embed: options.wall * 0.5,
        frame: surfaceFrame(normal, point),
        lift: 2,
        size: options.signatureSize || Math.max(6, box.size[1] * 0.14),
        style: options.signatureStyle,
      });
      out.piece.push(
        ...solids.map((solid) => ({
          op: options.signatureStyle === 'emboss' ? 'add' : 'cut',
          solid,
        }))
      );
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

// The whole pipeline from a printable's piece to a print model and report:
// scale to size, trim and clean the sheet, thicken it, add the mount, check.
export default async function assemblePrint(printable, options, env = {}) {
  const started = Date.now();
  const piece = await printable.build(options, env);
  const warnings = [...(piece.warnings ?? [])];
  let scale = fitScale(piece.surface.positions, options);
  let surface = scaleMesh(piece.surface, scale, ['rest']);

  let floorY = null;
  let stance = null;
  if (options.mount === 'hem') {
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
          'No stance within 30° of tilt and 40 mm of trim keeps it upright; trimmed flat as set. Fix: Pose → Hands "At rest" and Wind 0, or Mount → Printed base + stem.'
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
  const folds = surface.attributes.rest
    ? findFolds(surface, surface.attributes.rest.array, options.wall)
    : { closest: null, spots: [] };

  const solid = solidify(surface, options.wall, {
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
  const csgNeeded =
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
      warnings
    );
    const markOf = (entries, op) =>
      entries
        .filter((entry) => entry.op === op)
        .map((entry) => csg.solidOfManifold(entry.solid, PART.mark));
    const build = (adds, cuts) => {
      let body = env.manifold.Manifold.union(adds);
      if (cuts.length) body = body.subtract(env.manifold.Manifold.union(cuts));
      return csg.toModel(body);
    };
    bodies.push({
      id: 'piece',
      label: printable.label,
      model: build(
        [
          csg.solidOf(shell),
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
          plan.standAdd.map(csg.solidOf),
          markOf(signature.stand, 'cut')
        ),
      });
    }
  }

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
        vertexColors: piece.vertexColors ? body.model.vertexColors : null,
      },
    });
    Object.assign(body, { analysis: analyzeSolid(body.model) });
  });
  const foldSpots = folds.spots.map((spot) => spot.map((v, k) => v + shift[k]));
  const { analysis } = bodies[0];
  const profile = PROFILES[options.profile];

  bodies.forEach((body) => {
    const a = body.analysis;
    if (!a.watertight) {
      warnings.push(
        `${body.label}: not watertight (${a.openEdges} open, ${a.nonManifoldEdges} non-manifold, ${a.flippedEdges} flipped edges). Fix: Surface → Detail per cloth cell up or down one step, or Print → Drop specks under higher; if it persists it is a bug, report it.`
      );
    }
    if (a.shells > 1) {
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
  if (options.wall < profile.minWall) {
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
        'Its centre of mass is outside the hem footprint, so it will tip over. Fix: Mount → turn on Level it to stand, raise Trim at least (mm), or switch to Printed base + stem.'
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
      warnings,
    },
  };
}
