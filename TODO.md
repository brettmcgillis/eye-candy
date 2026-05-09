# #TODO:

### GENERAL

- [x] Add scripts to update major, minor, hotfix versions
- [x] Add scripts to deploy next maj, min, hotfix
- [ ] add/update screenshot(s) on readme for each scene
- [x] Fix dbg layout on mobile

### REPO

- [x] springs? got it
- [x] maath

### EXPLORE/EXPLODE

- [x] pixelation component. did a pixelhater
- [ ] Check out Tone.js for audio. Could be a good solution to bridging Strudel, Mp3, etc.

### APP

- [x] fix icon used in manifest, logo192 is not the right size, causes console err
- [x] serve up multiple scenes. portal(s)?, picture frames?, routing?
- [ ] if were doing screen cap then move it out of scenes and into something at app layer
  - Overhaul. Should support screenshot and screenrec.
  - Make sure output includes a watermark & some cool hiddnen fileinfo

- [Scaffold](src/app/scaffold/todo.md)

### SCENES

To Build:

- [ ] Skeleton with bird in ribcage (all assets grabbed, need to pose skeleton)
- [ ] Skull & crossbones w/ stained glass spotlight.
- [ ] Video casette tape with video playing on tape ribbon
- [ ] CSG Skull. Knock a reversal out of its forehead.
- [ ] Metaball (marching cubes) lava lamp
- [ ] Can we use ecctrl & click to move to make Quinn's board game playable?
- [ ] We should do a scene with Quinns seal, 3rd person camera, player controls w/keyboard and controller.
      Scene should include quinns dice in the environment. Get low-LOD versions.
      Scene should include various art images on planes in the environment.
      Scene should allow user to walk around and look at Quinns Portfolio.
      see example @ https://henryegloff.com/

### Scene TODO Files

**Showcase**

- [AllMyThoughtsAreSoCumulus](src/components/scenes/Showcase/WebGL/AllMyThoughtsAreSoCumulus/todo.md)
- [Cardinals](src/components/scenes/Showcase/WebGL/Cardinals/todo.md)
- [PaperCuts](src/components/scenes/Showcase/WebGL/PaperCuts/todo.md)
- [LoGlow](src/components/scenes/Showcase/WebGL/LoGlow/todo.md)
- [Mycelium](src/components/scenes/Showcase/WebGL/Mycelum/todo.md)
- [PaperStack](src/components/scenes/Showcase/WebGL/PaperStack/todo.md)
- [QuinnsDice](src/components/scenes/Showcase/WebGL/QuinnsDice/todo.md)
- [Rosie](src/components/scenes/Showcase/WebGL/Rosie/todo.md)
- [WatercolorSquares](src/components/scenes/Showcase/WebGL/WatercolorSquares/todo.md)
- [Surrender](src/components/scenes/Showcase/WebGPU/Surrender/todo.md)

**TestLab**

- [ExplosionTest](src/components/scenes/TestLab/WebGL/ExplosionTest/todo.md)
- [FluidTest](src/components/scenes/TestLab/WebGL/FluidTest/todo.md)
- [HandStuff](src/components/scenes/TestLab/WebGL/HandStuff/todo.md)
- [ParticleLab](src/components/scenes/TestLab/WebGL/ParticleLab/todo.md)
- [PixelHater](src/components/scenes/TestLab/WebGL/PixelHater/todo.md)
- [StrudelDoodle](src/components/scenes/TestLab/WebGL/StrudelDoodle/todo.md)
- [MobilePhysicsTest](src/components/scenes/TestLab/WebGPU/MobilePhysicsTest/todo.md)
- [NetworkTest](src/components/scenes/TestLab/WebGPU/NetworkTest/todo.md)
- [TheLoom](src/components/scenes/TestLab/WebGPU/TheLoom/todo.md)

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
- [Ghosts](src/components/scenes/WorkInProgress/WebGPU/Ghosts/todo.md)

