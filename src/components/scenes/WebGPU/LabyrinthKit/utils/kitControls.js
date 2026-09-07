import { folder } from 'leva';

import {
  ASSETS,
  LANDING_VARIATIONS,
  ROOM_SIDES,
  describeVariation,
} from './assets';
// Schema defaults are read from the active preset rather than written twice.
// Hardcoding them here let the two drift, which silently clamped preset values
// to a stale control range.
import { CONNECTIONS, CORRIDOR_ASSETS } from './corridor';

const WALL_MODES = ['Cutaway', 'Solid', 'Hidden'];
const KITS = ['Staircase', 'Corridor', 'Connections'];
const VARIATION_LABELS = LANDING_VARIATIONS.map(describeVariation);

export function getAssetControls(d) {
  return folder(
    {
      kit: { label: 'Kit', options: KITS, value: d.kit },
      asset: {
        label: 'Asset',
        options: ASSETS,
        value: d.asset,
        render: (get) => get('Labyrinth Kit.Asset.kit') === 'Staircase',
      },
      connection: {
        label: 'Connection',
        options: CONNECTIONS,
        value: d.connection,
        render: (get) => get('Labyrinth Kit.Asset.kit') === 'Connections',
      },
      corridorAsset: {
        label: 'Asset',
        options: CORRIDOR_ASSETS,
        value: d.corridorAsset,
        render: (get) => get('Labyrinth Kit.Asset.kit') === 'Corridor',
      },
      variation: {
        label: 'Landing Variation',
        options: VARIATION_LABELS,
        value: d.variation,
      },
      wallMode: { label: 'Shaft Wall', options: WALL_MODES, value: d.wallMode },
      showGrid: { label: 'Grid', value: d.showGrid },
      stoneColor: { label: 'Tint', value: d.stoneColor },
      textureScale: {
        label: 'Texture Scale',
        min: 0.01,
        max: 1,
        step: 0.005,
        value: d.textureScale,
      },
      textureBlend: {
        label: 'Triplanar Sharpness',
        min: 1,
        max: 12,
        step: 0.5,
        value: d.textureBlend,
      },
      normalStrength: {
        label: 'Normal Strength',
        min: 0,
        max: 2,
        step: 0.05,
        value: d.normalStrength,
      },
      backgroundColor: { label: 'Background', value: d.backgroundColor },
    },
    { collapsed: false }
  );
}

export function getShapeControls(d) {
  return folder(
    {
      voidRadius: {
        label: 'Void Radius',
        min: 2,
        max: 120,
        step: 0.5,
        value: d.voidRadius,
      },
      stairWidth: {
        label: 'Stair Width',
        min: 1,
        max: 40,
        step: 0.25,
        value: d.stairWidth,
      },
      landingOvershoot: {
        label: 'Landing Overshoot',
        min: 0,
        max: 12,
        step: 0.1,
        value: d.landingOvershoot,
      },
      riser: {
        label: 'Riser',
        min: 0.05,
        max: 0.6,
        step: 0.005,
        value: d.riser,
      },
      stepsPerTurn: {
        label: 'Steps Per Turn',
        min: 32,
        max: 1536,
        step: 1,
        value: d.stepsPerTurn,
      },
      stepCount: {
        label: 'Steps In Flight',
        min: 4,
        max: 256,
        step: 1,
        value: d.stepCount,
      },
      landingArc: {
        label: 'Landing Arc (turns)',
        min: 0.01,
        max: 0.5,
        step: 0.005,
        value: d.landingArc,
      },
      landingThickness: {
        label: 'Slab Thickness',
        min: 0.2,
        max: 6,
        step: 0.1,
        value: d.landingThickness,
      },
      wallArc: {
        label: 'Wall Arc',
        min: 0.05,
        max: 3.2,
        step: 0.01,
        value: d.wallArc,
      },
      wallHeight: {
        label: 'Wall Height',
        min: 4,
        max: 120,
        step: 1,
        value: d.wallHeight,
      },
      flights: {
        label: 'Flights (assembly)',
        min: 1,
        max: 40,
        step: 1,
        value: d.flights,
      },
    },
    { collapsed: true }
  );
}

export function getCorridorControls(d) {
  return folder(
    {
      segmentLength: {
        label: 'Segment Length',
        min: 4,
        max: 60,
        step: 0.5,
        value: d.segmentLength,
      },
      corridorWidth: {
        label: 'Corridor Width',
        min: 1.5,
        max: 20,
        step: 0.1,
        value: d.corridorWidth,
      },
      corridorHeight: {
        label: 'Corridor Height',
        min: 2.2,
        max: 24,
        step: 0.1,
        value: d.corridorHeight,
      },
      archRatio: {
        label: 'Arch Ratio',
        min: 0.05,
        max: 0.5,
        step: 0.01,
        value: d.archRatio,
      },
      corridorSegments: {
        label: 'Rings Per Segment',
        min: 4,
        max: 64,
        step: 1,
        value: d.corridorSegments,
      },
      corridorCount: {
        label: 'Live Segments',
        min: 2,
        max: 40,
        step: 1,
        value: d.corridorCount,
      },
    },
    { collapsed: true }
  );
}

