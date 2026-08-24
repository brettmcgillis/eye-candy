# // One In The Hand, Two In The Cage

# // Intent / Use Cases

- This scene is built around three main assets, a skeleton, a branch, and a bird.
- The camera is focused on the top half of the skeleton, including the spine, ribcage and above.
- The scene contains the branch is going through the skeleton's ribs
- The scene contains two instances of the bird model.
- In one preset both birds are perched on the branch in the rib cage. The skeleton is posed looking down towards the ribs and birds, with hands coming up as if to inspect
- In one preset the skeleton has an arm extended out infront of itself with pointer finger extended. one bird instance is perched on the finger. The other bird instance remains in the ribcage.
- the skeleton already has poses (ie single frame animations) named after the desired presets.
- scene file is orchestrator
- scene leverages controls hook and other hooks from ./hooks
- scene leverages child components from ./components
- scene leverages presets folder hook, as well as presets from ./presets
- files are kept small for easy human and agent consumptions
- files, variables, etc, are never prefixed with scene name
- scene leverages cameraRig and camera rig control folder
- components are memoized to prevent rerenders
- components have good separation of concerns
- have many animated bird models in repo, scene should allow switching between to figure out which one(s) are the best for the composition

# // TODO:

[Back to main TODO](../../../../../TODO.md)

# // Presets

- One In the Hand
- Two In the Cage

# // Features

# // Interactivity

# // Bugs
