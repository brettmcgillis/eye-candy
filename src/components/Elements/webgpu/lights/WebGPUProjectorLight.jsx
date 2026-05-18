import { TextureLoader } from 'three';
import {
  Fn,
  clamp,
  float,
  fract,
  int,
  mix,
  mx_fractal_noise_float as mxFractalNoise,
  mx_worley_noise_float as mxWorleyNoise,
  positionWorld,
  smoothstep,
  texture as textureSample,
  time,
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
  mapTintColor = '#ffffff',
  mapTintStrength = 0,
  mapBlur = 0,
  mapCausticAmount = 0,
  mapCausticScale = 6,
  mapCausticContrast = 0.22,
  mapCausticSpeed = 0.35,
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
  const projectedEffectUniforms = useMemo(
    () => ({
      tintColor: uniform(new THREE.Color('#ffffff')),
      tintStrength: uniform(0),
      blurAmount: uniform(0),
      causticAmount: uniform(0),
      causticScale: uniform(6),
      causticContrast: uniform(0.22),
      causticSpeed: uniform(0.35),
      texelSize: uniform(new THREE.Vector2(1, 1)),
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
  const usesProjectedSampling =
    usesMapTransform ||
    mapTintStrength > 0 ||
    mapBlur > 0 ||
    mapCausticAmount > 0;

  const effectiveColorNode = useMemo(() => {
    if (colorNode || !projectedTextureNode || !usesProjectedSampling) {
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
    const {
      blurAmount,
      causticAmount,
      causticContrast,
      causticScale,
      causticSpeed,
      texelSize,
      tintColor,
      tintStrength,
    } = projectedEffectUniforms;

    const sampleProjectedTexture = (uvNode) =>
      textureSample(
        projectedTextureNode,
        vec2(
          applyWrapMode(uvNode.x, mapWrapS),
          applyWrapMode(uvNode.y, mapWrapT)
        )
      );

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
      const blurOffset = texelSize.mul(blurAmount).mul(repeat.mul(focusZoom));
      const centerSample = sampleProjectedTexture(tiledUv);
      const leftSample = sampleProjectedTexture(
        tiledUv.sub(vec2(blurOffset.x, float(0.0)))
      );
      const rightSample = sampleProjectedTexture(
        tiledUv.add(vec2(blurOffset.x, float(0.0)))
      );
      const downSample = sampleProjectedTexture(
        tiledUv.sub(vec2(float(0.0), blurOffset.y))
      );
      const upSample = sampleProjectedTexture(
        tiledUv.add(vec2(float(0.0), blurOffset.y))
      );
      const blurredSample = centerSample
        .mul(float(0.4))
        .add(leftSample.mul(float(0.15)))
        .add(rightSample.mul(float(0.15)))
        .add(downSample.mul(float(0.15)))
        .add(upSample.mul(float(0.15)));
      const tintedColor = blurredSample.rgb.mul(
        mix(vec3(1, 1, 1), tintColor, tintStrength)
      );
      const animatedTime = time.mul(causticSpeed);
      const causticUv = tiledUv.mul(causticScale).add(
        vec2(
          animatedTime.mul(float(0.021)),
          animatedTime.mul(float(-0.014))
        )
      );
      const broadNoise = mxFractalNoise(
        vec3(causticUv, animatedTime.mul(float(0.013))),
        int(3),
        float(2.0),
        float(0.5)
      )
        .mul(float(0.5))
        .add(float(0.5));
      const cellNoise = float(1.0).sub(
        mxWorleyNoise(causticUv.mul(float(1.35)), float(1.0), 0).clamp(0.0, 1.0)
      );
      const causticPattern = smoothstep(
        float(0.52).sub(causticContrast),
        float(0.95),
        broadNoise.mul(float(0.45)).add(cellNoise.mul(float(0.55)))
      );
      const causticVisibility = tintedColor
        .dot(vec3(0.2126, 0.7152, 0.0722))
        .mul(float(0.7))
        .add(float(0.3));
      const causticStrength = causticAmount.mul(causticVisibility);
      const causticPatternCentered = causticPattern
        .mul(float(2.0))
        .sub(float(1.0));
      const causticEnergy = clamp(
        float(1.0).add(
          causticPatternCentered.mul(causticStrength.mul(float(1.35)))
        ),
        float(0.2),
        float(2.0)
      );
      const projectionMask = clamp(
        blurredSample.a.add(
          causticPatternCentered.mul(causticStrength.mul(float(0.18)))
        ),
        float(0.0),
        float(1.0)
      );
      const projectedColor = tintedColor.mul(causticEnergy);

      return mix(vec3(1, 1, 1), projectedColor, projectionMask);
    });
  }, [
    colorNode,
    mapWrapS,
    mapWrapT,
    projectedEffectUniforms,
    projectedMapUniforms,
    projectedTextureNode,
    usesProjectedSampling,
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
    projectedEffectUniforms.tintColor.value.set(mapTintColor);
    projectedEffectUniforms.tintStrength.value = mapTintStrength;
    projectedEffectUniforms.blurAmount.value = mapBlur;
    projectedEffectUniforms.causticAmount.value = mapCausticAmount;
    projectedEffectUniforms.causticScale.value = mapCausticScale;
    projectedEffectUniforms.causticContrast.value = mapCausticContrast;
    projectedEffectUniforms.causticSpeed.value = mapCausticSpeed;
  }, [
    mapBlur,
    mapCausticAmount,
    mapCausticContrast,
    mapCausticScale,
    mapCausticSpeed,
    mapTintColor,
    mapTintStrength,
    projectedEffectUniforms,
  ]);

  useEffect(() => {
    const image = mapTexture?.image;

    if (!image?.width || !image?.height) {
      projectedEffectUniforms.texelSize.value.set(1, 1);
      return;
    }

    projectedEffectUniforms.texelSize.value.set(
      1 / image.width,
      1 / image.height
    );
  }, [mapTexture, projectedEffectUniforms]);

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
      light.map = colorNode || usesProjectedSampling ? null : texture;
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
    usesProjectedSampling,
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
    light.shadow.focus = usesProjectedSampling ? 1 : shadowFocus;
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
    usesProjectedSampling,
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
