import React, { memo, useEffect, useMemo, useRef } from 'react';

import * as THREE from 'three/webgpu';

import { PANEL_KEYS, computeLayout } from '../utils/layout';
import buildPanelGeometry from '../utils/panel/buildPanelGeometry';

function Panel({ config }) {
  const configRef = useRef(config);
  configRef.current = config;

  const panelKey = PANEL_KEYS.map((key) => config[key]).join('|');
  const layout = useMemo(
    () => computeLayout(configRef.current),
    [panelKey, config.cavityDepth]
  );
  const geometry = useMemo(
    () => buildPanelGeometry(configRef.current, layout),
    [layout]
  );
  const wallGeometry = useMemo(
    () =>
      new THREE.PlaneGeometry(
        layout.panelHalfWidth * 2,
        layout.panelHalfHeight * 2
      ),
    [layout]
  );
  const panelMaterial = useMemo(() => new THREE.MeshStandardNodeMaterial(), []);
  const wallMaterial = useMemo(() => new THREE.MeshStandardNodeMaterial(), []);

  useEffect(() => {
    panelMaterial.color.set(config.panelColor);
    panelMaterial.roughness = config.panelRoughness;
    wallMaterial.color.set(config.wallColor);
    wallMaterial.roughness = 0.9;
  }, [
    config.panelColor,
    config.panelRoughness,
    config.wallColor,
    panelMaterial,
    wallMaterial,
  ]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => wallGeometry.dispose(), [wallGeometry]);
  useEffect(
    () => () => {
      panelMaterial.dispose();
      wallMaterial.dispose();
    },
    [panelMaterial, wallMaterial]
  );

  return (
    <>
      <mesh
        castShadow
        geometry={geometry}
        material={panelMaterial}
        receiveShadow
      />
      <mesh
        geometry={wallGeometry}
        material={wallMaterial}
        position={[0, 0, layout.zBack - 0.01]}
        receiveShadow
      />
    </>
  );
}

export default memo(Panel);
