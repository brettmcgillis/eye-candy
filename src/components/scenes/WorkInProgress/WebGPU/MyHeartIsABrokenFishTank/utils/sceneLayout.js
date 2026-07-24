export const SCENE_GROUND_Y = -0.9;

const MIN_EDGE_COLLIDER_HEIGHT = 0.18;
const MIN_EDGE_COLLIDER_THICKNESS = 0.08;
const MIN_LEG_DEPTH = 0.08;
const MIN_LEG_INSET = 0.12;
const MIN_LEG_WIDTH = 0.08;
const MIN_TABLE_DEPTH_MARGIN = 1.6;
const MIN_TABLE_THICKNESS = 0.16;
const MIN_TABLE_WIDTH_MARGIN = 1.9;

function getDefaultTableWidth(tank) {
  return tank.width + Math.max(MIN_TABLE_WIDTH_MARGIN, tank.spillExtent * 1.25);
}

function getDefaultTableDepth(tank) {
  return tank.depth + Math.max(MIN_TABLE_DEPTH_MARGIN, tank.spillExtent * 1.1);
}

function getDefaultTableThickness(tank) {
  return Math.max(MIN_TABLE_THICKNESS, tank.glassThickness * 3);
}

function getDefaultTableLegWidth(thickness) {
  return Math.max(MIN_LEG_WIDTH, thickness * 1.25);
}

function getDefaultTableLegDepth(thickness) {
  return Math.max(MIN_LEG_DEPTH, thickness * 1.25);
}

function getDefaultTableLegInset(thickness) {
  return Math.max(MIN_LEG_INSET, thickness * 1.75);
}

export function getTableLayout(tank, table = {}) {
  const tablePosition = table.position ?? [0, 0, 0];
  const width = Math.max(0.01, table.width ?? getDefaultTableWidth(tank));
  const depth = Math.max(0.01, table.depth ?? getDefaultTableDepth(tank));
  const thickness = Math.max(
    0.01,
    table.thickness ?? getDefaultTableThickness(tank)
  );
  const topY = -tank.height / 2 + tablePosition[1];
  const edgeColliderHeight = Math.max(
    MIN_EDGE_COLLIDER_HEIGHT,
    thickness * 1.4
  );
  const edgeColliderThickness = Math.max(
    MIN_EDGE_COLLIDER_THICKNESS,
    thickness * 0.65
  );
  const edgeColliderY = topY - edgeColliderHeight / 2;
  const legWidth = Math.max(
    0.01,
    table.legs?.width ?? getDefaultTableLegWidth(thickness)
  );
  const legDepth = Math.max(
    0.01,
    table.legs?.depth ?? getDefaultTableLegDepth(thickness)
  );
  const requestedLegInset = Math.max(
    0,
    table.legs?.inset ?? getDefaultTableLegInset(thickness)
  );
  const legInsetX = Math.min(
    requestedLegInset,
    Math.max(0, width / 2 - legWidth / 2)
  );
  const legInsetZ = Math.min(
    requestedLegInset,
    Math.max(0, depth / 2 - legDepth / 2)
  );
  const legOffsetX = Math.max(0, width / 2 - legInsetX - legWidth / 2);
  const legOffsetZ = Math.max(0, depth / 2 - legInsetZ - legDepth / 2);
  const legHeight = Math.max(0.01, topY - thickness - SCENE_GROUND_Y);
  const legY = SCENE_GROUND_Y + legHeight / 2;
  const legHalfExtents = [legWidth / 2, legHeight / 2, legDepth / 2];
  const legSize = [legWidth, legHeight, legDepth];

  return {
    depth,
    edgeBand: Math.max(0.28, thickness * 3),
    edgeColliders: [
      {
        args: [width / 2, edgeColliderHeight / 2, edgeColliderThickness / 2],
        key: 'front',
        position: [
          tablePosition[0],
          edgeColliderY,
          tablePosition[2] + depth / 2 - edgeColliderThickness / 2,
        ],
      },
      {
        args: [width / 2, edgeColliderHeight / 2, edgeColliderThickness / 2],
        key: 'back',
        position: [
          tablePosition[0],
          edgeColliderY,
          tablePosition[2] - depth / 2 + edgeColliderThickness / 2,
        ],
      },
      {
        args: [
          edgeColliderThickness / 2,
          edgeColliderHeight / 2,
          Math.max(0.01, depth / 2 - edgeColliderThickness),
        ],
        key: 'left',
        position: [
          tablePosition[0] - width / 2 + edgeColliderThickness / 2,
          edgeColliderY,
          tablePosition[2],
        ],
      },
      {
        args: [
          edgeColliderThickness / 2,
          edgeColliderHeight / 2,
          Math.max(0.01, depth / 2 - edgeColliderThickness),
        ],
        key: 'right',
        position: [
          tablePosition[0] + width / 2 - edgeColliderThickness / 2,
          edgeColliderY,
          tablePosition[2],
        ],
      },
    ],
    legs: [
      {
        halfExtents: legHalfExtents,
        key: 'front-left',
        position: [
          tablePosition[0] - legOffsetX,
          legY,
          tablePosition[2] + legOffsetZ,
        ],
        size: legSize,
      },
      {
        halfExtents: legHalfExtents,
        key: 'front-right',
        position: [
          tablePosition[0] + legOffsetX,
          legY,
          tablePosition[2] + legOffsetZ,
        ],
        size: legSize,
      },
      {
        halfExtents: legHalfExtents,
        key: 'back-left',
        position: [
          tablePosition[0] - legOffsetX,
          legY,
          tablePosition[2] - legOffsetZ,
        ],
        size: legSize,
      },
      {
        halfExtents: legHalfExtents,
        key: 'back-right',
        position: [
          tablePosition[0] + legOffsetX,
          legY,
          tablePosition[2] - legOffsetZ,
        ],
        size: legSize,
      },
    ],
    thickness,
    topHalfExtents: [width / 2, thickness / 2, depth / 2],
    topPosition: [tablePosition[0], topY - thickness / 2, tablePosition[2]],
    topY,
    width,
  };
}
