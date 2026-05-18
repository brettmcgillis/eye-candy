import { TextureLoader } from 'three';
import {
  Fn,
  clamp,
  fract,
  mix,
  positionWorld,
  texture as textureSample,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';

function getTextureAspect(texture) {
  const image = texture?.image;

  if (!image?.width || !image?.height) {
    return 1;
  }

  return image.width / image.height;
}

function getProjectedMapZoom(angle, focus) {
  if (focus >= 1) {
    return 1;
  }

  const safeFocus = Math.max(focus, 0.001);
  const baseTan = Math.tan(angle);
  const focusedTan = Math.tan(angle * safeFocus);

  if (baseTan === 0 || focusedTan === 0) {
    return 1;
  }

  return baseTan / focusedTan;
}

function getProjectorBasis(position, target) {
  const projectorPosition = new THREE.Vector3(
    position[0],
    position[1],
    position[2]
  );
  const projectorTarget = new THREE.Vector3(target[0], target[1], target[2]);
  const forward = projectorTarget.clone().sub(projectorPosition);
  const referenceDistance = Math.max(forward.length(), 0.001);

  forward.normalize();

  const fallbackUp =
    Math.abs(forward.dot(new THREE.Vector3(0, 1, 0))) > 0.999
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);

  const right = new THREE.Vector3()
    .crossVectors(forward, fallbackUp)
    .normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  return {
    projectorPosition,
    referenceDistance,
    right,
    up,
  };
}

function applyWrapMode(uvNode, wrapMode) {
  if (wrapMode === THREE.ClampToEdgeWrapping) {
    return clamp(uvNode, 0, 1);
  }

  return fract(uvNode);
}

