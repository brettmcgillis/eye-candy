import { KIND } from './graph';

const STEM_CLASS = new Set([KIND.stem, KIND.leaf]);

export default function measure(graph, p) {
  const n = graph.count;
  const stemTime = new Float32Array(n);
  const crownDist = new Float32Array(n);
  const pathDist = new Float32Array(n);
  const tips = new Float32Array(n);
  const leafT = new Float32Array(n);
  let stemLength = 1e-6;
  let maxCrown = 1e-6;
  let maxPath = 1e-6;

  for (let i = 0; i < n; i += 1) {
    const parent = graph.parent[i];

    if (parent >= 0) {
      const len = Math.hypot(
        graph.x[i] - graph.x[parent],
        graph.y[i] - graph.y[parent],
        graph.z[i] - graph.z[parent]
      );

      pathDist[i] = pathDist[parent] + len;

      if (graph.kind[i] === KIND.leaf) {
        const along = graph.kind[parent] === KIND.leaf ? leafT[parent] : 0;

        leafT[i] = along + len / (p.leafLength * 1.15);
      }

      if (STEM_CLASS.has(graph.kind[i])) {
        stemTime[i] = stemTime[parent] + len;
        crownDist[i] = 0;
      } else {
        stemTime[i] = stemTime[parent];
        crownDist[i] = crownDist[parent] + len;
      }

      if (graph.kind[i] === KIND.stem) {
        stemLength = Math.max(stemLength, stemTime[i]);
      }

      maxCrown = Math.max(maxCrown, crownDist[i]);
      maxPath = Math.max(maxPath, pathDist[i]);
    }
  }

  for (let i = n - 1; i >= 0; i -= 1) {
    if (tips[i] === 0) {
      tips[i] = 1;
    }

    if (graph.parent[i] >= 0) {
      tips[graph.parent[i]] += tips[i];
    }
  }

  const logMaxTips = Math.log(Math.max(tips[0], 2));
  const birth = new Float32Array(n);
  const thickness = new Float32Array(n);
  const crownT = new Float32Array(n);
  const flex = new Float32Array(n);

  for (let i = 0; i < n; i += 1) {
    const stemPart = Math.min(1, stemTime[i] / stemLength);
    const crownPart = (crownDist[i] / maxCrown) ** p.burst;

    birth[i] = p.stemPhase * stemPart + (1 - p.stemPhase) * crownPart;
    thickness[i] =
      graph.kind[i] === KIND.leaf
        ? -Math.max(1 - leafT[i], 0.02)
        : Math.log(tips[i]) / logMaxTips;
    crownT[i] = crownDist[i] / maxCrown;
    flex[i] = pathDist[i] / maxPath;
  }

  return { birth, crownT, flex, leafT, thickness, tips };
}
