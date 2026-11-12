/* eslint-disable no-param-reassign */
import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';

import {
  animationBuffers,
  compositeReveal,
  compositeSequence,
  drawMorphReference,
} from '../utils/animationComposite';
import { motifPasses, paintMotif } from '../utils/animationMotif';
import revealField from '../utils/revealField';

export default function useAnimatedPaint(
  config,
  assets,
  runtimeRef,
  timeline,
  actionsRef
) {
  const data = useMemo(() => {
    const buffers = animationBuffers(config.resolution);
    buffers.canvas
      .getContext('2d')
      .drawImage(assets.main, 0, 0, config.resolution, config.resolution);
    const texture = new CanvasTexture(buffers.canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    const sourceTexture = new CanvasTexture(buffers.source);
    sourceTexture.colorSpace = SRGBColorSpace;
    return {
      ...buffers,
      texture,
      sourceTexture,
      status: {
        busy: false,
        frames: 0,
        millis: 0,
        phase: 0,
        error: '',
        next: 0,
        seen: NaN,
        version: 0,
        disposed: false,
      },
    };
  }, [config.resolution]);
  const field = useMemo(
    () => (config.experiment === 'washReveal' ? revealField(config) : null),
    [
      config.experiment,
      config.seed,
      config.revealPattern,
      config.revealNoise,
      config.revealCenterX,
      config.revealCenterY,
      config.animationPetals,
    ]
  );
  useEffect(() => {
    const { status } = data;
    status.version += 1;
    status.seen = NaN;
    status.next = 0;
    data.source
      .getContext('2d')
      .drawImage(assets.main, 0, 0, data.source.width, data.source.height);
    if (config.experiment === 'paintSequence')
      compositeSequence(data, data.source, assets.animation, 1, config);
    data.sourceTexture.needsUpdate = true;
  }, [config, assets, data]);
  useEffect(() => {
    data.status.disposed = false;
    return () => {
      data.status.disposed = true;
      data.status.version += 1;
      data.texture.dispose();
      data.sourceTexture.dispose();
    };
  }, [data]);
  useEffect(() => {
    if (actionsRef.current) actionsRef.current.canvas = data.canvas;
  }, [actionsRef, data]);
  useFrame(({ clock }) => {
    if (config.studyView === 'original') return;
    const job = data.status;
    const { phase } = timeline;
    if (job.busy || phase === job.seen || clock.elapsedTime < job.next) return;
    job.next = clock.elapsedTime + 1 / config.animationFps;
    const diagnostic = config.studyView === 'treatment';
    const started = performance.now();
    const finish = () => {
      data.texture.needsUpdate = true;
      job.millis = performance.now() - started;
      job.phase = phase;
      job.seen = phase;
      job.frames += 1;
    };
    if (config.experiment === 'washReveal') {
      compositeReveal(data, assets.main, field, phase, config, diagnostic);
      finish();
      return;
    }
    if (config.experiment === 'paintSequence') {
      compositeSequence(
        data,
        data.canvas,
        assets.animation,
        phase,
        config,
        diagnostic
      );
      finish();
      return;
    }
    if (diagnostic) {
      drawMorphReference(
        data.canvas,
        config,
        paintMotif(config, phase, config.morphAmount)
      );
      finish();
      return;
    }
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const { version } = job;
    const snapshot = {
      ...config,
      seed: config.seed + (config.morphSeed === 'boiling' ? job.frames : 0),
    };
    job.busy = true;
    runtime
      .paint(motifPasses(snapshot, phase, config.morphAmount), snapshot)
      .then((canvas) => {
        if (!canvas || job.disposed || version !== job.version) return;
        data.canvas.getContext('2d').drawImage(canvas, 0, 0);
        job.error = '';
        finish();
      })
      .catch((error) => {
        if (!job.disposed) job.error = error.message;
      })
      .finally(() => {
        job.busy = false;
      });
  });
  return data;
}
