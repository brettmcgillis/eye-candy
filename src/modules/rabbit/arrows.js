// Authored against the upright pose at POSE_TIME, the moment the painting
// shows. Each arrow flies along (azimuth, elevation) toward `aim`, a point
// inside the low back; where that line first meets the skin is the wound.
// Azimuth runs from the rabbit's facing (+X) toward its right flank (+Z), so
// about -160 points back and out behind him, off the left haunch.
import { createRng } from '@modules/flora';

export const POSE_TIME = 11;
export const MAX_ARROWS = 6;

export const PAINTING_VOLLEY = [
  {
    key: 'high',
    aim: [-0.14, 0.15, -0.03],
    azimuth: -160,
    elevation: 36,
    length: 0.44,
  },
  {
    key: 'ribbon',
    aim: [-0.14, 0.13, -0.03],
    azimuth: -166,
    elevation: 22,
    length: 0.45,
    ribbon: true,
  },
  {
    key: 'mid',
    aim: [-0.14, 0.12, -0.035],
    azimuth: -158,
    elevation: 18,
    length: 0.46,
  },
  {
    key: 'low',
    aim: [-0.14, 0.11, -0.03],
    azimuth: -164,
    elevation: -20,
    length: 0.48,
  },
];

export const SHAFT_RADIUS = 0.0028;
export const EMBED_DEPTH = 0.035;
export const FLETCH_LENGTH = 0.068;
export const FLETCH_HEIGHT = 0.012;
export const FLETCH_INSET = 0.008;
export const RIBBON_WIDTH = 0.015;
export const RIBBON_LENGTH = 0.15;
export const RIBBON_WRAP_RADIUS = SHAFT_RADIUS + 0.0007;
// Measured back from the nock to the middle of the wrap, just shy of the
// fletching.
export const RIBBON_TIE_INSET =
  FLETCH_LENGTH + FLETCH_INSET + RIBBON_WIDTH / 2 + 0.006;

export function arrowDirection({ azimuth, elevation }, target) {
  const az = (azimuth * Math.PI) / 180;
  const el = (elevation * Math.PI) / 180;
  return target.set(
    Math.cos(el) * Math.cos(az),
    Math.sin(el),
    Math.cos(el) * Math.sin(az)
  );
}

const VOLLEY_AIM = [-0.14, 0.13, -0.032];
const LENGTHS = [0.42, 0.49];

// The arrows a config puts in him: the painting's four, or a seeded volley
// struck into the same low back — wounds scattered round it, shafts fanned
// about one flight, the ribbon on one of the middle arrows.
export default function layoutVolley(config) {
  if (config.volley !== 'rolled') return PAINTING_VOLLEY;
  const rng = createRng(`volley:${config.volleySeed}`);
  const count = Math.min(
    MAX_ARROWS,
    Math.max(1, Math.round(config.arrowCount))
  );
  const spread = config.volleySpread;
  const arrows = Array.from({ length: count }, (_, i) => {
    const tier = count > 1 ? 1 - (2 * i) / (count - 1) : 0;
    return {
      aim: [
        VOLLEY_AIM[0] + (rng() - 0.5) * 0.012,
        VOLLEY_AIM[1] + tier * spread * 0.8 + (rng() - 0.5) * spread * 0.5,
        VOLLEY_AIM[2] + (rng() * 2 - 1) * spread * 0.45,
      ],
      azimuth:
        config.volleyAzimuth +
        (rng() * 2 - 1) * Math.max(3, config.volleyFan * 0.12),
      elevation:
        config.volleyElevation +
        (tier * config.volleyFan) / 2 +
        (rng() - 0.5) * config.volleyFan * 0.2,
      key: `a${i}`,
      length: LENGTHS[0] + (LENGTHS[1] - LENGTHS[0]) * rng(),
    };
  });
  const ribbon =
    count > 2 ? 1 + Math.floor(rng() * (count - 2)) : Math.floor(rng() * count);
  arrows[ribbon].ribbon = true;
  return arrows;
}
