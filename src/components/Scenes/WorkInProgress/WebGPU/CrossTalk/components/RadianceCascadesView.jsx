/* eslint-disable no-nested-ternary */
import React, { memo, useMemo } from 'react';

import LightHandle from './LightHandle';
import OccluderHandle from './OccluderHandle';
import RadianceField from './RadianceField';

// Everything the Radiance Cascades preset needs, self-contained: the
// fullscreen GPU render (RadianceField) + one draggable light + one
// draggable occluder per alive window. Light/occluder *position* lives in
// useSceneControls (c.lightOffset/c.occluderOffset), not local state here —
// presets/views.js's getMeta runs at the CrossTalk.jsx orchestrator level,
// above this component, so anything that needs to broadcast over
// windowSync has to be reachable from `c` rather than a state hook inside
// this view. Mounting/unmounting is the on/off switch, same as every other
// preset view here.
function RadianceCascadesView({ c, selfId, selfRect, windows }) {
  const selfLight = useMemo(
    () => ({
      color: c.lightColor,
      intensity: c.lightIntensity,
      offsetX: c.lightOffset.x,
      offsetY: c.lightOffset.y,
      radius: c.lightRadius,
    }),
    [c.lightColor, c.lightIntensity, c.lightOffset, c.lightRadius]
  );

  const selfOccluder = useMemo(
    () => ({
      offsetX: c.occluderOffset.x,
      offsetY: c.occluderOffset.y,
      rotation: (c.occluderRotation * Math.PI) / 180,
      shape: c.occluderShape,
      size: c.occluderSize,
    }),
    [c.occluderOffset, c.occluderRotation, c.occluderShape, c.occluderSize]
  );

  const windowsForRender =
    windows.length > 0
      ? windows
      : selfRect
        ? [
            {
              h: selfRect.h,
              id: selfId ?? '__self_fallback__',
              meta: {},
              w: selfRect.w,
              x: selfRect.x,
              y: selfRect.y,
            },
          ]
        : [];

  return (
    <>
      <RadianceField
        ambient={c.ambient}
        exposure={c.exposure}
        sceneDetail={c.sceneDetail}
        selfId={selfId}
        selfLight={selfLight}
        selfOccluder={selfOccluder}
        selfRect={selfRect}
        shadowSoftness={c.shadowSoftness}
        windows={windows}
      />
      {windowsForRender.map((win) => {
        const isSelf = windows.length === 0 || win.id === selfId;
        const light = isSelf ? selfLight : win.meta?.light;
        const occluder = isSelf ? selfOccluder : win.meta?.occluder;
        const rect = { h: win.h, w: win.w, x: win.x, y: win.y };

        return (
          <React.Fragment key={win.id}>
            {light && (
              <LightHandle
                center={{
                  x: win.x + win.w / 2 + light.offsetX * win.w,
                  y: win.y + win.h / 2 + light.offsetY * win.h,
                }}
                color={light.color}
                draggable={isSelf}
                onDrag={isSelf ? c.setLightOffset : undefined}
                radius={light.radius}
                rect={rect}
              />
            )}
            {occluder && (
              <OccluderHandle
                center={{
                  x: win.x + win.w / 2 + occluder.offsetX * win.w,
                  y: win.y + win.h / 2 + occluder.offsetY * win.h,
                }}
                draggable={isSelf}
                onDrag={isSelf ? c.setOccluderOffset : undefined}
                rect={rect}
                rotation={occluder.rotation}
                shape={occluder.shape}
                size={occluder.size}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default memo(RadianceCascadesView);
