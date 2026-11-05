# Cumulus pipeline

All My Thoughts Are So Cumulus and CumulusCLI share `@modules/cumulus`
(the option schema, preset library, seeded rolls, framing and plot) and
`@modules/cumulusRender` (the actual R3F subject and WebGL capture stage).
Every Leva control in the scene is a schema option: halo transforms, the stage
(background, environment, ambient, key and spot lights, float speed, bloom) and
the anatomy (cloud, skull with its bones, femur, censor panel). The scene
builds those folders from `RENDER_OPTIONS`, so a control cannot exist in one
place only. Camera modes, grid helpers and halo scroll stay scene-only.
Skull and femur stay visible and the float stays off in batches, including
Universal, until a form pin or typed flag says otherwise.

## Workbench

Open `/dev/cumulus` (alias `/dev/CumulusCLI`). Included halos are individual
checkboxes: Rings, Gradient rings, Atomic, Network, Record, Plate, Static
and Universal. At least one stays selected. The pool controls unpinned
batch rolls; an explicitly pinned halo type takes precedence. A typed CLI
flag or a form pin holds that property while the other facets roll. The halo
preset supplies the stage and anatomy (Static's black set and blue spotlight,
Universal's hidden cloud and censor panel) until the `stage` or `anatomy`
facet, or one key in it, is pinned; vector options take `{x,y,z}` as three
number fields or JSON on the CLI.

Live uses the same WebGL stage as batch capture. Drag to orbit, Space to
pause, F to frame, R to roll, and C to capture. Start from preset pins
one of the eight scene presets (its values plus default placement and motion)
so a new variation begins exactly there; Keep pins the current
variation; Use this camera pins the orbit angles and zoom. Capture rebuilds
the seeded stage offscreen at output size and advances the fixed clock to
the frozen frame, then submits its image, SVG and sidecar through the common
capture route. Geometry, motion and plot use that one camera and clock.

## Outputs

- `npm run cumulus:generate -- --halos rings,gradient --count 12 --batch clouds --svg`
- `npm run cumulus:generate -- --halos gradient --svg --no-webp --svgMonochrome`
- `npm run cumulus:video -- --mode montage --count 8 --hold 3`
- `npm run cumulus:video -- --mode motion --halos record --fps 30 --hold 5`

The default canvas is 1700 × 1200, with a 215.9 × 152.4 mm
(8.5 × 6 inch) SVG and a 0.4 mm pen. Existing saved jobs keep their options;
re-render them at the intended size in Plotterizer rather than shrinking old
line work. Stills write lossless WebP, SVG and `props.json`; video supports MP4 and WebM,
including transparent WebM. Montage holds each generation; motion advances
the halo's authored animation; turntable adds a camera orbit. `frameTime`
selects the initial instant. The `camera` facet rolls the hero shot like DumpsterFire's: azimuth
−60…30°, elevation 6…34°, zoom 0.92…1.2, a ±5° tilt and a small vertical
shift; front, profile and back keep their fixed azimuths with the rolled
elevation and zoom. `--keep camera` (or pinning a key) holds it, and Start
from preset holds it at the default. Generation seeds reproduce atom packing and
network layout as well as option rolls.

SVG uses read-back geometry contours and creases with depth occlusion,
network lines and points, and density-controlled shading from the frozen
render. Ink colors come from an unlit material pass (including texture
maps); WebGL shader effects retain their shader colors. The skull and femur outline in `svgAnatomyInk` so pale bone stays legible;
with `svgColors` set it snaps to the nearest plot ink, so it never spends a
pen of a small budget. Rolled ring bands take five colours spread across the
palette in a shuffled order. Black ink only forces monochrome lines and shading.
Lines and shading share one palette (`svgColors` inks, 8 when 0) and one
layer per ink; an ink within `svgPaperDistance` (CIELAB ΔE) of `svgPaper`
is darkened until it clears it, so pale bone keeps a bone pen instead of
going unshaded, and the shading's ink map takes the commonest ink around
each pixel so texture flecks don't shade as specks. Silhouette, contours, creases (with crease
angle), texture contours and a min length are switchable for the halo, and
the scanned bones have their own contour/crease switches, coarser crease
angle and min length. Network points plot as circles at their rendered size
(`svgNodes`). An empty `svgStroke` uses the pen width. Shade style, spacing,
angle, gamma, pen width and plot width control plotting density. Plots contain vector pen strokes, not
embedded images. Cloud transparency, CRT noise and the sun shader's displacement have no exact
mesh outline; their visible tone is represented by image-driven line work.
The censor's physical box is excluded from mesh outlines. Its empty background
pixels are excluded from coverage, while its depth still hides the smooth
curves behind it. The shader's existing capture callback is refreshed during
the unlit pass so the pixelated lanes use the same inks as the exposed rings. Bloom is captured in raster output;
a pen plot represents the subject through line work and tone rather than
reproducing emitted light. Open in Plotterizer handles pen mapping and DXF.

