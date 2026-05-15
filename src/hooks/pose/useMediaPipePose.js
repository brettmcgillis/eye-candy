/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';

import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

import { POSE_CONNECTIONS } from './poseLandmarkUtils';

const TASKS_VISION_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';
const POSE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

const videoWidth = 240;
const videoHeight = 135;

function isMobile() {
  return window.innerWidth < window.innerHeight;
}

function updateOverlayVisibility(videoElement, canvasElement, showVideo) {
  const display = showVideo ? 'block' : 'none';
  const overlayVideo = videoElement;
  const overlayCanvas = canvasElement;

  if (overlayVideo) {
    overlayVideo.style.display = display;
  }

  if (overlayCanvas) {
    overlayCanvas.style.display = display;
  }
}

function updateOverlaySize(videoElement, canvasElement, videoSize) {
  const width = `${videoWidth * videoSize}px`;
  const height = `${videoHeight * videoSize}px`;
  const overlayVideo = videoElement;
  const overlayCanvas = canvasElement;

  if (overlayVideo) {
    overlayVideo.style.width = width;
    overlayVideo.style.height = height;
  }

  if (overlayCanvas) {
    overlayCanvas.style.width = width;
    overlayCanvas.style.height = height;
  }
}

export default function useMediaPipePose({
  minPoseDetectionConfidence = 0.6,
  minPosePresenceConfidence = 0.6,
  minTrackingConfidence = 0.6,
  cameraWidth = isMobile() ? 720 : 1280,
  cameraHeight = isMobile() ? 1280 : 720,

  showVideo = false,
  showDebugSkeleton = true,

  landmarkStyle = { color: '#38bdf8', radius: 4 },
  connectorStyle = { color: '#f97316', lineWidth: 3 },

  videoSize = 1,
  videoPosition = 'bottom-center',
  videoStyle = {},
} = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const rafRef = useRef(null);

  const showVideoRef = useRef(showVideo);
  const showSkeletonRef = useRef(showDebugSkeleton);
  const landmarkStyleRef = useRef(landmarkStyle);
  const connectorStyleRef = useRef(connectorStyle);

  const [results, setResults] = useState(null);

  useEffect(() => {
    showVideoRef.current = showVideo;
    updateOverlayVisibility(videoRef.current, canvasRef.current, showVideo);
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

  useEffect(() => {
    updateOverlaySize(videoRef.current, canvasRef.current, videoSize);
  }, [videoSize]);

  useEffect(() => {
    if (poseLandmarkerRef.current) {
      poseLandmarkerRef.current.setOptions({
        minPoseDetectionConfidence,
        minPosePresenceConfidence,
        minTrackingConfidence,
      });
    }
  }, [
    minPoseDetectionConfidence,
    minPosePresenceConfidence,
    minTrackingConfidence,
  ]);

  useEffect(() => {
    if (poseLandmarkerRef.current) return;

    let active = true;
    let lastVideoTime = -1;

    const video = document.createElement('video');
    video.className = videoPosition ?? 'bottom-center';
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;

    Object.assign(video.style, {
      position: 'fixed',
      transform: 'scaleX(-1)',
      zIndex: 9999,
      pointerEvents: 'none',
      borderRadius: 'var(--overlay-radius)',
      boxShadow: 'var(--overlay-shadow)',
      display: 'none',
    });
    Object.assign(video.style, videoStyle);

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

    updateOverlaySize(video, canvas, videoSize);
    updateOverlayVisibility(video, canvas, showVideoRef.current);

    document.body.appendChild(video);
    document.body.appendChild(canvas);

    videoRef.current = video;
    canvasRef.current = canvas;
    ctxRef.current = ctx;

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    async function boot() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          TASKS_VISION_WASM_URL
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: POSE_LANDMARKER_MODEL_URL,
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence,
          minPosePresenceConfidence,
          minTrackingConfidence,
          outputSegmentationMasks: false,
        });

        if (!active) {
          poseLandmarker.close();
          return;
        }

        poseLandmarkerRef.current = poseLandmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: cameraWidth,
            height: cameraHeight,
          },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        const tick = () => {
          if (!active) return;

          if (
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.currentTime !== lastVideoTime &&
            poseLandmarkerRef.current
          ) {
            lastVideoTime = video.currentTime;

            const poseResults = poseLandmarkerRef.current.detectForVideo(
              video,
              performance.now()
            );

            setResults(poseResults);

            if (ctxRef.current && canvasRef.current) {
              ctxRef.current.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );

              if (showVideoRef.current) {
                ctxRef.current.save();
                ctxRef.current.drawImage(
                  video,
                  0,
                  0,
                  canvasRef.current.width,
                  canvasRef.current.height
                );

                if (showSkeletonRef.current && poseResults.landmarks?.length) {
                  poseResults.landmarks.forEach((landmarks) => {
                    drawConnectors(
                      ctxRef.current,
                      landmarks,
                      POSE_CONNECTIONS,
                      connectorStyleRef.current
                    );
                    drawLandmarks(
                      ctxRef.current,
                      landmarks,
                      landmarkStyleRef.current
                    );
                  });
                }

                ctxRef.current.restore();
              }
            }
          }

          rafRef.current = window.requestAnimationFrame(tick);
        };

        tick();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize MediaPipe pose tracking', error);
      }
    }

    boot();

    return () => {
      active = false;

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      poseLandmarkerRef.current?.close();

      video.remove();
      canvas.remove();

      streamRef.current = null;
      poseLandmarkerRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  return results;
}