export function getCorridorDriftControls(d) {
  return folder(
    {
      driftAmount: {
        label: 'Smooth Drift',
        min: 0,
        max: 1,
        step: 0.01,
        value: d.driftAmount,
      },
      driftWavelength: {
        label: 'Drift Wavelength',
        min: 10,
        max: 600,
        step: 5,
        value: d.driftWavelength,
      },
      stepAmount: {
        label: 'Stepped Jumps',
        min: 0,
        max: 1,
        step: 0.01,
        value: d.stepAmount,
      },
      stepRunLength: {
        label: 'Segments Between Jumps',
        min: 1,
        max: 20,
        step: 1,
        value: d.stepRunLength,
      },
      revealDepth: {
        label: 'Wall Thickness',
        min: 0,
        max: 2,
        step: 0.05,
        value: d.revealDepth,
      },
      bulkheadThickness: {
        label: 'Bulkhead Thickness',
        min: 0.05,
        max: 2,
        step: 0.05,
        value: d.bulkheadThickness,
      },
    },
    { collapsed: true }
  );
}

export function getCorridorBranchControls(d) {
  return folder(
    {
      branchChance: {
        label: 'Branch Chance',
        min: 0,
        max: 1,
        step: 0.01,
        value: d.branchChance,
      },
      branchWidthScale: {
        label: 'Branch Size',
        min: 0.2,
        max: 1,
        step: 0.01,
        value: d.branchWidthScale,
      },
      branchLength: {
        label: 'Branch Length',
        min: 4,
        max: 200,
        step: 1,
        value: d.branchLength,
      },
      deadEndLength: {
        label: 'Dead End Length',
        min: 1,
        max: 40,
        step: 0.5,
        value: d.deadEndLength,
      },
      deadEndFlare: { label: 'Dead End Flare', value: d.deadEndFlare },
      branchRoomDepth: {
        label: 'Branch Room Depth',
        min: 2,
        max: 40,
        step: 0.5,
        value: d.branchRoomDepth,
      },
      branchRoomWidth: {
        label: 'Branch Room Width',
        min: 2,
        max: 40,
        step: 0.5,
        value: d.branchRoomWidth,
      },
      branchRoomHeight: {
        label: 'Branch Room Height',
        min: 2.5,
        max: 30,
        step: 0.5,
        value: d.branchRoomHeight,
      },
    },
    { collapsed: true }
  );
}

export function getTransitionControls(d) {
  return folder(
    {
      travelSpeed: {
        label: 'Travel Speed',
        min: 0,
        max: 40,
        step: 0.1,
        value: d.travelSpeed,
      },
      corridorLead: {
        label: 'Lead Segments',
        min: 0,
        max: 1,
        step: 0.05,
        value: d.corridorLead,
      },
      mouthRoomSize: {
        label: 'Shaft Room Size',
        min: 20,
        max: 200,
        step: 1,
        value: d.mouthRoomSize,
      },
      mouthRoomHeight: {
        label: 'Shaft Room Height',
        min: 4,
        max: 60,
        step: 0.5,
        value: d.mouthRoomHeight,
      },
      areaCorridorSegments: {
        label: 'Area Corridor Segments',
        min: 2,
        max: 30,
        step: 1,
        value: d.areaCorridorSegments,
      },
      areaDescentFlights: {
        label: 'Area Descent Flights',
        min: 2,
        max: 20,
        step: 1,
        value: d.areaDescentFlights,
      },
      areaFloorFlights: {
        label: 'Area Floor Flights',
        min: 1,
        max: 12,
        step: 1,
        value: d.areaFloorFlights,
      },
      showSensors: { label: 'Show Sensors', value: d.showSensors },
      stairVariance: {
        label: 'Stair Variance',
        min: 0,
        max: 0.8,
        step: 0.01,
        value: d.stairVariance,
      },
      stairFlareChance: {
        label: 'Landing Flare Chance',
        min: 0,
        max: 1,
        step: 0.01,
        value: d.stairFlareChance,
      },
      stationGlide: {
        label: 'Station Glide (s)',
        min: 0.1,
        max: 6,
        step: 0.1,
        value: d.stationGlide,
      },
      showBounds: { label: 'Show Geometry Ends', value: d.showBounds },
      areaSensorFlights: {
        label: 'Descend To Advance (flights)',
        min: 1,
        max: 8,
        step: 1,
        value: d.areaSensorFlights,
      },
      areaSensorSegments: {
        label: 'Walk To Advance (segments)',
        min: 1,
        max: 12,
        step: 1,
        value: d.areaSensorSegments,
      },
      endlessCorridorSlots: {
        label: 'Endless Corridor Slots',
        min: 4,
        max: 40,
        step: 1,
        value: d.endlessCorridorSlots,
      },
      areaSpread: {
        label: 'Spread Areas (debug)',
        min: 0,
        max: 400,
        step: 10,
        value: d.areaSpread,
      },
      tourFixedSegments: {
        label: 'Fixed Corridor Segments',
        min: 1,
        max: 10,
        step: 1,
        value: d.tourFixedSegments,
      },
      tourMovingSegments: {
        label: 'Endless Corridor Segments',
        min: 1,
        max: 20,
        step: 1,
        value: d.tourMovingSegments,
      },
      tourFixedFlights: {
        label: 'Fixed Flights',
        min: 1,
        max: 10,
        step: 1,
        value: d.tourFixedFlights,
      },
      tourMovingFlights: {
        label: 'Endless Flights',
        min: 1,
        max: 40,
        step: 1,
        value: d.tourMovingFlights,
      },
      floorExits: {
        label: 'Floor Exits',
        min: 0,
        max: 12,
        step: 1,
        value: d.floorExits,
      },
      floorExitVariance: {
        label: 'Floor Exit Variance',
        min: 0,
        max: 1,
        step: 0.01,
        value: d.floorExitVariance,
      },
      thresholdWallWidth: {
        label: 'Threshold Wall Width',
        min: 4,
        max: 40,
        step: 0.5,
        value: d.thresholdWallWidth,
      },
      thresholdWallHeight: {
        label: 'Threshold Wall Height',
        min: 3,
        max: 30,
        step: 0.5,
        value: d.thresholdWallHeight,
      },
    },
    { collapsed: true }
  );
}

