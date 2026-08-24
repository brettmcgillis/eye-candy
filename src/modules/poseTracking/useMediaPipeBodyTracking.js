/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';

import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
  FilesetResolver,
  HolisticLandmarker,
  PoseLandmarker,
} from '@mediapipe/tasks-vision';

import { POSE_CONNECTIONS } from './poseLandmarkUtils';

export const BODY_TRACKING_MODE = {
  holistic: 'holistic',
  pose: 'pose',
};

const TASKS_VISION_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';
const POSE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
const HOLISTIC_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task';

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

function buildLandmarkerOptions(mode, options) {
  if (mode === BODY_TRACKING_MODE.holistic) {
    return {
      minFaceDetectionConfidence: options.minFaceDetectionConfidence,
      minFacePresenceConfidence: options.minFacePresenceConfidence,
      minHandLandmarksConfidence: options.minHandLandmarksConfidence,
      minPoseDetectionConfidence: options.minPoseDetectionConfidence,
      minPosePresenceConfidence: options.minPosePresenceConfidence,
      outputFaceBlendshapes: false,
      outputPoseSegmentationMasks: false,
      runningMode: 'VIDEO',
    };
  }

  return {
    minPoseDetectionConfidence: options.minPoseDetectionConfidence,
    minPosePresenceConfidence: options.minPosePresenceConfidence,
    minTrackingConfidence: options.minTrackingConfidence,
    numPoses: options.maxPoses,
    outputSegmentationMasks: false,
    runningMode: 'VIDEO',
  };
}

async function createLandmarker(mode, vision, options) {
  if (mode === BODY_TRACKING_MODE.holistic) {
    return HolisticLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HOLISTIC_LANDMARKER_MODEL_URL,
      },
      ...buildLandmarkerOptions(mode, options),
    });
  }

  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_MODEL_URL,
    },
    ...buildLandmarkerOptions(mode, options),
  });
}

function normalizeTrackingResults(mode, rawResults) {
  if (!rawResults) return null;

  if (mode === BODY_TRACKING_MODE.holistic) {
    return {
      faceLandmarks: rawResults.faceLandmarks ?? [],
      landmarks: rawResults.poseLandmarks ?? [],
      leftHandLandmarks: rawResults.leftHandLandmarks ?? [],
      leftHandWorldLandmarks: rawResults.leftHandWorldLandmarks ?? [],
      mode,
      rawResults,
      rightHandLandmarks: rawResults.rightHandLandmarks ?? [],
      rightHandWorldLandmarks: rawResults.rightHandWorldLandmarks ?? [],
      worldLandmarks: rawResults.poseWorldLandmarks ?? [],
    };
  }

  return {
    faceLandmarks: [],
    landmarks: rawResults.landmarks ?? [],
    leftHandLandmarks: [],
    leftHandWorldLandmarks: [],
    mode,
    rawResults,
    rightHandLandmarks: [],
    rightHandWorldLandmarks: [],
    worldLandmarks: rawResults.worldLandmarks ?? [],
  };
}

function drawPoseOnlyOverlay(ctx, landmarks, connectorStyle, landmarkStyle) {
  drawConnectors(ctx, landmarks, POSE_CONNECTIONS, connectorStyle);
  drawLandmarks(ctx, landmarks, landmarkStyle);
}

function drawHolisticOverlay(ctx, results, connectorStyle, landmarkStyle) {
  results.poseLandmarks?.forEach((landmarks) => {
    drawPoseOnlyOverlay(ctx, landmarks, connectorStyle, landmarkStyle);
  });

  results.leftHandLandmarks?.forEach((landmarks) => {
    drawConnectors(
      ctx,
      landmarks,
      HolisticLandmarker.HAND_CONNECTIONS,
      connectorStyle
    );
    drawLandmarks(ctx, landmarks, landmarkStyle);
  });

  results.rightHandLandmarks?.forEach((landmarks) => {
    drawConnectors(
      ctx,
      landmarks,
      HolisticLandmarker.HAND_CONNECTIONS,
      connectorStyle
    );
    drawLandmarks(ctx, landmarks, landmarkStyle);
  });

  results.faceLandmarks?.forEach((landmarks) => {
    drawLandmarks(ctx, landmarks, {
      ...landmarkStyle,
      radius: Math.max(1, Math.round(landmarkStyle.radius * 0.4)),
    });

    drawConnectors(
      ctx,
      landmarks,
      HolisticLandmarker.FACE_LANDMARKS_FACE_OVAL,
      {
        ...connectorStyle,
        lineWidth: Math.max(1, Math.round(connectorStyle.lineWidth / 2)),
      }
    );
  });
}

