import React, { memo, useCallback, useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import RetroTv from '@elements/RetroTv/RetroTv';
import {
  createSecurityCamTimestampTexture,
  drawSecurityCamTimestamp,
} from '@materials/WebGPU/crt/surveillanceHUD';

import { JACK_PANELS, SCREEN_ASPECT } from '../utils/rig';
import {
  createScreenMaterial,
  createScreenUniforms,
} from '../utils/screenMaterial';

const pad = (value) => String(value).padStart(2, '0');

const JackPanels = memo(function JackPanels({ material }) {
  return JACK_PANELS.map(({ center, size }) => (
    <mesh
      key={center.join(',')}
      material={material}
      position={[center[0], center[1], center[2] - 0.002]}
    >
      <boxGeometry args={[size[0], size[1], 0.004]} />
    </mesh>
  ));
});

function Television({ config, feed, labels, onChannelStep }) {
  const hud = useMemo(createSecurityCamTimestampTexture, []);
  const uniforms = useMemo(createScreenUniforms, []);
  const material = useMemo(
    () => createScreenMaterial(feed.textureNode, hud.texture, uniforms),
    [feed, hud, uniforms]
  );
  const panelMaterial = useMemo(
    () =>
      new THREE.MeshStandardNodeMaterial({
        color: '#121314',
        roughness: 0.45,
        metalness: 0.6,
      }),
    []
  );

  useEffect(
    () => () => {
      material.dispose();
      panelMaterial.dispose();
      hud.texture.dispose();
    },
    [hud, material, panelMaterial]
  );

  useEffect(() => {
    uniforms.curvature.value = config.screenCurvature;
    uniforms.scanlines.value = config.screenScanlines;
    uniforms.brightness.value = config.screenBrightness;
    uniforms.idleStatic.value = config.screenStatic;
    uniforms.surveillanceHudOpacity.value = config.screenHud;
  }, [
    config.screenBrightness,
    config.screenCurvature,
    config.screenHud,
    config.screenScanlines,
    config.screenStatic,
    uniforms,
  ]);

  const { switchStatic, channel } = config;
  useFrame(({ clock }) => {
    const age = clock.elapsedTime - feed.switchedAt;
    uniforms.burst.value =
      switchStatic > 0 ? Math.max(0, 1 - age / switchStatic) : 0;
    drawSecurityCamTimestamp(
      hud,
      labels[channel - 1] ?? 'NO SIGNAL',
      SCREEN_ASPECT,
      `CH ${pad(channel)}`,
      new Date()
    );
  });

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      onChannelStep(1);
    },
    [onChannelStep]
  );
  const setCursor = useCallback((cursor) => {
    document.body.style.cursor = cursor;
  }, []);

  return (
    <group
      onClick={handleClick}
      onPointerOut={() => setCursor('auto')}
      onPointerOver={() => setCursor('pointer')}
    >
      <RetroTv
        bodyColor={config.tvBodyColor}
        screen={<primitive attach="material" object={material} />}
      />
      <JackPanels material={panelMaterial} />
    </group>
  );
}

export default memo(Television);
