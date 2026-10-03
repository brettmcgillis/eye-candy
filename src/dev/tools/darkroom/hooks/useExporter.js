/* eslint-disable no-await-in-loop */
import { useCallback, useRef, useState } from 'react';

import { postJson, request } from '@dev/renderWorkbench/useRenderJobs';

import { engineOf } from '../techniques';

const SESSIONS = '/dev-api/darkroom/sessions';
const IN_FLIGHT = 4;
const SETTLE_MS = 120;

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function putFrame(session, index, blob) {
  return request(`${SESSIONS}/${session}/frames/${index}`, {
    body: blob,
    headers: { 'Content-Type': 'image/png' },
    method: 'PUT',
  });
}

// Renders the export frame by frame through the live technique instance —
// seeking the clip, never sampling it in real time — and stages each frame
// on the dev server, which encodes the collection as a job.
export default function useExporter({ preview, submit }) {
  const [progress, setProgress] = useState(null);
  const cancelRef = useRef(false);

  const run = useCallback(
    async ({
      audio,
      end,
      fps,
      kind,
      options,
      size,
      source,
      sourceInfo,
      start,
      technique,
    }) => {
      const instance = preview.instanceRef.current;
      if (!instance || !source) return;
      cancelRef.current = false;
      preview.hold(true);
      const wasPlaying = source.kind === 'video' && !source.paused;
      let session = null;
      const total =
        kind === 'still' ? 1 : Math.max(1, Math.round((end - start) * fps));
      setProgress({ done: 0, phase: 'rendering', total });
      try {
        await sleep(SETTLE_MS);
        ({ session } = await postJson(SESSIONS, {}));
        preview.stage.setEngine(engineOf(technique, options));
        instance.reset?.();
        const uploads = new Set();
        for (let index = 0; index < total; index += 1) {
          if (cancelRef.current) throw new Error('Export cancelled.');
          if (kind === 'video') await source.seek(start + index / fps);
          await instance.render({
            dt: index === 0 ? 0 : 1 / fps,
            frame: source.frame,
            options,
            size,
            time: index / fps,
          });
          const blob = await preview.stage.snapshot();
          const upload = putFrame(session, index, blob).finally(() =>
            uploads.delete(upload)
          );
          uploads.add(upload);
          if (uploads.size >= IN_FLIGHT) await Promise.race(uploads);
          setProgress({ done: index + 1, phase: 'rendering', total });
        }
        setProgress({ done: total, phase: 'uploading', total });
        await Promise.all(uploads);
        await submit({
          audio: Boolean(audio && sourceInfo?.name),
          audioStart: start,
          fps,
          height: size.height,
          kind,
          options,
          session,
          source: sourceInfo
            ? {
                kind: source.kind,
                label: sourceInfo.label,
                name: sourceInfo.name,
              }
            : { kind: source.kind, label: source.label },
          technique: technique.id,
          width: size.width,
        });
        setProgress({ done: total, phase: 'submitted', total });
      } catch (failure) {
        if (session) {
          request(`${SESSIONS}/${session}`, { method: 'DELETE' }).catch(
            () => {}
          );
        }
        setProgress({ error: failure.message, phase: 'failed', total });
      } finally {
        instance.reset?.();
        preview.hold(false);
        if (wasPlaying) source.play().catch(() => {});
      }
    },
    [preview, submit]
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { cancel, progress, run };
}
