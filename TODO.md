# #TODO:

### GENERAL

- [x] Add scripts to update major, minor, hotfix versions
- [x] Add scripts to deploy next maj, min, hotfix
- [ ] add/update screenshot(s) on readme for each scene
- [x] Fix dbg layout on mobile

### REPO

- [ ] re-enable react/no-unknown-property, react/prop-types ?
- [ ] state management
- [x] springs? got it
- [x] maath

### EXPLORE/EXPLODE

- [ ] glass
- [x] pixelation component. did a pixelhater

### APP

- [x] fix icon used in manifest, logo192 is not the right size, causes console err
- [x] serve up multiple scenes. portal(s)?, picture frames?, routing?
- [ ] if were doing screen cap then move it out of scenes and into something at app layer

- [Scaffold](src/app/scaffold/todo.md)

### SCENES

- [ ] Hoist Cardinals (mobile) out of Fluid Test and into dedicated scene at the App level. Do not bring test mode, scene is always plane + orthographic cam
- [ ] Hoist Watercolor Squares (mobile) out of Fluid Test and into dedicated scene at the App level. Include Blue variant as preset. Do not bring test mode, scene is always plane + orthographic cam. Consider: Does watercolor squares override controls to provide consistent appearance across viewport sizes?

### Scene TODO Files

- [CRTTest](src/components/scenes/CRTTest/todo.md)
- [ExplosionTest](src/components/scenes/ExplosionTest/todo.md)
- [FluidTest](src/components/scenes/FluidTest/todo.md)
- [MobilePhysicsTest](src/components/scenes/MobilePhysicsTest/todo.md)
- [ParticleLab](src/components/scenes/ParticleLab/todo.md)
- [PaperStack](src/components/scenes/PaperStack/todo.md)
- [QuinnsDice](src/components/scenes/QuinnsDice/todo.md)
- [Rosie](src/components/scenes/Rosie/todo.md)
- [StrudelDoodle](src/components/scenes/StrudelDoodle/todo.md)

### PixelHater

- [ ] See if we can improve shader to prevent pixel colors including unmasked object colors.

### Dumpster Fire

- [x] Totally broken. see console for err. cant switch scenes

#### FoldedFrame

- [ ] fix default lighting
- [ ] fix default camera positiopn
- [ ] animate layer color
- [ ] break elements out into reusable components where possible

#### LoGlow

- [ ] Rename
- [x] Animate (flip, neon flicker)

#### NewScene

- [ ] name it
- [ ] extract all settings to json
- [ ] reset button (leverage set() + json settings)
- [ ] post processing (dots, godrays, +)
- [ ] add environment for reflections, add children for their reflections.
- [ ] Fun stuff
  - [ ] Atomic Halo
  - [ ] 45lb Halo
  - [ ] neural network halo (built, now wire up)
  - [ ] Animation (rotation + wobble, refactor out of record, into reusable code to be applied to any halo type)
  - [ ] motion controls (drag drop)
  - [ ] physics (cannon looks good, rapier looks better, is installed)

### PaperStack

- [x] Totally broken, no color. upgrade csg? rebuild? Fixed!
- [ ] Add compelling animations
- [x] create window orientation presets using settings, add preset option control
- [x] create some preset color arrangements, add controls.

### HandStuff

- [ ] Upgrade mediaPipe, handControls, and gestureControls hooks to handle n hands as array. Update scene to spawn probes based on number returned.
- [ ] Refactor hook to break apart media pipe and webcam + camera for reusability. Scenes need to be able to determine their own draw functions. hook responsible for drawing should accept an array of functions and provide the existing default.
- [ ] Allow for unmounting webcam from scene (ie, if i enable it then disable it, we shouldnt still have a handle on the cam)

### NetworkTest

- [ ] Points are broken? Likely canvas gl related
- [ ] Bring hand control hooks in to the scene to control network size, volume rotation etc
- [ ] show instanced meshes at points?

### StrudelDoodle

- [x] Prevent panel from stealing mouse, should still be able to click overlay items.
- [ ] Could we replace the text area with the REPL still maintain control?
- [ ] Could we show strudel visuals on the background of the scene?
- [ ] do a background. keep it on theme

