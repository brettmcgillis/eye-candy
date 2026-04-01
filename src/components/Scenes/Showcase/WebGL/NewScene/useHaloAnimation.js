import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { radians } from '../../../../../utils/math';

/**
 * useHaloAnimation
 * Reusable animation hook for rotation + wobble.
 * @param {Object} options
 * @param {boolean} options.animate - Enable rotation
 * @param {number} options.speed - Rotation speed (RPM)
 * @param {boolean} options.wobble - Enable wobble
 * @param {number} options.wobbleSpeed - Wobble speed
 * @param {number} options.wobbleAngle - Wobble angle (degrees)
 * @returns {React.RefObject}
 */
export default function useHaloAnimation({
  animate = true,
  speed = 33,
  wobble = false,
  wobbleSpeed = 1,
  wobbleAngle = 5,
} = {}) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (animate) {
      ref.current.rotation.z += (speed / 60) * 0.1;
    }
    if (wobble) {
      const degrees = Math.sin(clock.elapsedTime * wobbleSpeed) * wobbleAngle;
      ref.current.rotation.x = radians(degrees);
    }
  });
  return ref;
}
