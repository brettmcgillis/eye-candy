# // Kumiko

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- Generative kumiko (Japanese wooden lattice) panels: traditional infill patterns and lattice kin on eight Archimedean tilings, from a single pattern to every pattern at once.
- Mixing by weighted pool, zones, recursive subdivision (multiscale) and nested frames.
- 3D panel from a baked catalogue of cells drawn as instances, read as one board (slab) or as individually mitred strips, with backlit shoji paper and wood grain; palettes from gradients.json.
- An image or the live webcam can drive the panel: subdivide where the picture is busy, or halftone it through how open each pattern is.
- Kernel in `@modules/kumiko` (three-free), look in `@modules/kumikoRender`, shared with KumikoCLI (flat PNG/WebP/SVG + 3D stills).

## // TODO:

- [x] could we support image/webcam like we can with Subdivision? Might need perf improvements first.
- [x] seeing some disconnected segments, mostly squares inside squares
- [x] might want to add wood texture to the frames
- [x] might want to enable 2-fold, 4-fold symmetry
- [x] joinery intersections all need improvements for more seemlessness.
- [ ] motion design. how can we animate these?
- [x] improve perf. how do we do this? bake the catalog of shapes on scene load?
- [ ] can we support multiple wood types, an extreme example: a dark wood for the outer frame, a light wood for the inner frame, coloured wood for the rest

## // Presets

## // Features

## // Interactivity

## // Bugs

- [x] Seeing white tris in the wood joinery
- [x] takes too long to regenerate
- [x] seeing z-fighting on some colour tiles/infills
- [x] some controls dont appear to live-update the panel
