export const ASSETS = [
  'Stair Segment',
  'Wall Segment',
  'Wall + Opening',
  'Landing',
  'Flare',
  'Hallway',
  'Hallway + Flare',
  'Hallway + Room',
  'Hallway + Flare + Room',
  'Landing Variation',
  'Assembled Preview',
  'Motion Preview',
];

export const DEFAULT_ASSET = 'Stair Segment';

export const ROOM_SIDES = ['End', 'Left', 'Right'];

export function assetHasHallway(asset) {
  return asset.startsWith('Hallway');
}

export function assetHasRoom(asset) {
  return asset.includes('Room');
}

export function assetHasFlare(asset) {
  return asset === 'Flare' || asset.includes('Flare');
}

export function assetHasOpening(asset) {
  return asset === 'Wall + Opening';
}

// Generated rather than hand-listed so the set is provably complete: every
// landing shape crossed with every legal flare location, at most one flare
// each. 2 + 3 + (3 rooms x 4) = 17.
function buildVariations() {
  const list = [];
  const push = (hallway, room, flare) => list.push({ hallway, room, flare });

  push(false, null, null);
  push(false, null, 'landing');

  push(true, null, null);
  push(true, null, 'landing');
  push(true, null, 'hallway');

  ROOM_SIDES.forEach((room) => {
    push(true, room, null);
    push(true, room, 'landing');
    push(true, room, 'hallway');
    push(true, room, 'room');
  });

  return list;
}

export const LANDING_VARIATIONS = buildVariations();

export function variationFor(index) {
  return LANDING_VARIATIONS[index % LANDING_VARIATIONS.length];
}

export function describeVariation(v) {
  const parts = [v.hallway ? 'hallway' : 'landing only'];
  if (v.room) parts.push(`${v.room.toLowerCase()} room`);
  parts.push(v.flare ? `flare on ${v.flare}` : 'no flare');
  return parts.join(' + ');
}

export function variationByLabel(label) {
  const index = LANDING_VARIATIONS.findIndex(
    (v) => describeVariation(v) === label
  );
  return LANDING_VARIATIONS[index < 0 ? 0 : index];
}
