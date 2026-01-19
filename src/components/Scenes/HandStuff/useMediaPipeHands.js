/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';

import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, Hands } from '@mediapipe/hands';

function isMobile() {
  return window.innerWidth < window.innerHeight;
}

export default function useMediaPipeHands({
  maxHands = 1,
  modelComplexity = 1,
  minDetectionConfidence = 0.6,
  minTrackingConfidence = 0.6,
  cameraWidth = isMobile() ? 720 : 1280,
  cameraHeight = isMobile() ? 1280 : 720,

  showVideo = false,
  showDebugSkeleton = true,

  landmarkStyle = { color: '#FF3366', radius: 4 },
  connectorStyle = { color: '#00FFAA', lineWidth: 3 },

  videoWidth = 240,
  videoHeight = 135,
  videoPosition = 'bottom-center',
  videoStyle = {},
} = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const [results, setResults] = useState(null);

  // -------------------------
  // Create MediaPipe ONCE
  // -------------------------
  useEffect(() => {
    if (handsRef.current) return;

    let active = true;

    // ---------- video ----------
    const video = document.createElement('video');
    video.className = videoPosition ?? 'bottom-center';
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;

    Object.assign(video.style, {
      position: 'fixed',
      width: `${videoWidth}px`,
      height: `${videoHeight}px`,
      transform: 'scaleX(-1)',
      zIndex: 9999,
      borderRadius: 'var(--overlay-radius)',
      boxShadow: 'var(--overlay-shadow)',
      display: showVideo ? 'block' : 'none',
      ...videoStyle,
    });

    // ---------- canvas ----------
    const canvas = document.createElement('canvas');
    canvas.className = videoPosition ?? 'bottom-center';

    Object.assign(canvas.style, {
      position: 'fixed',
      width: `${videoWidth}px`,
      height: `${videoHeight}px`,
      transform: 'scaleX(-1)',
      zIndex: 10000,
      pointerEvents: 'none',
      borderRadius: 'var(--overlay-radius)',
    });

    const ctx = canvas.getContext('2d');

    document.body.appendChild(video);
    document.body.appendChild(canvas);

    videoRef.current = video;
    canvasRef.current = canvas;
    ctxRef.current = ctx;

    // match real camera resolution
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    // ---------- hands ----------
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.onResults((res) => {
      if (!active) return;

      setResults(res);

      if (!showDebugSkeleton) return;

      const ctxRefCurrent = ctxRef.current;
      const canvasRefCurrent = canvasRef.current;
      if (!ctxRefCurrent || !canvasRefCurrent) return;

      ctxRefCurrent.save();
      ctxRefCurrent.clearRect(
        0,
        0,
        canvasRefCurrent.width,
        canvasRefCurrent.height
      );

      // draw camera frame (optional)
      ctxRefCurrent.drawImage(
        res.image,
        0,
        0,
        canvasRefCurrent.width,
        canvasRefCurrent.height
      );

      if (res.multiHandLandmarks) {
        res.multiHandLandmarks.forEach((landmarks) => {
          drawConnectors(
            ctxRefCurrent,
            landmarks,
            HAND_CONNECTIONS,
            connectorStyle
          );

          drawLandmarks(ctxRefCurrent, landmarks, landmarkStyle);
        });
      }

      ctxRefCurrent.restore();
    });

    handsRef.current = hands;

    // ---------- camera ----------
    const camera = new Camera(video, {
      onFrame: async () => {
        if (!handsRef.current) return;
        await handsRef.current.send({ image: video });
      },
      width: cameraWidth,
      height: cameraHeight,
    });

    camera.start();
    cameraRef.current = camera;

    return () => {
      active = false;

      cameraRef.current?.stop();
      handsRef.current?.close();

      if (video && document.body.contains(video)) {
        document.body.removeChild(video);
      }

      if (canvas && document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }

      handsRef.current = null;
      cameraRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  // -------------------------
  // Live option updates
  // -------------------------
  useEffect(() => {
    if (!handsRef.current) return;

    handsRef.current.setOptions({
      maxNumHands: maxHands,
      modelComplexity,
      minDetectionConfidence,
      minTrackingConfidence,
    });
  }, [
    maxHands,
    modelComplexity,
    minDetectionConfidence,
    minTrackingConfidence,
  ]);

  // -------------------------
  // Video + canvas visibility
  // -------------------------
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    Object.assign(videoRef.current.style, {
      display: showVideo ? 'block' : 'none',
      ...videoStyle,
    });

    Object.assign(canvasRef.current.style, {
      display: showVideo || showDebugSkeleton ? 'block' : 'none',
      ...videoStyle,
    });
  }, [showVideo, showDebugSkeleton, videoStyle]);

  return results;
}
