import buildCaptureMetadata from './captureMetadata';
import downloadBlob from './download';
import injectMp4Metadata from './mp4Metadata';
import injectWebmMetadata from './webmMetadata';

// MP4/H.264 preferred (better editor compatibility — Premiere/FCP/Resolve/iMovie
// all handle it natively, webm is spottier). Chrome/Edge/Safari support recording
// straight to mp4 via MediaRecorder; browsers that don't (older Firefox) fall
// through to webm automatically since isTypeSupported() gates each candidate.
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8',
  'video/webm',
];

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  return (
    MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
  );
}

function extensionForMimeType(mimeType) {
  return mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
}

function toMp4Tags(metadata) {
  return {
    '©ART': metadata.Artist,
    cprt: metadata.Copyright,
    '©nam': metadata.Scene,
    '©too': metadata.Software,
    '©cmt': `Instagram: ${metadata.Instagram}`,
    '©day': metadata['Creation Time'],
  };
}

function toWebmTags(metadata) {
  return {
    ARTIST: metadata.Artist,
    COPYRIGHT: metadata.Copyright,
    TITLE: metadata.Scene,
    ENCODER: metadata.Software,
    COMMENT: `Instagram: ${metadata.Instagram}`,
    DATE_RECORDED: metadata['Creation Time'],
  };
}

const RECORDING_FPS = 30;

export default function createRecorder({ canvas, fileName }) {
  const stream = canvas.captureStream(RECORDING_FPS);
  const mimeType = pickSupportedMimeType();
  const recorder = new MediaRecorder(
    stream,
    mimeType ? { mimeType } : undefined
  );
  const chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
    const extension = extensionForMimeType(mimeType);
    let outBlob = blob;

    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const metadata = buildCaptureMetadata(fileName);
      const enriched =
        extension === 'mp4'
          ? injectMp4Metadata(bytes, toMp4Tags(metadata))
          : injectWebmMetadata(bytes, toWebmTags(metadata));
      outBlob = new Blob([enriched], { type: mimeType || 'video/webm' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '[mediaRecorder] video metadata injection failed, saving without metadata:',
        err
      );
    }

    downloadBlob(outBlob, `${fileName}.${extension}`);
  };

  recorder.onerror = (event) => {
    // eslint-disable-next-line no-console
    console.error('[mediaRecorder] MediaRecorder error:', event.error);
  };

  return recorder;
}
