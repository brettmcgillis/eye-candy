/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';

import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, Hands } from '@mediapipe/hands';

function isMobile() {
  return window.innerWidth < window.innerHeight;
}

const videoWidth = 240;
const videoHeight = 135;

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

  videoSize = 1,
  videoPosition = 'bottom-center',
  videoStyle = {},
} = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const showVideoRef = useRef(showVideo);
  const showSkeletonRef = useRef(showDebugSkeleton);
  const landmarkStyleRef = useRef(landmarkStyle);
  const connectorStyleRef = useRef(connectorStyle);

  const [results, setResults] = useState(null);

  /* ---------------- reactive mirrors ---------------- */

  useEffect(() => {
    showVideoRef.current = showVideo;
  }, [showVideo]);

  useEffect(() => {
    showSkeletonRef.current = showDebugSkeleton;
  }, [showDebugSkeleton]);

  useEffect(() => {
    landmarkStyleRef.current = landmarkStyle;
  }, [landmarkStyle]);

  useEffect(() => {
    connectorStyleRef.current = connectorStyle;
  }, [connectorStyle]);

  /* ---------------- create once ---------------- */

  useEffect(() => {
    if (handsRef.current) return;

    let active = true;

    /* ---------- video ---------- */

    const video = document.createElement('video');
    video.className = videoPosition ?? 'bottom-center';
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;

    Object.assign(video.style, {
      position: 'fixed',
      transform: 'scaleX(-1)',
      zIndex: 9999,
      borderRadius: 'var(--overlay-radius)',
      boxShadow: 'var(--overlay-shadow)',
      display: 'none',
    });

    /* ---------- canvas ---------- */

    const canvas = document.createElement('canvas');
    canvas.className = videoPosition ?? 'bottom-center';

    Object.assign(canvas.style, {
      position: 'fixed',
      transform: 'scaleX(-1)',
      zIndex: 10000,
      pointerEvents: 'none',
      borderRadius: 'var(--overlay-radius)',
      display: 'none',
    });

    const ctx = canvas.getContext('2d');

    document.body.appendChild(video);
    document.body.appendChild(canvas);

    videoRef.current = video;
    canvasRef.current = canvas;
    ctxRef.current = ctx;

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    /* ---------- hands ---------- */

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.onResults((res) => {
      if (!active) return;

      setResults(res);

      const videoVisible = showVideoRef.current;
      const skeletonVisible = showSkeletonRef.current;

      if (!ctxRef.current || !canvasRef.current) return;

      if (!videoVisible) {
        ctxRef.current.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        return;
      }

      ctxRef.current.save();
      ctxRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // always draw video frame if visible
      ctxRef.current.drawImage(
        res.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // only draw skeleton if video is visible AND skeleton enabled
      if (skeletonVisible && res.multiHandLandmarks) {
        res.multiHandLandmarks.forEach((landmarks) => {
          drawConnectors(
            ctxRef.current,
            landmarks,
            HAND_CONNECTIONS,
            connectorStyleRef.current
          );
          drawLandmarks(ctxRef.current, landmarks, landmarkStyleRef.current);
        });
      }

      ctxRef.current.restore();
    });

    handsRef.current = hands;

    /* ---------- camera ---------- */

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

      video.remove();
      canvas.remove();

      handsRef.current = null;
      cameraRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  /* ---------------- live option updates ---------------- */

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

  /* ---------------- visibility ---------------- */

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const display = showVideo ? 'block' : 'none';

    Object.assign(videoRef.current.style, {
      display,
      ...videoStyle,
    });

    Object.assign(canvasRef.current.style, {
      display,
      ...videoStyle,
    });

    if (!showVideo && ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  }, [showVideo, videoStyle]);

  /* ---------------- live resize ---------------- */

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    Object.assign(videoRef.current.style, {
      width: `${videoWidth * videoSize}px`,
      height: `${videoHeight * videoSize}px`,
    });

    Object.assign(canvasRef.current.style, {
      width: `${videoWidth * videoSize}px`,
      height: `${videoHeight * videoSize}px`,
    });
  }, [videoSize]);

  return results;
}
