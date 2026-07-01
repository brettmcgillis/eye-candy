import { useCallback, useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import useMediaRecorderStore from '../stores/useMediaRecorderStore';
import snapshotCanvas from '../utils/canvasSnapshot';
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
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const isRecording = useMediaRecorderStore((state) => state.isRecording);
  const setRecording = useMediaRecorderStore((state) => state.setRecording);

  const fileNameRef = useRef(fileName);
  const recorderRef = useRef(null);
  const compositorRef = useRef(null);

  useEffect(() => {
    fileNameRef.current = fileName;
  }, [fileName]);

  // Kick off a render of the current state, then read the canvas back on the
  // *next* animation frame rather than synchronously. A WebGL canvas
  // (preserveDrawingBuffer: true) can be read back in the same tick, but a
  // WebGPU canvas only holds a drawImage-able image once the browser has
  // *presented* the frame — which doesn't happen until the end of the current
  // task, after this handler returns. Reading synchronously (as we used to)
  // grabs an unpresented canvas, so WebGPU screenshots came out as just the
  // white page background + overlay text. Snapshotting inside rAF grabs the
  // presented frame instead — the same reason the recording compositor reads
  // the live canvas from within its own rAF loop.
  const takeScreenshot = useCallback(() => {
    gl.render(scene, camera);
    requestAnimationFrame(() => {
      const frame = snapshotCanvas(canvas);
      captureScreenshot(fileNameRef.current, fileNameRef.current, frame);
    });
  }, [gl, scene, camera, canvas]);

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
