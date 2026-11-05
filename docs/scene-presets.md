# Scene presets: preserve the artwork

A preset is an atomic artwork configuration. Its name and `?preset=` URL are
persistent public identities. A Showcase scene is published art: changing its
existing appearance accidentally is a regression. This applies to WIP presets
as well; their links and saved generations also have meaning.

## Contract and storage

The scene's Leva schema is the contract for its controls. Where an option
schema drives Leva and the workbench, keep that one declaration of keys,
types, ranges and choices. Derive a readonly TypeScript preset type from that
schema when introducing types, instead of maintaining a second independent
key list. Handwritten Leva scenes can use a scene-specific settings type.
Type checking complements the runtime checks: it cannot validate imported
JSON, numeric ranges or the persistence of literal artwork values.

A saved preset contains every persistent control value, including inactive
controls, random seeds, camera framing and constraints, lighting,
postprocessing, source asset paths and serialized designs. Buttons, monitors,
file-upload handles, the preset selector and transient editor state are not
artwork values. Publish source assets at stable paths; blob URLs cannot
preserve an image. A live webcam or other external signal remains live input,
not a reproducible recording.

Keep snapshots in the scene's `presets/` folder. Existing `presets.js` files
are suitable data files; per-preset JSON is optional, not another registry or
source of truth. A literal, scene-local `SAVED_BASE` may compress repeated saved
values. It is **artwork data**, not the current schema defaults. Editing that
base changes every preset spreading it and needs the same review as editing
each preset. Workbench saves expand it into literal entries.

Never construct existing presets with `sceneDefaults()`, `stageDefaults()`,
changing component defaults, a roll function, another scene's presets, or the
previously selected controls. Never export only differences from schema
defaults. Defaults initialize a **new** configuration; they do not define an
existing artwork.

## Applying and saving

Direct URL loading, dropdown selection and Reset must resolve the same saved
values, regardless of the previous selection or manual edits. Apply a fresh
copy so Leva and mutable consumers cannot change the saved data. Preset keys
match control keys; do not silently drop stale keys to make a check pass.
Variable entity lists, spline points and palette arrays are artwork too. Save
them with stable IDs and restore their state before registering/applying the
corresponding controls. Controls with `onChange` that belong in Copy must use
`transient: false`.

Legacy nested scene metadata needs an explicit adapter and a colocated
`PRESET_METADATA_KEYS` declaration. These fields remain artwork data; the
exception never permits silently dropping a stale control.

`presetFromConfig` retains all scene keys, including values equal to defaults.
`appendPreset` resolves a literal saved base when writing, never emits a live
base spread, and allocates a new name rather than overwriting an existing URL.
A scene-specific writer must preserve the same guarantees.

Run `npm run presets:check` after changing presets, controls, shared rigs,
option schemas, or writers, alongside the scene's pipeline checks. The audit
resolves preset data statically, rejects executable defaults and verifies the
loaded values still equal the literal source. It builds control definitions
through the real hooks and Leva normalization, with recording, tracking, unused
geometry setup and Canvas-only hotkeys disabled. It checks the data contract; mount-effect and browser visual
review is still required for rendered appearance and performance.

## Public and private presets

Off localhost (`localEnv()` false — GitHub Pages, or `?testMode=true` locally)
`usePresetsFolder` shows only the scene's **public** presets plus its
`defaultPreset`. A `?preset=` URL naming any other preset falls back to the
default, and `applyPresetByName` ignores it, so cycling hotkeys and toggles
only reach visible presets. Locally every preset stays available.

Visibility is stored per scene in `presets/visibility.json`
(`{ "public": [...], "private": [...] }`), written by Cataloggr's Public /
Private toggle on each preset row in the scene detail. A preset in neither list
is **unreviewed** and is treated as private, so a scene with no file shows only
its default preset in prod. The file is not artwork data and is not read by
`presets:check`; renaming a preset needs its visibility entry renamed too
(Cataloggr flags stale names). `src/app/presetVisibility.js` reads the files and
`SceneShell` provides them through `@hooks/scenePresetVisibility`. Scenes that
manage presets without `usePresetsFolder` are not filtered.

Each Gallery screenshot (and the main thumbnail, `mainPreset`) can name the
preset it shows in `screenshots/screenshots.json`; Capture fills it from the
seeder's preset choice. The Gallery modal lists the public presets as links,
and clicking a screenshot tagged with a public preset opens the scene at it.

A screenshot can also be a video: drop or pick an MP4, MOV, WebM or MKV in
Cataloggr's screenshot panel and the dev server converts it with `ffmpeg` to a
silent VP9 `.webm` (at most 1280px on the long edge) beside the `.webp` shots.
The Gallery plays it muted on a loop; "Use as card thumbnail" takes its first
frame.

To audit, use Cataloggr's grid filters **Presets to review** (Showcase scenes
with unreviewed or stale presets) and **Public preset, no screenshot**, then
open a scene: each preset row shows its toggle and whether a screenshot covers
it. Mark the default preset public explicitly if the Gallery should list it.

## Changing the contract

- **Add a control:** give every existing preset an explicit compatibility
  value that preserves its previous behavior. The new authoring default can
  differ. Do not fill legacy snapshots automatically from the new default.
- **Rename a key or enum choice:** migrate saved values without changing their
  meaning, including sidecars, workbench import/export and shared rig keys.
- **Remove a control or narrow its range:** preserve the old behavior through
  an explicit compatibility path, or agree an intentional artwork change with
  the author. Do not silently clamp or delete published values.
- **Change a default:** existing snapshots stay unchanged. Create a new preset
  name for a new look; do not repoint an existing URL.
- **Change rendering, generation, assets or randomness:** matching settings do
  not prove matching art. Compare the existing presets visually. Preserve the
  old algorithm/asset path when necessary; use a versioned renderer only when
  there is an actual incompatible mechanism to retain.

A schema version alone does not preserve art. It helps only with an explicit,
reviewed migration or retained implementation behind it. Full snapshots plus
contract checks are the default; frozen release builds/assets are the stronger
option when pixel-identical historical playback is required.

## Freeze baseline (2026-11-01)

The author selected freezing current resolved values, because no particular
published revision was identified for recovery. Explicit saved values are
retained; omitted values are captured from the current scene controls. Cumulus and WatercolorSquares apply their authored values in mount effects;
those applied values are retained. Legacy hooks that ignored explicit values
on URL load are frozen at their initial resolved control values, so Reset
now agrees with those URLs. Shared ghost skins retain their authored values;
GhostBuster owns separate complete scene snapshots. This prevents future
default drift. It does not claim to reconstruct appearances
that may already have changed before this audit.

The completed audit and validation scope are recorded in
[scene-preset-audit.md](scene-preset-audit.md).
