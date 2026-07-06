# // Cross Talk

# // Intent / Use Cases

- The scene turns every open browser window/tab (of this same scene) into a
  viewport onto one shared desktop-spanning 3D world. Drag a window and its
  contents glide to match; put two windows edge to edge and their contents
  read as continuous, like the reference demos in `~/dev/examples/`.
- Cross-window sync is `src/modules/windowSync` (`WindowRegistry` +
  `useWindowSync`), promoted out of this scene's folder per
  docs/scene-conventions.md §6 since every preset below needs it, and it's a
  candidate for other future desktop-companion scenes (`gpu-party`) too.
  Mechanism: each window heartbeats its `screenX/Y` + `innerWidth/Height` rect
  into `localStorage`, every window observes every other via the `storage`
  event, and the lowest-id survivor is host (host election exists in the
  registry now; no preset needs host-only authority yet — Fluid Sim and
  Gravity Rooms will).
- **No real desktop transparency.** Chrome on macOS can't punch a
  window-transparent hole through to the wallpaper (that flag is Linux/X11
  only). Preset 1 uses a plain sky-blue background instead. See the Electron
  item below for the actual way to get see-through/click-through windows.
- `launch-windows.sh` (this folder) opens N minimal `--app=` Chrome windows
  (native close/minimize/maximize + resize only, no tabs/toolbar) tiled
  across the screen, each as its own process so `--window-size`/
  `--window-position` actually take effect. Usage:
  `./launch-windows.sh 4 https://localhost:5173/crossTalk`.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] **Electron exploration** — capture as a real goal, not just a note.
      Chrome can't do true transparent/click-through windows; Electron's
      `BrowserWindow({ transparent: true })` can, and would let later presets
      (fireflies drifting over the real desktop, gravity rooms) actually
      reveal the wallpaper instead of faking it with a color. Open questions
      to resolve before starting (haven't used Electron before): - Does Electron's multi-`BrowserWindow` model even give us the same
      `screenX/Y` + `localStorage`-style sync, or does cross-window
      messaging need to move to Electron's IPC (`ipcMain`/`ipcRenderer`)
      instead of the `storage` event this module currently uses? - Scope: does the Electron shell wrap the _whole_ eye-candy app (every
      scene, routed as today), or is there a way to cut a single scene out
      into its own minimal Electron bundle? Leaning toward the latter for
      this family of scenes specifically, but needs a spike to know if
      that's realistic given the rest of the app's routing/scaffold. - Whichever answer: keep `windowSync`'s public API (`useWindowSync`)
      stable so presets don't care whether the transport underneath is
      `localStorage` or IPC.

# // Presets

- [x] **Clouds** (this pass) — each window gets one `cartoon_clouds.glb`
      instance (`src/components/elements/CartoonClouds`, merged/instanced via
      drei's `Merged` so every window's cloud is one shared draw call),
      centered on that window's rect, easing smoothly when the window
      moves/resizes, tinted per-window via a vertex-color material clone.
      Sky-blue background. A hand-rolled procedural TSL puff-cloud was the
      first attempt but read as "circles in the air" rather than a cloud —
      swapped for the real asset.
- [ ] **Particles & Attractors** — each window gets an attractor with its own
      strength control; the mouse is also an attractor and can roam between
      windows. Particles are leaves (textured, curved plane, à la Surrender's
      `ClothLeaves`), not plain points.
- [ ] **Fluid Sim** — water flows downhill toward whichever open window is
      lowest on screen. Needs host-authoritative simulation (see host
      election above) since the fluid state must be singular, not per-window.
- [ ] **Gravity Rooms** — each window has its own gravity direction (rotatable
      by the user). A ball crossing from one window's rect into another's
      immediately takes on that window's gravity.
- [ ] **Goldfish** — animated model ready to go; swims within its own window,
      idle/roam behavior only for this pass.
- [ ] **Betta Fish** — animated models exist but only have a stationary swim
      cycle, no fight/turn animations yet. Fish fight when two betta windows'
      rects overlap (share a "tank"). Needs new animation work before this
      preset can start.
- [ ] **Birds on the Desktop** — boids that land on browser window edges and
      fly between windows when several are open.
- [ ] **Fireflies** — tiny lights that gather where the cursor rests and
      migrate between windows; blink timing modeled on real firefly behavior
      (species-specific flash patterns), not a uniform sine pulse.

# // Features

- [x] `src/modules/windowSync` — generic cross-tab/window registry (heartbeat,
      stale-window cleanup, host election), independent of any one preset's
      content. Each window also broadcasts a `meta` payload (this preset's
      cloud color/size) alongside its rect — every sibling renders an
      entity from the _owning_ window's own meta, never from its own local
      Leva state, so appearance doesn't depend on which tab is looking.
- [x] `DesktopStage` — fixed pixel-accurate `OrthographicCamera` + a `world`
      group that eases toward `-selfRect`, standing in for CameraRig (see
      code comment in `components/DesktopStage.jsx` for why CameraRig doesn't
      fit this scene's camera model).
- [ ] Debug overlay showing this window's registry id / host status — useful
      once Fluid Sim / Gravity Rooms need to reason about which window is
      host, currently not needed since Clouds doesn't have host-only logic.

# // Interactivity

# // Bugs
