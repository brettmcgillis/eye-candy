# Plotterizer

The Plotterizer (`/dev/plotterizer`) sits between the render workbenches and
the cutter (a Silhouette Curio). Benches write SVG; the Plotterizer turns one
into a plot: layers to pens, a real size on real paper, nib-aware optimising,
a saved plot job, and DXF for Silhouette Studio. Work still in flight is in
`plans/plotterizer.md`.

## The shape

```
src/dev/tools/plotterizer/
  kernel/*.mjs          pure JS (no DOM, no three, no aliases): Node loads it
    svg.mjs               SVG → mm polylines per pen layer (y down), sizePlot
    paths.mjs             join, simplify, order (nearest-neighbour, bridging)
    stats.mjs             lifts / ink / travel / time, nib crowding
    job.mjs               placement, pass order, buildJob, job (de)serialise
    dxf.mjs               ACI colours, writeDxf
    exportJob.mjs         a job → DXFs and a preview SVG
  plotterizer.worker.js parse / build / serialise off the main thread
  rerender.js           re-run a generation through its bench at a new size
src/dev/server/plotterizer/plugin.js   /dev-api/plotterizer
```

`scripts/lib/generatorCli.mjs` imports `sizePlot` from the kernel; the
server plugin imports the kernel directly. Keep the kernel `.mjs` and free of
aliases so both keep working.

## Sources and the hand-off

- `/dev-api/plotterizer/sources` (`src/dev/server/plotterizer/sources.js`)
  lists every SVG under `output/` (job runs) and `public/images/` (kept
  items), newest first: bench and job (dated from the job's manifest), what
  it is (`identity`: skin, species, palette) and how it is drawn (`style`
  chips) from its `props.json`, its plot width and layer count from the SVG
  (cached by mtime in `output/.thumbs/plots.json`), and the bench's tool
  name (the folder slug in camelCase).
- **Choose plot…** opens the picker: a bench → job tree beside a thumbnail
  grid (60 cards a page as you scroll), search over names, identity and
  style, kept-only, newest/oldest, and a Recent list (the last 24 opened,
  per browser). Thumbnails come from `/dev-api/thumbs`.
- A gallery's **Open in Plotterizer** opens
  `/dev/plotterizer?svg=…&props=…&tool=…&name=…`; `?job=<slug>` reopens a
  saved job.
- A bench answers a job's asset URLs only after it has listed its jobs since
  the dev server started; `fetchFromBench` lists them and retries on a 404.

## Size first: re-render, don't shrink

Shrinking a finished plot packs its lines closer than the nib can draw. When
the plot's size differs from the size the SVG was drawn for, the Plotterizer
offers **Re-render**: it posts the generation's `props.json` `render`
options back to its bench as a one-item still job with `plotWidthMm` set to
the plot width, `width`/`height` scaled by the same factor (so every
pixel-measured spacing keeps its size on paper) and `svgPenMm` set to the
finest nib in use, then loads the result. Features a bench sizes by count
(threads, levels) rather than spacing still crowd at a smaller size; the
layer list shows crowding per layer so the culprit is visible.

Crowding is the share of a pass's (or layer's) ink lying in nib-sized cells
that hold more than two nib lengths of line.

## Optimising

Per pen pass: the layers assigned to it are placed (scaled and centred on
the paper inside the margin), touching ends joined, polylines simplified to
`min(0.1, nib / 4)` mm (full circles are left exact), strokes shorter than
the drop length removed, then ordered by a greedy nearest-neighbour tour from
the paper's top-left: open runs may run backwards, closed ones start at
their nearest vertex, and a gap no wider than the nib is drawn across rather
than lifted. Passes run light pens first so the darkest (outline) lands
last; the user can reorder them.

## Pens, colour and knock-out

