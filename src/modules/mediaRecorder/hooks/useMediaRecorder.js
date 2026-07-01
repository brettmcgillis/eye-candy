import { useCallback, useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import useMediaRecorderStore from '../stores/useMediaRecorderStore';
import { captureOverlayBitmap, startCompositor } from '../utils/compositor';
import createRecorder from '../utils/recording';
import captureScreenshot from '../utils/screenshot';
import useMediaRecorderControls from './useMediaRecorderControls';
import useMediaRecorderHotkeys from './useMediaRecorderHotkeys';

// Public opt-in hook. A scene calls useMediaRecorder({ fileName }) from within its
// useSceneControls to get screenshot + screen-recording support (Leva controls,
// Shift+S/Shift+R hotkeys, gamepad buttons 8/9). Nothing else in the app runs or
// costs anything unless a scene calls this.
export default function useMediaRecorder({ fileName }) {
  const canvas = useThree((state) => state.gl.domElement);
  const isRecording = useMediaRecorderStore((state) => state.isRecording);
  const setRecording = useMediaRecorderStore((state) => state.setRecording);

  const fileNameRef = useRef(fileName);
  const recorderRef = useRef(null);
  const compositorRef = useRef(null);

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  const takeScreenshot = useCallback(() => {
    captureScreenshot(fileNameRef.current, fileNameRef.current);
  }, []);

  const startRecording = useCallback(async () => {
    if (recorderRef.current) return;

    const overlayBitmap = await captureOverlayBitmap();
    const compositor = startCompositor({
      sourceCanvas: canvas,
      overlayBitmap,
    });
    const recorder = createRecorder({
      canvas: compositor.canvas,
      fileName: fileNameRef.current,
    });

    compositorRef.current = compositor;
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }, [canvas, setRecording]);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current) return;

    recorderRef.current.stop();
    recorderRef.current = null;
    compositorRef.current?.stop();
    compositorRef.current = null;
    setRecording(false);
  }, [setRecording]);

  const toggleRecording = useCallback(() => {
    if (recorderRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [startRecording, stopRecording]);

  useEffect(
    () => () => {
      recorderRef.current?.stop();
      compositorRef.current?.stop();
    },
    []
  );

  useMediaRecorderControls({
    fileName,
    onFileNameChange: (value) => {
      fileNameRef.current = value;
    },
    onScreenshot: takeScreenshot,
    onToggleRecording: toggleRecording,
  });

  useMediaRecorderHotkeys({
    onScreenshot: takeScreenshot,
    onToggleRecording: toggleRecording,
  });

  return { isRecording, takeScreenshot, startRecording, stopRecording };
}
