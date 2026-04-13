import {
  cos,
  mix,
  uniform as nodeUniform,
  sin,
  texture as textureSample,
  uv,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

import createClothSimulation from './createClothSimulation';

// Module-level shared objects — avoid per-frame allocation.
// Safe because R3F useFrame callbacks execute sequentially.
const sharedRaycaster = new THREE.Raycaster();
const sharedPlane = new THREE.Plane();
const sharedIntersect = new THREE.Vector3();
const sharedCameraDir = new THREE.Vector3();

// Color-type properties on MeshPhysicalNodeMaterial that need .set()
const COLOR_KEYS = new Set([
  'color',
  'sheenColor',
  'attenuationColor',
  'specularColor',
  'emissive',
]);

const ClothMesh = forwardRef(function ClothMesh(
  {
    // Cloth shape (static — used at creation only)
    width = 1.0,
    height = 0.7,
    segmentsX = 30,
    segmentsY = 21,
    pinEdge = 'left',
    origin = [0, 0, 0],
    gravity = 0.00005,
    windFrequency = 1,
    windAmplitude = 0.0001,
    stepsPerSecond = 360,
    maxVelocity = 0.01,
    // Initial material config (static — constructor only)
    initialMaterial = {},
    // Runtime simulation controls
    wind = 1.0,
    windDirX = 1,
    windDirZ = 0,
    stiffness = 0.2,
    dampening = 0.99,
    paused = false,
    // Sphere interaction
    sphereEnabled = true,
    sphereRadius = 0.12,
    sphereWireframe = false,
    sphereColor = '#ff0000',
    // Tatter — noise-driven face removal for edges/holes
    tatterSeed = 42,
    tatterScale = 3,
    tatterEdge = 0,
    tatterHoles = 0,
    // Optional texture URL (applied as material.map)
    textureUrl = null,
    // Array of URLs to eagerly preload (avoids Suspense on switch)
    preloadTextures = [],
    textureScaleX = 1,
    textureScaleY = 1,
    textureRotation = 0,
    // Material properties applied each frame (optional)
    materialProps,
  },
  ref
) {
  const simState = useRef({
    timeSinceLastStep: 0,
    lastPointerX: 0,
    lastPointerY: 0,
  });
  const meshRef = useRef();
  const sphereRef = useRef();

  // Persistent GPU uniforms for texture compositing (stable across frames)
  const texUniforms = useMemo(
    () => ({
      baseColorU: nodeUniform(new THREE.Color(1, 1, 1)),
      scaleU: nodeUniform(new THREE.Vector2(1, 1)),
      rotU: nodeUniform(0),
    }),
    []
  );

  const { sim, interactionCenter } = useMemo(() => {
    const mat = new THREE.MeshPhysicalNodeMaterial({
      side: THREE.DoubleSide,
      ...initialMaterial,
    });
    const s = createClothSimulation({
      width,
      height,
      segmentsX,
      segmentsY,
      pinEdge,
      origin,
      gravity,
      windFrequency,
      windAmplitude,
      tatter: {
        seed: tatterSeed,
        scale: tatterScale,
        edge: tatterEdge,
        holes: tatterHoles,
      },
      material: mat,
    });
    const cx = pinEdge === 'top' ? origin[0] : origin[0] + width / 2;
    const cy = origin[1] - height / 2;
    return {
      sim: s,
      interactionCenter: new THREE.Vector3(cx, cy, origin[2]),
    };
  }, []); // GPU buffers built once — intentionally static

  // Expose resetSim on the forwarded ref
  useImperativeHandle(
    ref,
    () => ({
      get mesh() {
        return meshRef.current;
      },
      resetSim() {
        sim.reset();
        simState.current.timeSinceLastStep = 0;
      },
    }),
    [sim]
  );

  // Eagerly preload all texture URLs into a Map (no Suspense)
  const textureMap = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = new Map();
    preloadTextures.forEach((url) => {
      if (url && url !== 'None') {
        map.set(url, loader.load(url));
      }
    });
    return map;
    // eslint-disable-next-line
  }, []); // Loaded once at mount — intentionally static

  const texture = textureUrl ? textureMap.get(textureUrl) || null : null;

  useEffect(() => {
    if (textureUrl && texture) {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      // Build UV transform: scale + rotate around center
      const uvCentered = uv().sub(0.5);
      const scaled = uvCentered.mul(texUniforms.scaleU);
      const c = cos(texUniforms.rotU);
      const s = sin(texUniforms.rotU);
      const rotated = vec2(
        scaled.x.mul(c).sub(scaled.y.mul(s)),
        scaled.x.mul(s).add(scaled.y.mul(c))
      );
      const transformedUv = rotated.add(0.5);

      // Alpha-composite: base color where transparent, texture where opaque
      const texNode = textureSample(texture, transformedUv);
      sim.material.colorNode = mix(
        texUniforms.baseColorU,
        texNode.rgb,
        texNode.a
      );
      sim.material.map = null;
      sim.material.needsUpdate = true;
    } else {
      sim.material.colorNode = null;
      sim.material.map = null;
      sim.material.needsUpdate = true;
    }
  }, [sim, textureUrl, texture, texUniforms]);

  // Rebuild tatter (index buffer only) when noise params change
  useEffect(() => {
    sim.rebuildTatter({
      seed: tatterSeed,
      scale: tatterScale,
      edge: tatterEdge,
      holes: tatterHoles,
    });
  }, [sim, tatterSeed, tatterScale, tatterEdge, tatterHoles]);

  const timePerStep = 1 / stepsPerSecond;

  useFrame(({ gl, pointer, camera }, delta) => {
    const s = simState.current;

    // Push control values into GPU uniforms
    sim.windU.value = wind;
    sim.windDirU.value.set(windDirX, 0, windDirZ).normalize();
    sim.stiffnessU.value = stiffness;
    sim.dampeningU.value = dampening;
    sim.sphereRadiusU.value = sphereRadius;
    sim.maxVelocityU.value = maxVelocity;

    // Push texture-compositing uniforms
    texUniforms.scaleU.value.set(1 / textureScaleX, 1 / textureScaleY);
    texUniforms.rotU.value = (textureRotation * Math.PI) / 180;
    if (materialProps?.color) {
      texUniforms.baseColorU.value.set(materialProps.color);
    }

    // Apply dynamic material properties
    if (materialProps) {
      Object.entries(materialProps).forEach(([key, val]) => {
        if (COLOR_KEYS.has(key) && sim.material[key]?.isColor) {
          sim.material[key].set(val);
        } else {
          // eslint-disable-next-line no-param-reassign
          sim.material[key] = val;
        }
        if (key === 'opacity') {
          // eslint-disable-next-line no-param-reassign
          sim.material.transparent = val < 1;
        }
      });
    }

    // Cursor → sphere interaction
    const pointerActive =
      pointer.x !== s.lastPointerX || pointer.y !== s.lastPointerY;
    if (
      pointerActive &&
      (pointer.x !== 0 || pointer.y !== 0) &&
      sphereEnabled
    ) {
      camera.getWorldDirection(sharedCameraDir);
      sharedPlane.setFromNormalAndCoplanarPoint(
        sharedCameraDir,
        interactionCenter
      );
      sharedRaycaster.setFromCamera(pointer, camera);
      if (sharedRaycaster.ray.intersectPlane(sharedPlane, sharedIntersect)) {
        sim.spherePosU.value.copy(sharedIntersect);
        if (sphereRef.current) {
          sphereRef.current.position.copy(sharedIntersect);
        }
      }
      sim.sphereU.value = 1.0;
    } else if (!sphereEnabled) {
      sim.sphereU.value = 0.0;
    }
    s.lastPointerX = pointer.x;
    s.lastPointerY = pointer.y;

    // Fixed-timestep simulation
    if (!paused) {
      s.timeSinceLastStep += Math.min(delta, 1 / 60);
      let steps = 0;

      while (s.timeSinceLastStep >= timePerStep && steps < 10) {
        s.timeSinceLastStep -= timePerStep;
        steps += 1;
        gl.compute(sim.computeSprings);
        gl.compute(sim.computeVertices);
      }
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={sim.geometry}
        material={sim.material}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      {sphereWireframe && (
        <mesh ref={sphereRef} frustumCulled={false}>
          <icosahedronGeometry args={[sphereRadius, 3]} />
          <meshBasicMaterial
            wireframe
            color={sphereColor}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
});

export default ClothMesh;
