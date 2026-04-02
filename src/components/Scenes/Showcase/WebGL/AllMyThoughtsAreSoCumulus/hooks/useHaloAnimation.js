import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { radians } from '../../../../../../utils/math';

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
    baseRotationXRef.current = baseRotationX;

    // Keep orientation aligned immediately when wobble is off.
    if (ref.current && !wobble) {
      ref.current.rotation.x = baseRotationX;
    }
  }, [baseRotationX, wobble]);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    if (animate) {
      ref.current.rotation.z += (speed / 60) * 0.1;
    }

    if (!wobble) {
      // Keep baseline in sync while wobble is disabled and restore it after toggling off.
      if (wasWobblingRef.current) {
        ref.current.rotation.x = baseRotationXRef.current;
      }
      baseRotationXRef.current = ref.current.rotation.x;
      wasWobblingRef.current = false;
      return;
    }

    const degrees = Math.sin(clock.elapsedTime * wobbleSpeed) * wobbleAngle;
    ref.current.rotation.x = baseRotationXRef.current + radians(degrees);
    wasWobblingRef.current = true;
  });
  return ref;
}
