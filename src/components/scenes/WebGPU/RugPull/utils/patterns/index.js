import {
  orientalRug,
  persianCarpet7,
  persianCarpet18,
  persianRug,
} from './channelLoop';
import {
  blackAndWhiteRug,
  greenAndGoldFlowerRug,
  redAndBlackRug,
  redAndBlueRug,
} from './feedback';
import { fractalKnots7, frostFractal } from './knots';
import funkyMotherboardCarpet from './motherboard';

export const PATTERNS = {
  persianCarpet7: { label: 'Persian Carpet 7', build: persianCarpet7 },
  persianRug: { label: 'Persian Rug', build: persianRug },
  orientalRug: { label: 'Oriental Rug', build: orientalRug },
  persianCarpet18: { label: 'Persian Carpet 18', build: persianCarpet18 },
  blackAndWhiteRug: { label: 'Black & White Rug', build: blackAndWhiteRug },
  redAndBlueRug: { label: 'Red & Blue Rug', build: redAndBlueRug },
  redAndBlackRug: { label: 'Red & Black Rug', build: redAndBlackRug },
  greenAndGoldFlowerRug: {
    label: 'Green & Gold Flower Rug',
    build: greenAndGoldFlowerRug,
  },
  fractalKnots7: { label: 'Fractal Knots 7', build: fractalKnots7 },
  frostFractal: { label: 'Frost Fractal', build: frostFractal },
  funkyMotherboardCarpet: {
    label: 'Funky Motherboard Carpet',
    build: funkyMotherboardCarpet,
  },
};

export const PATTERN_OPTIONS = Object.fromEntries(
  Object.entries(PATTERNS).map(([id, { label }]) => [label, id])
);
