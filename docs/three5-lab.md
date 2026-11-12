# Three5.JS

An interactive Test Lab for p5.js, p5.brush and Three.js. There is no render
bench. Open `/testlab/three5` for WebGL or `/testlab/three5-webgpu` for WebGPU.
Both register from `src/components/scenes/Shared/Three5/`.

## Start here

Use **Presets** to load one of twenty-seven complete starting points. The active
study's controls appear first; unrelated folders are hidden without dropping
their saved values. Each guide has a **Start with** instruction naming the
relevant folder. **Study → Study** changes technique while retaining settings.
**Study → Backdrop** changes the backdrop; **Texture paper** changes the painting's paper. Camera and Lighting remain shared.

| Study                                                | Primary controls                                    |
| ---------------------------------------------------- | --------------------------------------------------- |
| Brush cabinet                                        | Brush marks; Custom brush edits the two Lab brushes |
| Watercolor paper                                     | Watercolor fills; Hatching                          |
| Painted ceramics / Paint a sculpture                 | Mesh surface; Paint on mesh; Brush marks            |
| Pencil in space / Crayon wireframe / Pastel gestures | 3D lines; Brush marks                               |
| Botanical pencilcrayon                               | Botanical shape; 3D lines; Brush marks              |
| Water held in a drawing                              | Water volume; 3D lines; Watercolor filter in WebGL  |
| Painted diorama                                      | Planes in space; Watercolor fills                   |
| Draw the camera view                                 | Camera drawing; Brush marks; Watercolor fills       |

Reset and Copy share a compact row in Presets. **Paint on mesh → Clear all
strokes** clears the painting. **Camera drawing** contains repaint and drawing
export. **Texture engine and export** holds the engine, resolution, seed,
texture repaint, texture PNG and settings JSON export. **How this study works**
reveals the longer notes; ribbon studies also show their actual baked brush strip.

Selecting a preset or pressing Reset restores its camera and recreates only
the camera controller to discard accumulated orbit inertia. Other control
changes keep the current view. Painting disables orbit interaction through
the camera rig; mouse strokes use full pressure, while pen strokes retain
their pressure input. A click can also leave a small dab.

Mesh painting uses two meshes over one geometry: the saved painting stays on
the base material, and an independent transparent layer shows the current and
not-yet-baked strokes. Updating live ink never uploads or replaces the base
surface. The live texture survives asset replacement and stays visible until
its replacement is ready; the baked-stroke ID prevents already-baked marks
from being retained in the overlay. Completing one gesture while the next is
in progress keeps the new gesture visible. Preview work is limited to one job
in flight with a minimum 60 ms interval, while idle frames do no texture uploads.
Releasing bakes the complete spline and bump map. Pigment blending may settle
slightly when the final opaque painting replaces the live ink.

p5.brush's pigment composite mixes pixels with white paper and can return them
at full alpha even on a transparent drawing target. The adapter reconstructs
coverage from those pixels for stroke strips and live overlays, preserving the
image over white while removing paper from overlaps. Pure white ink retains
the library's original coverage. Ribbon strips extend beyond their source
canvas horizontally to avoid a blank padding gap where closed paths join.
Thin strips use linear filtering without mipmaps, which otherwise average the
pencil core into the empty space beside it when a long texture is compressed
onto short segments. The Pencil and Botanical presets use darker ink and equal
start, middle and end pressures for uninterrupted lines.

The water preset starts with the animated `NurbsWaterColumn` used in Staying
Afloat, with dedicated surface and deep-water colors. The static painted box
remains an explicitly named comparison. Wave controls are shown only for the
animated source; postprocessing controls appear only in the WebGL channel.

The camera preset opens in **compare** mode: the live source appears beside
its painted camera projection. A view offset presents the source at the same
display scale as the square drawing without moving the geometry. The drawing
uses a centered snapshot of that camera. Orbiting flags the drawing as stale;
**Repaint camera view** updates it, or **Repaint on orbit end** does so
automatically. Source-only and drawing-only modes remain available.

