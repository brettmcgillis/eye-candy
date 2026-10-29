import { closedRuns, straightSidesAgree } from './triSides';
import {
  H,
  TRIANGLE,
  TRI_STRIPES,
  cellCenter,
  cornerPoints,
  ringsEdge,
} from './triangle';

export const BOUNDARY_RETURN = 12;

export function boundaryRadii(size, pitch) {
  const n = Math.round(size * pitch);
  const phase = n % 2 ? 1 : 0.5;
  return Array.from(
    { length: Math.floor(n / 2) },
    (_, i) => (i + phase) / pitch
  );
}

export const boundarySize = (edge) => Math.floor(edge / 6);
export const boundarySide = (edge) => edge % 3;
export const boundaryUp = (edge) => Math.floor(edge / 3) % 2 === 1;

function pairCell(a, b) {
  const av = cornerPoints(a);
  const bv = cornerPoints(b);
  const shared = av.filter(([x, y]) =>
    bv.some(([u, v]) => Math.hypot(x - u, y - v) < 1e-6)
  );
  const x = (shared[0][0] + shared[1][0]) / 2;
  const y = (shared[0][1] + shared[1][1]) / 2;
  const size = a.size * 1.5;
  const row = y / H - size / 3;
  return {
    column: x - row / 2 - size / 2,
    row,
    size,
    up: false,
    shape: TRIANGLE,
    connectors: [false, false, false],
  };
}

export default function triangleFans(design, groups, pitch, connectionsFor) {
  const runs = closedRuns(design);
  const drawn = [];
  const hosts = [];
  const geometry = (source) => ({
    ...source,
    up: Math.floor(source.mask / 8) % 2 === 1,
    shape: TRIANGLE,
    connectors: [false, false, false],
  });
  groups.forEach((sources, network) => {
    const cells = sources.map((i) => geometry(design.cells[i]));
    if (sources.length <= 2) {
      const cell = sources.length === 2 ? pairCell(...cells) : cells[0];
      drawn.push({
        cell,
        connections: [[5, ringsEdge(cell.up)]],
        group: sources[0],
        channelGroup: network,
        occluders: [],
        sources,
      });
      return;
    }
    sources.forEach((index) => {
      const source = design.cells[index];
      const cell = geometry(source);
      if (cell.size * pitch <= 1) {
        drawn.push({
          cell,
          connections: [[5, ringsEdge(cell.up)]],
          group: index,
          channelGroup: network,
          occluders: [],
          sources: [index],
        });
        return;
      }
      const connections = connectionsFor(
        source,
        straightSidesAgree(runs[index], source.mask, source.size)
      );
      if (connections.length === 1) {
        const [type, edge] = connections[0];
        const closed = (edge + 1) % 3;
        drawn.push({
          cell,
          connections:
            type === TRI_STRIPES && !runs[index][closed][0].facing
              ? [[type, edge + 6]]
              : connections,
          group: index,
          channelGroup: network,
          occluders: [],
          sources: [index],
        });
        return;
      }
      const [top, middle, bottom] = connections;
      const bottomIndex = drawn.length;
      drawn.push({
        cell,
        connections: [bottom],
        group: index,
        channelGroup: network,
        occluders: [top, middle].map(([type, edge]) => ({ cell, type, edge })),
        under: true,
      });
      const topIndex = drawn.length;
      drawn.push({
        cell,
        connections: [top, middle],
        group: index,
        channelGroup: network,
        occluders: [],
      });
      hosts.push({
        cell,
        source,
        index,
        network,
        topIndex,
        bottomIndex,
        connections,
      });
    });
  });
  // A return per closed run of a side: the whole side unless irregular
  // connections leave some of it open. Those facing a cell go last, so their
  // full outlines close over the void-facing ones they overlap.
  const caps = [];
  hosts.forEach((host) => {
    const points = cornerPoints(host.cell);
    [0, 1, 2].forEach((side) =>
      runs[host.index][side].forEach(({ from, to, facing }) => {
        const a = points[side];
        const b = points[(side + 1) % 3];
        const t = (from + to) / 2 / host.cell.size;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        const size = to - from;
        const edge = side + (host.cell.up ? 3 : 0) + 6 * size;
        const cell = {
          column: x - size / 2,
          row: y - size / 2,
          size,
          connectors: [false, false, false, false],
        };
        const [hx, hy] = cellCenter(host.cell);
        caps.push({
          cell,
          connections: [[BOUNDARY_RETURN, edge]],
          group: host.index,
          channelGroup: host.network,
          occluders: [],
          cap: {
            host: host.cell,
            topIndex: host.topIndex,
            bottomIndex: host.bottomIndex,
            connections: host.connections,
            offset: [x - hx, y - hy],
            side,
            from,
            facing,
          },
        });
      })
    );
  });
  drawn.push(
    ...caps.filter(({ cap }) => !cap.facing),
    ...caps.filter(({ cap }) => cap.facing)
  );
  return drawn.map((entry, index) => ({
    ...entry,
    renderOccluders: drawn
      .slice(index + 1)
      .filter((later) => later.cap)
      .map(({ cell, connections, cap }) => ({
        cell,
        type: connections[0][0],
        edge: connections[0][1],
        cap,
      })),
  }));
}