export default function useMediaPipeBodyTracking({
  enabled = true,
  mode = BODY_TRACKING_MODE.pose,
  maxPoses = 1,
  minPoseDetectionConfidence = 0.6,
  minPosePresenceConfidence = 0.6,
  minTrackingConfidence = 0.6,
  minFaceDetectionConfidence = 0.6,
  minFacePresenceConfidence = 0.6,
  minHandLandmarksConfidence = 0.6,
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
  const landmarkerRef = useRef(null);
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
    if (!enabled) return;
    if (!landmarkerRef.current) return;

    landmarkerRef.current.setOptions(
      buildLandmarkerOptions(mode, {
        maxPoses,
        minFaceDetectionConfidence,
        minFacePresenceConfidence,
        minHandLandmarksConfidence,
        minPoseDetectionConfidence,
        minPosePresenceConfidence,
        minTrackingConfidence,
      })
    );
  }, [
    enabled,
    maxPoses,
    minFaceDetectionConfidence,
    minFacePresenceConfidence,
    minHandLandmarksConfidence,
    minPoseDetectionConfidence,
    minPosePresenceConfidence,
    minTrackingConfidence,
    mode,
  ]);

  useEffect(() => {
    if (!enabled) {
      setResults(null);
      return undefined;
    }

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
    setResults(null);

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    async function boot() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          TASKS_VISION_WASM_URL
        );

        const landmarker = await createLandmarker(mode, vision, {
          maxPoses,
          minFaceDetectionConfidence,
          minFacePresenceConfidence,
          minHandLandmarksConfidence,
          minPoseDetectionConfidence,
          minPosePresenceConfidence,
          minTrackingConfidence,
        });

        if (!active) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            height: cameraHeight,
            width: cameraWidth,
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
            landmarkerRef.current
          ) {
            lastVideoTime = video.currentTime;

            const trackingResults = landmarkerRef.current.detectForVideo(
              video,
              performance.now()
            );

            setResults(normalizeTrackingResults(mode, trackingResults));

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

                if (showSkeletonRef.current) {
                  if (mode === BODY_TRACKING_MODE.holistic) {
                    drawHolisticOverlay(
                      ctxRef.current,
                      trackingResults,
                      connectorStyleRef.current,
                      landmarkStyleRef.current
                    );
                  } else if (trackingResults.landmarks?.length) {
                    trackingResults.landmarks.forEach((landmarks) => {
                      drawPoseOnlyOverlay(
                        ctxRef.current,
                        landmarks,
                        connectorStyleRef.current,
                        landmarkStyleRef.current
                      );
                    });
                  }
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
        console.error('Failed to initialize MediaPipe body tracking', error);
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
      landmarkerRef.current?.close();

      video.remove();
      canvas.remove();

      streamRef.current = null;
      landmarkerRef.current = null;
      videoRef.current = null;
      canvasRef.current = null;
      ctxRef.current = null;
      setResults(null);
    };
  }, [
    cameraHeight,
    cameraWidth,
    enabled,
    maxPoses,
    minFaceDetectionConfidence,
    minFacePresenceConfidence,
    minHandLandmarksConfidence,
    minPoseDetectionConfidence,
    minPosePresenceConfidence,
    minTrackingConfidence,
    mode,
    videoPosition,
    videoSize,
  ]);

  return results;
}
