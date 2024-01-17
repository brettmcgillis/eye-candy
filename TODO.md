# #TODO:

- update screenshot(s)

- EXPLORE/EXPLODE
  -- glass
  -- chrome/metalic
  -- pixelation component.

- OVERLAY
  -- add personal links
  -- display back link contextually.
  -- show emojis contextually.

- APP
  -- serve up multiple scenes
  --- portal(s)?, picture frames?, routing?

- SCENES
  -- NEWSCENE
  --- name it
  --- extract all settings to json
  --- reset button (leverage set() + json settings)
  --- default camera position
  --- post processing (dots, godrays, +)
  --- Fun stuff
  ---- motion controls (drag drop)
  ---- physics

  -- FOLDEDFRAME
  --- fix default lighting
  --- animate layer color
  --- break elements out into reusable components where possible

- ELEMENTS
  -- HALO
  --- halo props to controls
  --- halo hover glow
  --- generative halos?
  -- SKULL
  -- element position controls
  -- material controls (? chrome skull)

- ENVIRONMENT (app)
  -- selectable background color

- SCREENSHOT
  -- add watermark?
  -- add Screen Rec
  --- add screen rec controls.

- CAMERARIG
  -- add camera rig with props for default position, more
  -- add camera controls, control availablity with props?
  -- add screenshot to camera rig, control availablity with props?
  -- orbit (on/off w/props)

- LIGHTINGRIG
  -- props
  -- improve controls
  -- directional lighting

- UTILS
  -- color utilites
  --- (hook into THREE for glow etc)

- CONTROLS
  -- universal control module
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