### One-view ink study

**Drawing method → Ink study** (`--svgDrawing ink`) is a separate drawing
method under visual review on one fixed generation at 8.5 × 6 inches with
a 0.4 mm pen. **Contour detail** remains the default.

The study traces color-region boundaries for continuous halo lanes and
pixelated censor steps. Each lane has one hatch direction. **Pixel square
size (mm)** (`svgCensorCellMm`, default 4 mm) sizes the plot's actual shader
sampling grid physically, so higher capture resolution does not shrink its
squares. Each occupied cell takes one captured ink and has an explicit
outline, including borders shared by two cells of the same color. Shared
borders are drawn once in the anatomy outline ink; color hatching is inset
from the cell edges. A separate sampled-subject mask excludes empty glass,
including white background samples. The live/raster pixel-size setting and
capture textures are restored after SVG export.

Bone tone comes from the capture without the cloud: small isolated regions
are removed and neighboring deep shadows are joined. Shadow areas use one
open hatch direction with a minimum 1 mm center spacing (2.5 nibs), leaving
0.6 mm of paper between nominal 0.4 mm strokes. Midtone uses at least 1.6 mm
spacing (4 nibs). There are no overlapping fill strokes or scan-ridge marks. The skull and
femur have separate identity masks in the same capture pass. Skull details
come from contrast edges in the skull-only lit capture, with nib-scale
smoothing, non-maximum suppression and connected-edge hysteresis. This
preserves the source's socket rims, cheekbones and nasal opening instead
of outlining merged shadow blobs. Sparse jittered tone dots retain the
cranial side shadow without facial hatch lines or solid fills. Dots use
small arc strokes so they survive plot parsing and the Curio's 0.05 mm
coordinate grid; their pitch is at least 2.5 nibs with clearance from edges.
Hatching is restricted to the femur. The femur is
cut back by 1.75 nib widths around the visible skull so their outlines do
not fuse at the overlap. Cloud lobes use the full inscribed billboard
footprints, with a few long interior puff arcs and no stipple grain.
Cloud lobes use the actual frozen billboard positions and sizes as rounded
footprints, depth-clipped behind solids and given lower priority than the
bone silhouette. This is a deliberate ink interpretation of the sprite
cloud, rather than a contour of its fuzzy composite image.

The study uses physical pen width for every stroke and hides the existing
contour/shading-style controls while selected. It has not been approved as
the general batch treatment; judge the fixed proof visually before extending
it. Readability at the intended paper size and a physical pen test are the
acceptance criteria; crowding statistics alone do not establish quality.

### Shading regions

The capture separates four regions:

- **Solids** (halo): tone is the region's own light stretched between its
  2nd and 98th percentile, retaining 35% of the render's luma. Eroding the
  mask by half the shade spacing leaves thin orbit tubes and ring rims to
  their outlines.
