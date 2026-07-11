// Fixed orbit frame around the habitat sphere, equivalent to the previous
// hand-rolled <PerspectiveCamera> (fov 42, position [11, 6.5, 12]) — see
// docs/scene-conventions.md §10 for why CameraRig replaces a hand-rolled
// camera. orbitInteractionEnabled (wired in Fireflies.jsx from windowSync)
// is what actually satisfies todo.md's "orbit controls disabled in
// multi-tab mode" — the camera stays framed here either way.
const TARGET = [0, 2.5, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      fov: 42,
      pivot: TARGET,
      position: [11, 6.5, 12],
      target: TARGET,
    },
  },
};

export default CAMERA;
