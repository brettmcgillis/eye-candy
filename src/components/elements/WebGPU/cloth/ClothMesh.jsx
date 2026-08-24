import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

import {
  Fn,
  attribute,
  cos,
  cross,
  float,
  frontFacing,
  mix,
  uniform as nodeUniform,
  positionWorld,
  screenUV,
  sin,
  texture as textureSample,
  uv,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import createClothSimulation from './createClothSimulation';

// Module-level shared objects — avoid per-frame allocation.
// Safe because R3F useFrame callbacks execute sequentially.
const sharedRaycaster = new THREE.Raycaster();
const sharedPlane = new THREE.Plane();
const sharedIntersect = new THREE.Vector3();
const sharedCameraDir = new THREE.Vector3();
const sharedWorldQuat = new THREE.Quaternion();
const sharedGravityDir = new THREE.Vector3();
const sharedSphereLocal = new THREE.Vector3();
const sharedWorldMatrix = new THREE.Matrix4();
const sharedInteractionCenterWorld = new THREE.Vector3();

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
    pins = [],
    centered = false,
    orientation = 'vertical',
    shape = 'rectangle',
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
    // When true, caller manages windU/windDirU via sim ref — skip overwrite
    windManaged = false,
    // When true, caller manages gravityU via sim ref — skip overwrite
    gravityManaged = false,
    // Cursor collider (slot 0) — follows pointer on the cloth plane
    cursorCollider = true,
    cursorRadius = 0.12,
    // Scene-driven colliders (slots 1+) — array of {position, radius}
    colliders = [],
    // Collision margin — enlarges detection volume for small spheres
    collisionMargin = 0.02,
    // Dynamic anchors — vertices pinned to moving positions
    // [{worldX, worldZ, restX, restY, restZ, gridRadius, position: THREE.Vector3}]
    anchors = [],
    // Debug: render wireframe spheres for all active colliders
    debugColliders = false,
    debugColor = '#ff0000',
    // Alpha masking — replaces tatter
    alphaSeed = 42,
    alphaScale = 3,
    edgeFade = 0,
    holeAmount = 0,
    tatterEdge = 0,
    smoothEdges = false,
    cutouts = [],
    // Cutout rim (eyeliner outline) — color + width in UV space
    cutoutRimColor = '#000000',
    cutoutRimWidth = 0,
    cutoutRimOffset = 0,
    // Legacy single texture URL. Use outerTextureUrl / innerTextureUrl for
    // discrete per-side textures.
    textureUrl = null,
    // Legacy resolved texture object (loaded upstream)
    texture = null,
    // Discrete per-side texture URLs / resolved textures.
    outerTextureUrl = null,
    outerTexture = null,
    innerTextureUrl = null,
    innerTexture = null,
    textureScaleX = 1,
    textureScaleY = 1,
    textureRotation = 0,
    textureBlend = 1,
    // When false, clamps texture to edges instead of repeating/tiling
    textureTile = true,
    // uv | world | screen
    textureProjection = 'uv',
    // Texture application side: both | inner | outer
    textureSide = 'both',
    // Lightweight silhouette outline
    outlineEnabled = false,
    outlineColor = '#ffffff',
    outlineThickness = 0.015,
    outlineOpacity = 1,
    // Inner (back-face) color — when set, front/back faces render different colors
    innerColor = null,
    // Per-face roughness/metalness — activates roughnessNode/metalnessNode when non-null
    innerRoughness = null,
    innerMetalness = null,
    // Emissive glow — self-illumination independent of scene lights.
    // Inner/outer split follows the same frontFacing rule as innerColor.
    outerEmissiveColor = null,
    outerEmissiveIntensity = 0,
    innerEmissiveColor = null,
    innerEmissiveIntensity = 0,
    // Radial falloff: 0 = uniform, >0 = glow fades from emissiveCenter outward
    emissiveFalloff = 0,
    // UV origin for the emissive glow [u, v]
    emissiveCenter = [0.5, 0.5],
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
  const cursorSphereRef = useRef();
  const colliderSphereRefs = useRef([]);
  const materialKeysRef = useRef(null);
  const outerTextureNodeRef = useRef(null);
  const innerTextureNodeRef = useRef(null);

  // Persistent GPU uniforms for texture compositing (stable across frames)
  const texUniforms = useMemo(
    () => ({
      baseColorU: nodeUniform(new THREE.Color(1, 1, 1)),
      scaleU: nodeUniform(new THREE.Vector2(1, 1)),
      rotU: nodeUniform(0),
      textureBlendU: nodeUniform(1),
      innerColorU: nodeUniform(new THREE.Color(0, 0, 0)),
      outerEmissiveColorU: nodeUniform(new THREE.Color(0, 0, 0)),
      outerEmissiveIntensityU: nodeUniform(0),
      innerEmissiveColorU: nodeUniform(new THREE.Color(0, 0, 0)),
      innerEmissiveIntensityU: nodeUniform(0),
      emissiveFalloffU: nodeUniform(0),
      emissiveCenterU: nodeUniform(new THREE.Vector2(0.5, 0.5)),
      outerRoughnessU: nodeUniform(0.8),
      innerRoughnessU: nodeUniform(0.8),
      outerMetalnessU: nodeUniform(0),
      innerMetalnessU: nodeUniform(0),
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
      pins,
      centered,
      orientation,
      shape,
      origin,
      gravity,
      windFrequency,
      windAmplitude,
      anchors,
      alpha: {
        seed: alphaSeed,
        scale: alphaScale,
        edgeFade,
        holeAmount,
        tatterEdge,
        cutouts,
      },
      material: mat,
    });
    const cx = centered ? origin[0] : origin[0] + width / 2;
    const isHoriz = orientation === 'horizontal';
    const cy = isHoriz ? origin[1] : origin[1] - height / 2;
    let cz = origin[2];
    if (isHoriz) cz = centered ? origin[2] : origin[2] + height / 2;
    return {
      sim: s,
      interactionCenter: new THREE.Vector3(cx, cy, cz),
    };
  }, []); // GPU buffers built once — intentionally static

  const outlineThicknessU = useMemo(() => nodeUniform(outlineThickness), []);

  const outlineMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial({
      color: outlineColor,
      side: THREE.BackSide,
      transparent: true,
      opacity: outlineOpacity,
      depthTest: true,
      depthWrite: false,
    });
    // Build a positionNode that reads from the same GPU storage buffer as the
    // cloth, computes the geometric normal at each quad, and pushes outward.
    // This is the only correct approach — the cloth positions live only in
    // posBuf; scaling static geometry has nothing to scale.
    mat.positionNode = Fn(() => {
      const ids = attribute('vertexIds');
      const v0 = sim.posBuf.element(ids.x).toVar();
      const v1 = sim.posBuf.element(ids.y).toVar();
      const v2 = sim.posBuf.element(ids.z).toVar();
      const v3 = sim.posBuf.element(ids.w).toVar();
      const top = v0.add(v1);
      const right = v1.add(v3);
      const bottom = v2.add(v3);
      const left = v0.add(v2);
      const tangent = right.sub(left).normalize();
      const bitangent = bottom.sub(top).normalize();
      const normal = cross(bitangent, tangent);
      const pos = v0.add(v1).add(v2).add(v3).mul(0.25);
      return pos.add(normal.mul(outlineThicknessU));
    })();
    return mat;
  }, [sim, outlineThicknessU]);

  useEffect(
    () => () => {
      outlineMaterial.dispose();
    },
    [outlineMaterial]
  );

  // Expose resetSim on the forwarded ref
  useImperativeHandle(
    ref,
    () => ({
      get mesh() {
        return meshRef.current;
      },
      get sim() {
        return sim;
      },
      resetSim() {
        sim.reset();
        simState.current.timeSinceLastStep = 0;
      },
    }),
    [sim]
  );

  const textureReady = Boolean(texture);
  const outerTextureReady = Boolean(outerTexture);
  const innerTextureReady = Boolean(innerTexture);
  const hasDiscreteTextureTargets = Boolean(
    (outerTextureUrl && outerTextureReady) ||
    (innerTextureUrl && innerTextureReady)
  );

  useEffect(() => {
    const buildTexturedColor = (tex) => {
      const wrap = textureTile
        ? THREE.RepeatWrapping
        : THREE.ClampToEdgeWrapping;
      tex.wrapS = wrap;
      tex.wrapT = wrap;
      tex.needsUpdate = true;

      // Build UV transform: scale + rotate around center
      const uvCentered = uv().sub(0.5);
      const worldProjected = vec2(positionWorld.x, positionWorld.z);
      const screenProjected = screenUV.sub(0.5);
      let sourceUv = uvCentered;

      if (textureProjection === 'world') {
        sourceUv = worldProjected;
      } else if (textureProjection === 'screen') {
        sourceUv = screenProjected;
      }

      const scaled = sourceUv.mul(texUniforms.scaleU);
      const c = cos(texUniforms.rotU);
      const s = sin(texUniforms.rotU);
      const rotated = vec2(
        scaled.x.mul(c).sub(scaled.y.mul(s)),
        scaled.x.mul(s).add(scaled.y.mul(c))
      );
      const transformedUv = rotated.add(0.5);

      // Alpha-composite: base color where transparent, texture where opaque.
      // Then blend texture amount and optionally restrict it to inner/outer side.
      const texNode = textureSample(tex, transformedUv);
      const alphaComposited = mix(
        texUniforms.baseColorU,
        texNode.rgb,
        texNode.a
      );
      const texturedColor = mix(
        texUniforms.baseColorU,
        alphaComposited,
        texUniforms.textureBlendU
      );

      return texturedColor;
    };

    let nextOuterTextureNode = null;
    let nextInnerTextureNode = null;

    if (hasDiscreteTextureTargets) {
      if (outerTextureUrl && outerTextureReady) {
        nextOuterTextureNode = buildTexturedColor(outerTexture);
      }
      if (innerTextureUrl && innerTextureReady) {
        nextInnerTextureNode = buildTexturedColor(innerTexture);
      }
    } else if (textureUrl && textureReady) {
      const legacyTexturedColor = buildTexturedColor(texture);

      if (textureSide === 'inner') {
        nextInnerTextureNode = legacyTexturedColor;
      } else if (textureSide === 'outer') {
        nextOuterTextureNode = legacyTexturedColor;
      } else {
        nextOuterTextureNode = legacyTexturedColor;
        nextInnerTextureNode = legacyTexturedColor;
      }
    }

    outerTextureNodeRef.current = nextOuterTextureNode;
    innerTextureNodeRef.current = nextInnerTextureNode;
    sim.material.map = null;
  }, [
    sim,
    textureUrl,
    texture,
    textureReady,
    outerTextureUrl,
    outerTexture,
    outerTextureReady,
    innerTextureUrl,
    innerTexture,
    innerTextureReady,
    hasDiscreteTextureTargets,
    texUniforms,
    textureSide,
    textureProjection,
    textureTile,
  ]);

  useEffect(() => {
    outlineMaterial.color.set(outlineColor);
    outlineMaterial.opacity = outlineOpacity;
    outlineThicknessU.value = outlineThickness;
  }, [
    outlineMaterial,
    outlineColor,
    outlineOpacity,
    outlineThickness,
    outlineThicknessU,
  ]);

  // Dual-color: back faces (exterior) use material color, front faces (interior)
  // use innerColor unless the texture mode is targeting that side. On a horizontal
  // cloth draped over a sphere, gl_FrontFacing is true for the interior surface,
  // so frontFacing=1 → inner side, frontFacing=0 → outer side.
  // Cutout rim darkening is applied only to the outer surface before the final
  // inner/outer split so the eye-hole edge stays readable.
  useEffect(() => {
    const baseOuterNode = texUniforms.baseColorU;
    const outerNode = outerTextureNodeRef.current || baseOuterNode;

    const innerBaseNode = innerColor ? texUniforms.innerColorU : baseOuterNode;
    const innerNode = innerTextureNodeRef.current || innerBaseNode;

    const rimmedOuter = mix(outerNode, sim.cutoutRimColorU, sim.cutoutRimNode);

    if (innerColor) texUniforms.innerColorU.value.set(innerColor);
    sim.material.colorNode = mix(rimmedOuter, innerNode, frontFacing);
    sim.material.needsUpdate = true;
  }, [
    sim,
    innerColor,
    textureUrl,
    texture,
    textureReady,
    outerTextureUrl,
    outerTexture,
    outerTextureReady,
    innerTextureUrl,
    innerTexture,
    innerTextureReady,
    textureSide,
    texUniforms,
  ]);

  // Emissive glow — radial falloff from emissiveCenter in UV space.
  // Inner/outer are selected by frontFacing, same rule as innerColor.
  useEffect(() => {
    if (outerEmissiveColor || innerEmissiveColor) {
      texUniforms.outerEmissiveColorU.value.set(outerEmissiveColor || '#000');
      texUniforms.outerEmissiveIntensityU.value = outerEmissiveColor
        ? outerEmissiveIntensity
        : 0;
      texUniforms.innerEmissiveColorU.value.set(innerEmissiveColor || '#000');
      texUniforms.innerEmissiveIntensityU.value = innerEmissiveColor
        ? innerEmissiveIntensity
        : 0;
      texUniforms.emissiveFalloffU.value = emissiveFalloff;
      texUniforms.emissiveCenterU.value.set(
        emissiveCenter[0],
        emissiveCenter[1]
      );

      let glowNode = null;
      if (emissiveFalloff > 0) {
        const dist = uv().sub(texUniforms.emissiveCenterU).length();
        glowNode = float(1.0)
          .sub(dist.mul(texUniforms.emissiveFalloffU))
          .clamp(0, 1)
          .pow(2);
      }

      const outerI = glowNode
        ? texUniforms.outerEmissiveIntensityU.mul(glowNode)
        : texUniforms.outerEmissiveIntensityU;
      const innerI = glowNode
        ? texUniforms.innerEmissiveIntensityU.mul(glowNode)
        : texUniforms.innerEmissiveIntensityU;

      const outerEmissive = texUniforms.outerEmissiveColorU.mul(outerI);
      const innerEmissive = texUniforms.innerEmissiveColorU.mul(innerI);

      sim.material.emissiveNode = mix(
        outerEmissive,
        innerEmissive,
        frontFacing
      );
    } else {
      sim.material.emissiveNode = null;
    }
    sim.material.needsUpdate = true;
    // emissiveCenter is an array — track elements individually to avoid
    // re-running on every render from a new array reference.
  }, [
    sim,
    outerEmissiveColor,
    outerEmissiveIntensity,
    innerEmissiveColor,
    innerEmissiveIntensity,
    emissiveFalloff,
    emissiveCenter,
    texUniforms,
  ]);

  // Set per-face roughness/metalness nodes synchronously before first render.
  // Using useMemo (not useEffect) so the nodes are established before the
  // shader compiles — avoids a recompile cycle that drops the computed normalNode.
  // Uniform values are pushed each frame in useFrame; node structure never changes.
  useMemo(() => {
    sim.material.roughnessNode = mix(
      texUniforms.outerRoughnessU,
      texUniforms.innerRoughnessU,
      frontFacing
    );
    sim.material.metalnessNode = mix(
      texUniforms.outerMetalnessU,
      texUniforms.innerMetalnessU,
      frontFacing
    );
  }, [sim, texUniforms]); // sim and texUniforms are both stable (empty deps useMemo)

  // Rebuild alpha mask when params change
  useEffect(() => {
    sim.rebuildAlpha({
      seed: alphaSeed,
      scale: alphaScale,
      edgeFade,
      holeAmount,
      tatterEdge,
      smoothEdges,
    });
  }, [
    sim,
    alphaSeed,
    alphaScale,
    edgeFade,
    holeAmount,
    tatterEdge,
    smoothEdges,
  ]);

  // Per-pixel cutouts — push to GPU uniforms (not per-vertex)
  useEffect(() => {
    sim.applyCutouts(cutouts);
  }, [sim, cutouts]);

  const timePerStep = 1 / stepsPerSecond;

  useFrame(({ gl, pointer, camera }, delta) => {
    const s = simState.current;

    // Push control values into GPU uniforms
    if (!windManaged) {
      sim.windU.value = wind;
      sim.windDirU.value.set(windDirX, 0, windDirZ).normalize();
    }
    sim.stiffnessU.value = stiffness;
    sim.dampeningU.value = dampening;
    sim.colliderRadiusU[0].value = cursorRadius;
    sim.maxVelocityU.value = maxVelocity;
    if (!gravityManaged) sim.gravityU.value = gravity;
    sim.collisionMarginU.value = collisionMargin;

    // Push scene-driven colliders into external slots after the cursor slot
    for (let c = 1; c < sim.NUM_COLLIDERS; c += 1) {
      const ext = colliders[c - 1];
      if (ext && ext.enabled !== false) {
        sim.colliderPosU[c].value.copy(ext.position);
        sim.colliderRadiusU[c].value = ext.radius;
        sim.colliderEnabledU[c].value = 1.0;
        // Sync debug wireframe sphere with live collider position
        const dbg = colliderSphereRefs.current[c - 1];
        if (dbg) dbg.position.copy(ext.position);
      } else {
        sim.colliderEnabledU[c].value = 0.0;
      }
    }

    // Push dynamic anchor positions
    for (let a = 0; a < sim.NUM_ANCHORS; a += 1) {
      const anch = anchors[a];
      if (anch?.position) {
        sim.anchorPosU[a].value.copy(anch.position);
      }
    }

    // Compute local-space gravity direction from the mesh's world rotation
    // so gravity always pulls "world-down" regardless of parent group rotation.
    if (meshRef.current) {
      meshRef.current.getWorldQuaternion(sharedWorldQuat);
      sharedGravityDir.set(0, -1, 0).applyQuaternion(sharedWorldQuat.invert());
      sim.gravityDirU.value.copy(sharedGravityDir);
    }

    // Push texture-compositing uniforms
    texUniforms.scaleU.value.set(1 / textureScaleX, 1 / textureScaleY);
    texUniforms.rotU.value = (textureRotation * Math.PI) / 180;
    texUniforms.textureBlendU.value = Math.max(0, Math.min(1, textureBlend));
    if (materialProps?.color) {
      texUniforms.baseColorU.value.set(materialProps.color);
    }
    const outerR = materialProps?.roughness ?? 0.8;
    texUniforms.outerRoughnessU.value = outerR;
    texUniforms.innerRoughnessU.value =
      innerRoughness !== null ? innerRoughness : outerR;
    const outerM = materialProps?.metalness ?? 0;
    texUniforms.outerMetalnessU.value = outerM;
    texUniforms.innerMetalnessU.value =
      innerMetalness !== null ? innerMetalness : outerM;

    // Apply dynamic material properties (cached keys avoid per-frame allocation)
    if (materialProps) {
      if (!materialKeysRef.current) {
        materialKeysRef.current = Object.keys(materialProps);
      }
      const keys = materialKeysRef.current;
      for (let k = 0; k < keys.length; k += 1) {
        const key = keys[k];
        const val = materialProps[key];
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
      }
    }

    // Cutout rim uniforms
    if (cutoutRimColor) {
      sim.cutoutRimColorU.value.set(cutoutRimColor);
    }
    sim.cutoutRimWidthU.value = cutoutRimWidth;
    sim.cutoutRimOffsetU.value = cutoutRimOffset;

    // Cursor → slot 0 collider interaction
    const pointerActive =
      pointer.x !== s.lastPointerX || pointer.y !== s.lastPointerY;
    if (
      pointerActive &&
      (pointer.x !== 0 || pointer.y !== 0) &&
      cursorCollider
    ) {
      camera.getWorldDirection(sharedCameraDir);
      const interactionPoint = meshRef.current
        ? meshRef.current.localToWorld(
            sharedInteractionCenterWorld.copy(interactionCenter)
          )
        : sharedInteractionCenterWorld.copy(interactionCenter);
      sharedPlane.setFromNormalAndCoplanarPoint(
        sharedCameraDir,
        interactionPoint
      );
      sharedRaycaster.setFromCamera(pointer, camera);
      if (sharedRaycaster.ray.intersectPlane(sharedPlane, sharedIntersect)) {
        // Convert world-space hit to cloth's local space for the GPU sim
        if (meshRef.current) {
          sharedWorldMatrix.copy(meshRef.current.matrixWorld).invert();
          sharedSphereLocal
            .copy(sharedIntersect)
            .applyMatrix4(sharedWorldMatrix);
          sim.colliderPosU[0].value.copy(sharedSphereLocal);
        } else {
          sim.colliderPosU[0].value.copy(sharedIntersect);
        }
        if (cursorSphereRef.current) {
          cursorSphereRef.current.position.copy(
            meshRef.current ? sharedSphereLocal : sharedIntersect
          );
        }
      }
      sim.colliderEnabledU[0].value = 1.0;
    } else if (!cursorCollider) {
      sim.colliderEnabledU[0].value = 0.0;
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

    // if (gl.backend?.trackTimestamp) {
    //   gl.resolveTimestampsAsync(THREE.TimestampQuery.COMPUTE);
    // }
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
      {outlineEnabled && (
        <mesh geometry={sim.geometry} frustumCulled={false} renderOrder={2}>
          <primitive attach="material" object={outlineMaterial} />
        </mesh>
      )}
      {debugColliders && cursorCollider && (
        <mesh ref={cursorSphereRef} frustumCulled={false}>
          <icosahedronGeometry args={[cursorRadius, 3]} />
          <meshBasicMaterial
            wireframe
            color={debugColor}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
      {debugColliders &&
        colliders.map((col, idx) => (
          <mesh
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            ref={(el) => {
              colliderSphereRefs.current[idx] = el;
            }}
            frustumCulled={false}
          >
            <icosahedronGeometry args={[col.radius, 3]} />
            <meshBasicMaterial
              wireframe
              color={debugColor}
              transparent
              opacity={0.4}
            />
          </mesh>
        ))}
    </group>
  );
});

export default ClothMesh;
