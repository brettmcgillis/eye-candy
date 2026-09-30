/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';

import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, Hands } from '@mediapipe/hands';

import {
  flipPointsX,
  isMirrored,
  openWebcam,
  resolveFacing,
  stopWebcam,
} from '@modules/webcam';

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
  facing = 'front',

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
  const mirroredRef = useRef(true);

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
      width: `${videoWidth * videoSize}px`,
      height: `${videoHeight * videoSize}px`,
      pointerEvents: 'none',
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
      width: `${videoWidth * videoSize}px`,
      height: `${videoHeight * videoSize}px`,
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

      setResults(
        mirroredRef.current
          ? res
          : {
              ...res,
              multiHandLandmarks: flipPointsX(res.multiHandLandmarks),
              multiHandWorldLandmarks: flipPointsX(
                res.multiHandWorldLandmarks,
                0
              ),
            }
      );

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

    return () => {
      active = false;

      handsRef.current?.close();

      video.remove();
      canvas.remove();

      handsRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  /* ---------------- camera ---------------- */

  const resolvedFacing = resolveFacing(facing);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let stream = null;
    let frame = 0;

    mirroredRef.current = isMirrored(resolvedFacing);
    const transform = mirroredRef.current ? 'scaleX(-1)' : 'none';
    video.style.transform = transform;
    if (canvasRef.current) canvasRef.current.style.transform = transform;

    const pump = async () => {
      if (!active) return;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        await handsRef.current?.send({ image: video });
      }
      if (active) frame = window.requestAnimationFrame(pump);
    };

    openWebcam({
      facing: resolvedFacing,
      height: cameraHeight,
      width: cameraWidth,
    })
      .then(async (media) => {
        if (!active) {
          stopWebcam(media);
          return;
        }
        stream = media;
        video.srcObject = media;
        await video.play();
        pump();
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to start hand tracking camera', error);
      });

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      stopWebcam(stream);
      video.srcObject = null;
    };
  }, [cameraHeight, cameraWidth, resolvedFacing]);

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
