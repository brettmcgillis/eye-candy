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

Stills write lossless WebP, SVG and `props.json`; video supports MP4 and WebM,
including transparent WebM. Montage holds each generation; motion advances
the halo's authored animation; turntable adds a camera orbit. `frameTime`
selects the initial instant. Generation seeds reproduce atom packing and
network layout as well as option rolls.

SVG uses read-back geometry contours and creases with depth occlusion,
network lines and points, and density-controlled shading from the frozen
render. Ink colors come from an unlit material pass (including texture
maps); WebGL shader effects retain their shader colors. The skull and femur have a separate dark outline ink so pale bone colors
remain legible on paper. Black ink only forces monochrome lines and shading.
Lines and shading share one palette (`svgColors` inks, 8 when 0) and one
layer per ink; inks within `svgPaperDistance` (CIELAB ΔE) of `svgPaper` are
dropped so nothing is drawn in a pen that vanishes on the page, and the
shading's ink map takes the commonest ink around each pixel so texture
flecks don't shade as specks. Silhouette, contours, creases (with crease
angle), texture contours and a min length are switchable for the halo, and
the scanned bones have their own contour/crease switches, coarser crease
angle and min length. Network points plot as circles at their rendered size
(`svgNodes`). An empty `svgStroke` uses the pen width. Shade style, spacing,
angle, gamma, pen width and plot width control plotting density. Plots contain vector pen strokes, not
embedded images. Cloud transparency, CRT noise, the sun shader's displacement
and censor refraction have no exact mesh outline; their visible tone is
represented by image-driven shading. Bloom is captured in raster output;
a pen plot represents the subject through line work and tone rather than
reproducing emitted light. Open in Plotterizer handles pen mapping and DXF.

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
