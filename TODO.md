# #TODO:

### GENERAL

- [ ] add/update screenshot(s) on readme for each scene
- [ ] Add info button and stylized byline to showcase scenes. ByLine should be a modal. Should allow for text, images, links, and dismissal.
- [ ] Webgpu supports occlusion culling. Would any scenes benefit in perf from this?
- [ ] Reread the Mathias-reaseach article on cloth self-collision and use it to improve cloth flag and ghost. https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/15-selfCollision.html
- [ ] Webgpu scenes will randomly not render (all black) until a window resize?
- [ ] Flatten Showcase/WIP folder structure to WebGL/WebGPU.
- [ ] Move showcase scenes over to WebGPU

### REPO

### EXPLORE/EXPLODE

### APP

- [Scaffold](src/app/scaffold/todo.md)

### EFFECTS

- [FractalPixelate](src/components/postprocessing/webGPU/fractalPixelate/todo.md)

### SCENES

To Build:

- [ ] Video casette tape with video playing on tape ribbon
- [ ] CSG Skull. Knock a reversal out of its forehead. grow some crystals on it `~/dev/examples/260222_CrystalGrowth`
- [ ] Metaball (marching cubes) interactive lava lamp
- [ ] Audio reactive/interactive tree (use bonsai, grow the stem, bud and flower dynamically)
- [ ] Eyeball
- [ ] leverage threejs addons/generators for skyscraper, city, forest, tree. take a look at the generator docs too. Example; Forest generator can generate on a terrain OR anything that exposes sampleHeight, etc, Could we cover a car model in trees? an animal model in buildings/city?
- [ ] Can we use ecctrl & click to move to make Quinn's board game playable?
- [ ] We should do a scene with Quinns seal, 3rd person camera, player controls w/keyboard and controller.
      Scene should include quinns dice in the environment. Get low-LOD versions.
      Scene should include various art images on planes in the environment.
      Scene should allow user to walk around and look at Quinns Portfolio.
      see example @ https://henryegloff.com/
- [ ] can we build a scene that uses device orientation/gyro etc to allow the user's phone to BE the camera? Add multiplayer mode that allows a desktop user to watch what the phone user is framing with their 'camera'
- [ ] build a scene using an animated mesh, but keep the mesh stationary and have one instance for each animation frame, leading to a 4d view of the subject. is this called Muybridge effect? onion skin effect?
- [ ] deep-sea diver on land, with surface air tube leading up and out of frame.
- [ ] can we voxelize things using three-mesh-bvh and webgpu backdrop pixel effect?
- [ ] interactive spider-plant, in a pot on a table. we could use a small number of very long, stylized grass for the plant. create 'rope' using rapier joints or cloth-sim. could do other leafy-viny plants too.
- [ ] Softbodies - mathias-research has some good examples. https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/10-softBodies.html
- [ ] Rain on the ocean. 2 presets. 1 full color, rain hitting the ocean surface as it rages. 2 black and white, everything is black except for the light reflections from the rain ripples and raindrops.
- [ ] godray point light close to asphalt, ruined cars surrounding it, ruined buildings behind those.
- [ ] Particles, field lines, & emissive spheres in the abandoned interior model
- [ ] can we build a scene with a lightbulb that casts darkness? Negative light intensity!
- [ ] 2D truchet tiling using 3D geometry, animated so a tile, or tiles, rotate 90\* every n-seconds. This could be easily accomplished using Torus geometry and appropriately setting tube, radius, and arc. Another interesting variation might be CSG tiles like the Chips in PaperStack
- [ ] Build a cymatic particle system `~/dev/examples/260610_ChladniCymatics`
- [ ] Generative mazes vs pathfinder algos `~/dev/examples/260602_MazeTerrain` & `~/dev/examples/Pathfinding-Visualizer-ThreeJS`
- [ ] Wan ATI in comfyUI style scene ala WAVE
- [ ] Multicolor godray volume
- [ ] (Dev) Build a color pallette generator to help get some variety in scenes
- [ ] Procedural power poles with interactive verlet powerlines. see `~/dev/examples/PoleGeneratorThreeJS`
- [ ] Endless Hydrolic Erosion Simulation
- [ ] House of leaves: could we use the skyscraper generator as a starting point to learn how to build a house generator to generate one/two/three story homes, and then use the Parallax Occlusion Mapping technique we see on the window to reveal surreal/impossible house interiors? peek in the window to find a forest, space, impossible corridors
- [ ] Wild horses. Horses running in an endless field. Use threejs webgpu volume fire example to create smoke coming off the horse's mane + tail.
- [ ] Consider creative letterboxing for scenes. could be a 3d element to give it depth in the scene, catch shadows.
- [ ] Radar scene. like a radar scanner, rotating clockwise, the radar 'reveals' geometry in the scene as it passes over it similar to that Lidar game. Over time the dots fade so they are gone before the sweep returns. if we use a slowly animated model we could get snapshots in time.
- [ ] Checkout MarkovJunior/MarkovJuniorWeb. id love to generate liminal spaces using similar logic.

