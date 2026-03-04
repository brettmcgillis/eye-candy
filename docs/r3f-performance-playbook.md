# R3F + Three.js Performance Playbook

Last reviewed: 2026-03-04
Audience: AI coding agents and humans making scene/material/shader changes
Scope: Mobile-first baseline, balanced adaptive quality policy, checklist-required workflow

## 1) Performance Model

- Treat performance as a three-lane budget: CPU (JS + React), GPU (draw + shaders + post), and memory/GC.
- Profile first, then optimize the largest bottleneck. Avoid speculative micro-optimizations.
- In this repo, shader-heavy scenes can be GPU-bound even when React work is low.

## 2) Frame Loop Rules

- Keep `useFrame` work allocation-free. No new vectors, arrays, objects, materials, or functions per frame.
- Use `delta`-based motion/animation so behavior is refresh-rate independent.
- Do not call React `setState` in `useFrame` or other high-frequency loops.
- For mostly static scenes, prefer demand rendering (`frameloop="demand"`) and explicit invalidation.
- For continuously animated/sim scenes, keep the loop continuous but aggressively minimize frame work.

## 3) React/R3F Pitfalls to Avoid

- Do not bind fast-changing values to React state when refs or direct object mutation is sufficient.
- Do not mount/unmount expensive scene objects repeatedly to show/hide; prefer toggles (`visible`) and reuse.
- Avoid prop churn from inline objects/arrays/functions passed into hot components.
- Keep component boundaries stable and memoize where it reduces render churn.

## 4) Draw Calls + Scene Graph Strategy

- Reuse geometry/material instances via `useMemo`/module scope when safe.
- Use `THREE.InstancedMesh` when rendering many similar meshes.
- Merge static geometry where practical to reduce draw calls.
- Keep dynamic lights/shadows conservative on mobile-first targets.

## 5) Resource Lifetime + Memory

- Use loader caching (`useLoader` patterns) and shared assets instead of repeated loads.
- Avoid duplicate textures/materials unless visual differences require it.
- Dispose manually created GPU resources when lifecycle requires it.
- Keep texture sizes and render targets conservative by default.

## 6) Materials, Shaders, and Postprocessing

- Keep shader math simple where possible; avoid large dynamic loops/branches in fragment paths.
- Gate expensive post effects behind controls; default to conservative settings.
- Prefer reducing pass count and sample count before adding algorithmic complexity.
- Validate visual changes against frame-time impact, not just FPS snapshots.

## 7) Adaptive Quality Policy (Balanced)

- Prefer smooth adaptation over hard quality locks.
- Allowed adaptation levers: DPR scaling, postprocessing toggles/quality, shadow quality/distance, expensive effect resolution.
- Do not sacrifice scene interactivity for perfect fidelity during motion-heavy interaction.
- Recover quality when performance stabilizes.

## 8) Measurement Workflow

- Measure before/after every non-trivial performance change.
- Use:
  - in-app stats components (`src/app/scaffold/StatsPanel.jsx`, `src/app/scaffold/leva/AppStats.jsx`)
  - browser performance tools for CPU/GPU clues
  - scene-specific sanity checks during interaction, idle, and camera motion
- Record impact in task notes/session notes (what changed, expected impact, observed impact).

## 9) Exception Cases

- Shader experiments and art scenes may intentionally break conservative defaults.
- When breaking defaults, document why and what fallback/adaptive mechanism exists.
- If an optimization hurts visual intent, prefer adaptive guardrails instead of permanently degraded output.

## 10) Source Mapping

Three.js generic foundations (broad rendering guidance):

- https://discoverthreejs.com/tips-and-tricks/

R3F scaling patterns (React-aware performance strategy):

- https://r3f.docs.pmnd.rs/advanced/scaling-performance

R3F anti-patterns/pitfalls (critical do-not-do rules):

- https://r3f.docs.pmnd.rs/advanced/pitfalls

## 11) Version-Sensitive Notes

- Some ecosystem guidance changes over time (color management defaults, renderer/shadow flags, API naming).
- Treat hard thresholds (e.g., draw-call numbers) as starting budgets, not universal limits.
- Re-validate this playbook when major Three.js/R3F versions change.
