import { faceNormal } from '../checks';
import zipStore from './zip';

// Every writer takes a print model: millimetres, Y-up, triangles tagged with
// a part (`triPart` → `parts[i]`), optional sRGB `vertexColors`. Slicers and
// print services expect Z-up, so STL and 3MF rotate +Y onto +Z; glTF stays
// Y-up and is written in metres.
const zUp = (positions, v) => [
  positions[v * 3],
  -positions[v * 3 + 2],
  positions[v * 3 + 1],
];

export function writeStl({ indices, positions }, name = 'eye-candy') {
  const triangles = indices.length / 3;
  const buffer = new ArrayBuffer(84 + triangles * 50);
  const view = new DataView(buffer);
  const header = new TextEncoder().encode(name.slice(0, 79));
  new Uint8Array(buffer).set(header);
  view.setUint32(80, triangles, true);
  for (let t = 0; t < triangles; t += 1) {
    const corners = [indices[t * 3], indices[t * 3 + 1], indices[t * 3 + 2]];
    const n = faceNormal(positions, ...corners);
    const values = [n[0], -n[2], n[1]];
    corners.forEach((v) => values.push(...zUp(positions, v)));
    const offset = 84 + t * 50;
    for (let k = 0; k < 12; k += 1) {
      view.setFloat32(offset + k * 4, values[k], true);
    }
    view.setUint16(offset + 48, 0, true);
  }
  return new Uint8Array(buffer);
}

const hex = (rgb) =>
  `#${rgb
    .map((value) =>
      Math.round(Math.min(1, Math.max(0, value)) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')
    .toUpperCase()}`;

const escapeXml = (text) =>
  String(text).replace(
    /[<>&"]/gu,
    (c) => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]
  );

// Parts become base materials, so a multi-material slicer can assign a
// filament per part; baked texture colour rides along as a per-vertex colour
// group for full-colour services, which take it over the base material.
export function write3mf(model, { title = 'Eye Candy print' } = {}) {
  const { indices, parts, positions, triPart, vertexColors } = model;
  const vertices = positions.length / 3;
  const lines = [];
  lines.push(
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">',
    `<metadata name="Title">${escapeXml(title)}</metadata>`,
    '<metadata name="Application">Eye Candy PrintShop</metadata>',
    '<resources>',
    '<basematerials id="1">'
  );
  parts.forEach((part) => {
    lines.push(
      `<base name="${escapeXml(part.label)}" displaycolor="${part.color.toUpperCase()}FF" />`
    );
  });
  lines.push('</basematerials>');
  if (vertexColors) {
    lines.push('<m:colorgroup id="2">');
    for (let v = 0; v < vertices; v += 1) {
      lines.push(
        `<m:color color="${hex([vertexColors[v * 3], vertexColors[v * 3 + 1], vertexColors[v * 3 + 2]])}FF" />`
      );
    }
    lines.push('</m:colorgroup>');
  }
  lines.push(
    '<object id="3" type="model" pid="1" pindex="0">',
    '<mesh>',
    '<vertices>'
  );
  for (let v = 0; v < vertices; v += 1) {
    const [x, y, z] = zUp(positions, v);
    lines.push(
      `<vertex x="${x.toFixed(4)}" y="${y.toFixed(4)}" z="${z.toFixed(4)}" />`
    );
  }
  lines.push('</vertices>', '<triangles>');
  for (let t = 0; t < indices.length / 3; t += 1) {
    const [a, b, c] = [indices[t * 3], indices[t * 3 + 1], indices[t * 3 + 2]];
    lines.push(
      vertexColors
        ? `<triangle v1="${a}" v2="${b}" v3="${c}" pid="2" p1="${a}" p2="${b}" p3="${c}" />`
        : `<triangle v1="${a}" v2="${b}" v3="${c}" pid="1" p1="${triPart[t]}" />`
    );
  }
  lines.push(
    '</triangles>',
    '</mesh>',
    '</object>',
    '</resources>',
    '<build>',
    '<item objectid="3" />',
    '</build>',
    '</model>'
  );

  const encoder = new TextEncoder();
  return zipStore([
    [
      '[Content_Types].xml',
      encoder.encode(
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" /><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" /></Types>'
      ),
    ],
    [
      '_rels/.rels',
      encoder.encode(
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" /></Relationships>'
      ),
    ],
    ['3D/3dmodel.model', encoder.encode(lines.join('\n'))],
  ]);
}

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

