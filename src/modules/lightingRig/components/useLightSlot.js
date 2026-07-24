import { useEffect, useRef } from 'react';

// Shared per-light wiring: layer assignment, imperative shadow config, and
// instance-identity notification. Disabled slots unmount entirely rather than
// linger at intensity 0, so any consumer holding the light (e.g. Godrays
// reading a real THREE.PointLight) has to be told when the instance changes —
// a plain ref won't re-trigger their effects.
export default function useLightSlot(slot, onLightChange) {
  const lightRef = useRef(null);
  const layerMode = slot.layer?.mode;
  const layerChannel = slot.layer?.channel;
  const { shadow } = slot;

  useEffect(() => {
    const light = lightRef.current;

    if (!light || layerChannel === undefined) {
      return undefined;
    }

    if (layerMode === 'enable') {
      light.layers.enable(layerChannel);
    } else {
      light.layers.set(layerChannel);
    }

    return () => {
      light.layers.set(0);
    };
  }, [layerChannel, layerMode]);

  useEffect(() => {
    const light = lightRef.current;

    if (!light?.shadow || !shadow) {
      return;
    }

    const lightShadow = light.shadow;

    // mapSize only takes effect on a freshly allocated map; three.js won't
    // resize one that already exists.
    if (lightShadow.map && lightShadow.map.width !== shadow.mapSize) {
      lightShadow.map.dispose();
      lightShadow.map = null;
    }

    lightShadow.mapSize.set(shadow.mapSize, shadow.mapSize);
    lightShadow.bias = shadow.bias;
    lightShadow.normalBias = shadow.normalBias;
    lightShadow.radius = shadow.radius;
    lightShadow.intensity = shadow.intensity;
    lightShadow.camera.near = shadow.near;
    lightShadow.camera.far = shadow.far;

    if (slot.type === 'directional') {
      lightShadow.camera.left = -shadow.extent;
      lightShadow.camera.right = shadow.extent;
      lightShadow.camera.top = shadow.extent;
      lightShadow.camera.bottom = -shadow.extent;
    }

    lightShadow.camera.updateProjectionMatrix();
    lightShadow.needsUpdate = true;
  }, [shadow, slot.type]);

  useEffect(() => {
    if (!onLightChange) {
      return undefined;
    }

    onLightChange(slot.id, lightRef.current ?? null);

    return () => onLightChange(slot.id, null);
  }, [onLightChange, slot.id]);

  return lightRef;
}
