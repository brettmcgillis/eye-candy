const TARGET = [0, 0, 0];

// Only reached when Chase Camera is off — a free look around the caverns for
// framing shots. The chase rig owns the camera the rest of the time.
const CAMERA = {
  defaultMode: 'orbit',
  fixed: {
    activeShot: 'hero',
    behavior: 'single',
    shots: {
      hero: {
        desktop: { fov: 60, position: [-6, 4, 8], target: TARGET },
      },
    },
  },
  orbit: {
    desktop: { fov: 60, pivot: TARGET, position: [-6, 4, 8], target: TARGET },
    mobile: { fov: 70, pivot: TARGET, position: [-8, 5, 10], target: TARGET },
  },
};

export default CAMERA;
