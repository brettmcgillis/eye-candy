/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';

import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';

export default function useMediaPipeHands({
  maxHands = 1,
  modelComplexity = 1,
  minDetectionConfidence = 0.6,
  minTrackingConfidence = 0.6,
  width = 1280,
  height = 720,
  showVideo = false,
  videoPosition = 'bottom-center',
  videoStyle = {},
} = {}) {
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const [results, setResults] = useState(null);

  // -------------------------
  // Create MediaPipe ONCE
  // -------------------------
  useEffect(() => {
    if (handsRef.current) return; // 🚨 prevents duplicate WASM

    let active = true;

    const video = document.createElement('video');
    video.className = videoPosition ?? 'bottom-center';
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;

    Object.assign(video.style, {
      position: 'fixed',
      width: '240px',
      transform: 'scaleX(-1)',
      zIndex: 9999,
      borderRadius: 'var(--overlay-radius)',
      boxShadow: 'var(--overlay-shadow)',
      display: showVideo ? 'block' : 'none',
      ...videoStyle,
    });

    document.body.appendChild(video);
    videoRef.current = video;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.onResults((res) => {
      if (active) setResults(res);
    });

    handsRef.current = hands;

    const camera = new Camera(video, {
      onFrame: async () => {
        if (!handsRef.current) return;
        await handsRef.current.send({ image: video });
      },
      width,
      height,
    });

    camera.start();
    cameraRef.current = camera;

    return () => {
      console.log('🔥 MediaPipe cleanup');

      active = false;
      cameraRef.current?.stop();
      handsRef.current?.close();

      if (video && document.body.contains(video)) {
        document.body.removeChild(video);
      }

      handsRef.current = null;
      cameraRef.current = null;
      videoRef.current = null;
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
  // Video visibility
  // -------------------------
  useEffect(() => {
    if (!videoRef.current) return;

    Object.assign(videoRef.current.style, {
      display: showVideo ? 'block' : 'none',
      ...videoStyle,
    });
  }, [showVideo, videoStyle]);

  return results;
}
