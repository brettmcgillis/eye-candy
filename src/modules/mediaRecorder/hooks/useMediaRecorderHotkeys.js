import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const SCREENSHOT_GAMEPAD_BUTTON = 8;
const RECORD_GAMEPAD_BUTTON = 9;

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

// Keyboard (Shift+S / Shift+R) + gamepad (buttons 8 & 9) bindings for screenshot /
// toggle-recording. Only mounted while a scene has opted into useMediaRecorder.
export default function useMediaRecorderHotkeys({
  onScreenshot,
  onToggleRecording,
}) {
  const onScreenshotRef = useRef(onScreenshot);
  const onToggleRecordingRef = useRef(onToggleRecording);
  onScreenshotRef.current = onScreenshot;
  onToggleRecordingRef.current = onToggleRecording;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'S') {
        e.preventDefault();
        onScreenshotRef.current();
      } else if (e.key === 'R') {
        e.preventDefault();
        onToggleRecordingRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const previousGamepadButtonsRef = useRef({
    screenshot: false,
    record: false,
  });

  useFrame(() => {
    const gamepads = navigator.getGamepads?.() ?? [];
    const gamepad = Array.from(gamepads).find(Boolean);
    const previousButtons = previousGamepadButtonsRef.current;

    if (!gamepad) {
      previousButtons.screenshot = false;
      previousButtons.record = false;
      return;
    }

    const screenshotPressed = isButtonPressed(
      gamepad,
      SCREENSHOT_GAMEPAD_BUTTON
    );
    const recordPressed = isButtonPressed(gamepad, RECORD_GAMEPAD_BUTTON);

    if (screenshotPressed && !previousButtons.screenshot) {
      onScreenshotRef.current();
    }
    if (recordPressed && !previousButtons.record) {
      onToggleRecordingRef.current();
    }

    previousButtons.screenshot = screenshotPressed;
    previousButtons.record = recordPressed;
  });
}
