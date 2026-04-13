# // ExplosionTest

# // Intent / Use Cases

- I want to develop another interactive material, diven by the cursor position. When the cursor interacts with the material I want the tris of the mesh to explode off the model and hover above while the mouse is there.
- If there is a mesh beneath the original mesh it should be made visible as the tris fly off.
- The material should be generic enough to be applied to any model, with props to tune the appearance and behaviour for larger or smaller meshes/scenes
- Beyond this, implementation details should be left up to consumers. Example: if a scene wants an explodable model with an inner glass core, the scene should contain a sub-component that is responsible for loading or instantiating the meshes and adding the materials in the appropriate order and position.
- The scene should contain a collection of simple geometry to test the material on, a sphere, a cube, and a plane.
- The scene shoudld contain a collection of more complex geometry to test on, a sphere with a smaller glass sphere inside, a cube with a smaller glass cube within and a plane with a glass plane behind it.
- When the material is done being developed and Im 100% happy with it we will promote it to the components/materials folder for use in other scenes

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [x] Support as many material types as possible so that we can explode any material we can use in Thre. Right now we pass in a meshStandardMaterial. What else could we support?
- [x] Move components, hooks, and presets into sub folders.
- [x] create a new material that uses the shader from explodable group.
- [x] Update presets so we have an example of each material type. Include one meshStandard in wireframe mode

# // Presets

# // Bugs

- [x] Seeing issues when exploding the cube. The only points of interaction that seem to work are the vertexes where the faces meet. Interacting with the cube faces doenst make the effect happen. We can explode the face of a plane and a sphere so I suspect we can do the same with a cube

# // Intended scene + component graph

- Scene - In explosion Test folder
  - Sphere - In components folder, receives props for material behavior
    - exploding material - A new explodingMaterial in the components folder
    - sphere geo
  - Cube
    - exploding material
    - cube geo
  - Plane
    - exploding material
    - plane geo
  - DoubleSphere - In components folder, receives props for material behavior
    - Sphere - Reuse the componet from above
    - glass material + sphere geo - Colocated geometry (slightly smaller) with mesh transmission material.
  - DoubleCube
    - Cube
    - glass material + cube geo
  - Plane
    - Plane
    - glass material + plane geo

# // Intended Control Layout

- Explosion Test
  - Presets
    - dropdown
    - reset button
    - copy button
  - Scene
    - Bg Color
    - Lighting settings
  - Shader Settings
    - Any controls for exploding behavior
  - Material Settings
    - material type dropdown
    - Any settings for the underlying material. (color, roughness, props supported by material type)

# // Intended File Structure

- ExplosionTest
  - Components
    - Sphere.jsx
    - Cube.jsx
    - Plane.jsx
    - DoubleSphere.jsx
    - DoubleCube.jsx
    - DoublePlane.jsx
    - explodingMaterial.jsx
  - Hooks
    - useSceneControls.jsx
  - Presets
    - presets.js
  - ExplosionTest.jsx
  - todo.md
