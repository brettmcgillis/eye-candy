import { mulberry32 } from '@utils/noise2d';

// Upper bound on the uniform array the grass and terrain shaders loop over.
// Must not be lowered below the herdCount control's max.
export const MAX_HERD = 6;

// The herd never translates — the field scrolls underneath it — so a member's
// position is only its standing spot in the frame, and the grass and terrain
// can treat these as fixed obstacles to bend and darken around.
export default function herdLayout({ count, seed, spread }) {
  const random = mulberry32(seed);

  return Array.from({ length: count }, (_, index) => {
    const lane = count === 1 ? 0 : index / (count - 1) - 0.5;

    return {
      clipOffset: random(),
      key: index,
      position: [
        lane * spread + (random() * 2 - 1) * spread * 0.08,
        0,
        (random() * 2 - 1) * spread * 0.35,
      ],
      rotation: (random() * 2 - 1) * 0.12,
      scale: 0.9 + random() * 0.25,
    };
  });
}
