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

- serve up multiple scenes
  - portal(s)?, picture frames?, routing?

### SCENES

#### NEWSCENE

- name it
- extract all settings to json
- reset button (leverage set() + json settings)
- post processing (dots, godrays, +)
- Fun stuff
  - Atomic Halo
  - 45lb Halo
  - neural network halo
  - Animation (rotation + wobble, refactor out of record, into reusable code to be applied to any halo type)
  - motion controls (drag drop)
  - physics (cannon looks good, rapier looks better, is installed)

#### FOLDEDFRAME

- fix default lighting
- animate layer color
- break elements out into reusable components where possible

#### LOGLOW

- Rename
- Animate (flip, neon flicker)

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
