# #TODO:

- update screenshot(s)

- EXPLORE/EXPLODE
  -- glass
  -- chrome/metalic
  -- pixelation component.

- OVERLAY
  -- update defaults on leva for visiblity, collapsed
  -- add personal links
  -- display back link contextually.
  -- show emojis contextually.

- APP
  -- serve up multiple scenes
  --- portal(s)?, picture frames?, routing?

- SCENES
  -- NEWSCENE
  --- name it
  --- Cloud size, position , bounds, color, castShadow, receiveShadow
  --- Skull elements disabled by default
  --- default camera position
  --- element position controls
  --- element rotation controls
  --- post processing (dots, godrays, +)
  --- motion controls (drag drop)
  --- physics

  -- FOLDEDFRAME
  --- fix default lighting
  --- Blender up a model for the frolded frame :| ~!
  --- animate layer color
  --- break elements out into reusable components where possible

- ELEMENTS
  -- HALO
  --- halo props to controls
  --- halo hover glow
  --- generative halos?
  -- SKULL
  -- props to controls
  --- element position controls
  --- material controls (? chrome skull)

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
  // });
  ```