The cabinet's **Spray ink boost** defaults to 4. The native spray widens with
pressure while depositing fewer dots, so its fine dots become almost invisible
in these small texture samples. The boost scales only its dot diameter through
`brush.add()`; spread, density, opacity and pressure behavior remain native.
Set it to 1 for the pinned library's original spray. Other saved presets use 1.
Both cabinet samples now use the Start / Middle / End pressure controls.

| Study              | What is actually being rendered                                                                                           | What to try                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brush cabinet      | Every installed built-in brush, two editable custom brushes and a larger pressure-sensitive spline, painted onto a canvas | Compare cpencil, crayon, pastel and charcoal; vary pressure, weight, spline curvature and flow field                                                    |
| Watercolor paper   | Actual p5.brush polygons with watercolor fills, optional hatching and outlines                                            | Compare watercolor with flat wash; toggle drying between shapes; increase grain, edge pigment and pigment separation                                    |
| Painted materials  | A color canvas on a UV-mapped solid, with a separately derived grayscale map                                              | Compare lit, unlit and clean shading; inspect sphere poles and the box's repeated face UVs; vary repeat, rotation, bump and roughness                   |
| Drawn curves in 3D | A baked transparent brush stroke mapped along camera-facing ribbons                                                       | Compare loops, helices and cube wires; turn off camera-facing marks and orbit; toggle the clean centerline                                              |
| Flora study        | Real segments, wires and ornament placements from `@modules/flora`, drawn by a scene-local experimental renderer          | Change crown form, tips and segment budget; compare watercolor ornaments and pencilcrayon stems                                                         |
| Water + outlines   | A painted volume or the shared `NurbsWaterColumn` element, plus brush ribbons along the box edges                         | Compare authored textures, the shared water surface, brush edges and the existing WebGL watercolor filter independently                                 |
| Painted space      | Transparent painted leaf cards arranged in depth                                                                          | Change depth spread, plane count, scale, billboarding, sway and paper backing; orbit to reveal the construction                                         |
| Paint a mesh       | Pointer hits converted through the mesh's transformed UVs into committed p5.brush strokes                                 | Enable Paint gestures and drag for live brush feedback; release to bake the final spline and bump; disable it to orbit; clear marks under Paint on mesh |
| Redraw a 3D view   | A real low-poly knot projected through the active camera, then repainted as polygons with brush edges                     | Compare the visible source and drawing together; orbit, then Repaint camera view; optionally repaint on orbit end                                       |

The **Custom brush** controls affect the two `Lab` brushes. Installed
`crayon` and `pastel` are separate built-in brushes. Flow fields and hatching
apply to the 2D studies and painted cards; a 3D ribbon follows its world-space
path, using a straight baked stroke as its source. Water wave settings apply to
the shared water element. The box-edge ribbons are an illustrative static cage,
not a reconstruction of the animated water boundary.

## Additional technique studies

Eleven studies extend the original nine techniques. Each has a focused control
folder and **Compare and animate → Display**: original, treatment, combined,
or side-by-side. The two sides share a clock; **Run motion** freezes and resumes
it. Static ink separations omit motion controls. Selecting a preset or Reset
clears spatial gestures and restarts the study clock.

