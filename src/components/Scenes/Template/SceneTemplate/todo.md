# // Scene Template

# // TODO:

[Back to main TODO](../../../../../TODO.md)

# // Intent/Use Cases

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

# // Features

# // Bugs
