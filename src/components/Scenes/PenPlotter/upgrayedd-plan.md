## Plan: Plotter Renderer Layer Expansion

Implement three coordinated upgrades to PlotterTest: make crosshatching a first-class independent layer, add optional point/line-cloud plotting layers with density optimizations, and enforce robust frustum/viewport clipping so exported SVG edges cannot extend beyond visible bounds.

**Steps**

1. Phase 0 - Baseline and compatibility guardrails: catalog current config keys and preset shape, then define a backward-compatible migration map from `secondHatchPass`/`secondHatchPassAngle` to new crosshatch keys. This unblocks phased rollout without breaking saved snapshots.
2. Phase 1 - Crosshatch as independent layer (parallel with Step 3): add dedicated controls and config fields for crosshatch (visibility, axis rotation/spacing, inset, connect behavior, segment cap, stroke/stroke-width if desired), and refactor renderer pass construction so primary hatch and crosshatch each have their own per-pass options object. The current layers appear as discrete collections (Edges, Shading, Silhouettes) once imported into Inkscape. Cross hatching should appear as Secondary Shading
3. Phase 1 - Point/line cloud layers (parallel with Step 2): add separate optional renderer layers for `Points` and `LineSegments` primitives with explicit appearance controls (point radius/color/opacity, line stroke/width/opacity, layer order), plus extraction/projection paths that do not depend on mesh edge extraction.
4. Phase 2 - Density/perf optimization for clouds (depends on 3): implement screen-space optimization pipeline: coordinate quantization, exact/epsilon deduplication, density cap, optional simplification for line segments, and deterministic ordering so export output remains stable between runs.
5. Phase 2 - Clipping and visibility hardening (depends on 2 and 3): enforce ordered clipping pipeline: frustum reject in 3D, near-plane handling for crossing segments, 2D viewport clipping to SVG bounds, and remove/replace current out-of-bounds fallback that marks segments visible without clipping.
6. Phase 3 - Integrate controls and presets (depends on 2, 3, 4, 5): wire new layer toggles/options into PlotterTest Leva controls and presets, maintain temporary support for old crosshatch keys, then add migration cleanup path once validated.
7. Phase 4 - Validation and regression checks (depends on all prior steps): verify side-by-side preview/export parity, confirm no out-of-bounds SVG coordinates for edges/line layers, test with primitives, dense clouds, and network scenes, and profile render/export responsiveness.

**Relevant files**

- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/usePlotterTestControls.js` - add new layer control groups and migration-era control mapping.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/plotterTestPresets.js` - add defaults/presets for crosshatch layer and point/line layer options.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/PlotterTest.jsx` - map control state into renderer options; preserve backward compatibility for legacy crosshatch keys.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/examples/PlotterRenderer/plotter-renderer.js` - add independent layer option objects, render-order orchestration, and invocation of new primitive-layer/clipping flows.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/examples/PlotterRenderer/hidden-line.js` - implement frustum rejection + near-plane logic + viewport clipping and remove permissive out-of-bounds visibility fallback.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/examples/PlotterRenderer/gpu-silhouette.js` - keep mesh-only behavior for silhouette/depth pass, but ensure primitive layers do not regress GPU pass assumptions.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/examples/PlotterRenderer/optimize.js` - extend with dedupe/simplification helpers reusable by point/line layer export.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/examples/PlotterRenderer/geom.js` - reuse/add geometric helpers for clipping/simplification primitives.
- `/Users/brettmcgillis/dev/eye-candy/src/components/scenes/PlotterTest/examples/PlotterRenderer/perspective-hatch.js` - ensure hatch/crosshatch pass option parity and per-pass settings compatibility.

**Verification**

1. Control-level checks: toggling `Hatching`, `Crosshatching`, `Points Layer`, and `Lines Layer` independently affects only intended SVG groups.
2. Export bounds checks: all exported line endpoints satisfy viewport bounds (no coordinates beyond clip rectangle except intentional stroke joins).
3. Frustum checks: geometry fully outside camera frustum does not appear in exported edges/lines; geometry crossing near plane is clipped, not exploded.
4. Density checks: on dense clouds, dedupe/quantization reduces segment/point counts while preserving recognizable form; output is deterministic across repeated exports.
5. Visual parity checks: left 3D viewport composition and right plot preview remain conceptually aligned for visible contours and occlusion.
6. Performance checks: export/refresh remains responsive on representative dense scenes; no major regressions versus current baseline.

**Decisions**

- Include: crosshatch as true first-class layer with independent controls and render pass options.
- Include: points and line segments as explicit optional plot layers, separate from mesh-only hidden-line extraction.
- Include: clipping pipeline that trims segments rather than binary keep/discard.
- Exclude for this cycle: full silhouette-polygon clipping of all non-mesh primitives against region interiors (can be future enhancement after viewport/frustum clipping is stable).
- Migration strategy: keep legacy crosshatch keys temporarily for preset/snapshot compatibility, then deprecate after validation.

**Further Considerations**

1. Point symbol strategy recommendation: start with SVG circles for readability and optional tiny line stubs for plotter-friendliness; keep this user-selectable.
2. Occlusion strategy recommendation: start with viewport/frustum clipping first, then optionally add mesh-depth occlusion for primitive layers behind a toggle due to cost.
3. Layer order recommendation: allow configurable order (`silhouettes -> hatching -> crosshatching -> edges -> lines -> points`) with conservative defaults to avoid visual clutter.