- **Bones**: a separate id mask gives the skull and femur smooth silhouettes
  in `svgAnatomyInk`. The default **Bone detail source: structure** uses a
  geometry-only view-space normal pass and the linear depth pass. Both are
  sampled and smoothed at half-nib scale; normal changes and depth curvature
  locate ridges and cavities without following texture grain or every mesh
  crease. Non-maximum suppression traces their centerlines. Silhouettes take
  priority, nearby duplicate features are removed, and short socket/nasal
  marks survive the legacy mesh minimum-length filter. Bone shading defaults
  to a single hatch direction, with clearance around these features.
- **Cloud** (`userData.plotCloud`): sprite planes stay out of mesh line work.
  An isolated opacity pass retains solid depth occlusion. It temporarily
  reduces the cloud material opacity to 18%, then restores it: overlapping
  sprites no longer saturate the pass before their density can be read.
  The visible density supplies the outer contour, two puff contours and
  sparse stippling. Cloud tone does not come from the composite bone/halo
  image, and cloud marks use the dedicated cloud style.
- **Censor** (`userData.plotCensor`): only pixelated subject pixels plot.
  Boundaries between inks follow the shader's block grid, and each ink gets
  an even, axis-aligned hatch independent of its rendered brightness. Smooth
  curves stop at the panel and resume outside it; empty glass has no frame
  or fill. Censor shading stays rectilinear regardless of the halo style.

### Detail, styles and physical spacing

**Halo shading** (`svgShading`), **Bone shading** (`svgAnatomyShading`),
**Cloud shading** (`svgCloudShading`) and **Censor shading**
(`svgCensorShading`) are independent. Set all four to `none` for outlines
alone. Bone detail remains independently selectable as `structure`, `mesh`
(the legacy contour/crease controls), or `none` (silhouette only).
**Structure sensitivity** retains shallower ridges at higher values;
**Shortest structural feature (mm)** defaults to 0.6 mm.

New controls take their defaults even when loading an older job, so saved
bone-crease toggles only apply after selecting `mesh`. Existing halo style
and texture settings stay intact. Geometry strokes take priority over
optional texture contours; near-duplicates are suppressed before shading.

**Minimum shade spacing (mm)** defaults to 1.1 mm. Each style also reserves
room for its full mark: loops get wider rows, dots get radius plus half-nib
boundary clearance, and neighboring dots cannot overlap. Stroke styles are
clipped to their safe region, including TSP connections across holes. Bone
and halo shading stop short of structural outlines. Cumulus passes
`equalize: false` to plotKit's shading so squiggle, scribble and TSP preserve
the chosen light tones instead of redistributing them across the full dark
range; other consumers retain plotKit's existing equalization default.

All extra captures and extraction run only for SVG export, using the same
frozen camera and clock. Normal capture is skipped for non-structural modes,
and structural mode avoids reading the scanned bone meshes back to JS.
Materials, opacity, visibility, background and capture textures are restored
after export. Live animation gains no extra per-frame passes.

Spacing never falls below 2.5 times the pen width. Embossed lettering on the
plate is normal-map detail, so only `--svgTexture` picks it up.

## Headless WebGL

These are WebGL materials, including CRT Static and the procedural sun.
The CLI bundles the shared stage in memory with Vite, launches an isolated
headless Chrome profile, and serves public assets by Chrome DevTools request
interception. It does not start or use a dev server. Set `CUMULUS_CHROME` to
a Chrome/Chromium executable when it is not at a standard macOS or Linux
location. The browser profile is removed on completion. Existing loaders
may fetch their Draco decoder and drei environment/cloud assets remotely,
just as the scene does. `CUMULUS_DEBUG=1` prints browser requests and errors.

Run `npm run cumulus:check` for schema and registration drift checks and
`npm run cumulus:check -- --render` to render every halo and its vector plot.
`npm run live:check -- cumulus` dispatches to the same WebGL capture check. Also run `npm run workbench-chrome:check`, lint and format.
