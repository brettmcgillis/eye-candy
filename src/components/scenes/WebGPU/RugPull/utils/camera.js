const FLOOR = {
  desktop: { position: [2.6, 2.4, 3.4], target: [0, 0.1, -0.2], fov: 40 },
  mobile: { position: [2.4, 3.4, 4.2], target: [0, 0.1, -0.2], fov: 50 },
};
const WALL = {
  desktop: { position: [0.7, 1.3, 5.6], target: [0, 1.15, 0], fov: 40 },
  mobile: { position: [0.5, 1.2, 7], target: [0, 1.15, 0], fov: 52 },
};

const orbitOf = ({ desktop, mobile }) => ({
  desktop: { ...desktop, pivot: desktop.target },
  mobile: { ...mobile, pivot: mobile.target },
});

const CAMERA = { defaultMode: 'orbit', orbit: orbitOf(FLOOR) };

// The orbit framing each mode opens on, as the camera rig's own control
// keys: presets carry these, and switching modes in Leva applies them.
const keysOf = ({ desktop, mobile }) => ({
  cameraMode: 'orbit',
  orbitDesktopFov: desktop.fov,
  orbitDesktopPivot: desktop.target,
  orbitDesktopPosition: desktop.position,
  orbitDesktopTarget: desktop.target,
  orbitMobileFov: mobile.fov,
  orbitMobilePivot: mobile.target,
  orbitMobilePosition: mobile.position,
  orbitMobileTarget: mobile.target,
});

export const MODE_CAMERA = { floor: keysOf(FLOOR), wall: keysOf(WALL) };

export default CAMERA;
