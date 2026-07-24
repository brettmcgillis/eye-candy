import * as THREE from 'three/webgpu';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import SplashFluidRenderer from './SplashFluidRenderer';
import SplashFluidSimulator from './SplashFluidSimulator';
import {
  OPEN_SIDE_ORDER,
  buildSplashStaticConfig,
  createBreakImpulse,
  getContainBounds,
  getOpenSides,
  writeSimulationMatrix,
} from './splashConfig';

const MIN_VISIBLE_WATER_LEVEL = 0.0001;

const sharedBreakLocalPoint = new THREE.Vector3();
const sharedDrawBufferSize = new THREE.Vector2();
const sharedSimulationMatrix = new THREE.Matrix4();
const sharedSimulationDomainCenter = new THREE.Vector3();
const sharedWorldScale = new THREE.Vector3();
const WATER_DEPTH_EXCLUDED_SURFACE_TYPES = new Set([
  'tank-pane',
  'tank-pane-fragment',
]);

function createBreakState() {
  return Object.fromEntries(OPEN_SIDE_ORDER.map((paneKey) => [paneKey, 0]));
}

function getFluidColor(tank) {
  const color = new THREE.Color(tank.waterColor).offsetHSL(0, 0.02, -0.06);

  return [color.r, color.g, color.b];
}

function disposeAfterQueueIdle(device, disposable) {
  if (!disposable) {
    return;
  }

  if (!device?.queue?.onSubmittedWorkDone) {
    disposable.dispose();
    return;
  }

  device.queue
    .onSubmittedWorkDone()
    .catch(() => {
      // Dispose anyway if the queue promise rejects during teardown/device loss.
    })
    .then(() => {
      disposable.dispose();
    });
}