### ELEMENTS

- [ ] make them all forwardRefs

#### HALO

- [ ] halo props to controls
- [ ] halo hover glow
- [ ] generative halos?

#### SKULL

- [ ] default prop vals
- [ ] element position controls
- [ ] material controls (? chrome skull)
- [ ] CSG Skull?

#### LOGO

- [ ] visiblity to props

### ENVIRONMENT (app)

- [ ] probably just delete it
- [ ] background color
- [ ] background environment
- [ ] background fog

### SCREENSHOT

- [ ] add watermark?
- [ ] make it work on mobile
- [ ] add Screen Recording

### CAMERARIG

- [ ] Probably just delete it
- [ ] add camera rig with props for default position, more
- [ ] add camera controls, control availablity with props?
- [ ] orbit (on/off w/props)

### LIGHTINGRIG

- [ ] Probably just delete it
- [ ] props
- [ ] directional lighting

### UTILS

- [ ] color utilites
  - [ ] (hook into THREE for glow etc)

### CONTROLS

- [ ] universal control module

```javascript
// COMPLEX CONTROLS~!
// const controls = useControls("Controls", {
//   show: { value: true, label: "Show color" },
//   color: { value: "#fff", render: (get) => get("Controls.show") },
//   show2: { value: false, label: "Show folder" },
//   folder: folder(
//     {
//       number: 1,
//       string: {
//         value: "shown if `number >= 1`",
//         render: (get) => get("Controls.folder.number") >= 1,
//       },
//     },
//     { render: (get) => get("Controls.show2") }
//   ),
//   options: {
//     value: 'helloWorld',
//     options: {
//       'Hello World': 'helloWorld',
//       'Leva is awesome!': 'leva',
//     },
//   }
// });
```

### Scene setup and conventions

File: ~/SceneName/SceneName.jsx

- A fully encapsulated scene component that accepts no props and is designed to be dropped in a <Canvas />

File: ~/SceneName/useSceneControls.js

- Leverages leva use controls to provide control values to the scene and mange scene state.
- Some scenes will provide a preset dropdown allowing users to set control values to predetermined settings.
- Scenes with a preset dropdown also get a reset button to restore control values to the currently selected preset.
- Scenes with a preset dropdown also get a copy settings button, to allow me to copy the control settings as json, and bring them back to the IDE as new or updated presets.

File: ~/SceneName/scenePresets.js

- Contains control presets, in json format.
- More mature scenes with multiple configs will get a presets file, to be leveraged in the controls hook to provide an options dropdown

File: ~/SceneName/TestScene.jsx

- Some scenes are designed to build and exercise tooling. These scenes require a sub-scene to test against. Subscenes go into a dedicated TestScene file to keep the main component clean and ensure tooling is generic enough to be used against any other sub-scene.

- [ ] Check out Tone.js for audio. Could be a good solution to bridging Strudel, Mp3, etc.

- [ ] We should do a scene with Quinns seal, 3rd person camera, player controls w/keyboard and controller.
      Scene should include quinns dice in the environment.
      Scene should include various art images on planes in the environment.
      Scene should allow user to walk around and look at Quinns Portfolio.
      see example @ https://henryegloff.com/

- v 0.1.0
- Stats
- Channel
  Option - WebGPU - Sets the WebGPU Canvas wrapper
  Option - WebGL - Sets the WebGL Canvas wrapper
- Area
  Option - Showcase - Sets us on WebGL/WebGPU ShowCase
  Option - Work in progress - Sets us on WebGL/WebGPU WIP
  Option - TestLab - Sets us on WebGL/WebGPU TestLab
  Option - Toolbox - Sets us on WebGL/WebGPU Toolbox
- Scene
  Options - Provided by the Showcase/WIP/TestLab/Toolbox

- SceneMoji
  Format: 🔥 - {Area} - {Scene}
- Area:
  - ShowCase: no emoji, no second hyphen.
  - Wip: 🏗️
  - TestLab: 🧪
  - Toolbox: 🧰
- Scene: Should be defined in our scene registry hooks
