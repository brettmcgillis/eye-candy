<!-- Copilot entry point. Content lives in AGENTS.md — do not duplicate it here. -->

# Eye Candy — Copilot Instructions

See **`AGENTS.md`** in the repo root. It is the agent-agnostic source of truth
for this repo and applies to Copilot unchanged.

In particular, read before writing any code:

- `AGENTS.md` — orientation, process, TSL reference.
- `docs/scene-conventions.md` — how scenes, components, models, shared code, and
  presets are structured. §0 covers where a new file belongs.
- `docs/scene-performance-checklist.md` — required for any change touching
  scenes, materials, shaders, controls, loading, or postprocessing.
- `docs/r3f-performance-playbook.md` — performance guidance (60fps, mobile-first).

Nothing Copilot-specific is maintained here — if a rule needs to change, change
`AGENTS.md` (or the `docs/` file it points at) so every agent picks it up.
