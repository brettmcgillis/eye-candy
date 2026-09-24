// Strands resampled to one fixed point count pack into a single buffer with a
// uniform stride, so `instanceIndex` alone finds a strand's slice and one
// instanced draw renders all of them. Points are [x, y, z, w, aux?]: xyzw fills
// `points`, the optional fifth channel fills `aux`.
export default function packStrands(strands, pointsPerStrand) {
  const points = new Float32Array(strands.length * pointsPerStrand * 4);
  const aux = new Float32Array(strands.length * pointsPerStrand);

  strands.forEach((strand, s) => {
    strand.forEach((p, i) => {
      const at = s * pointsPerStrand + i;
      points.set([p[0], p[1], p[2], p[3] ?? 0], at * 4);
      aux[at] = p[4] ?? 0;
    });
  });

  return { aux, count: strands.length, points };
}
