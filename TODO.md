# #TODO:

### GENERAL

- [x] Add scripts to update major, minor, hotfix versions
- [x] Add scripts to deploy next maj, min, hotfix
- [ ] add/update screenshot(s) on readme for each scene
- [x] Fix dbg layout on mobile

### REPO

- [ ] re-enable react/no-unknown-property, react/prop-types ?
- [ ] state management
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
- [ ] Relax and take notes while the gun smoke spells out "That's all, folks!"
- [ ] Burning the candle at both ends
- [ ] We should do a scene with Quinns seal, 3rd person camera, player controls w/keyboard and controller.
      Scene should include quinns dice in the environment.
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

- [CRTTest](src/components/scenes/WorkInProgress/WebGL/CRTTest/todo.md)
- [DumpsterFire](src/components/scenes/WorkInProgress/WebGL/DumpsterFire/todo.md)

**Template**

- [SceneTemplate](src/components/scenes/Template/SceneTemplate/todo.md)

**ToolBox**

- [SplineEditor](src/components/scenes/ToolBox/WebGL/SplineEditor/todo.md)

### ELEMENTS

#### HALO

- [ ] halo props to controls
- [ ] halo hover glow
- [ ] generative halos?

#### SKULL

- [ ] Refactor like we did with bret/reversal to offer a generic that takes props, and specialized versions
- [ ] material controls (? chrome skull)

### ENVIRONMENT (app)

- [ ] delete it

### SCREENSHOT

- Overhaul. Should support screenshot and screenred
- Make sure output includes a watermark & some cool hiddnen fileinfo
- Make sure it works on mobile

### CAMERARIG

- [ ] delete it

### LIGHTINGRIG

- [ ] delete it