| Preset                    | Primary controls    | Mechanism                                                                                                                               |
| ------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Geometry-aware contours   | Mesh contours       | Welded edge adjacency, camera-facing silhouette tests, crease angles and a small CPU depth buffer; hidden segments are dashed           |
| Light-driven pencil       | Light and marks     | Seeded, area-weighted surface samples; normal/light dot products and analytic sphere occlusion choose native brush ribbons              |
| Light-driven watercolor   | Light and marks     | Native watercolor color texture with quantized geometry lighting and analytic sphere occlusion                                          |
| Motion and mark stability | Mark stability      | Surface-attached strokes versus queued native camera repaint; fixed or changing seeds, cadence and retained ink                         |
| Draw in 3D space          | Draw in space       | Live pressure-sensitive ribbons on adjustable world-XY depth planes, with real depth occlusion                                          |
| Paint projection methods  | Paint projection    | Original UVs, clipped `DecalGeometry`, or normal-weighted three-axis sampling baked into a triangle atlas                               |
| Paper in three spaces     | Paper anchoring     | Object/world grain coordinates with physical bump; a separate camera-image multiply overlay for screen paper                            |
| Painted cutouts           | Cut paper           | Alpha-traced leaf contours, card/contour/extruded geometry, vertex curl and light-projected contour shadows on the floor                |
| Pigment as a material     | Pigment as material | Isolated native monochrome witness layers accumulate coverage independently of paint hue; compare it with image luminance               |
| Ink and registration      | Ink separations     | Nonnegative optical-density separation relative to paper white, rotated halftone dots/lines, individual plates and registration offsets |
| Painted particle field    | Painted particles   | Native pastel/spray or leaf stamps on instanced billboards, lifetime fades, seeded drift, back-to-front sorting and an occluder         |

Spatial drawing starts in front of the subject. Change **Drawing plane Z** to
put later gestures behind it; disable **Draw gestures** before orbiting. Pen,
speed-derived and constant pressure are available. Gestures are capped at 32,
with 512 samples each. **Clear space drawing** clears them; settings JSON records
their sampled coordinates and widths. Each gesture keeps its brush texture.
There is no gesture JSON import UI.

The stability study shares one motion transform between the surface and camera
versions. Camera repaint has only one brush job in flight and reports its actual
time above the drawing. Requested repaint frequency is a ceiling; slow brush
jobs skip intermediate views. Seed and retention controls apply to camera
repaint. Surface strokes reuse the original texture.

Triplanar projection uses unique per-triangle UV tiles with padding and linear
filtering. World-anchored animation rebakes at most four times per second;
object-anchored paint stays fixed without new texture uploads. A decal that
misses the mesh displays a message instead of silently showing an empty result.

The cutout floor shadows project the traced contour along the directional
light. They work identically in both renderer channels and avoid rectangular
alpha-card shadow maps. They are hard planar shadows, without self-shadowing
or soft-shadow integration. Thickness and curl remain actual geometry.

The material coverage map accumulates isolated black witness fills made with
the same native fill settings, normalizing out pigment color. It is an authored
deposition signal, not a physical measurement or fluid simulation. Coverage can
control color, roughness, bump, actual vertex displacement or clearcoat. The
treatment display exposes the map itself.

Particles use one instanced draw per field, with per-instance alpha and tint.
WebGL injects these attributes into a basic material; WebGPU uses a matching node
material. Sorting, depth writing and billboarding are independent controls.
Smoke, spray and pollen expose **Stamp color**; leaves expose the native brush
and watercolor controls. The field is capped at 2,000 particles. Large soft
stamps can become fill-rate limited even with a small draw-call count.

## Animated watercolor studies

Four additional presets test animation with the existing Three.js clock. No
animation extension is required for these mechanisms. **Animation timeline**
controls play/pause, a seek position, cycle duration, loop/ping-pong/once playback,
easing, petal count and the paper/sphere target. The seek value is a timeline
position, not a live progress readout; pause and change it to inspect a frame.
The status bar reports actual paint progress, update counts and update time.
Looping reveals hold their completed painting for the last 15% of each cycle.

| Preset              | Mechanism                                                                                      | What to compare                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Blooming watercolor | A precomputed irregular scalar field reveals a baked native painting through a soft alpha mask | Radial, sweep and multi-origin spreading; Treatment shows the mask                                |
| Morphing watercolor | Animated polygon boundaries are repainted with actual p5.brush fills                           | Locked/boiling seeds, movement strength and requested update rate; Treatment shows shape outlines |
| Pigment in motion   | A fixed grid mesh changes UV coordinates beneath a separate stationary paper-grain overlay     | Swirl, drift and ripples; Treatment replaces the painting with a diagnostic UV grid               |
| Ink then watercolor | Native ink and isolated dry washes are baked into layer banks, then composed over time         | Ink first, wash first or together; Treatment isolates the progressively drawn pencil contours     |

