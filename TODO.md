# #TODO:

### GENERAL

- [x] Add scripts to update major, minor, hotfix versions
- [x] Add scripts to deploy next maj, min, hotfix
- [ ] add/update screenshot(s) on readme for each scene
- [x] Fix dbg layout on mobile

### REPO

- [ ] re-enable react/no-unknown-property, react/prop-types ?
- [x] springs? got it
- [x] maath

### EXPLORE/EXPLODE

- [ ] glass
- [x] pixelation component. did a pixelhater
- [ ] Check out Tone.js for audio. Could be a good solution to bridging Strudel, Mp3, etc.

### APP

- [x] fix icon used in manifest, logo192 is not the right size, causes console err
- [x] serve up multiple scenes. portal(s)?, picture frames?, routing?
- [ ] if were doing screen cap then move it out of scenes and into something at app layer

- [Scaffold](src/app/scaffold/todo.md)

### SCENES

To Build:

- [ ] CSG Skull. Knock a reversal out of its forehead.
- [ ] Metaball (marching cubes) lava lamp
- [ ] We should do a scene with Quinns seal, 3rd person camera, player controls w/keyboard and controller.
      Scene should include quinns dice in the environment. Get low-LOD versions.
      Scene should include various art images on planes in the environment.
      Scene should allow user to walk around and look at Quinns Portfolio.
      see example @ https://henryegloff.com/

### Scene TODO Files

**Showcase**

- [FoldedFrame](src/components/scenes/Showcase/WebGL/FoldedFrame/todo.md)
- [LoGlow](src/components/scenes/Showcase/WebGL/LoGlow/todo.md)
- [NewScene](src/components/scenes/Showcase/WebGL/NewScene/todo.md)
- [PaperStack](src/components/scenes/Showcase/WebGL/PaperStack/todo.md)
- [PenPlotter](src/components/scenes/Showcase/WebGL/PenPlotter/todo.md)
  - [PlotScenes](src/components/scenes/Showcase/WebGL/PenPlotter/PlotScenes/todo.md)
  - [GenerativeGeometry](src/components/scenes/Showcase/WebGL/PenPlotter/PlotScenes/GenerativeGeometry/todo.md)
  - [NetworkPlot](src/components/scenes/Showcase/WebGL/PenPlotter/PlotScenes/NetworkPlot/todo.md)
  - [ParticlePlot](src/components/scenes/Showcase/WebGL/PenPlotter/PlotScenes/ParticlePlot/todo.md)
- [QuinnsDice](src/components/scenes/Showcase/WebGL/QuinnsDice/todo.md)
- [Rosie](src/components/scenes/Showcase/WebGL/Rosie/todo.md)

**TestLab**

- [ExplosionTest](src/components/scenes/TestLab/WebGL/ExplosionTest/todo.md)
- [FluidTest](src/components/scenes/TestLab/WebGL/FluidTest/todo.md)
- [HandStuff](src/components/scenes/TestLab/WebGL/HandStuff/todo.md)
- [ParticleLab](src/components/scenes/TestLab/WebGL/ParticleLab/todo.md)
- [PixelHater](src/components/scenes/TestLab/WebGL/PixelHater/todo.md)
- [StrudelDoodle](src/components/scenes/TestLab/WebGL/StrudelDoodle/todo.md)
- [MobilePhysicsTest](src/components/scenes/TestLab/WebGPU/MobilePhysicsTest/todo.md)
- [NetworkTest](src/components/scenes/TestLab/WebGPU/NetworkTest/todo.md)

**WorkInProgress**

- [BurningAtBothEnds](src/components/scenes/WorkInProgress/WebGL/BurningAtBothEnds/todo.md)
- [CRTTest](src/components/scenes/WorkInProgress/WebGL/CRTTest/todo.md)
- [DumpsterFire](src/components/scenes/WorkInProgress/WebGL/DumpsterFire/todo.md)
- [ThatsAllFolks](src/components/scenes/WorkInProgress/WebGL/ThatsAllFolks/todo.md)
- [StillPullingForYou](src/components/scenes/WorkInProgress/WebGL/StillPullingForYou/todo.md)
- [PolicePresence](src/components/scenes/WorkInProgress/WebGL/PolicePresence/todo.md)
- [FlyingHigh](src/components/scenes/WorkInProgress/WebGL/FlyingHigh/todo.md)
- [RowItAlone](src/components/scenes/WorkInProgress/WebGL/RowItAlone/todo.md)
- [StayingAfloat](src/components/scenes/WorkInProgress/WebGL/StayingAfloat/todo.md)

**Template**

- [SceneTemplate](src/components/scenes/Template/SceneTemplate/todo.md)

**ToolBox**

- [HotBox](src/components/scenes/ToolBox/WebGL/HotBox/todo.md)
- [SmokeTest](src/components/scenes/ToolBox/WebGL/SmokeTest/todo.md)
- [SplineEditor](src/components/scenes/ToolBox/WebGL/SplineEditor/todo.md)

### ELEMENTS

#### HALO

- [ ] halo props to controls
- [ ] halo hover glow

#### SKULL

- [ ] Refactor like we did with bret/reversal to offer a generic that takes props, and specialized versions

- Overhaul. Should support screenshot and screenrec.
- Make sure output includes a watermark & some cool hiddnen fileinfo

### LIGHTINGRIG

## Show

- SVG Renderer
- Explosion Test
- Particle Lab
- Spline Editor
- SmokeTest
- HotBox
- PixelHater updates
- Thats All Folks
- Crt Test
- Still Pulling For You
- Row It Alone
- Police Presence
- Flying High
- Dumpster Fire
- Mycelium - ✔

- TrophyHusband
- Yggdraskill

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
