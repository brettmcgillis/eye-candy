# // Birds Arent Real

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- the scene combines the security camera and pigeon models into fake birds. the camera body replaces the birds head
- the scene contains many instances of the animated fake birds walking around the scene.
- the scene contains a gritty wet asphault floor
- the scene contains a curb as the stage for a few urban props; trash can, bus stop, man hole cover.
- the scene contains cool shaders on the bus stop sign meshes, with the exception of the inside back one which displays the bus route.
- the scene includes the CCTV post processing from Aisle9.
- The scene contains a special mode where we scroll between camera views. each view is at the same location as the camera of one of the birds. as the bird turns its head the camera moves as well. each bird has a unique number generated at scene load, which is used to power the overlay on the CCTV post, to give the illusion that we are seeing the birds eye view of each fake bird in the scene. To acheive this we could a preset roll animation like AllMyThoughts. Then create presets for camera positions at the location of each bird, looking in the same direction as the bird, where that specific bird is made hidden so as not to clip/interfere with camera. we know the best position to put the scene camera, since we manually put and tuned a glowing dot on the camera head. This is just one possible solution but Im up for other solutions that are easy to maintain.
- the scene has a bird on the rim of the trash can
- the scene has a bird on the asphalt next to the man hole cover
- the scene has two birds inside the bus stop, one on the bench and one on the ground in front of the bench
- the scene has three birds on the roof of the bus stop, two on the front left corner and one on the back right.
- the scene contains a mode where all of the cameraHeads aim at and follow the user's cursor
- The advertisments in the bus station are overridden with custom shaders that display some of my art but occassionally glitch out and reveal 'They Live'-style Obey, Consume, etc, messaging.

## // TODO:

## // Presets

## // Features

- [x] **View Mode** Leva enum (Orbit / Bird POV / Cursor Follow) under the `View`
      folder, persisted in presets (`viewMode`).
- [x] **Bird POV (CCTV feed)** — `BirdPovRig` rides the active bird's swept lens
      (registered via `CameraHead` `lensRef`). The director auto-cuts between birds on a
      timer (`povShotDuration`); the ridden bird is hidden so the camera never sits inside
      its own mesh. `povFov` / `povDolly` tune the shot.
- [x] **CCTV post** — `SurveillancePost` folds bloom + the Aisle9 surveillance HUD
      (REC dot, timestamp, `CAM ####`, corner frame) + retro scanlines/vignette/chroma into
      ONE post chain (replaces `Bloom`). Each bird mints a stable `CAM ####` id at load,
      shown as the active feed's label.
- [x] **Cursor Follow** — `CursorTracker` projects the pointer onto a focus plane;
      every `FakeBird` overrides its head-aim to stare at that world point (sweep off) while
      the camera keeps orbiting.

## // Interactivity

- [x] Camera-Cursor follow

## // Bugs
