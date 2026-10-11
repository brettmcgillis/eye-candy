# Fractal Automata pipeline

Fractal Automata follows Nesting Boxes' arrangement
(`docs/nesting-boxes-pipeline.md`): one kernel, two renderers, and a dev tool
that is a UI over one of them. Change the kernel first, land every consumer in
the same commit, and run `npm run fractal-automata:check`.

## The shape

```
@modules/fractalAutomata        rule tables (CPU), facet roll, option schema
@modules/fractalAutomataRender  GPU CA + detail-enhance compute, greedy mesh, per-state
                                materials, voxelBuild (build / rebake), light rig, centre
                                light, studio environment, godrays slot, camera
        │                              │
  WebGPU/FractalAutomata scene    scripts/lib/fractalAutomataRender.mjs
  (R3F, Leva generated)             ├─ fractal-automata-generate.mjs   stills
                                    └─ fractal-automata-video.mjs      turntable / keyLight / godrayLight
                                          │
      src/dev/server/fractalAutomata → src/dev/tools/fractalAutomata (FractalAutomataCLI)
```

| Piece                            | Rule                                                                                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modules/fractalAutomata`       | **Three-free.** May import only `@modules/flora` (`createRng`) and `@utils/paletteStops`. `fractal-automata:check` enforces it.                                                                                   |
| `@modules/fractalAutomataRender` | The only home of the look. `buildVoxelObject` / `rebakeVoxelObject` / `updateVoxelMaterials` are what the scene's `VoxelField` and the CLI both call; the scene adds only React lifecycle (debounce, swap).       |
| `renderOptions.mjs`              | Every knob, once; the scene's Leva is generated from it (`utils/controls.js`). Facets: `structure`, `detail`, `color`, `material`, `atmosphere`. `godraysPosition` is `sceneOnly` (a vec3 the video modes drive). |
| Presets                          | `presets.js` spreads `BASE` (camera keys + `sceneDefaults()`); `Default` is `BASE`. A preset that leaves a key out gets its default (`getPresetControls`).                                                        |

## Structure

The CA is GPU-only: there is no CPU mirror, so nothing here can be verified in
Node without a renderer. The rules are rolled blind, so the CLI draws a roll
again (as `name~1`, `name~2`…) when the built structure has fewer than 800
surface cells or is flat (shortest bounds axis under 30% of the longest),
unless `structure` is held. Level 7 is 2.1M cells.

Roll windows are sampled from a level-5 sweep of `ruleMode` × `baseFill` ×
`density` × `beta`: `random` rules (every shipped preset) are a seed lottery,
`ising` below beta ~0.8 is a noise-filled cube, `balanced` is the reliable one.
Re-tune `rollConfig.js` / the `roll` windows from renders, not from guesses.

## Lighting

The key / rim / bounce / hemisphere rig and the godray centre light are the
scene's own (`createLightRig`, `createCenterLight`), ported from
AutomataChunks; the scene mounts their groups and the CLI adds them to its
scene. The centre light is always on (its intensity is `godraysIntensity`);
`godraysEnabled` only adds the raymarch pass. The environment is a baked
studio PMREM (`createStudio`) in both, not drei's remote HDRI, so a render is
offline and matches the scene.

Godrays raymarch the point light's shadow map, which only exists after a
render, so the CLI builds the post chain after a warm-up frame. The chain is
postRig's `godrays` effect fed `godraysSlot(config)`, whose keys are the
scene's own `godrays*` controls.

## Outputs

- **Stills**: views `hero` (the scene camera's bearing and elevation),
  `front`, `right`, `back`, `left`, `top`. A perspective camera at `fov` is
  pulled back until the built geometry's bounds fit inside `margin`. ACES tone
  mapping, PCF soft shadows and `exposure` as on the scene's canvas.
- **Video**: `turntable` (`turns` revolutions per `hold`), `keyLight` (the key
  light's azimuth sweeps `turns` times), `godrayLight` (forces godrays on and
  circles the light at 45% of the structure's half-width). The structure is
  built once per clip; only lights and camera move.
- No plot SVG: the structure is millions of unit cubes, not line work.

## Definition of done

- `npm run fractal-automata:check`
- `npm run lint:fix`
- `npm run fractal-automata:generate -- --count 1`
- `npm run fractal-automata:video -- --count 1 --pixelRatio 1 --hold 2`
- The scene still renders in the browser (human eyeball).
