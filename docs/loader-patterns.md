# Loader patterns

The app-shell loader (`src/app/scaffold/loader/`) draws the argyle logo
(`@utils/argylePattern`) as **motion × style**. Every motion renders in every
style; `ALL_LOADERS` is the full cross product and `Loader.jsx` picks one at
random. Preview them all at `/dev/loaderpattern`.

| File           | Holds                                                         |
| -------------- | ------------------------------------------------------------- |
| `motions.js`   | How squares move: `frame(squares, t)` → layers                |
| `styles.js`    | How a square is drawn: canvas styles and p5.brush recipes     |
| `drawFrame.js` | `restState`, `drawLayers`, `clipReveal`                       |
| `brushBake.js` | Paints brush recipes once into alpha-mask atlases, tints them |
| `loaders.jsx`  | `makeLoader(motion, style)`, `ALL_LOADERS`, `getLoader`       |

## Motions

A motion is `{ id, label, cycleDuration, frame(squares, t) }`. `frame`
returns layers drawn in order:

```js
{ look: 'ink' | 'sketch', squares, alpha?, offset?: [x, y], clip?: (ctx) => path }
```

Each square state is `restState` plus overrides: `sx`, `sy` (grid units),
`rot` (degrees), `scale`, `opacity`, `color`, `reveal` (0–1). `ink` is the
finished mark; `sketch` is its underdrawing (an outline for Solid, a faint
hairline for Outline, a construction drawing for brush styles). Motions only
describe geometry and timing; they never know which style is drawing them.
`cycleDuration` is the minimum time the loader stays up.

## Styles

A style is `{ id, label, engine, draw(ctx, square, look), prepare? }`, drawn
in square-local space (origin at the square centre, side `SQ`). `reveal < 1`
clips with a diagonal wipe that reads top-to-bottom on screen.

Brush styles are recipes: a `sketch` pass and an ordered list of `stages`,
each `(brush, { s, i, rand })` drawing one square centred on the origin with
half-side `s` px. `brushBake.js` paints all eleven squares (one unique tile
each) in black on white with `p5.brush/standalone`, snapshots after every
stage, and converts each snapshot to an alpha mask. Masks are tinted per
colour on demand, so motions can recolour painted squares (Invert,
Misregister). For `ink`, `reveal` steps through the stages, wiping each one in
over the last — that is what Paint In animates.

Until a bake resolves, brush styles draw the Outline sketch. Bakes run once
per page and are serialized, because p5.brush standalone has one active target
per page; never call `brush.scaleBrushes()` (it is global and would change
Three5's brushes). The built-in brush names in p5.brush 3 are `pen`,
`rotring`, `2B`, `HB`, `2H`, `cpencil`, `pastel`, `crayon`, `charcoal`,
`spray` and `marker`; an unknown name throws and fails the whole bake.

The dev page shows every bake atlas under **Brush bakes**; tune a recipe's
weights and opacities there.

The Watercolor stages are shared through `@modules/painted`'s
`watercolorStages`. The loader still uses the same square recipe and insets;
the scene-material bake retains complete marks from it, including triangular
polygons. See [Painted variants](painted-variants.md) for its offline atlas,
independent fill identities and clean/loose controls.