### Scene TODO Files

**Showcase**

- [AllMyThoughtsAreSoCumulus](src/components/scenes/Showcase/WebGL/AllMyThoughtsAreSoCumulus/todo.md)
- [Beautys in the eye of the beheaded](src/components/scenes/Showcase/WebGPU/BeautysInTheEyeOfTheBeheaded/todo.md)
- [BirdsArentReal](src/components/scenes/Showcase/WebGPU/BirdsArentReal/todo.md)
- [BurningAtBothEnds](src/components/scenes/Showcase/WebGL/BurningAtBothEnds/todo.md)
- [Cardinals](src/components/scenes/Showcase/WebGL/Cardinals/todo.md)
- [CrossTalk](src/components/scenes/Showcase/WebGPU/CrossTalk/todo.md)
- [DumpsterFire](src/components/scenes/Showcase/WebGL/DumpsterFire/todo.md)
- [HorsesForCourses](src/components/scenes/Showcase/WebGPU/HorsesForCourses/todo.md)
- [LoGlow](src/components/scenes/Showcase/WebGPU/LoGlow/todo.md)
- [Mycelium](src/components/scenes/Showcase/WebGL/Mycelium/todo.md)
- [PaperCuts](src/components/scenes/Showcase/WebGL/PaperCuts/todo.md)
- [PaperStack](src/components/scenes/Showcase/WebGL/PaperStack/todo.md)
- [QuinnsDice](src/components/scenes/Showcase/WebGL/QuinnsDice/todo.md)
- [Rosie](src/components/scenes/Showcase/WebGL/Rosie/todo.md)
- [Surrender](src/components/scenes/Showcase/WebGPU/Surrender/todo.md)
- [Touch Grass](src/components/scenes/Showcase/WebGPU/TouchGrass/todo.md)
- [Trucheterie](src/components/scenes/Showcase/WebGPU/Trucheterie/todo.md)
- [WatercolorSquares](src/components/scenes/Showcase/WebGL/WatercolorSquares/todo.md)
- [Weightless](src/components/scenes/Showcase/WebGPU/Weightless/todo.md)
- [Windswept](src/components/scenes/Showcase/WebGPU/Windswept/todo.md)

**WorkInProgress**

