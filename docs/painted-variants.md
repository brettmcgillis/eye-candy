# Painted variants

The first painted collection adds named presets to existing scenes. Existing
presets explicitly retain `paintStyle: original` and their previous artwork
values. The new presets remain unreviewed in Cataloggr and are available locally.

| Scene                          | Preset               | Treatment                                                                             |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------- |
| Kumiko                         | Painted Shoji        | Native watercolor deposits on the paper behind the wooden lattice                     |
| Kumiko                         | Paper Resist         | Painted opening polygons on a continuous sheet; strip-width paper reserves            |
| Kumiko                         | Joiner's Sketchbook  | Overshooting graphite outlines and crisp parallel hatch fills                         |
| All My Thoughts Are So Cumulus | Watercolor Thoughts  | Painted bone and halo materials, translucent native-brush cloud sprites               |
| Flora                          | Botanical Watercolor | Transparent petal washes and mottled watercolor stems                                 |
| Flora                          | Botanical Sketch     | Native petal outlines, veins and hatch fills, with continuous brush strokes for stems |
| Trucheterie                    | Ink and Wash         | Continuous watercolor variation and broken ink contours over a blob field             |
| Iso Lines                      | Watercolor Atlas     | Indigo elevation bands, deposited pigment and fine contour lines                      |
| Iso Lines Relief               | Watercolor Relief    | Teal and ochre washes across raised bands, drawn contours and painted walls           |
| Trucheterie 3D                 | Watercolor Weave     | Pigment on woven ribbons and their raised seams                                       |
| Trucheterie 3D                 | Painted Quilt        | Rose washes over inflated membrane lanes with painted piping                          |
| Stay Hunted                    | Watercolor Fable     | Cool body washes, subtle pencil grain and a crimson painted ribbon                    |
| Paper Cuts                     | Painted Paper        | Bounded pigment fills on separate layers, visible relief and paper-white margins      |
| Argyle                         | Pigment Diamonds     | Native square washes in the existing two-layer lattice                                |

## Loose wash and pencil review

Each artwork above also has a complete `· Loose Wash` or `· Loose Pencil`
companion preset. Those fourteen new names select the expressive treatment;
the existing saved names retain explicit compatibility values. No visibility
entries change: the new presets are local and unreviewed in Cataloggr.

All five controls live in **Painting**, in the shared option schema:

| Control                | Key                    | Clean/custom end                           | Expressive end                                                           |
| ---------------------- | ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Loose wash edges       | `paintBleed`           | 0: existing resist/surface treatment       | 1: complete native brush marks with bleed and paper reserves             |
| Evaporation lines      | `paintPooling`         | 0: no added edge concentration             | 1: stronger pigment concentration at native wash edges                   |
| Hatch looseness        | `paintHatchRoughness`  | 0: clean baseline strokes                  | 1: staggered spacing, wobble, pressure variation and faint second passes |
| Pen looseness          | `paintStrokeRoughness` | 0: clean baseline outlines                 | 1: expressive overshoots, doubled strokes and irregular pen pressure     |
| Palette paints and ink | `paintFollowPalette`   | Off: custom/legacy ink and accent controls | On: scene colours drive the painted accents and drawing ink              |

Set both wash controls to zero for clean resist edges. Set both looseness
controls to zero for the clean drawing baseline. Native pencil grain remains
part of Flora's baked pencil marks. Kumiko's previous sketch explicitly saves
Pen looseness 0.5 and Hatch looseness 0, preserving its earlier doubled lines;
its loose companion saves 0.8 for both. New loose washes save edge freedom 1
and evaporation lines 0.7. Painting paper sets the paper tone independently.

### Palette wiring

The ordinary fill colours continue through each scene's existing palette and
colour-placement controls. Palette paints and ink also connects drawing ink
and formerly fixed painted accents to those colours:

- Kumiko: existing palette, repeat, shift and colour target; pen and hatch ink
  follow the opening/piece colours.
- Flora: existing Palette folder, including its window and flip; painted
  stems, petals, ornaments and their drawing ink follow the selected palette.
- Trucheterie, Trucheterie3D, both Iso Lines scenes, Argyle and PaperCuts:
  existing palette/manual-colour controls; drawn contours use corresponding ink.
- Cumulus: the existing global Palette and Exact controls are visible in
  Painting. The selected scheme reaches bones, halo and cloud. With no global
  selection, the rings' selected palette can supply the scheme; manual cloud
  colour still supplies the cloud's colour when no palette is selected.
- Stay Hunted: Painting has a palette picker and Exact control. It reaches the
  body washes, arrows, ribbon, ground deposits, grass and drawn outlines.
  With no palette selected, the grass uses its existing root/tip colours.

Palette changes recolour existing marks; they do not change fill identities.
Turn Palette paints and ink off to use the existing manual ink controls.

### Complete native marks

