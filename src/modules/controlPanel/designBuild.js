import { createRng } from '@modules/flora';

import { AREAS, UNITS, buildBadge, buildBlank } from './controls';
import { controlSize } from './designTransforms';
import createKit from './kit';
import { quatZ } from './parts';

const SPECIALS = { badge: buildBadge, blank: buildBlank };

export default function fillDesign(context, leaf, transform, makeControl) {
  const { config, style } = context;
  return leaf.design.controls.map((item) => {
    const seed = `${leaf.design.seed}:${item.id}:${item.seed}`;
    const kit = createKit(style, createRng(`${seed}:kit`), {
      labelled: createRng(`${seed}:label`)() < config.labelChance,
    });
    const size = controlSize(item);
    const rotation = item.rotation ?? 0;
    const unit = UNITS[item.type];
    const built = unit
      ? unit.build(kit, {
          domain: config.domain,
          variant: item.variant,
          k: size.w,
        })
      : (SPECIALS[item.type] ?? AREAS[item.type].build)(kit, {
          domain: config.domain,
          variant: item.variant,
          w: size.w,
          h: size.h,
        });
    const x = item.x + item.w / 2 - leaf.w / 2;
    const y = leaf.h / 2 - item.y - item.h / 2;
    return makeControl(
      item.type,
      built,
      {
        ...transform,
        ...(rotation && { q: quatZ((-rotation * Math.PI) / 180), rotation }),
        offset: [
          transform.offset[0] + x * transform.scale,
          transform.offset[1] + y * transform.scale,
          transform.offset[2],
        ],
      },
      createRng(`${seed}:signals`),
      [size.w / 2, size.h / 2]
    );
  });
}
