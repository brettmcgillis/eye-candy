# // Scaffold

# // TODO:

[Back to main TODO](../../../TODO.md)

# // Overlay

- [x] Show version on overlay
- [x] Spring animate leva transition.
- [x] add personal links
- [x] show emojis contextually.
- [x] change positions when on mobile
- [x] update leva theme
- [x] Add query param to increase top bottom padding on overlay containers for ig posts.
- [ ] Add query param for hide overlay, with hotkey combo to reveal.
- [x] Update the way we set up the Leva controls/menu and scaffold the app. It should end up looking like the pseudo code below. we also want to make sure we can still link directly to a scene (ie eye-candy/?mode=gpu&area=showcase&scene=myCoolScene)

  ```
  - v 0.1.0
  - Stats
  - Channel (mode? not sure whats best here)
    Option - WebGPU - Sets the WebGPU Canvas wrapper
    Option - WebGL - Sets the WebGL Canvas wrapper
  - Area (? what makes sense here too ?)
    Option - Showcase - Sets us on WebGL/WebGPU ShowCase
    Option - Work in progress - Sets us on WebGL/WebGPU WIP
    Option - TestLab - Sets us on WebGL/WebGPU TestLab
    Option - Toolbox - Sets us on WebGL/WebGPU Toolbox
  - Scene
    Options - Provided by the Showcase/WIP/TestLab/Toolbox
  ```

- [x] Update how SceneMoji sets up and displays. New Format: 🔥 - {Area} - {Scene}
  - Area:
    - ShowCase: no emoji, no second hyphen.
    - Wip: 🏗️
    - TestLab: 🧪
    - Toolbox: 🧰
  - Scene: Should be the icondefined in our scene registry hooks

## // NoScene

- [x] Remove skull emoji
- [x] Fix opaque png
- [x] Add bret.png, turboflex.png
- [x] Cycle pngs randomly
- [x] Can we hide behind Suspense & Loader until png is ready?
