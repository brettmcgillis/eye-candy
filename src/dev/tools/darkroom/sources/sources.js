import {
  isMirrored,
  openWebcam,
  resolveFacing,
  stopWebcam,
} from '@modules/webcam';

import createFrame from './createFrame';

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be decoded.'));
    image.src = url;
  });
}

function videoElement() {
  const video = document.createElement('video');
  Object.assign(video, { loop: true, muted: true, playsInline: true });
  return video;
}

function waitFor(target, event) {
  return new Promise((resolve, reject) => {
    const onError = () => reject(new Error('The video could not be loaded.'));
    target.addEventListener(event, resolve, { once: true });
    target.addEventListener('error', onError, { once: true });
  });
}

// A source is what Darkroom reads pictures from. `poll()` draws a new
// picture into `frame` when one has arrived; `seek()` (clips only) draws the
// picture at a time, which is what makes an export frame-exact.
export async function createImageSource({ label, url }) {
  const image = await loadImage(url);
  const frame = createFrame();
  const source = {
    duration: 0,
    frame,
    kind: 'still',
    label,
    mirrored: false,
    poll: () => false,
    setMirrored(mirrored) {
      source.mirrored = mirrored;
      frame.draw(image, image.naturalWidth, image.naturalHeight, { mirrored });
    },
    dispose() {},
  };
  source.setMirrored(false);
  return source;
}

export async function createVideoSource({ label, mirrored = false, url }) {
  const video = videoElement();
  video.src = url;
  video.preload = 'auto';
  await waitFor(video, 'loadeddata');
  const frame = createFrame();
  let fresh = true;
  let callback = null;
  const watch = () => {
    callback = video.requestVideoFrameCallback(() => {
      fresh = true;
      watch();
    });
  };
  watch();

  const state = { mirrored };
  const draw = () =>
    frame.draw(video, video.videoWidth, video.videoHeight, {
      mirrored: state.mirrored,
    });

  const source = {
    get currentTime() {
      return video.currentTime;
    },
    duration: video.duration,
    frame,
    kind: 'video',
    label,
    get mirrored() {
      return state.mirrored;
    },
    get paused() {
      return video.paused;
    },
    play: () => video.play(),
    pause: () => video.pause(),
    poll() {
      if (!fresh) return false;
      fresh = false;
      return draw();
    },
    async seek(time) {
      video.pause();
      const target = Math.min(Math.max(0, time), video.duration - 1e-3);
      if (Math.abs(video.currentTime - target) > 1e-4) {
        const presented = new Promise((resolve) => {
          const id = video.requestVideoFrameCallback(() => resolve());
          setTimeout(() => {
            video.cancelVideoFrameCallback(id);
            resolve();
          }, 250);
        });
        video.currentTime = target;
        await waitFor(video, 'seeked');
        await presented;
      }
      fresh = false;
      draw();
    },
    setMirrored(next) {
      state.mirrored = next;
      draw();
    },
    dispose() {
      video.cancelVideoFrameCallback(callback);
      video.pause();
      video.removeAttribute('src');
      video.load();
    },
  };
  draw();
  video.play().catch(() => {});
  return source;
}

export async function createCameraSource({ facing = 'front' } = {}) {
  const resolved = resolveFacing(facing);
  const stream = await openWebcam({
    facing: resolved,
    height: { ideal: 1080 },
    width: { ideal: 1920 },
  });
  const video = videoElement();
  video.srcObject = stream;
  await video.play();
  const frame = createFrame();
  let fresh = true;
  let callback = null;
  const watch = () => {
    callback = video.requestVideoFrameCallback(() => {
      fresh = true;
      watch();
    });
  };
  watch();

  const source = {
    duration: 0,
    facing: resolved,
    frame,
    kind: 'live',
    label: resolved === 'front' ? 'Front camera' : 'Back camera',
    mirrored: isMirrored(resolved),
    stream,
    poll() {
      if (!fresh) return false;
      fresh = false;
      return frame.draw(video, video.videoWidth, video.videoHeight, {
        mirrored: source.mirrored,
      });
    },
    setMirrored(next) {
      source.mirrored = next;
    },
    dispose() {
      video.cancelVideoFrameCallback(callback);
      stopWebcam(stream);
    },
  };
  return source;
}

const RECORDER_TYPES = [
  'video/mp4;codecs=avc1',
  'video/webm;codecs=vp9',
  'video/webm',
];

// The raw camera, recorded so a live take can be processed like a clip.
export function recordStream(stream, seconds, onProgress) {
  const mimeType = RECORDER_TYPES.find((type) =>
    MediaRecorder.isTypeSupported(type)
  );
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 12_000_000,
  });
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const started = performance.now();
  const timer = setInterval(() => {
    onProgress?.(Math.min(1, (performance.now() - started) / 1000 / seconds));
  }, 100);
  const done = new Promise((resolve) => {
    recorder.onstop = () => {
      clearInterval(timer);
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
    };
  });
  recorder.start(250);
  const stop = setTimeout(() => recorder.stop(), seconds * 1000);
  return {
    done,
    stop() {
      clearTimeout(stop);
      if (recorder.state !== 'inactive') recorder.stop();
    },
  };
}
