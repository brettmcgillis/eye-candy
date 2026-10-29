export function cSq(size, position, color) {
  return {
    size,
    position,
    color,
  };
}

export function sq(size, position) {
  return cSq(size, position, 'white');
}