function createSceneDepthMaterial() {
  const material = new THREE.MeshBasicNodeMaterial({
    fog: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  material.colorWrite = false;

  return material;
}

function shouldExcludeFromSceneDepth(object) {
  if (!object?.isMesh || object.visible === false) {
    return false;
  }

  if (object.userData?.excludeFromWaterDepthOcclusion) {
    return true;
  }

  return WATER_DEPTH_EXCLUDED_SURFACE_TYPES.has(object.userData?.surfaceType);
}

function createSceneDepthTarget(width, height) {
  const depthTexture = new THREE.DepthTexture(width, height, THREE.FloatType);

  depthTexture.name = 'fish-tank-splash-scene-depth';
  depthTexture.magFilter = THREE.NearestFilter;
  depthTexture.minFilter = THREE.NearestFilter;

  return new THREE.RenderTarget(width, height, {
    colorSpace: THREE.NoColorSpace,
    depthBuffer: true,
    depthTexture,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    samples: 0,
    stencilBuffer: false,
  });
}

function renderSceneDepth({ camera, gl, material, scene, target }) {
  const activeScene = scene;
  const hiddenMeshes = [];
  const renderer = gl;
  const savedOverrideMaterial = activeScene.overrideMaterial;
  const savedRenderTarget = renderer.getRenderTarget?.() ?? null;

  activeScene.traverse((child) => {
    if (!shouldExcludeFromSceneDepth(child)) {
      return;
    }

    const excludedMesh = child;

    hiddenMeshes.push(excludedMesh);
    excludedMesh.visible = false;
  });

  try {
    renderer.setRenderTarget(target);
    activeScene.overrideMaterial = material;
    renderer.clear(true, true, false);
    renderer.render(activeScene, camera);
  } finally {
    hiddenMeshes.forEach((mesh) => {
      const restoredMesh = mesh;

      restoredMesh.visible = true;
    });
    activeScene.overrideMaterial = savedOverrideMaterial;
    renderer.setRenderTarget(savedRenderTarget);
  }
}

export default function TankWaterSplash({
  runtime,
  showWaterBounds = false,
  tank,
}) {
  const breakIdsRef = useRef(createBreakState());
  const groupRef = useRef(null);
  const impulseRef = useRef(null);
  const renderSignatureRef = useRef('');
  const rendererRef = useRef(null);
  const sceneDepthMaterialRef = useRef(null);
  const sceneDepthTargetRef = useRef(null);
  const simulatorRef = useRef(null);
  const simulatorSignatureRef = useRef('');
  const staticConfig = useMemo(
    () => buildSplashStaticConfig(tank),
    [
      tank.depth,
      tank.glassThickness,
      tank.height,
      tank.splashParticleBudget,
      tank.waterInset,
      tank.waterLevel,
      tank.width,
    ]
  );
  const fluidColor = useMemo(() => getFluidColor(tank), [tank.waterColor]);
  const simulationDomainBounds = useMemo(() => {
    const [domainMinX, domainMinY, domainMinZ] = staticConfig.domainMinLocal;
    const [domainSizeX, domainSizeY, domainSizeZ] = staticConfig.domainSize;
    const size = [
      domainSizeX * staticConfig.cellSize,
      domainSizeY * staticConfig.cellSize,
      domainSizeZ * staticConfig.cellSize,
    ];

    sharedSimulationDomainCenter.set(
      domainMinX + size[0] * 0.5,
      domainMinY + size[1] * 0.5,
      domainMinZ + size[2] * 0.5
    );

    return {
      position: sharedSimulationDomainCenter.toArray(),
      size,
    };
  }, [staticConfig]);
  const simulationSettings = useMemo(
    () => ({
      dynamicViscosity: tank.splashViscosity,
      gravity: tank.splashGravity,
      restDensity: tank.splashRestDensity,
      stiffness: tank.splashStiffness,
      wallStiffness: tank.splashWallStiffness,
    }),
    [
      tank.splashGravity,
      tank.splashRestDensity,
      tank.splashStiffness,
      tank.splashViscosity,
      tank.splashWallStiffness,
    ]
  );

  useEffect(
    () => () => {
      const renderer = rendererRef.current;
      const sceneDepthMaterial = sceneDepthMaterialRef.current;
      const sceneDepthTarget = sceneDepthTargetRef.current;
      const simulator = simulatorRef.current;
      const device = renderer?.device ?? simulator?.device;

      renderSignatureRef.current = '';
      simulatorSignatureRef.current = '';
      rendererRef.current = null;
      sceneDepthMaterialRef.current = null;
      sceneDepthTargetRef.current = null;
      simulatorRef.current = null;

      disposeAfterQueueIdle(device, renderer);
      sceneDepthMaterial?.dispose?.();
      sceneDepthTarget?.dispose?.();
      disposeAfterQueueIdle(device, simulator);
    },
    []
  );

  useFrame((state, delta) => {
    const { camera, gl, scene } = state;

    const backend = gl?.backend;
    const device = backend?.device;
    const context = backend?.context;
    const group = groupRef.current;
    const activeWaterLevel = runtime
      ? runtime.getWaterLevel()
      : tank.waterLevel;
    const hasBrokenPane = runtime?.isAnyPaneBroken?.() ?? false;
    const containmentWaterLevel = runtime?.isAnyPaneBroken?.()
      ? tank.waterLevel
      : activeWaterLevel;

    if (
      !device ||
      !context ||
      !group ||
      (!hasBrokenPane && activeWaterLevel <= MIN_VISIBLE_WATER_LEVEL)
    ) {
      return;
    }

    const simulatorSignature = [
      staticConfig.signature,
      runtime?.getResetNonce?.() ?? 0,
      simulationSettings.dynamicViscosity,
      simulationSettings.gravity,
      simulationSettings.restDensity,
      simulationSettings.stiffness,
      simulationSettings.wallStiffness,
    ].join(':');

    if (simulatorSignature !== simulatorSignatureRef.current) {
      disposeAfterQueueIdle(device, rendererRef.current);
      disposeAfterQueueIdle(device, simulatorRef.current);
      simulatorRef.current = new SplashFluidSimulator({
        config: staticConfig,
        device,
        simulationSettings,
      });
      breakIdsRef.current = createBreakState();
      impulseRef.current = null;
      renderSignatureRef.current = '';
      simulatorSignatureRef.current = simulatorSignature;
    }

    const simulator = simulatorRef.current;

    if (!simulator) {
      renderSignatureRef.current = '';
      return;
    }

    gl.getDrawingBufferSize(sharedDrawBufferSize);
    const width = Math.max(1, Math.round(sharedDrawBufferSize.x));
    const height = Math.max(1, Math.round(sharedDrawBufferSize.y));
    let sceneDepthMaterial = sceneDepthMaterialRef.current;
    let sceneDepthTarget = sceneDepthTargetRef.current;

    if (!sceneDepthMaterial) {
      sceneDepthMaterial = createSceneDepthMaterial();
      sceneDepthMaterialRef.current = sceneDepthMaterial;
    }

    if (!sceneDepthTarget) {
      sceneDepthTarget = createSceneDepthTarget(width, height);
      sceneDepthTargetRef.current = sceneDepthTarget;
    } else if (
      sceneDepthTarget.width !== width ||
      sceneDepthTarget.height !== height
    ) {
      sceneDepthTarget.setSize(width, height);
    }

    renderSceneDepth({
      camera,
      gl,
      material: sceneDepthMaterial,
      scene,
      target: sceneDepthTarget,
    });
    gl.render(scene, camera);

    const sceneDepthTexture = backend?.get?.(
      sceneDepthTarget.depthTexture
    )?.texture;

    if (!sceneDepthTexture) {
      renderSignatureRef.current = '';
      return;
    }

    const renderSignature = `${width}x${height}:${simulatorSignature}`;

    group.getWorldScale(sharedWorldScale);

    if (
      !rendererRef.current ||
      renderSignature !== renderSignatureRef.current
    ) {
      disposeAfterQueueIdle(device, rendererRef.current);
      rendererRef.current = new SplashFluidRenderer({
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        height,
        fovRadians: THREE.MathUtils.degToRad(camera.fov),
        particleDiameter:
          staticConfig.particleDiameterWorld * sharedWorldScale.x,
        posvelBuffer: simulator.posvelBuffer,
        sceneDepthTexture,
        width,
      });
      renderSignatureRef.current = renderSignature;
    }

    const containBounds = getContainBounds(
      staticConfig,
      tank,
      containmentWaterLevel
    );

    OPEN_SIDE_ORDER.forEach((paneKey) => {
      const breakEvent = runtime?.getPaneBreakEvent?.(paneKey);
      const breakId = breakEvent?.id ?? 0;

      if (breakId <= breakIdsRef.current[paneKey] || !breakEvent?.worldPoint) {
        return;
      }

      breakIdsRef.current[paneKey] = breakId;
      sharedBreakLocalPoint.fromArray(breakEvent.worldPoint);
      group.worldToLocal(sharedBreakLocalPoint);
      impulseRef.current = createBreakImpulse(
        staticConfig,
        tank,
        paneKey,
        sharedBreakLocalPoint,
        containBounds
      );
    });

    const simulationRunning = tank.splashRunning !== false;

    if (impulseRef.current && simulationRunning) {
      impulseRef.current.remaining = Math.max(
        0,
        impulseRef.current.remaining - delta
      );

      if (impulseRef.current.remaining <= 0) {
        impulseRef.current = null;
      }
    }

    const openSides = getOpenSides(runtime);
    const impulse = impulseRef.current
      ? {
          center: impulseRef.current.center,
          direction: impulseRef.current.direction,
          radius: impulseRef.current.radius,
          strength:
            impulseRef.current.strength *
            (impulseRef.current.remaining / impulseRef.current.duration),
        }
      : null;
    if (simulationRunning) {
      const clampedDelta = Math.min(
        delta * tank.splashSimSpeed,
        tank.splashMaxDelta
      );

      simulator.update({
        containMax: containBounds.containMax,
        containMin: containBounds.containMin,
        delta: clampedDelta,
        impulse,
        openSides,
        spillFloor: containBounds.spillFloor,
      });
    }

    rendererRef.current.update({
      camera,
      density: tank.splashColorDensity,
      fluidColor,
      modelMatrix: writeSimulationMatrix(
        sharedSimulationMatrix,
        group,
        staticConfig
      ),
      sphereSize: staticConfig.particleDiameterWorld * sharedWorldScale.x,
    });

    const commandEncoder = device.createCommandEncoder({
      label: 'fish-tank-splash-frame',
    });
    const currentTexture = context.getCurrentTexture();

    rendererRef.current.copyBackground(commandEncoder, currentTexture);
    if (simulationRunning) {
      simulator.step(commandEncoder);
    }
    rendererRef.current.render(
      commandEncoder,
      currentTexture.createView(),
      simulator.particleCount,
      { showParticles: tank.splashShowParticles === true }
    );
    device.queue.submit([commandEncoder.finish()]);
  }, 1);

  return (
    <group ref={groupRef}>
      {showWaterBounds && (
        <mesh position={simulationDomainBounds.position}>
          <boxGeometry args={simulationDomainBounds.size} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}