- [Abandoned](src/components/scenes/WorkInProgress/WebGPU/Abandoned/todo.md)
- [Aisle9](src/components/scenes/WorkInProgress/WebGPU/Aisle9/todo.md)
- [AllHandsOffDeck](src/components/scenes/WorkInProgress/WebGPU/AllHandsOffDeck/todo.md)
- [AllMyFriendsAreGhosts](src/components/scenes/WorkInProgress/WebGPU/AllMyFriendsAreGhosts/todo.md)
- [Apparitions](src/components/scenes/WorkInProgress/WebGPU/Apparitions/todo.md)
- [BurningCash](src/components/scenes/WorkInProgress/WebGPU/BurningCash/todo.md)
- [Digital Rain](src/components/scenes/WorkInProgress/WebGPU/DigitalRain/todo.md)
- [DrippingSkull](src/components/scenes/WorkInProgress/WebGPU/DrippingSkull/todo.md)
- [FightingFish](src/components/scenes/WorkInProgress/WebGPU/FightingFish/todo.md)
- [Fireflies](src/components/scenes/WorkInProgress/WebGPU/Fireflies/todo.md)
- [FlyingHigh](src/components/scenes/WorkInProgress/WebGL/FlyingHigh/todo.md)
- [Fractal Automata](src/components/scenes/WorkInProgress/WebGPU/FractalAutomata/todo.md)
- [GetWrecked](src/components/scenes/WorkInProgress/WebGPU/GetWrecked/todo.md)
- [GhostStories](src/components/scenes/WorkInProgress/WebGPU/GhostStories/todo.md)
- [HexTrees](src/components/scenes/WorkInProgress/WebGPU/HexTrees/todo.md)
- [My Heart Is A Broken Fish Tank](src/components/scenes/WorkInProgress/WebGPU/MyHeartIsABrokenFishTank/todo.md)
- [OneInTheHand](src/components/scenes/WorkInProgress/WebGPU/OneInTheHand/todo.md)
- [PolicePresence](src/components/scenes/WorkInProgress/WebGL/PolicePresence/todo.md)
- [Prayer](src/components/scenes/WorkInProgress/WebGPU/Prayer/todo.md)
- [QuinnsPlayground](src/components/scenes/WorkInProgress/WebGL/QuinnsPlayground/todo.md)
- [RaisedByTV](src/components/scenes/WorkInProgress/WebGPU/RaisedByTV/todo.md)
- [RowItAlone](src/components/scenes/WorkInProgress/WebGL/RowItAlone/todo.md)
- [RowItAlone-WebGPU](src/components/scenes/WorkInProgress/WebGPU/RowItAlone/todo.md)
- [Rorschach](src/components/scenes/WorkInProgress/WebGPU/Rorschach/todo.md)
- [StayHunted](src/components/scenes/WorkInProgress/WebGPU/StayHunted/todo.md)
- [StayingAfloat](src/components/scenes/WorkInProgress/WebGL/StayingAfloat/todo.md)
- [StillPullingForYou](src/components/scenes/WorkInProgress/WebGPU/StillPullingForYou/todo.md)
- [ThatsAllFolks](src/components/scenes/WorkInProgress/WebGPU/ThatsAllFolks/todo.md)
- [UrbanWildlife](src/components/scenes/WorkInProgress/WebGPU/UrbanWildlife/todo.md)
- [WaterCycle](src/components/scenes/WorkInProgress/WebGPU/WaterCycle/todo.md)
- [Wet Paint](src/components/scenes/WorkInProgress/WebGPU/WetPaint/todo.md)
- [WhiteLies](src/components/scenes/WorkInProgress/WebGPU/WhiteLies/todo.md)
- [WindowBreaker](src/components/scenes/WorkInProgress/WebGPU/WindowBreaker/todo.md)

**Template**

- [SceneTemplate](src/components/scenes/Template/SceneTemplate/todo.md)

**TestLab**

- [ExplosionTest](src/components/scenes/TestLab/WebGL/ExplosionTest/todo.md)
- [FluidTest](src/components/scenes/TestLab/WebGL/FluidTest/todo.md)
- [FurLab (webGL)](src/components/scenes/TestLab/WebGL/FurLab/todo.md)
- [HandStuff](src/components/scenes/TestLab/WebGL/HandStuff/todo.md)
- [ParticleLab](src/components/scenes/TestLab/WebGL/ParticleLab/todo.md)
- [PixelHater](src/components/scenes/TestLab/WebGL/PixelHater/todo.md)
- [StrudelDoodle](src/components/scenes/TestLab/WebGL/StrudelDoodle/todo.md)
- [TheBoneZone](src/components/scenes/TestLab/WebGL/TheBoneZone/todo.md)
- [MobilePhysicsTest](src/components/scenes/TestLab/WebGPU/MobilePhysicsTest/todo.md)
- [NetworkTest](src/components/scenes/TestLab/WebGPU/NetworkTest/todo.md)
- [FurLab (webGPU)](src/components/scenes/TestLab/WebGPU/FurLab/todo.md)
- [TheLoom](src/components/scenes/TestLab/WebGPU/TheLoom/todo.md)
- [LightningLab (webGL)](src/components/scenes/TestLab/WebGL/LightningLab/todo.md)
- [LightningLab (webGPU)](src/components/scenes/TestLab/WebGPU/LightningLab/todo.md)

