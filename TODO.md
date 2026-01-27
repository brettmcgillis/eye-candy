# #TODO:

- add/update screenshot(s) on readme for each scene

- Fix dbg layout on mobile

### REPO

- re-enable react/no-unknown-property, react/prop-types ?
- state management
- springs?
- maath

### EXPLORE/EXPLODE

- glass
- pixelation component.

### OVERLAY

- add personal links
- display back link contextually.
- show emojis contextually.
- change positions when on mobile

### APP

- fix icon used in manifest, logo192 is not the right size, causes console err
- serve up multiple scenes
  - portal(s)?, picture frames?, routing?

### SCENES

### PixelHater

- See if we can improve shader to prevent pixel colors including unmasked object colors.

### Dumpster Fire

- Totally broken. see console for err. cant switch scenes

#### FoldedFrame

- fix default lighting
- fix default camera positiopn
- animate layer color
- break elements out into reusable components where possible

#### LoGlow

- Rename
- Animate (flip, neon flicker)

#### NewScene

- name it
- extract all settings to json
- reset button (leverage set() + json settings)
- post processing (dots, godrays, +)
- add environment for reflections, add children for their reflections.
- Fun stuff
  - Atomic Halo
  - 45lb Halo
  - neural network halo (built, wire up)
  - Animation (rotation + wobble, refactor out of record, into reusable code to be applied to any halo type)
  - motion controls (drag drop)
  - physics (cannon looks good, rapier looks better, is installed)

### PaperStack

- Totally broken, no color. upgrade csg? rebuild?

### HandStuff

- Upgrade mediaPipe, handControls, and gestureControls hooks to handle n hands as array. Update scene to spawn probes based on number returned.
- Refactor hook to break apart media pipe and webcam + camera for reusability. Scenes need to be able to determine their own draw functions. hook responsible for drawing should accept an array of functions and provide the existing default.

### NetworkTest

- Points are broken? Likely canvas gl related
- When they are ready, promote hooks from handstuff, and bring them in to the scene to control network size, volume rotation etc

### StrudelDoodle

- Prevent panel from stealing mouse, should still be able to click overlay items.
- Could we replace the text area with the REPL still maintain control?
- Could we show strudel visuals on the background of the scene?

### ELEMENTS

- make them all forwardRefs

#### HALO

- halo props to controls
- halo hover glow
- generative halos?

#### SKULL

- default prop vals
- element position controls
- material controls (? chrome skull)

#### LOGO

- visiblity to props

### ENVIRONMENT (app)

- background color
- background environment
- background fog

### SCREENSHOT

- add watermark?
- add Screen Rec
  - add screen rec controls.

### CAMERARIG

- add camera rig with props for default position, more
- add camera controls, control availablity with props?
- orbit (on/off w/props)

### LIGHTINGRIG

- props
- directional lighting

### UTILS

- color utilites
  - (hook into THREE for glow etc)

### CONTROLS

- universal control module

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