`@modules/painted` owns `watercolorStages`, the actual LoaderPatterns recipe:
three nested passes at opacity 110/95/80, bleed 0.2/0.12/0.06 and texture
0.5–0.8. The loader and scene bake call the same functions. The loader's square
recipe is unchanged; the scene bake also draws native triangular polygons.

`scripts/bake-painted-wash.mjs` writes `wash.json`: sixteen square and sixteen
triangular marks, keeping the complete shape, evaporated fringes and nested tide
lines. Density, signed boundary distance and local pigment concentration occupy
separate scalar channels. The 512×1024 atlas is one shared 2 MiB GPU texture
with reference-counted ownership. It is generated offline, never in a scene's
frame loop. Rebuild it separately from the compatibility maps:

```sh
node scripts/bake-painted-wash.mjs
```

Each fill selects and warps its mark with its own seeded identity. Kumiko
maps triangles barycentrically and convex quads through their own coordinates,
rather than clipping the middle of a square wash to a polygon. Other opening
polygons carry an interpolated boundary reserve. Boundary and wash coordinates
share the existing opening attribute to stay within WebGPU's eight vertex
buffers. Extra face vertices are confined to watercolor paper geometry.

Continuous surfaces blend independently seeded native deposits in a warped
spatial domain. Their overlap is attenuated to retain visible pigment variation
and paper reserves. Trucheterie uses the kernel's connected lane IDs, cached by
field and lane spacing, so paint stays continuous across cell borders. Separate
channels have independent identities even when their colours match. The
identity lookup is uploaded only when that channel solve changes. Trucheterie3D
retains the same continuity across sewn cap/lane components.

## Controls and ownership

`@modules/painted` is three-free. Its dependency-free `index.mjs` builds the
shared treatment, pigment, paper, palette-follow, wash-edge and drawing
looseness specs through `@modules/optionSchema`. Each consumer includes these
in its own option schema, so scene controls, CLI flags and workbench controls
share their contract. Kumiko also declares `paintLayout` (`wood` or `paper`).

`@modules/paintedRender` owns the pigment texture, TSL treatment, matching WebGL
material treatment, and the handwritten scenes' schema-generated Painting
folders. Scene-specific placement, topology and animation stay in each scene's
existing kernel and render module. No consumer imports the Three5 Test Lab.

The actual p5.brush 3.0.0 watercolor and colored-pencil marks are baked by
`scripts/lib/paintedBake.js`, through the standalone WebGL2 engine. The four
channels in `pigment.json` contain wash density, pencil coverage, cloud coverage
and a leaf study. They are linear scalar signals, not an sRGB color image or a
physical paint-height map. Materials combine those deposits with authored
colors; geometry clips them to each subject. Continuous fields use a stochastic
lattice: each corner selects an independently rotated and offset crop of the
native brush map, with smooth blending between neighbours. Both the macro wash
and fine grain use seeded PCG hashes rather than a wrapping texture, avoiding
repeated rectangular brush boundaries.

Every watercolor fill must supply a stable logical identity, independent of
colour, palette selection or motion. The shared `treat` and `field` APIs require
an explicit seed; there is no default identity. The scene's authored generation
seed combines with that identity in the shader. Separate diffuse and emissive
paths must use the same seeded result. In particular, Kumiko's paper layout is
visible through its emissive path; seeding only its diffuse colour has no effect
on the artwork.

Kumiko combines cell ordinal and opening ordinal. Argyle preserves its tile
index through depth sorting. Paper Cuts combines layer, square and box face;
Flora separates ornament groups and instances; Cumulus distinguishes halo rings,
bones and cloud puffs. Trucheterie uses connected lane identities in its loose flat field
and chain identities on its 3D ribbons. Sewn cap/lane components share one
continuous identity on a membrane skin, with separate identities on the lower
skin. Iso Lines combines
contour band identity with its continuous spatial field. Ground deposits, grass
blades and arrow parts have their own identities. Do not derive these identities
from colour values or reuse one seeded local-UV fill for a repeated shape.

Rebuild the pinned source maps with:

```sh
node scripts/bake-painted-assets.mjs
```

This launches an isolated Chrome capture and does not start or alter the dev
server. The source seeds and library version are recorded with the data.
Scenes and Node-based captures synchronously decode the same small DataTexture;
there is no p5 runtime, paint generation or texture upload in their frame loops.
Each rig owns and disposes its pigment map and materials, and releases its lease
on the shared native-wash texture.

## Scene details

Kumiko's sketch uses irregular doubled and occasional tripled pencil outlines,
with varied overshoot and relief shadows removed from the strokes. Cell fills
are anti-aliased parallel hatch lines with independently varied angle and phase,
without a blurred pigment fill. Painted Shoji saves a complete orthographic
camera with room for all four frame members. Opening seeds combine the stable
cell ordinal and the opening ordinal, including the visible emissive path.