function WebGPUProjectorLightInner({
  color = '#ffffff',
  intensity = 100,
  position = [0, 5, 0],
  target = [0, 0, 0],
  angle = Math.PI / 6,
  penumbra = 1,
  decay = 2,
  distance = 0,
  castShadow = true,
  shadowMapSize = [2048, 2048],
  shadowNear = 1,
  shadowFar = 10,
  shadowFocus = 1,
  shadowBias = 0,
  shadowNormalBias = 0,
  shadowAspect = null,
  colorNode = null,
  mapUrl = null,
  mapColorSpace = THREE.SRGBColorSpace,
  mapMinFilter = THREE.LinearFilter,
  mapMagFilter = THREE.LinearFilter,
  mapGenerateMipmaps = false,
  mapRepeat = [1, 1],
  mapOffset = [0, 0],
  mapWrapS = THREE.ClampToEdgeWrapping,
  mapWrapT = THREE.ClampToEdgeWrapping,
  debug = false,
}) {
  const { scene } = useThree();
  const lightRef = useRef(null);
  const targetRef = useRef(null);
  const helperRef = useRef(null);
  const textureRef = useRef(null);
  const [mapTexture, setMapTexture] = useState(null);
  const projectedTextureNode = useMemo(
    () => (mapTexture ? new THREE.TextureNode(mapTexture) : null),
    [mapTexture]
  );
  const projectedMapUniforms = useMemo(
    () => ({
      repeat: uniform(new THREE.Vector2(1, 1)),
      offset: uniform(new THREE.Vector2(0, 0)),
      focusZoom: uniform(1),
      projectorPosition: uniform(new THREE.Vector3(0, 0, 0)),
      projectorRight: uniform(new THREE.Vector3(1, 0, 0)),
      projectorUp: uniform(new THREE.Vector3(0, 1, 0)),
      halfWidth: uniform(1),
      halfHeight: uniform(1),
    }),
    []
  );

  const usesMapTransform =
    mapRepeat[0] !== 1 ||
    mapRepeat[1] !== 1 ||
    mapOffset[0] !== 0 ||
    mapOffset[1] !== 0 ||
    mapWrapS !== THREE.ClampToEdgeWrapping ||
    mapWrapT !== THREE.ClampToEdgeWrapping;

  const effectiveColorNode = useMemo(() => {
    if (colorNode || !projectedTextureNode || !usesMapTransform) {
      return colorNode || null;
    }

    const {
      focusZoom,
      halfHeight,
      halfWidth,
      offset,
      projectorPosition,
      projectorRight,
      projectorUp,
      repeat,
    } = projectedMapUniforms;

    return Fn(() => {
      const localPosition = positionWorld.sub(projectorPosition);
      const baseUv = vec2(
        localPosition.dot(projectorRight).div(halfWidth.mul(2)).add(0.5),
        localPosition.dot(projectorUp).div(halfHeight.mul(2)).add(0.5)
      );
      const tiledUv = baseUv
        .sub(0.5)
        .mul(repeat.mul(focusZoom))
        .add(0.5)
        .add(offset);
      const wrappedUv = vec2(
        applyWrapMode(tiledUv.x, mapWrapS),
        applyWrapMode(tiledUv.y, mapWrapT)
      );
      const texNode = textureSample(projectedTextureNode, wrappedUv);

      return mix(vec3(1, 1, 1), texNode.rgb, texNode.a);
    });
  }, [
    colorNode,
    mapWrapS,
    mapWrapT,
    projectedMapUniforms,
    projectedTextureNode,
    usesMapTransform,
  ]);

  useEffect(() => {
    const effectiveAspect =
      shadowAspect || getTextureAspect(textureRef.current) || 1;
    const { projectorPosition, referenceDistance, right, up } =
      getProjectorBasis(position, target);
    const halfHeight = Math.max(referenceDistance * Math.tan(angle), 0.001);

    projectedMapUniforms.repeat.value.set(mapRepeat[0], mapRepeat[1]);
    projectedMapUniforms.offset.value.set(mapOffset[0], mapOffset[1]);
    projectedMapUniforms.focusZoom.value = getProjectedMapZoom(
      angle,
      shadowFocus
    );
    projectedMapUniforms.projectorPosition.value.copy(projectorPosition);
    projectedMapUniforms.projectorRight.value.copy(right);
    projectedMapUniforms.projectorUp.value.copy(up);
    projectedMapUniforms.halfHeight.value = halfHeight;
    projectedMapUniforms.halfWidth.value = halfHeight * effectiveAspect;
  }, [
    angle,
    mapOffset,
    mapRepeat,
    position,
    projectedMapUniforms,
    shadowAspect,
    shadowFocus,
    target,
  ]);

  useEffect(() => {
    // SpotLight supports both map cookies and colorNode projection while
    // avoiding the rectangular ProjectorLight attenuation artifacts.
    const light = new THREE.SpotLight(new THREE.Color(color), intensity);
    const lightTarget = new THREE.Object3D();

    scene.add(lightTarget);
    scene.add(light);

    lightRef.current = light;
    targetRef.current = lightTarget;

    return () => {
      if (helperRef.current) {
        scene.remove(helperRef.current);
        helperRef.current.dispose();
        helperRef.current = null;
      }

      scene.remove(light);
      scene.remove(lightTarget);

      lightRef.current = null;
      targetRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    const light = lightRef.current;

    if (!light) return undefined;

    if (!mapUrl) {
      textureRef.current = null;
      setMapTexture(null);
      light.map = null;
      light.shadow.aspect = shadowAspect || 1;
      light.shadow.camera.updateProjectionMatrix();
      return undefined;
    }

    let disposed = false;
    const loader = new TextureLoader();

    const loadedTexture = loader.load(mapUrl, (loadedMap) => {
      if (disposed) {
        loadedMap.dispose();
        return;
      }

      const texture = loadedMap;

      texture.colorSpace = mapColorSpace;
      texture.minFilter = mapMinFilter;
      texture.magFilter = mapMagFilter;
      texture.generateMipmaps = mapGenerateMipmaps;
      texture.wrapS = mapWrapS;
      texture.wrapT = mapWrapT;
      texture.needsUpdate = true;

      textureRef.current = texture;
      setMapTexture(texture);
      light.map = colorNode || usesMapTransform ? null : texture;
      light.shadow.aspect = shadowAspect || getTextureAspect(texture);
      light.shadow.camera.updateProjectionMatrix();

      if (light.castShadow) light.shadow.needsUpdate = true;
    });

    return () => {
      disposed = true;

      if (light.map === loadedTexture) {
        light.map = null;
      }

      if (textureRef.current === loadedTexture) {
        textureRef.current = null;
      }

      setMapTexture((currentTexture) =>
        currentTexture === loadedTexture ? null : currentTexture
      );

      loadedTexture.dispose();
    };
  }, [
    colorNode,
    mapColorSpace,
    mapGenerateMipmaps,
    mapMagFilter,
    mapMinFilter,
    mapUrl,
    mapWrapS,
    mapWrapT,
    shadowAspect,
    usesMapTransform,
  ]);

  useEffect(() => {
    const light = lightRef.current;
    const lightTarget = targetRef.current;

    if (!light || !lightTarget) return;

    light.color.set(color);
    light.intensity = intensity;
    light.position.set(position[0], position[1], position[2]);
    light.angle = angle;
    light.penumbra = penumbra;
    light.decay = decay;
    light.distance = distance;
    light.castShadow = castShadow;
    light.colorNode = effectiveColorNode;
    light.map = effectiveColorNode ? null : textureRef.current;
    lightTarget.position.set(target[0], target[1], target[2]);
    light.target = lightTarget;

    light.shadow.mapSize.set(shadowMapSize[0], shadowMapSize[1]);
    light.shadow.aspect =
      shadowAspect || getTextureAspect(textureRef.current) || 1;
    light.shadow.camera.near = shadowNear;
    light.shadow.camera.far = shadowFar;
    light.shadow.focus = usesMapTransform ? 1 : shadowFocus;
    light.shadow.bias = shadowBias;
    light.shadow.normalBias = shadowNormalBias;
    light.shadow.camera.updateProjectionMatrix();

    if (castShadow) light.shadow.needsUpdate = true;

    lightTarget.updateMatrixWorld();

    if (helperRef.current) {
      helperRef.current.update();
    }
  }, [
    angle,
    castShadow,
    color,
    decay,
    distance,
    effectiveColorNode,
    intensity,
    penumbra,
    position,
    shadowBias,
    shadowFar,
    shadowFocus,
    shadowAspect,
    shadowMapSize,
    shadowNear,
    shadowNormalBias,
    target,
    usesMapTransform,
  ]);

  useEffect(() => {
    const light = lightRef.current;

    if (!light) return undefined;

    if (!debug) {
      if (helperRef.current) {
        scene.remove(helperRef.current);
        helperRef.current.dispose();
        helperRef.current = null;
      }

      return undefined;
    }

    const helper = new THREE.SpotLightHelper(light);
    helperRef.current = helper;
    scene.add(helper);
    helper.update();

    return () => {
      scene.remove(helper);
      helper.dispose();

      if (helperRef.current === helper) {
        helperRef.current = null;
      }
    };
  }, [debug, scene]);

  return null;
}

export default memo(WebGPUProjectorLightInner);