function smoothNormals(positions, indices) {
  const normals = new Float32Array(positions.length);
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t], indices[t + 1], indices[t + 2]];
    const n = faceNormal(positions, a, b, c);
    [a, b, c].forEach((v) => {
      normals[v * 3] += n[0];
      normals[v * 3 + 1] += n[1];
      normals[v * 3 + 2] += n[2];
    });
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= length;
    normals[i + 1] /= length;
    normals[i + 2] /= length;
  }
  return normals;
}

// A viewable twin of the print: one primitive per part over a shared vertex
// buffer, baked colour as COLOR_0 (linear, as glTF requires).
export function writeGlb(model, { title = 'Eye Candy print' } = {}) {
  const { indices, parts, positions, triPart, vertexColors } = model;
  const vertices = positions.length / 3;
  const metres = Float32Array.from(positions, (value) => value / 1000);
  const normals = smoothNormals(positions, indices);
  const colors = vertexColors
    ? Float32Array.from(vertexColors, (value) => toLinear(value))
    : null;
  const byPart = parts.map((_, p) => {
    const list = [];
    for (let t = 0; t < indices.length / 3; t += 1) {
      if (triPart[t] === p) {
        list.push(indices[t * 3], indices[t * 3 + 1], indices[t * 3 + 2]);
      }
    }
    return Uint32Array.from(list);
  });

  const chunks = [];
  const views = [];
  let length = 0;
  const addView = (array, target) => {
    const bytes = new Uint8Array(
      array.buffer,
      array.byteOffset,
      array.byteLength
    );
    views.push({
      buffer: 0,
      byteLength: bytes.length,
      byteOffset: length,
      target,
    });
    chunks.push(bytes);
    length += bytes.length;
    const pad = (4 - (length % 4)) % 4;
    if (pad) {
      chunks.push(new Uint8Array(pad));
      length += pad;
    }
    return views.length - 1;
  };

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < vertices; v += 1) {
    for (let k = 0; k < 3; k += 1) {
      min[k] = Math.min(min[k], metres[v * 3 + k]);
      max[k] = Math.max(max[k], metres[v * 3 + k]);
    }
  }
  const accessors = [
    {
      bufferView: addView(metres, 34962),
      componentType: 5126,
      count: vertices,
      max,
      min,
      type: 'VEC3',
    },
    {
      bufferView: addView(normals, 34962),
      componentType: 5126,
      count: vertices,
      type: 'VEC3',
    },
  ];
  const attributes = { NORMAL: 1, POSITION: 0 };
  if (colors) {
    accessors.push({
      bufferView: addView(colors, 34962),
      componentType: 5126,
      count: vertices,
      type: 'VEC3',
    });
    attributes.COLOR_0 = 2;
  }
  const primitives = [];
  byPart.forEach((list, p) => {
    if (list.length === 0) return;
    accessors.push({
      bufferView: addView(list, 34963),
      componentType: 5125,
      count: list.length,
      type: 'SCALAR',
    });
    primitives.push({ attributes, indices: accessors.length - 1, material: p });
  });

  const rgb = (color) =>
    [1, 3, 5].map((i) => toLinear(parseInt(color.slice(i, i + 2), 16) / 255));
  const json = {
    accessors,
    asset: { generator: 'Eye Candy PrintShop', version: '2.0' },
    bufferViews: views,
    buffers: [{ byteLength: length }],
    materials: parts.map((part) => ({
      name: part.label,
      pbrMetallicRoughness: {
        baseColorFactor: colors ? [1, 1, 1, 1] : [...rgb(part.color), 1],
        metallicFactor: 0,
        roughnessFactor: 0.8,
      },
    })),
    meshes: [{ name: title, primitives }],
    nodes: [{ mesh: 0, name: title }],
    scene: 0,
    scenes: [{ nodes: [0] }],
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPadded = Math.ceil(jsonBytes.length / 4) * 4;
  const total = 12 + 8 + jsonPadded + 8 + length;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonPadded, true);
  view.setUint32(16, 0x4e4f534a, true);
  out.set(jsonBytes, 20);
  out.fill(0x20, 20 + jsonBytes.length, 20 + jsonPadded);
  view.setUint32(20 + jsonPadded, length, true);
  view.setUint32(24 + jsonPadded, 0x004e4942, true);
  let offset = 28 + jsonPadded;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}

export const WRITERS = {
  stl: {
    extension: 'stl',
    label: 'STL',
    write: (model, meta) => writeStl(model, meta.title),
  },
  '3mf': { extension: '3mf', label: '3MF', write: write3mf },
  glb: { extension: 'glb', label: 'GLB', write: writeGlb },
};