Kumiko retains the catalogue's actual inset openings as well as its original
paper faces. Paper layouts draw the openings and omit wood geometry; the
sketch adds narrow outline geometry. Changes to pigment uniforms keep the plan
and geometry; changing construction or treatment rebakes the existing plan.
Painted flat CLI images use the shared GPU stage. Structural SVGs remain vector
opening/strip diagrams, without embedded raster pigment.

Cumulus's new preset disables the censor panel. Its existing controls remain
available: enabling it uses the existing refraction/pixelation of the painted
halo underneath. It does not introduce independent painted squares. Skull,
femur and halo customization flows through their element material interfaces;
loaded original materials remain untouched.

Cumulus anatomy and the rabbit's painted body use a specimen shading pass: an
authored light direction in view space locates wash bands, native pigment
coverage breaks their edges, and pencil marks shade the contours. This replaces
smooth material lighting for the painted subjects; the original treatment keeps
its existing lighting. Scene lights still illuminate the other scene materials.
The specimen pass is explicit in the material API and its shader cache key, so
it cannot share an incompatible surface-paint program.

Flora retains its full generator, growth, wind and seed flight. Its native
botanical map follows Three5's curved petal polygon, watercolor fill,
colored-pencil hatch, outlined veins and cropped brush strip. Watercolor petals
use pigment coverage as transparency, with no opaque paper backing. Pencil
petals use separate outline and fill channels. Stems become camera-facing brush
ribbons in pencil mode; contiguous branch segments share a normalized stroke
coordinate, matching the Lab's whole-path mapping instead of restarting the
stroke on every tiny segment. A continuous graphite center keeps connected
stem sections joined; native brush alpha supplies edge grain without fading
through the center at branch joins. Watercolor stems retain their shape and wear
mottled fills. All extra path preparation happens once per specimen build. Trucheterie
supports the treatment in its blob, square and triangular views; the named
preset uses a blob field, which is also the CLI's source. Iso Lines applies the
paint in its flat renderer. Iso Lines Relief uses the same maps on its layer
tops, smooth sheet, walls, skirts and contour ribbons while retaining real
lighting, shadows and all build/rise motion.
Rabbit retains its rig, wound masks, pose, arrows and cloth motion. Painted
mode adds translucent green ground deposits, a mix of line and fill grass
blades, seeded arrow materials and drawn ribbon edges over irregular crimson
fills. Its ground deposits are raster artwork; the structural SVG keeps its
existing grass and subject paths.

Trucheterie 3D projects the native pigment in centered grid coordinates, across
both the tube mesh and the membrane's GPU-displaced surface. The wash follows
the same domain while the skin inflates. Its local treatment retains some lane
color so thin seams and ribbons remain legible under the studio lights. The pigment treatment adds no
geometry, simulation dispatches or frame-loop texture generation; its rig owns
and disposes its pigment map and releases its native-wash texture lease. Central half-disc caps are
explicit membrane strips: the tube solver's rounded end geometry cannot fill
those missing pieces for the membrane renderer. Coincident cap centres and
interior chain ends are welded and released from artificial zero-height pins;
actual radial seams and exterior boundaries remain pinned. This lets filled
half-disc ends inflate without a notch through their centre. Quarter-pitch
chain matching keeps half-width caps separate from full-width lanes; their
diameter grids share the same vertex spacing and are welded together. Display-level
weld reductions preserve these joins through subdivision and smoothing,
including their normals; these small geometry passes run only when the membrane
display is updated.

Paper Cuts uses a WebGL material in the scene and an explicit node material
in its WebGPU capture stage. WebGPU does not execute WebGL `onBeforeCompile`
hooks. Both paths read the same pigment maps and equations. Each face has an
independently seeded irregular wash boundary, pigment pooling and a reserved
paper margin, so the edges of the watercolor remain visible. The new preset
opens the relief without the decorative frame; its Frame controls can restore it.

## Review and validation

Render all fourteen saved variants, with explicit pins for their authored values:

```sh
node scripts/painted-review.mjs
node scripts/painted-review.mjs kumiko flora
node scripts/painted-review.mjs --loose
```

Outputs and capture logs live under `output/painted-review/`. Render framing is
chosen by each existing CLI; Flora retains its saved plant seed when capture
folders are named; the scene presets also retain their own saved
interactive cameras. SVG exports preserve the subjects' structural drawing
rather than reproducing raster pigment.

Run `presets:check` and each touched pipeline's check. Iso Lines also requires
`iso-lines-relief:check`; Argyle also requires `live:check -- argyle`. Capture
review checks appearance and shader compatibility; live idle, interaction and
camera performance still require browser/human review.

The loose review captures live under `output/painted-review/loose-marks/`.
They include clean/loose controls, fixed-seed blue/orange palette comparisons,
and twelve identical dark Kumiko openings with independent native washes.
The capture runner rejects GPU validation and shader compilation failures;
isolated Chrome captures also reject console errors instead of accepting a
blank frame as a successful image. Interactive device frame time still needs
review in the running app; native render/readback timings are not browser FPS.