export function getFogControls(d) {
  return folder(
    {
      fogEnabled: { label: 'Fog', value: d.fogEnabled },
      fogColor: { label: 'Fog Color', value: d.fogColor },
      fogNear: {
        label: 'Fog Near',
        min: 0,
        max: 200,
        step: 1,
        value: d.fogNear,
      },
      fogFar: { label: 'Fog Far', min: 5, max: 600, step: 1, value: d.fogFar },
    },
    { collapsed: true }
  );
}

export function getMotionControls(d) {
  return folder(
    {
      motionSpeed: {
        label: 'Fall Speed',
        min: 0,
        max: 10,
        step: 0.1,
        value: d.motionSpeed,
      },
      spinLock: {
        label: 'Spin Lock',
        min: 0,
        max: 1,
        step: 0.01,
        value: d.spinLock,
      },
      motionSlots: {
        label: 'Live Flights',
        min: 17,
        max: 68,
        step: 17,
        value: d.motionSlots,
      },
      variance: {
        label: 'Architecture Variance',
        min: 0,
        max: 1,
        step: 0.01,
        value: d.variance,
      },
    },
    { collapsed: true }
  );
}

export function getBranchControls(d) {
  return folder(
    {
      mouthWidth: {
        label: 'Doorway Width',
        min: 1,
        max: 20,
        step: 0.1,
        value: d.mouthWidth,
      },
      mouthHeight: {
        label: 'Doorway Height',
        min: 2,
        max: 20,
        step: 0.1,
        value: d.mouthHeight,
      },
      tunnelLength: {
        label: 'Hallway Length',
        min: 2,
        max: 200,
        step: 0.5,
        value: d.tunnelLength,
      },
      tunnelLengthEndRoom: {
        label: 'Hallway Length (end room)',
        min: 2,
        max: 120,
        step: 0.5,
        value: d.tunnelLengthEndRoom,
      },
      roomSide: { label: 'Room Side', options: ROOM_SIDES, value: d.roomSide },
      roomAlong: {
        label: 'Side Room Along Hall',
        min: 0.05,
        max: 0.5,
        step: 0.01,
        value: d.roomAlong,
      },
      hallwayCapEnd: { label: 'Hallway Back Wall', value: d.hallwayCapEnd },
      roomDepth: {
        label: 'Room Depth',
        min: 2,
        max: 40,
        step: 0.5,
        value: d.roomDepth,
      },
      roomWidth: {
        label: 'Room Width',
        min: 2,
        max: 40,
        step: 0.5,
        value: d.roomWidth,
      },
      roomHeight: {
        label: 'Room Height',
        min: 2,
        max: 30,
        step: 0.5,
        value: d.roomHeight,
      },
      flareShadows: { label: 'Flare Shadows', value: d.flareShadows },
      flareShadowCount: {
        label: 'Shadow Casters',
        min: 0,
        max: 4,
        step: 1,
        value: d.flareShadowCount,
      },
      flareColor: { label: 'Flare', value: d.flareColor },
      flareLength: {
        label: 'Flare Length',
        min: 0.05,
        max: 2,
        step: 0.01,
        value: d.flareLength,
      },
      flareRadius: {
        label: 'Flare Radius',
        min: 0.01,
        max: 0.4,
        step: 0.005,
        value: d.flareRadius,
      },
      flareGlow: {
        label: 'Flare Glow',
        min: 0.5,
        max: 12,
        step: 0.1,
        value: d.flareGlow,
      },
      flareRange: {
        label: 'Flare Light Range',
        min: 1,
        max: 80,
        step: 0.5,
        value: d.flareRange,
      },
      flareIntensity: {
        label: 'Flare Intensity',
        min: 0,
        max: 200,
        step: 1,
        value: d.flareIntensity,
      },
    },
    { collapsed: true }
  );
}
