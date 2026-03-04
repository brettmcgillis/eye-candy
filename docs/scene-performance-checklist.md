# Scene Performance Checklist (Required)

Use this checklist for any change touching scenes, materials, shaders, controls, loading, or postprocessing.

## Frame Loop + React

- [ ] No React `setState` inside `useFrame` or other high-frequency paths.
- [ ] Frame updates are `delta`-based where time-dependent.
- [ ] No per-frame object/function/array allocations in hot loops.

## Resource Reuse

- [ ] Geometry/material instances are reused where possible.
- [ ] Asset loading uses cache-friendly patterns (`useLoader`/shared assets).
- [ ] Repeated meshes use instancing or equivalent draw-call reduction strategy when appropriate.

## Rendering Cost

- [ ] Postprocessing is conservative by default and controllable.
- [ ] Shadow/light settings are justified for mobile-first constraints.
- [ ] Expensive effects have adaptive-quality fallback or rationale for fixed cost.

## Scene Lifecycle

- [ ] Avoided unnecessary mount/unmount churn for expensive objects.
- [ ] Visibility toggles/reuse used instead of frequent reconstruction where possible.

## Validation Evidence

- [ ] Human-in-the-loop visual/performance spot-check was done (idle + interaction + camera motion).
- [ ] Stats/profiling observations are documented in task/session notes.
- [ ] Any intentional rule violations include rationale and fallback plan.

Reference:

- docs/r3f-performance-playbook.md
