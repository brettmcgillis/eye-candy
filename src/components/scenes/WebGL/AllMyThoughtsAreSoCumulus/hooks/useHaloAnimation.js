import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { radians } from '@utils/math';

/**
 * useHaloAnimation
 * Reusable animation hook for rotation + wobble.
 * @param {Object} options
 * @param {boolean} options.animate - Enable rotation
 * @param {number} options.speed - Rotation speed (RPM)
 * @param {boolean} options.wobble - Enable wobble
 * @param {number} options.wobbleSpeed - Wobble speed
 * @param {number} options.wobbleAngle - Wobble angle (degrees)
 * @param {number} options.baseRotationX - Base X rotation (radians)
 * @returns {React.RefObject}
 */
export default function useHaloAnimation({
  animate = true,
  speed = 33,
  wobble = false,
  wobbleSpeed = 1,
  wobbleAngle = 5,
  baseRotationX = 0,
} = {}) {
  const ref = useRef();
  const baseRotationXRef = useRef(0);
  const wasWobblingRef = useRef(false);

  useEffect(() => {
    // Keep orientation aligned immediately when wobble is off.
    if (ref.current && !wobble) {
      ref.current.rotation.x = baseRotationX;
    }
  }, [baseRotationX, wobble]);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const hasBaseRotationChanged = baseRotationXRef.current !== baseRotationX;

    if (animate) {
      ref.current.rotation.z += (speed / 60) * 0.1;
    }

    if (!wobble) {
      // Use the incoming preset/control rotation as canonical baseline.
      baseRotationXRef.current = baseRotationX;
      ref.current.rotation.x = baseRotationX;
      wasWobblingRef.current = false;
      return;
    }

    if (!wasWobblingRef.current || hasBaseRotationChanged) {
      baseRotationXRef.current = baseRotationX;
    }

    const degrees = Math.sin(clock.elapsedTime * wobbleSpeed) * wobbleAngle;
    ref.current.rotation.x = baseRotationXRef.current + radians(degrees);
    wasWobblingRef.current = true;
  });
  return ref;
}
