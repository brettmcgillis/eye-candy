import { useCallback, useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// Y / Triangle. Unclaimed by operator-mode camera input (0, 1, 4-13) or
// useMediaRecorderHotkeys (8, 9).
const TOGGLE_GAMEPAD_BUTTON = 3;

function isTypingTarget(target) {
  if (!target) return false;

  const tagName = target.tagName?.toLowerCase();

  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

function isButtonPressed(gamepad, buttonIndex) {
  const button = gamepad.buttons[buttonIndex];
  return !!button && button.pressed;
}

// Spacebar + gamepad button 3 toggle between two named presets. Disabled while
// the camera is in operator mode, where Space is already bound to action1
// (useOperatorInput) — firing both on one press would read as a bug, not two
// features working together.
export default function usePresetToggleHotkeys({
  applyPresetByName,
  enabled = true,
  presetA,
  presetB,
  selectedPreset,
}) {
  const stateRef = useRef(null);
  stateRef.current = {
    applyPresetByName,
    enabled,
    presetA,
    presetB,
    selectedPreset,
  };

  const toggle = useCallback(() => {
    const { current } = stateRef;

    current.applyPresetByName(
      current.selectedPreset === current.presetA
        ? current.presetB
        : current.presetA
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!stateRef.current.enabled) return;
      if (isTypingTarget(event.target)) return;
      if (event.code !== 'Space' || event.repeat) return;
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      event.preventDefault();
      toggle();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const previousButtonRef = useRef(false);

  useFrame(() => {
    if (!stateRef.current.enabled) {
      previousButtonRef.current = false;
      return;
    }

    const gamepads = navigator.getGamepads?.() ?? [];
    const gamepad = Array.from(gamepads).find(Boolean);

    if (!gamepad) {
      previousButtonRef.current = false;
      return;
    }

    const pressed = isButtonPressed(gamepad, TOGGLE_GAMEPAD_BUTTON);

    if (pressed && !previousButtonRef.current) {
      toggle();
    }

    previousButtonRef.current = pressed;
  });
}
