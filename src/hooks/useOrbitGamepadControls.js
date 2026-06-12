import { useFrame } from '@react-three/fiber';

const DEFAULT_ROTATE_SPEED = 2.5;
const DEFAULT_ZOOM_SPEED = 1.5;

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function resolveZoomScale(inputZoom, zoomSpeed, deltaSeconds) {
  return Math.exp(Math.abs(inputZoom) * zoomSpeed * deltaSeconds);
}

function rotateControls(controls, lookX, lookY, rotationStep) {
  const currentAzimuthalAngle = controls.getAzimuthalAngle?.();
  const currentPolarAngle = controls.getPolarAngle?.();

  if (
    Number.isFinite(currentAzimuthalAngle) &&
    typeof controls.setAzimuthalAngle === 'function'
  ) {
    controls.setAzimuthalAngle(currentAzimuthalAngle - lookX * rotationStep);
  }

  if (
    Number.isFinite(currentPolarAngle) &&
    typeof controls.setPolarAngle === 'function'
  ) {
    controls.setPolarAngle(currentPolarAngle - lookY * rotationStep);
  }
}

export default function useOrbitGamepadControls({
  controlsRef,
  enabled = false,
  inputRef,
} = {}) {
  useFrame((_, deltaSeconds) => {
    if (!enabled) {
      return;
    }

    const controls = controlsRef?.current;
    const input = inputRef?.current;

    if (!controls || !input || controls.enabled === false) {
      return;
    }

    let shouldUpdate = false;
    const rotateSpeed = toFiniteNumber(
      controls.rotateSpeed,
      DEFAULT_ROTATE_SPEED
    );

    if (
      controls.enableRotate !== false &&
      (input.lookX || input.lookY) &&
      rotateSpeed
    ) {
      const rotationStep = rotateSpeed * deltaSeconds;

      rotateControls(controls, input.lookX, input.lookY, rotationStep);
      shouldUpdate = true;
    }

    if (controls.enableZoom !== false && input.zoom) {
      const zoomSpeed = Math.max(
        Math.abs(toFiniteNumber(controls.zoomSpeed, DEFAULT_ZOOM_SPEED)),
        0.01
      );
      const zoomScale = resolveZoomScale(input.zoom, zoomSpeed, deltaSeconds);

      if (input.zoom > 0 && typeof controls.dollyIn === 'function') {
        controls.dollyIn(zoomScale);
        shouldUpdate = true;
      }

      if (input.zoom < 0 && typeof controls.dollyOut === 'function') {
        controls.dollyOut(zoomScale);
        shouldUpdate = true;
      }
    }

    if (shouldUpdate && typeof controls.update === 'function') {
      controls.update();
    }
  });
}
