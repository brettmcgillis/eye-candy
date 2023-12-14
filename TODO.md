# #TODO:

- update screenshot.png

- OVERLAY
  -- update defaults on leva for visiblity, collapsed

- NEWSCENE
  -- name
  -- element position controls
  -- element rotation controls

- HALO
  -- halo props (# of rings)
  -- halo hover glow
  -- generative halos?

- SKULL
  -- element position controls
  -- material controls (? chrome skull)

- ENVIRONMENT (app)
  -- default camera position
  -- orbit by default
  -- portal(s)?
  -- motion controls (ie drag drop elements?)
  -- physics
  -- post processing?
  -- Cloud
  -- selectable background color

- LIGHTINGRIG
  -- improve controls
  -- directional lighting

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
- add utils
  -- color utilites (hook into THREE if possible)

- Start new scene to recreated folded frame #?
