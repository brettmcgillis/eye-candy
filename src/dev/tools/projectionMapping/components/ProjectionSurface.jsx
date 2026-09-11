import React, { memo, useEffect, useRef, useState } from 'react';

import { getProjectiveTransform } from '../utils/homography';
import { loadMedia } from '../utils/mediaStore';

function getSceneUrl(source) {
  const params = new URLSearchParams({ hideUI: '1', noLeva: '1' });
  if (source.preset) params.set('preset', source.preset);
  return `${source.path}?${params}`;
}

function GridSource({ source }) {
  const spacing = Math.max(8, Number(source.spacing) || 80);
  return (
    <div
      className="pm-grid-source"
      style={{
        '--pm-grid-background': source.backgroundColor,
        '--pm-grid-line': source.lineColor,
        '--pm-grid-major': source.majorColor,
        '--pm-grid-spacing': `${spacing}px`,
      }}
    >
      <span className="pm-grid-source__axis pm-grid-source__axis--x" />
      <span className="pm-grid-source__axis pm-grid-source__axis--y" />
    </div>
  );
}

function MediaSource({ layer }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    loadMedia(layer.source.assetId).then((record) => {
      if (!active || !record?.blob) return;
      objectUrl = URL.createObjectURL(record.blob);
      setUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [layer.source.assetId]);

  if (!url) return <div className="pm-media-missing">Media unavailable</div>;
  if (layer.type === 'video') {
    return (
      <video
        autoPlay
        className="pm-media-source"
        loop
        muted
        playsInline
        src={url}
      />
    );
  }
  return <img alt="" className="pm-media-source" src={url} />;
}

function LayerSource({ layer }) {
  if (layer.type === 'scene') {
    return (
      <iframe
        allow="autoplay; fullscreen"
        className="pm-scene-source"
        key={getSceneUrl(layer.source)}
        src={getSceneUrl(layer.source)}
        title={layer.name}
      />
    );
  }
  if (layer.type === 'color') {
    return (
      <div
        className="pm-color-source"
        style={{ background: layer.source.color }}
      />
    );
  }
  if (layer.type === 'image' || layer.type === 'video') {
    return <MediaSource layer={layer} />;
  }
  return <GridSource source={layer.source} />;
}

function ProjectionSurface({ height, layer, width }) {
  const lastTransformRef = useRef('none');
  const transform = getProjectiveTransform(width, height, layer.corners);
  if (transform) lastTransformRef.current = transform;

  return (
    <div
      className="pm-surface"
      style={{
        height,
        mixBlendMode: layer.blendMode,
        opacity: layer.opacity,
        pointerEvents: layer.interactive ? 'auto' : 'none',
        transform: lastTransformRef.current,
        visibility: layer.visible ? 'visible' : 'hidden',
        width,
      }}
    >
      <LayerSource layer={layer} />
    </div>
  );
}

export default memo(ProjectionSurface);
