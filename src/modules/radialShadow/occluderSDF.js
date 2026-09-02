import { If, float } from 'three/tsl';

import { NO_HIT } from './constants';
import {
  sdAnnulus,
  sdArrow,
  sdAsterisk,
  sdBox,
  sdChevron,
  sdCircle,
  sdClover,
  sdClub,
  sdCross,
  sdDiamond,
  sdEllipse,
  sdHeart,
  sdInfinity,
  sdPin,
  sdSpade,
  sdTag,
  sdTriangle,
} from './shapes';

// Shape ids are this list's order, and every consumer's dropdown has to match
// it. An If/ElseIf chain rather than nested selects so only the active shape's
// SDF is evaluated per sample.
export const ANALYTIC_SHAPES = [
  'Circle',
  'Box',
  'Triangle',
  'Diamond',
  'Cross',
  'Ring',
  'Heart',
  'Clover',
  'Spade',
  'Club',
  'Chevron',
  'Tag',
  'Asterisk',
  'Infinity',
  'Pin',
  'Arrow',
  'Ellipse',
];

// `fallback(shapeId, p, r, bound)` handles ids past the analytic set — that is
// where CrossTalk hangs its baked-SDF artwork atlas. Scenes with no artwork
// leave it out and any out-of-range id reads as empty space.
export const buildOccluderSDF =
  (fallback = null) =>
  (shapeId, p, osize) => {
    const r = osize.x;
    const d = float(NO_HIT).toVar();
    If(shapeId.lessThan(0.5), () => d.assign(sdCircle(r, p)))
      .ElseIf(shapeId.lessThan(1.5), () => d.assign(sdBox(osize, p)))
      .ElseIf(shapeId.lessThan(2.5), () => d.assign(sdTriangle(p, r)))
      .ElseIf(shapeId.lessThan(3.5), () => d.assign(sdDiamond(p, r)))
      .ElseIf(shapeId.lessThan(4.5), () => d.assign(sdCross(p, r)))
      .ElseIf(shapeId.lessThan(5.5), () => d.assign(sdAnnulus(p, r)))
      .ElseIf(shapeId.lessThan(6.5), () => d.assign(sdHeart(p, r)))
      .ElseIf(shapeId.lessThan(7.5), () => d.assign(sdClover(p, r)))
      .ElseIf(shapeId.lessThan(8.5), () => d.assign(sdSpade(p, r)))
      .ElseIf(shapeId.lessThan(9.5), () => d.assign(sdClub(p, r)))
      .ElseIf(shapeId.lessThan(10.5), () => d.assign(sdChevron(p, r)))
      .ElseIf(shapeId.lessThan(11.5), () => d.assign(sdTag(p, r)))
      .ElseIf(shapeId.lessThan(12.5), () => d.assign(sdAsterisk(p, r)))
      .ElseIf(shapeId.lessThan(13.5), () => d.assign(sdInfinity(p, r)))
      .ElseIf(shapeId.lessThan(14.5), () => d.assign(sdPin(p, r)))
      .ElseIf(shapeId.lessThan(15.5), () => d.assign(sdArrow(p, r)))
      .ElseIf(shapeId.lessThan(16.5), () => d.assign(sdEllipse(p, r)))
      .Else(() => {
        if (fallback) d.assign(fallback(shapeId, p, r));
      });
    return d;
  };
