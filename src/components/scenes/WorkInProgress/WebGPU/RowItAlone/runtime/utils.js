export function dictIntersection(dictA, dictB) {
  const intersection = {};

  Object.keys(dictB).forEach((key) => {
    if (key in dictA) {
      intersection[key] = dictA[key];
    }
  });

  return intersection;
}

export function dictDifference(dictA, dictB) {
  const difference = { ...dictA };

  Object.keys(dictB).forEach((key) => {
    delete difference[key];
  });

  return difference;
}
