import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const DEFAULT_GAMEPAD_DEADZONE = 0.14;
const DEFAULT_GAMEPAD_MAPPING = Object.freeze({
  moveUpButton: 12,
  moveDownButton: 13,
  zoomInButton: 6,
  zoomOutButton: 7,
  boostButtons: Object.freeze([4, 5]),
  action1Button: 0,
  action2Button: 1,
});

function isTypingTarget(target) {
  if (!target) {
    return false;
  }

  const tagName = target.tagName?.toLowerCase();

  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

function hasShortcutModifier(event) {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function clampAxis(value) {
  return Math.max(-1, Math.min(1, value));
}

function applyDeadzone(value, deadzone) {
  if (Math.abs(value) <= deadzone) {
    return 0;
  }

  return (value - Math.sign(value) * deadzone) / (1 - deadzone);
}

function getButtonAmount(gamepad, buttonIndex) {
  const button = gamepad.buttons[buttonIndex];

  if (!button) {
    return 0;
  }

  if (typeof button.value === 'number' && button.value > 0) {
    return button.value;
  }

  return button.pressed ? 1 : 0;
}

function isButtonPressed(gamepad, buttonIndex) {
  return getButtonAmount(gamepad, buttonIndex) > 0;
}

export default function useOperatorInput({
  enabled = false,
  gamepadMapping = null,
} = {}) {
  const keyStateRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    zoomIn: false,
    zoomOut: false,
    boost: false,
  });
  const queuedActionsRef = useRef({
    action1: false,
    action2: false,
  });
  const previousGamepadButtonsRef = useRef({
    action1: false,
    action2: false,
  });
  const inputRef = useRef({
    moveX: 0,
    moveY: 0,
    moveZ: 0,
    lookX: 0,
    lookY: 0,
    zoom: 0,
    boost: false,
    action1: false,
    action2: false,
  });
  const resolvedGamepadMapping = useMemo(
    () => ({
      ...DEFAULT_GAMEPAD_MAPPING,
      ...gamepadMapping,
      boostButtons:
        gamepadMapping?.boostButtons ?? DEFAULT_GAMEPAD_MAPPING.boostButtons,
    }),
    [gamepadMapping]
  );

  useEffect(() => {
    const keyState = keyStateRef.current;
    const queuedActions = queuedActionsRef.current;

    const resetKeyState = () => {
      keyState.forward = false;
      keyState.backward = false;
      keyState.left = false;
      keyState.right = false;
      keyState.up = false;
      keyState.down = false;
      keyState.zoomIn = false;
      keyState.zoomOut = false;
      keyState.boost = false;
      queuedActions.action1 = false;
      queuedActions.action2 = false;
    };

    const onKeyDown = (event) => {
      if (!enabled || isTypingTarget(event.target)) {
        return;
      }

      if (hasShortcutModifier(event)) {
        return;
      }

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keyState.forward = true;
          event.preventDefault();
          break;
        case 'KeyS':
        case 'ArrowDown':
          keyState.backward = true;
          event.preventDefault();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keyState.left = true;
          event.preventDefault();
          break;
        case 'KeyD':
        case 'ArrowRight':
          keyState.right = true;
          event.preventDefault();
          break;
        case 'KeyQ':
        case 'PageDown':
          keyState.down = true;
          event.preventDefault();
          break;
        case 'KeyE':
        case 'PageUp':
          keyState.up = true;
          event.preventDefault();
          break;
        case 'KeyC':
          keyState.zoomIn = true;
          event.preventDefault();
          break;
        case 'KeyZ':
          keyState.zoomOut = true;
          event.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keyState.boost = true;
          event.preventDefault();
          break;
        case 'Space':
          if (!event.repeat) {
            queuedActions.action1 = true;
          }
          event.preventDefault();
          break;
        default:
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keyState.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keyState.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keyState.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keyState.right = false;
          break;
        case 'KeyQ':
        case 'PageDown':
          keyState.down = false;
          break;
        case 'KeyE':
        case 'PageUp':
          keyState.up = false;
          break;
        case 'KeyC':
          keyState.zoomIn = false;
          break;
        case 'KeyZ':
          keyState.zoomOut = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keyState.boost = false;
          break;
        default:
          break;
      }
    };

    const onBlur = () => {
      resetKeyState();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled]);

  useFrame(() => {
    const input = inputRef.current;

    if (!enabled) {
      input.moveX = 0;
      input.moveY = 0;
      input.moveZ = 0;
      input.lookX = 0;
      input.lookY = 0;
      input.zoom = 0;
      input.boost = false;
      input.action1 = false;
      input.action2 = false;
      return;
    }

    const keyState = keyStateRef.current;
    const queuedActions = queuedActionsRef.current;
    const previousGamepadButtons = previousGamepadButtonsRef.current;
    const gamepads = navigator.getGamepads?.() ?? [];
    const gamepad = Array.from(gamepads).find(Boolean);

    const keyboardMoveX = (keyState.right ? 1 : 0) - (keyState.left ? 1 : 0);
    const keyboardMoveY = (keyState.up ? 1 : 0) - (keyState.down ? 1 : 0);
    const keyboardMoveZ =
      (keyState.backward ? 1 : 0) - (keyState.forward ? 1 : 0);
    const keyboardZoom = (keyState.zoomIn ? 1 : 0) - (keyState.zoomOut ? 1 : 0);

    let gamepadMoveX = 0;
    let gamepadMoveY = 0;
    let gamepadMoveZ = 0;
    let gamepadLookX = 0;
    let gamepadLookY = 0;
    let gamepadZoom = 0;
    let gamepadBoost = false;
    let gamepadAction1 = false;
    let gamepadAction2 = false;

    if (gamepad) {
      gamepadMoveX = applyDeadzone(
        gamepad.axes[0] ?? 0,
        DEFAULT_GAMEPAD_DEADZONE
      );
      gamepadMoveZ = applyDeadzone(
        gamepad.axes[1] ?? 0,
        DEFAULT_GAMEPAD_DEADZONE
      );
      gamepadLookX = applyDeadzone(
        gamepad.axes[2] ?? 0,
        DEFAULT_GAMEPAD_DEADZONE
      );
      gamepadLookY = applyDeadzone(
        gamepad.axes[3] ?? 0,
        DEFAULT_GAMEPAD_DEADZONE
      );

      const moveUpAmount = getButtonAmount(
        gamepad,
        resolvedGamepadMapping.moveUpButton
      );
      const moveDownAmount = getButtonAmount(
        gamepad,
        resolvedGamepadMapping.moveDownButton
      );
      gamepadMoveY = clampAxis(moveUpAmount - moveDownAmount);

      const zoomInAmount = getButtonAmount(
        gamepad,
        resolvedGamepadMapping.zoomInButton
      );
      const zoomOutAmount = getButtonAmount(
        gamepad,
        resolvedGamepadMapping.zoomOutButton
      );
      gamepadZoom = clampAxis(zoomInAmount - zoomOutAmount);
      gamepadBoost = resolvedGamepadMapping.boostButtons.some((buttonIndex) =>
        isButtonPressed(gamepad, buttonIndex)
      );

      const isAction1Pressed = isButtonPressed(
        gamepad,
        resolvedGamepadMapping.action1Button
      );
      const isAction2Pressed = isButtonPressed(
        gamepad,
        resolvedGamepadMapping.action2Button
      );
      gamepadAction1 = isAction1Pressed && !previousGamepadButtons.action1;
      gamepadAction2 = isAction2Pressed && !previousGamepadButtons.action2;
      previousGamepadButtons.action1 = isAction1Pressed;
      previousGamepadButtons.action2 = isAction2Pressed;
    } else {
      previousGamepadButtons.action1 = false;
      previousGamepadButtons.action2 = false;
    }

    input.moveX = clampAxis(keyboardMoveX + gamepadMoveX);
    input.moveY = clampAxis(keyboardMoveY + gamepadMoveY);
    input.moveZ = clampAxis(keyboardMoveZ + gamepadMoveZ);
    input.lookX = gamepadLookX;
    input.lookY = gamepadLookY;
    input.zoom = clampAxis(keyboardZoom + gamepadZoom);
    input.boost = keyState.boost || gamepadBoost;
    input.action1 = queuedActions.action1 || gamepadAction1;
    input.action2 = queuedActions.action2 || gamepadAction2;

    queuedActions.action1 = false;
    queuedActions.action2 = false;
  }, -1);

  return inputRef;
}