- [StayHunted](src/components/scenes/WorkInProgress/WebGPU/StayHunted/todo.md)
- [GhostStories](src/components/scenes/WorkInProgress/WebGPU/GhostStories/todo.md)
- [QuinnsPlayground](src/components/scenes/WorkInProgress/WebGL/QuinnsPlayground/todo.md)

**Template**

- [SceneTemplate](src/components/scenes/Template/SceneTemplate/todo.md)

**ToolBox**

- [FireTest](src/components/scenes/ToolBox/WebGL/FireTest/todo.md)
- [HotBox](src/components/scenes/ToolBox/WebGL/HotBox/todo.md)
- [PenPlotter](src/components/scenes/ToolBox/WebGL/PenPlotter/todo.md)
  - [PlotScenes](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/todo.md)
  - [GenerativeGeometry](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/GenerativeGeometry/todo.md)
  - [NetworkPlot](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/NetworkPlot/todo.md)
  - [ParticlePlot](src/components/scenes/ToolBox/WebGL/PenPlotter/PlotScenes/ParticlePlot/todo.md)
- [SmokeTest](src/components/scenes/ToolBox/WebGL/SmokeTest/todo.md)
- [SplineEditor](src/components/scenes/ToolBox/WebGL/SplineEditor/todo.md)
- [GhostBuster](src/components/scenes/ToolBox/WebGPU/GhostBuster/todo.md)
- [CharacterController (webGPU)](src/components/scenes/ToolBox/WebGPU/CharacterController/todo.md)
- [CharacterController (webGL)](src/components/scenes/ToolBox/WebGL/CharacterController/todo.md)
- [MultiplayerMadness (webGPU)](src/components/scenes/ToolBox/WebGPU/MultiplayerMadness/todo.md)
- [MultiplayerMadness (webGL)](src/components/scenes/ToolBox/WebGL/MultiplayerMadness/todo.md)

### ELEMENTS

#### SKULL

- [ ] Refactor like we did with bret/reversal to offer a generic that takes props, and specialized versions

### LIGHTINGRIG

- [ ] Get rid of it.

## Show

- [ ] PenPlotter
- [ ] Explosion Test
- [ ] Particle Lab
- [ ] Spline Editor
- [ ] SmokeTest
- [ ] FireTest
- [ ] HotBox
- [ ] TheLoom
- [ ] PixelHater updates (censor, voxels)
- [ ] Thats All Folks
- [ ] Crt Test
- [ ] Still Pulling For You
- [ ] Row It Alone
- [ ] Police Presence
- [ ] Flying High
- [ ] Dumpster Fire
- [x] Burning At Both Ends - Enlightened
- [x] Burning At Both Ends - Extinguished
- [x] Burning At Both Ends - Lenticular
- [x] Mycelium
- [ ] All my thoughts are so cumulus - Atomic
- [ ] All my thoughts are so cumulus - Censored Rings
- [ ] All my thoughts are so cumulus - Network
- [ ] All my thoughts are so cumulus - Plate
- [ ] All my thoughts are so cumulus - Record
- [x] All my thoughts are so cumulus - Static
- [ ] Surrender
- [ ] Surrender Now
- [ ] Surrender - Autumn
- [ ] Surrender - Spring
- [ ] Surrender - Winter
- [ ] Stay Hunted
- [ ] AllMyFriendsAreGhosts
- [x] GhostBuster
- [ ] CharacterController
- [ ] MultiplayerMadness
- [ ] GhostStories
- [ ] Quinn'sPlayground
- [x] PaperCuts - Default
- [x] PaperCuts - Morse Code
- [ ] PaperCuts - Layer Fade
- [ ] PaperCuts - Argyle (2)
- [ ] PaperCuts - 11 (3)
- [x] PaperStack - Gradient Scan
- [ ] LoaderPattern
- [ ] Iconography

- TrophyHusband
- Yggdraskill

## Lenticulars

- [x] Burning At Both Ends
- [ ] Still Pulling For you - Rough Waters
- [ ] Still Pulling For you - Triptych
- [ ] All My Thoughts Are So Cumulus - Static

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
