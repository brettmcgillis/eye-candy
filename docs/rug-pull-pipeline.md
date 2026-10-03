# Rug Pull pipeline

Rug Pull weaves generative Persian rugs. Like Kumiko and IsoLines it is one
kernel, two renderers and a dev tool that is a UI over one of them. Change
the kernel first, land every consumer in the same commit, and run
`npm run rug-pull:check`.

## The shape

```
@modules/rugPull        knot-grid cartoon: designs, motifs, borders, house motifs, palettes,
                        finishing (abrash, fade, wear, kilim), verlet cloth, views, SVG, schema
@modules/rugPullRender  createRugRig: pile material, room (floor, wall, rod), lights
        │                              │
  WebGPU/RugPull scene        scripts/lib/rugPullRender.mjs
  (R3F, Leva generated,         └─ rug-pull-generate.mjs   cartoon PNG/SVG, flat/floor/wall stills
   weaves in a worker)                  │
              src/dev/server/rugPull → src/dev/tools/rugPull (RugPullCLI)
```

| Piece                    | Rule                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/rugPull`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@utils/argylePattern`. Runs in Node and the scene's worker.                 |
| `renderOptions.mjs`      | Every knob, once; the scene's Leva is generated from it. Its id lists (`DESIGN_CHOICES`, …) mirror the kernel's and the check holds them equal. |
| `@modules/rugPullRender` | The only home of the 3D look. `apply(config)`, `setBuild(build)`, `setLayout(layout, mode)`, `updateCloth(positions)`.                          |
| Facets                   | `design`, `border`, `mine` (house motifs), `palette`, `age`, `room`. Each rolls on its own stream so any can be held.                           |

## The weave

A rug is a **cartoon**: one palette role per knot (`dark`, `ivory`, `red`,
`blue`, `gold`, `green`, `rose`, `sky`, `camel`, `warp`), the way a weaver
reads a graph-paper chart. Rows run head (0) to foot; the kilim ends are part
of the grid, the fringe is not.

- **Motifs** (`motifs.js`) are `(x, y, k) => role | -1` over about [-1, 1]²,
  y down, built from 2D signed distances (`sdf.js`). `k` is one knot in local
  units, so outlines stay one knot wide at any scale. Coarse designs come out
  stepped because the grid is coarse, as village rugs are.
- **Borders** (`borders.js`) are tile motifs `(u, v, k, t, half)` painted by
  `paintBand`: tiles are fitted to each side in odd counts from its middle,
  so a border mirrors end to end. Main borders take corner rosettes or mitre.
- **Designs** (`designs.js`): city medallion, village (Heriz), tribal
  (Qashqai), Turkmen gul, herati, boteh, mina khani, prayer, garden (khesti),
  tree of life, harlequin. Each names the borders it reads best with.
- **Yarn choice** (`canvas.js` `createInk`): outlines by luminance, accents
  avoid the ground they sit on.
- **Finishing** (`finish.js`): abrash bands rows per dye, sun fade, wear
  lowers the pile (alpha of the RGBA build) toward the foundation, flaws swap
  a yarn in a small patch, kilim rows are flat-woven stripes.

## House motifs

`personal.js`: the loader's argyle (`@utils/argylePattern`), the Reversal
knot and the Turboflex skull. The last two are charted from
`public/images/reversal.png` / `turbo_flex.png` into `bitmaps.js` by
`npm run rug-pull:bake-motifs` (rerun after changing a source) and sampled
3×3 per knot. Each placement is its own control: `mineMedallion`,
`mineBorder`, `mineGuard`, `mineField`, `mineSignature` (chances or shares),
and `weightArgyle` / `weightReversal` / `weightTurboflex` pick among them
(all 0 turns them off). The roll weaves them into `houseRate` of rugs.

## Cloth

`cloth.js` is a CPU verlet sheet: stretch, shear and bend links, fringe
cords slack under compression. Floor: static friction, ripples held by a
per-particle floor offset that travels with the rug, an optional folded
corner. Wall: the head pinned to a rod, clips or two corners, with a breeze.
It is deterministic, so the CLI settles exactly what the scene shows. The
scene steps it live; pointer drag grabs the nearest particle and **Pull The
Rug!** yanks the foot.

## Outputs

`--views cartoon,flat,floor,wall`: `cartoon` is the knot chart rasterised in
JS (no GPU — fastest for weaving en masse), the rest are headless WebGPU
renders of the rig after `--settleSteps`. `--svg` writes `cartoon.svg`, one
path per yarn. `--designPool`, `--palettePool` and `--houseRate` steer the
roll; a typed scene flag is a pin.

## Definition of done

- `npm run rug-pull:check`
- `npm run lint:fix`
- `npm run rug-pull:generate -- --count 2 --views cartoon,floor,wall --svg`
- The scene still renders in the browser (human eyeball).
