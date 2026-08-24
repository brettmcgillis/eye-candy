import { folder } from 'leva';

// Voxel detail enhancement (utils/detailEnhanceCompute.js) — a settled-
// structure-only refinement pass generalizing "recursive subdivision" from
// Adam Smith's "Two Methods for Voxel Detail Enhancement" (PCGames 2011)
// into two independent modes: erosion (subtractive — replaces originally-
// solid boundary voxels with rougher/chipped fragments) and growth
// (additive — adds fragments into originally-empty voxels next to solid
// material). Structural: toggling it, or changing any of these, retriggers
// a regenerate (see VoxelField.jsx's pickStructuralSettings) since it
// re-runs the enhancement compute pass.
export default function getDetailEnhanceControls(p = {}) {
  return folder(
    {
      detailEnhanceEnabled: {
        label: 'Enabled',
        value: p.detailEnhanceEnabled ?? false,
      },
      // How many nested subdivision passes to run — 1 is the original
      // single half-size fine tier (a coarse voxel's own 2x2x2 fragments,
      // at most one octant of which can ever fully erode away, since the
      // rest each keep at least one solid neighbor). >1 recurses the SAME
      // candidate-then-fragment pattern onto the previous pass's own
      // surviving fragments, letting material thin out across multiple
      // scales (16->8->4->2->1) instead of chipping at only one fixed
      // granularity, which reads as "voxels just getting culled" rather
      // than eroded at 1 level. Levels beyond the first share this
      // folder's erosion/growth/threshold/sharpness settings rather than
      // getting their own copies, and only ever erode (a fragment that
      // survives to be exposed is by definition already solid, so there's
      // no "empty" fragment left to grow further) — also structural, since
      // each level is its own compute + compaction pass.
      subdivisionLevels: {
        label: 'Subdivision Levels',
        value: p.subdivisionLevels ?? 2,
        min: 1,
        max: 4,
        step: 1,
      },
      // Multiplies erosionCoverage up at each level beyond the first (level
      // N uses erosionCoverage * boost^(N-1), clamped to 1) — counteracts
      // the natural falloff of a flat shared coverage value applied
      // repeatedly: per split, only 1 of a candidate's 8 children is ever
      // guaranteed to die (the one facing entirely away from its own
      // parent's sibling — see detailEnhanceCompute.js), so most material
      // survives each level unless coverage climbs to compensate. 1 = no
      // boost, matches the flat shared-coverage behavior before this
      // control existed.
      subdivisionCoverageBoost: {
        label: 'Subdivision Growth',
        value: p.subdivisionCoverageBoost ?? 1.5,
        min: 1,
        max: 3,
        step: 0.1,
      },
      // How many of a voxel's 6 face-neighbors must differ in occupancy
      // before it's even a detail CANDIDATE — 1 = the entire exposed
      // surface qualifies (this scene's porous CA means that's nearly
      // everywhere, so coverage ends up perforating broad flat faces too,
      // reading as "the whole structure changed"); 2 = edges only (two
      // faces meeting); 3+ = corners/thin features only. This is what
      // concentrates detail at edges/corners like the reference piece
      // instead of scattering it uniformly — tune THIS first if
      // erosion/growth coverage feels like it reshapes everything at once.
      detailMinSharpness: {
        label: 'Min Sharpness',
        value: p.detailMinSharpness ?? 2,
        min: 1,
        max: 6,
        step: 1,
      },
      // Fraction of originally-SOLID boundary voxels that get eroded
      // (replaced by rougher fine fragments, carved out of the kept/
      // greedy-mesh tier). The scene's CA tends to generate porous/lacy
      // structures where nearly every solid voxel sits on a boundary, so
      // without this gate erosion would mean "nearly the whole structure."
      // Also a real perf dial — lower it if detail-enhance feels heavy.
      erosionCoverage: {
        label: 'Erosion Coverage',
        value: p.erosionCoverage ?? 0.2,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // Fraction of originally-EMPTY boundary voxels that get growth
      // fragments added (debris/detail bleeding outward into the air next
      // to solid material) — independent of erosionCoverage, since it's a
      // different effect (additive, never touches the kept tier at all).
      growthCoverage: {
        label: 'Growth Coverage',
        value: p.growthCoverage ?? 0.2,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // Count of {source voxel, +/-X neighbor, +/-Y neighbor, +/-Z neighbor}
      // (whichever 3 directional neighbors face the fragment's octant) that
      // must be solid for a fine fragment to turn on — max 4. Low (1) yields
      // chipped/Sierpinski-like facets; high (3-4) yields smoother, rounded
      // strata (paper §2). Shared by both erosion and growth fragments.
      detailThreshold: {
        label: 'Threshold',
        value: p.detailThreshold ?? 2,
        min: 0,
        max: 4,
        step: 1,
      },
      detailAltitudeVariance: {
        label: 'Altitude Variance',
        value: p.detailAltitudeVariance ?? false,
      },
      // Only applies where a fragment's own (fine-grid) altitude is odd —
      // alternates with `detailThreshold` to yield the paper's strata look
      // instead of a uniform threshold everywhere.
      detailThresholdHigh: {
        label: 'Threshold (High Alt.)',
        value: p.detailThresholdHigh ?? 3,
        min: 0,
        max: 4,
        step: 1,
      },
      // Debug aid for spotting tier-vs-tier z-fighting — forces each
      // subdivision tier to its own solid flat color (bypassing palette AND
      // lighting via emissive, see TIER_DEBUG_COLORS in VoxelField.jsx) so
      // overlaps between tiers are unmistakable at a glance, live-toggleable
      // with no regenerate needed.
      debugTierColors: {
        label: 'Debug Tier Colors',
        value: p.debugTierColors ?? false,
      },
    },
    { collapsed: true }
  );
}