- A layer's default pen is the pen nearest its stroke colour (CIELAB);
  black or uncoloured layers take the first pen. Benches that colour their
  layers (the ghost's fills, the flock's inks, Rorschach's palette) arrive
  mapped.
- **Fit to N pens** chooses the N pens from the list that draw the layers
  closest to their own colours, weighing each layer by its ink (every
  combination is tried), and maps each layer to the nearest of them.
- A pen within ΔE 20 of the paper (white gel on white) is never picked.
- Knock-out: a pass marked **Cuts lighter** (by default the near-black
  pens) cuts every earlier, lighter pass back by its nib, so fills stop
  short of the outline and eyeliner instead of running under them. Shades of
  one colour are left to interleave. It is a mask of nib/2 cells grown by
  the nib, applied in pass order before the registration tick.
- The layer list shows crowding per layer as well as per pass, so a layer
  that crowds can be dropped or re-rendered.

## Plot jobs

`Save job` writes `output/plotterizer/jobs/<slug>/`: `job.json` (version,
paper, placement, settings, source and the ordered passes as rounded mm
polylines — self-contained, so the basement runner needs nothing else),
`summary.json` (the list view), `plot.svg` (passes in their pen colours on
the paper) and the DXFs. The pen list lives in `output/plotterizer/pens.json`.

## DXF

R12 in mm, y up, one layer per pass. Silhouette Studio ignores layer-table
colour and groups the Send panel's Line Color tab by **entity** colour, so
every POLYLINE / SEQEND / CIRCLE carries its pass's ACI colour. A pass takes
the nearest ACI colour (by hue for a coloured pen, by lightness for a black,
gray or white one) that no earlier pass took; the passes table's "In Studio"
column shows which row is which. Closed all-arc subpaths round within
0.05 mm become `CIRCLE`s. One DXF holds every pass; one per pass is written
too.

## Driving the Curio

The **Plotter** tab plots saved jobs straight to a Silhouette Curio
(USB `0b4d:112c`), no Silhouette Studio. `kernel/gpgl.mjs` writes GPGL —
ETX-ended ASCII commands in 1/20 mm, **y (the bed's travel) before x** —
from protocol facts in inkscape-silhouette (GPLv2; none of its code is
used). `src/dev/server/plotterizer/plotter.js` sends it.

- **Transports**, tried in order: Linux's printer device `/dev/usb/lpN`
  (no libraries; the Pi's user needs the `lp` group), then the optional
  `usb` package (libusb; bulk out 0x01, in 0x82, interface 0) for the Mac.
  **Dry run** keeps every byte in `output/plotterizer/dry-runs/<name>.gpgl.txt`,
  one command per line.
- **A pass**: `J<carriage>`, `!<speed 1–10>`, `FX<force 1–33>`, `FC0` (pen,
  no blade offset), `FY1`, `FN0`, `TB50,0`, `FE0,0`, the work area
  (`\0,0`, `Z<h>,<w>` in y,x), `L0`, `FE0,0`, `FF0,0,0`, then `M` to each
  stroke's start and `D` along it, and `M0,0` to park. Never `SO0`: it moves
  the origin and would shift every later pass.
- **Sending**: pieces of at most 1 KB, each ending on an ETX, and after each
  the status is polled (`ESC ENQ`: `0` ready, `1` moving, `2` unloaded) until
  ready. `ESC EOT` initializes once per job.
- **The runner** holds one job: Start, then for every pass it waits (load
  this pen in this carriage) until **Pen loaded** plots it; Stop parks and
  closes. Passes and tests run in the background; the page polls.

### Unverified until the hardware says so

The command forms are the older (pre-Cameo 3) ones a community Curio branch
plotted with; nothing here has driven a Curio yet. Before a real job:

1. **Travel test** (pen up): the head should trace the paper's margin
   corners and come home, nothing out of bounds.
2. **Orientation test**: an L at the paper's top-left, long arm along the
   top, arrow pointing right; a square bottom-right. Rotated or mirrored
   means the axis order or origin is wrong.
3. **Carriage alignment**: the orientation test once with carriage 1 and
   once with carriage 2 on the same paper; the Ls should land on each
   other. If not, the carriages need an offset.
4. **Registration**: plot a job with the registration tick on and two
   passes; the ticks should overlap after the park between passes.
5. **Pen force and speed** for the 0.3 fineliners and sketch pens (defaults
   force 10, speed 5).
