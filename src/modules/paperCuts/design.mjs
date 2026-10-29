export const MAX_PIECES = 512;
export const MAX_LAYERS = 32;
export const SIZES = [1, 2, 4];
export const GRID_STEP = 0.25;
export const snap = (value) => Math.round(value / GRID_STEP) * GRID_STEP;

export function normalizeDesign(input = {}) {
  if (input.version != null && input.version !== 1)
    throw new Error('Unsupported design version.');
  if (input.rotate != null && typeof input.rotate !== 'boolean')
    throw new Error('Rotation must be a boolean.');
  const rows = input.pieces ?? [];
  if (!Array.isArray(rows) || rows.length > MAX_PIECES)
    throw new Error(`A design can contain up to ${MAX_PIECES} pieces.`);
  const pieces = rows.map((row, index) => {
    if (
      !row ||
      typeof row !== 'object' ||
      (Array.isArray(row) && row.length !== 5)
    )
      throw new Error('Each piece must be an object or a five-value row.');
    const piece = Array.isArray(row)
      ? { id: row[0], layer: row[1], size: row[2], x: row[3], y: row[4] }
      : { ...row, id: row.id ?? index };
    if (
      !Number.isInteger(piece.id) ||
      piece.id < 0 ||
      !Number.isInteger(piece.layer) ||
      piece.layer < 0 ||
      piece.layer >= MAX_LAYERS ||
      !SIZES.includes(piece.size) ||
      ![piece.x, piece.y].every(
        (v) =>
          Number.isFinite(v) && Math.abs(v) <= 64 && Number.isInteger(v * 4)
      )
    )
      throw new Error(
        'Pieces need a unique ID, layer 0–31, size 1, 2 or 4, and quarter-grid coordinates within ±64.'
      );
    return piece;
  });
  if (new Set(pieces.map((p) => p.id)).size !== pieces.length)
    throw new Error('Piece IDs must be unique.');
  pieces.forEach((p, i) => {
    if (
      pieces
        .slice(i + 1)
        .some(
          (q) =>
            p.layer === q.layer &&
            Math.abs(p.x - q.x) < (p.size + q.size) / 2 - 1e-8 &&
            Math.abs(p.y - q.y) < (p.size + q.size) / 2 - 1e-8
        )
    )
      throw new Error('Pieces on the same layer cannot overlap.');
  });
  const occupied = Math.max(1, ...pieces.map((p) => p.layer + 1));
  const layerCount = input.layerCount ?? occupied;
  if (
    !Number.isInteger(layerCount) ||
    layerCount < occupied ||
    layerCount > MAX_LAYERS
  )
    throw new Error(`Layer count must be ${occupied}–${MAX_LAYERS}.`);
  return { version: 1, rotate: input.rotate ?? true, layerCount, pieces };
}

export const emptyDesign = () => normalizeDesign();
export const designToJson = (design) => {
  const normalized = normalizeDesign(design);
  return {
    ...normalized,
    pieces: normalized.pieces.map(({ id, layer, size, x, y }) => [
      id,
      layer,
      size,
      x,
      y,
    ]),
  };
};
export const encodeDesign = (design) =>
  `pc1.${encodeURIComponent(JSON.stringify(designToJson(design)))}`;
export function decodeDesign(code) {
  if (!String(code).startsWith('pc1.'))
    throw new Error('Expected a PaperCuts design code (pc1.).');
  return normalizeDesign(JSON.parse(decodeURIComponent(code.slice(4))));
}
export const isDesignCode = (value) => String(value).startsWith('pc1.');

export function designFromFrame(frame, { rotate = true } = {}) {
  const seen = new Set();
  const pieces = frame.layers.flatMap((layer, index) =>
    layer.flatMap(({ size, position: [x, y] }) => {
      const key = [index, size, x, y].join(',');
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ id: seen.size - 1, layer: index, size, x, y }];
    })
  );
  return normalizeDesign({ pieces, layerCount: frame.layers.length, rotate });
}

export function frameFromDesign(design, config) {
  const normalized = normalizeDesign(design);
  const low = [0, 1].map((axis) =>
    Math.min(
      ...(normalized.pieces.length
        ? normalized.pieces
        : [{ x: 0, y: 0, size: 0 }]
      ).map((p) => (axis ? p.y : p.x) - p.size / 2)
    )
  );
  const high = [0, 1].map((axis) =>
    Math.max(
      ...(normalized.pieces.length
        ? normalized.pieces
        : [{ x: 0, y: 0, size: 0 }]
      ).map((p) => (axis ? p.y : p.x) + p.size / 2)
    )
  );
  const origin = low.map((v, i) => (v + high[i]) / 2);
  const layers = Array.from({ length: normalized.layerCount }, () => []);
  normalized.pieces.forEach((piece) =>
    layers[piece.layer].push({
      size: piece.size,
      position: [piece.x - origin[0], piece.y - origin[1]],
    })
  );
  const halfExtent = Math.max(
    1,
    ...normalized.pieces.flatMap((p) => [
      Math.abs(p.x - origin[0]) + p.size / 2,
      Math.abs(p.y - origin[1]) + p.size / 2,
    ])
  );
  return {
    layers,
    settings: {
      origin,
      paperDepth: config.paperDepth,
      dataScaleMultiplier: Math.min(1, 3.5 / halfExtent),
    },
    stats: {
      layers: layers.length,
      pieces: normalized.pieces.length,
      halfExtent,
      motifs: 0,
    },
  };
}

export function editPieces(design, ids, patch, { duplicate = false } = {}) {
  let nextId = Math.max(-1, ...design.pieces.map((p) => p.id)) + 1;
  const changed = design.pieces
    .filter((p) => ids.includes(p.id))
    .map((p) => ({ ...p, ...patch(p), id: duplicate ? nextId++ : p.id }));
  const pieces = duplicate
    ? [...design.pieces, ...changed]
    : design.pieces.map((p) => changed.find((q) => q.id === p.id) ?? p);
  try {
    return normalizeDesign({ ...design, pieces });
  } catch {
    return null;
  }
}
export function placePiece(design, piece) {
  try {
    return normalizeDesign({
      ...design,
      pieces: [
        ...design.pieces,
        { ...piece, id: Math.max(-1, ...design.pieces.map((p) => p.id)) + 1 },
      ],
    });
  } catch {
    return null;
  }
}
export const removePieces = (design, ids) => ({
  ...design,
  pieces: design.pieces.filter((p) => !ids.includes(p.id)),
});
export function moveLayer(design, from, to) {
  const remap = (layer) => {
    if (layer === from) return to;
    if (from < to && layer > from && layer <= to) return layer - 1;
    if (from > to && layer >= to && layer < from) return layer + 1;
    return layer;
  };
  return normalizeDesign({
    ...design,
    pieces: design.pieces.map((p) => ({ ...p, layer: remap(p.layer) })),
  });
}
