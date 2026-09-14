function centre(district) {
  const { h, w, x, y } = district.bounds;

  return { x: x + w / 2, y: y + h / 2 };
}

function spiralOrder(districts) {
  const reach = Math.max(
    ...districts.map((district) =>
      Math.hypot(centre(district).x, centre(district).y)
    )
  );

  return [...districts]
    .map((district) => {
      const { x, y } = centre(district);
      const ring = Math.round((Math.hypot(x, y) / reach) * 2);

      return { angle: Math.atan2(y, x), index: district.index, ring };
    })
    .sort((a, b) => a.ring - b.ring || a.angle - b.angle)
    .map((entry) => entry.index);
}

export function districtOrder(mode, districts) {
  if (mode === 'spiral') {
    return spiralOrder(districts);
  }

  return districts.map((district) => district.index);
}

export function nextDistrict({ last, mode, occupied, order, turn }) {
  const candidates = order.filter((index) => occupied.includes(index));

  if (!candidates.length) {
    return { index: null, turn };
  }

  if (mode === 'random') {
    const pool =
      candidates.length > 1
        ? candidates.filter((index) => index !== last)
        : candidates;

    return { index: pool[Math.floor(Math.random() * pool.length)], turn };
  }

  const next = (turn + 1) % candidates.length;

  return { index: candidates[next], turn: next };
}