**ToolBox**

- [CRTTest (webGL)](src/components/scenes/ToolBox/WebGL/CRTTest/todo.md)
- [CRTTest (webGPU)](src/components/scenes/ToolBox/WebGPU/CRTTest/todo.md)
- [FireTest](src/components/scenes/ToolBox/FireTest/todo.md)
- [HotBox](src/components/scenes/ToolBox/HotBox/todo.md)
- [PenPlotter](src/components/scenes/ToolBox/WebGL/PenPlotter/todo.md)
  - [PlotScenes](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/todo.md)
  - [GenerativeGeometry](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/GenerativeGeometry/todo.md)
  - [NetworkPlot](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/NetworkPlot/todo.md)
  - [ParticlePlot](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/ParticlePlot/todo.md)
- [SmokeTest](src/components/scenes/ToolBox/SmokeTest/todo.md)
- [SplineEditor](src/components/scenes/ToolBox/WebGL/SplineEditor/todo.md)
- [TrashCollector](src/components/scenes/ToolBox/WebGL/TrashCollector/todo.md)
- [GhostBuster](src/components/scenes/ToolBox/WebGPU/GhostBuster/todo.md)
- [CharacterController (webGPU)](src/components/scenes/ToolBox/WebGPU/CharacterController/todo.md)
- [CharacterController (webGL)](src/components/scenes/ToolBox/WebGL/CharacterController/todo.md)
- [MultiplayerMadness (webGPU)](src/components/scenes/ToolBox/WebGPU/MultiplayerMadness/todo.md)
- [MultiplayerMadness (webGL)](src/components/scenes/ToolBox/WebGL/MultiplayerMadness/todo.md)

### ELEMENTS

#### SKULL

- [ ] Refactor like we did with bret/reversal to offer a generic that takes props, and specialized versions

## Show

### Tools/TestLab To Demo

- [ ] PenPlotter
- [ ] Explosion Test
- [ ] Particle Lab
- [ ] PixelHater updates (censor, voxels)
- [x] GhostBuster
- [ ] CharacterController
- [ ] MultiplayerMadness
- [ ] Spline Editor
- [ ] SmokeTest
- [ ] FireTest
- [ ] HotBox
- [ ] LightningLab
- [ ] FurLab
- [ ] GLTF Workbench
- [ ] CRT Test

### Scenes to post

- [ ] All my Thoughts Are So Cumulus - Atomic
- [ ] All my Thoughts Are So Cumulus - Censored Rings
- [ ] All my Thoughts Are So Cumulus - Network
- [ ] All my Thoughts Are So Cumulus - Plate
- [ ] All my Thoughts Are So Cumulus - Record
- [x] All my Thoughts Are So Cumulus - Static
- [ ] All my Thoughts Are So Cumulus - Universal
- [x] Birds Arent Real
- [x] Burning At Both Ends - Enlightened
- [x] Burning At Both Ends - Extinguished
- [x] Burning At Both Ends - Lenticular Print
- [x] Cardinals - Cardinals
- [ ] Cardinals - Bluejays
- [ ] Cardinals - Magpies
- [x] Cross Talk - Cloud Connected
- [x] Cross Talk - Water Works
- [ ] Cross Talk - Gravity Rooms
- [ ] Cross Talk - Radiance Cascades
- [ ] Dumpster Fire
- [x] Horses For Courses
- [x] LoaderPattern(s)
- [x] LoGlow - Default
- [x] LoGlow - Mondrian
- [x] Mycelium
- [x] PaperCuts - Default
- [x] PaperCuts - Morse Code
- [ ] PaperCuts - Layer Fade
- [ ] PaperCuts - Argyle (2)
- [ ] PaperCuts - 11 (3)
- [x] PaperStack - Gradient Scan
- [ ] Surrender
- [ ] Surrender Now
- [ ] Surrender - Autumn
- [x] Surrender - Spring
- [ ] Surrender - Winter
- [ ] Surrender - Weather Any Storm
- [x] Touch Grass
- [x] Trucheterie - 001
- [x] Water Cycle - Ocean Implied
- [x] Windswept - Tangled
- [ ] Weightless - Simulated Flight
- [x] Weightless - Sketchbook
- [ ] Weightless - Wingspeed