Pause freezes the animation clock. Once a pending native frame settles, unchanged
frames do no further canvas or UV uploads. Restart returns to the beginning;
Reset reloads the saved starting phase, settings and camera. Original shows the
finished reference and suspends animated texture work. Both paper and sphere
targets use the same animated material image; orbit the sphere to inspect UV
stretching and seams.

The morphing study keeps only one native brush job in flight. It retains the
previous finished image while painting its replacement and drops stale results
after settings change. Its default is six requested updates per second at
512px, with petal count, resolution and update rate available as cost controls.
The measured update time includes any brush-queue wait. Reveals and sequences
perform bounded Canvas2D compositing; pigment flow only uploads UV coordinates
for a 64-segment grid (or a 64-by-40 sphere) and never repaints during motion.
The stationary paper layer uses separate fixed UVs.

The sequence always uses separately baked dry layers. Its path masks reveal
native brush marks along each contour, and its wash stages fade in separately.
Changing playback order only recomposes the stored layers. Shape, pigment or
brush changes rebuild the banks. **Save animated texture PNG** exports the
currently displayed material image; the shared Media PNG control captures the
3D view. The texture exporter remains available while animation is paused.

These are controlled animation techniques. A spreading reveal suggests a wet
wash, UV flow moves an existing painted image, and native morphing redraws fills.
None of these maintains a continuous water/pigment diffusion or drying state.

## How the bridge works

The standalone brush engine is the default. Select **p5.js + p5.brush** under
**Texture engine and export → Drawing engine** to compare the full p5 integration.

`brushRuntime` owns one hidden drawing canvas for the active engine:

- **p5.js + p5.brush:** instance mode, a WebGL canvas, `noLoop()`, and explicit
  `redraw()` calls. `brush.load(p)` binds each new canvas. In p5 2.x, density is
  applied after the WebGL renderer is created. Each redraw finishes a paint pass.
- **Standalone:** p5.brush's own WebGL2 runtime, with explicit `brush.render()`
  at the end of each pass. This keeps the brush implementation while avoiding
  the full p5 runtime when porting the technique elsewhere.

The dependencies are pinned to p5 2.3.4 and p5.brush 3.0.0. The installed brush
palette includes `crayon` and `pastel`; older README examples mentioning
`marker2` or `hatch_brush` do not describe this release's actual palette.

Both engines draw in the same logical 768-unit space. Texture resolution is
independent of display DPR. The canvas is copied immediately after a completed
pass into a stable 2D canvas before Three.js receives it; the brush canvas is
then free to produce the next asset. Each generation produces:

- An opaque painting for base color.
- A transparent stroke strip, tightly cropped vertically for use on ribbons.
- A transparent watercolor leaf for planes and cards.
- A luminance image for experiments with bump and roughness.

Color maps use sRGB. The luminance map uses `NoColorSpace`. Luminance is only a
convenient experimental height signal: it is not a simulated paint thickness
or an automatically correct normal map.

Paint changes are debounced and queued. Camera, lighting, material settings,
object movement, plane layout and ribbon width do not regenerate the painting.
Generated textures are reused while orbiting and disposed when replaced. The
drawing libraries load only when the lab mounts. Each experiment uses bounded
geometry or instance counts; the guide reports generation time, live frame rate
and WebGL scene draw calls. First-use shader compilation can be substantially slower than
subsequent generations. Large fills and dense custom brushes can still stall
the main thread during generation; lower texture resolution and wash count for
interactive exploration.

