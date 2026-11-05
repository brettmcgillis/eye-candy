import { foldClose, meshPlotSvg, samplePalette } from '@modules/plotKit';

import { STRIDE } from './generation';
import { isDrawn, placeTile, tileInk } from './plotGeometry';
import tileMesh from './tileMesh';

// Pen plots draw a tile only once it is at least this opaque: a fading tile
// is neither drawn nor hides what is behind it.
const FADE_CUTOFF = 0.5;
const INKS = 8;

const trianglesOf = (faces) =>
  Uint32Array.from(
    faces.flatMap(({ indices: [a, b, c, d] }) => [a, b, c, a, c, d])
  );

// Every drawn tile as world meshes for plotKit's exact hidden-line plot:
// `solid` is each tile whole (what hides lines; a flat tile is its top
// alone), `drawn` what is outlined: the same, or with `faces` each top alone.
function tileMeshes(field, { faces }) {
  const { data, tiles, config } = field;
  const shapes = [tileMesh(false), tileMesh(true, config.frameWidth)];
  const flat = config.dimension === 'flat';
  const solid = [];
  const drawn = [];
  const inks = new Map();
  tiles.forEach((tile, i) => {
    const k = i * STRIDE;
    if (!isDrawn(data, k) || data[k + 7] < FADE_CUTOFF) return;
    const shape = shapes[Number(tile.hollow)];
    const position = Float32Array.from(placeTile(shape, data, k).flat());
    const color = tileInk(data, k).map((v) => v * 255);
    const tops = trianglesOf(shape.faces.filter((face) => face.top));
    const whole = flat ? tops : trianglesOf(shape.faces);
    solid.push({ index: whole, position });
    drawn.push({
      color,
      index: faces ? tops : whole,
      position,
      rest: position,
    });
    const key = color.join();
    inks.set(key, { rgb: color, weight: (inks.get(key)?.weight ?? 0) + 1 });
  });
  return { drawn, inks: [...inks.values()], solid };
}

export default function plotMesh(field, view, options) {
  const { drawn, inks, solid } = tileMeshes(field, {
    faces: options.svgStyle === 'faces',
  });
  return meshPlotSvg({
    camera: view,
    contourTolerance: 0,
    height: options.height,
    meshes: drawn,
    occluders: solid,
    palette: samplePalette(foldClose(inks), options.svgColors || INKS),
    silhouette: false,
    stroke: options.svgStroke,
    width: options.width,
  });
}
