/* eslint-disable consistent-return */
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { EcctrlJoystick } from '../../../../ecctrl/EcctrlJoystick';
import Experience from './components/Experience';

export default function CharacterController() {
  // Mount joystick outside the main Canvas — only on touch devices
  useEffect(() => {
    const isTouchScreen =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchScreen) return;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const joystickRoot = createRoot(container);
    joystickRoot.render(<EcctrlJoystick buttonNumber={5} />);

    return () => {
      joystickRoot.unmount();
      document.body.removeChild(container);
    };
  }, []);

  return <Experience />;
}