### Toolbox/TestLab to finish before demo

- [ ] TheLoom
- [ ] TheBoneZone

### Scenes finish before post

- [ ] Abandoned
- [ ] Aisle 9
- [ ] All My Friends Are Ghosts
- [ ] Apparitions
- [ ] Burning Cash
- [ ] Cross Talk - Particles & Attractors
- [ ] Cross Talk - Other Presets
- [ ] Digital Rain
- [ ] Dripping Skull
- [ ] Fireflies
- [ ] Flying High - Day
- [ ] Flying High - NightMode
- [ ] Fractal Automata
- [ ] GhostStories
- [ ] HexTrees
- [ ] LoGlow - Growth
- [ ] My Heart Is A Broken Fish Tank
- [ ] One In The Hand
- [ ] One In The Hand - Two in the cage
- [ ] Police Presence
- [ ] Police Presence - City sitting on cinder blocks
- [ ] Prayer - One Prayer
- [ ] Prayer - Two Prayers
- [ ] Prayer - Three Prayers
- [ ] Raised By TV
- [ ] Rorshach - lines
- [ ] Rorshach - points with dramatic lighting
- [ ] Rorshach - watercolor
- [ ] Rorshach - lines over watercolor
- [ ] Row It Alone
- [ ] Stay Hunted
- [ ] Still Pulling For You - Rough Waters
- [ ] Still Pulling For You - Still Pulling
- [ ] Still Pulling For You - Sunk
- [ ] Thats All Folks - Smoke
- [ ] Thats All Folks - Bang
- [ ] Touch Grass - Cut Grass
- [ ] Trucheterie - triangular grid
- [ ] Trucheterie - multiscale square grid
- [ ] Trucheterie - multiscale triangular grid
- [ ] Trucheterie - field grid
- [ ] Urban Wildlife / Night Danger
- [ ] Water Cycle - Other presets
- [ ] Weightless - Default
- [ ] Weightless - Touchsensitive
- [ ] Weightless - Magnetic North
- [ ] Weightless - Bee
- [ ] Weightless - Dragonfly
- [ ] Wet Paint
- [ ] White Lies
- [ ] WindowBreaker
- [ ] Windswept - Default
- [ ] Windswept - Clover
- [ ] Windswept - Duality
- [ ] Windswept - Physical Attraction

### Scenes to build

- [ ] All Hands Off Deck
- [ ] Quinn's Playground
- [ ] FightingFish

## Lenticulars

- need to make sure there is not
  - high contrast between subject and background
  - high contrast between frames

- [x] Burning At Both Ends
- [ ] Still Pulling For you - Triptych
  - [ ] Rough Waters
  - [ ] Still Pulling
  - [ ] Sunk
- [ ] All my Thoughts Are So Cumulus - Static

## Firescale

Ive accumulated a bunch of scenes that involve things on fire or smoking. Cataloging here so I can make sure they all work nicely as I continue to upgrade my smoke and fire systems

- Candle - Burning At Both Ends
- Gun - Thats All Folks
- Dumpster - Dumpster Fire
- Police Car - Police Presence
- Tug Boat - Still Pulling For You
- Airplane - Flying High (with both engines on fire)

# // ASCII Settings

Plopping this here since Im about to rip it out elsewhere.

- This is supposed to be every char in ascending density
  // " `.-':\_,^=;><+!rc\*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@",
- These look cool
  // " ░▒▓█"
  // " ▁▂▃▄▅▆▇█"
  // " ░▒▓█▁▂▃▄▅▆▇█"