`scaleBrushes()` multiplies the library's persistent brush definitions. The lab
undoes the previous scale before setting the next, so repeated redraws do not
keep enlarging the brushes. This scale bookkeeping also survives hot module reloads.

The live checks for mesh painting include active pointer-down captures with the
painted surface and earlier strokes visible, and cover both renderer channels, both drawing
engines, and consecutive gestures before baking finishes. Chrome confirmed
brush texture updates before pointer release, stable baked marks afterward,
and no errors in those runs. The camera comparison was checked in WebGL and
WebGPU, including manual repaint and repaint on orbit end. The preset audit,
scoped ESLint / Prettier checks, and production build pass.

## Applying the findings to art scenes

### Flora

The lab consumes the public `@modules/flora` barrel; it never imports the Flora
scene or changes its generator, materials or saved presets. Structural segments
are joined into continuous paths to avoid stamping one whole fading stroke on
every tiny segment. A portion of the segment budget is reserved for wire
ornaments; the rest prioritizes thicker structural segments. This is a bounded
study, not a replacement for Flora's full GPU growth and wind renderer.

A production variant should share a promoted brush adapter, keep the existing
kernel's birth times and motion, and implement the alternative look in
`@modules/floraRender` so the scene and headless consumers stay consistent.
Compare the stroke-strip approach with projecting the entire specimen: ribbons
stay in 3D and can be occluded, whereas projected repainting gives a more unified
drawing at the cost of redrawing camera views.

### Staying Afloat

The lab reuses `@elements/Water/NurbsWaterColumn` and the existing
`@postprocessing/WebGL/waterColorEffect/WaterColorEffect` without importing the
Staying Afloat scene. The existing filter comparison is WebGL-only; the other
studies run in both channels. The filter affects the rendered scene, including
its brush textures, so it can soften or remove the very marks being evaluated.

A production integration could combine a restrained screen-space filter with
painted object materials and brush outlines following the actual animated
boundary. Painting a UV map does not automatically produce a camera silhouette.

### Drawings arranged in space

Paint cards once, preserve their alpha, then use ordinary Three.js geometry,
depth and camera movement. This is a strong fit for illustrated clouds, foliage,
landscape layers and stage sets. Inspect transparency sorting, silhouettes from
the side and billboard behavior before committing to a camera move. A planar
painting remains planar even when it looks volumetric from its intended view.

## Limits and exports

- The lab is a collection of integration mechanisms, not a universal
  watercolor postprocessing replacement. The projected study explicitly reads
  geometry; it does not accept arbitrary rendered images or reconstruct depth
  from them. It culls backfaces and sorts faces by depth, without exact
  hidden-surface clipping. Intersections can therefore overlap imperfectly.
- Ribbons are flat marks with 3D centerlines. Camera-facing ribbons preserve
  their appearance when orbiting; fixed ribbons can disappear edge-on. Depth
  writing is optional because transparent marks have different sorting and
  occlusion tradeoffs.
- Mesh UVs control stretching, repetition and seams. The generated painting
  is not promised to tile seamlessly. Mesh painting splits strokes at U seams;
  complex UV islands need a more sophisticated painting tool.
- Mesh strokes commit on release and preserve the brush settings used when
  they were made. The most recent 50 stroke fragments are retained. Preset
  selection and Reset clear this transient painting, so a saved preset starts clean.
  Export the color PNG to preserve the final painted appearance; settings JSON
  also records the stroke paths and their settings, but the lab has no JSON
  import UI. Camera-dependent projected images need PNG export for an exact
  record of the chosen view.
- A render bench, roll batches and pen-plot output are outside this lab's scope.
  Keep scene-local adapters here until a second consumer needs them, then
  promote reusable code behind a public module barrel instead of importing
  from this scene.

References: [p5.brush](https://github.com/acamposuribe/p5.brush),
[standalone API](https://github.com/acamposuribe/p5.brush/blob/main/docs/standalone.md),
[Three.js CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html).
