import {
  Fn,
  If,
  billboarding,
  deltaTime,
  hash,
  instanceIndex,
  instancedArray,
  mix,
  positionGeometry,
  texture,
  time,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const MIN_DROP_COUNT = 1000;
const MAX_DROP_COUNT = 50000;

function clampDropCount(value) {
  return Math.max(
    MIN_DROP_COUNT,
    Math.min(MAX_DROP_COUNT, Math.floor(value || MIN_DROP_COUNT))
  );
}

export default function RainSystem({ config, waterRuntime }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const rainRef = useRef(null);

  useEffect(() => {
    if (!gl?.isWebGPURenderer) {
      return undefined;
    }

    const maxParticleCount = MAX_DROP_COUNT;

    const [firstCascade, secondCascade, thirdCascade] =
      waterRuntime?.cascades || [];
    const impactFoamRT = waterRuntime?.impactFoamRT;
    const impactFoamDecay = uniform(config?.rain?.impactFoamDecay ?? 0.08);

    if (!firstCascade || !secondCascade || !thirdCascade || !impactFoamRT) {
      return undefined;
    }

    const impactCamera = new THREE.OrthographicCamera(
      -50,
      50,
      50,
      -50,
      0.1,
      200
    );
    impactCamera.position.set(0, 100, 0);
    impactCamera.lookAt(0, 0, 0);
    const impactScene = new THREE.Scene();
    impactScene.background = new THREE.Color(0x000000);

    const decayGeometry = new THREE.PlaneGeometry(1, 1);
    decayGeometry.rotateX(-Math.PI / 2);
    const decayMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      depthTest: false,
      depthWrite: false,
      opacity: impactFoamDecay.value,
      transparent: true,
    });
    const decayPlane = new THREE.Mesh(decayGeometry, decayMaterial);
    decayPlane.scale.set(
      config?.rain?.boundsWidth ?? 100,
      config?.rain?.boundsDepth ?? 100,
      1
    );
    decayPlane.renderOrder = 0;
    impactScene.add(decayPlane);

    const boundsWidth = uniform(config?.rain?.boundsWidth ?? 100);
    const boundsDepth = uniform(config?.rain?.boundsDepth ?? 100);
    const ceiling = uniform(config?.rain?.ceiling ?? 35);
    const spawnRange = uniform(config?.rain?.spawnRange ?? 20);
    const speed = uniform(config?.rain?.speed ?? 20);
    const streakLength = uniform(config?.rain?.streakLength ?? 1.6);
    const impactLifetime = uniform(config?.rain?.impactLifetime ?? 1.4);
    const impactSize = uniform(config?.rain?.impactSize ?? 2.8);
    const impactBrightness = uniform(config?.rain?.impactBrightness ?? 1);
    const firstWaveLength = uniform(waterRuntime.waveLengths?.[0] ?? 250);
    const secondWaveLength = uniform(waterRuntime.waveLengths?.[1] ?? 17);
    const thirdWaveLength = uniform(waterRuntime.waveLengths?.[2] ?? 5);
    const firstDisplacement = firstCascade.displacement;
    const secondDisplacement = secondCascade.displacement;
    const thirdDisplacement = thirdCascade.displacement;

    const positionBuffer = instancedArray(maxParticleCount, 'vec3');
    const velocityBuffer = instancedArray(maxParticleCount, 'vec3');
    const ripplePositionBuffer = instancedArray(maxParticleCount, 'vec3');
    const rippleTimeBuffer = instancedArray(maxParticleCount, 'vec3');

    const randUint = () => uint(Math.random() * 0xffffff);

    const computeInit = Fn(() => {
      const position = positionBuffer.element(instanceIndex);
      const velocity = velocityBuffer.element(instanceIndex);
      const rippleTime = rippleTimeBuffer.element(instanceIndex);

      const randX = hash(instanceIndex);
      const randY = hash(instanceIndex.add(randUint()));
      const randVelocity = hash(instanceIndex.add(randUint()));
      const randZ = hash(instanceIndex.add(randUint()));

      position.x = randX.mul(boundsWidth).add(boundsWidth.mul(-0.5));
      position.y = randY.mul(ceiling.add(spawnRange));
      position.z = randZ.mul(boundsDepth).add(boundsDepth.mul(-0.5));

      velocity.y = randVelocity.mul(speed.mul(-0.45)).add(speed.mul(-0.55));
      rippleTime.x = 1000;
    })().compute(maxParticleCount);

    const computeUpdate = Fn(() => {
      const sampleSurfaceY = (positionXZ) => {
        const first = texture(
          firstDisplacement,
          positionXZ.div(firstWaveLength)
        );
        const second = texture(
          secondDisplacement,
          positionXZ.div(secondWaveLength)
        );
        const third = texture(
          thirdDisplacement,
          positionXZ.div(thirdWaveLength)
        );

        return first.y.add(second.y).add(third.y);
      };

      const position = positionBuffer.element(instanceIndex);
      const velocity = velocityBuffer.element(instanceIndex);
      const ripplePosition = ripplePositionBuffer.element(instanceIndex);
      const rippleTime = rippleTimeBuffer.element(instanceIndex);

      position.addAssign(velocity.mul(deltaTime));

      rippleTime.x = rippleTime.x.add(deltaTime.div(impactLifetime.max(0.001)));

      const floorPosition = sampleSurfaceY(position.xz).add(0.03);
      const streakHalfLength = streakLength.mul(0.5);
      const contactPadding = 0.03;
      const streakBottomY = position.y.sub(streakHalfLength);

      If(streakBottomY.lessThan(floorPosition.add(contactPadding)), () => {
        ripplePosition.x = position.x;
        ripplePosition.z = position.z;
        ripplePosition.y = floorPosition;
        rippleTime.x = 0.0001;

        position.y = ceiling.add(hash(instanceIndex.add(time)).mul(spawnRange));
        position.x = hash(instanceIndex.add(time.add(randUint())))
          .mul(boundsWidth)
          .add(boundsWidth.mul(-0.5));
        position.z = hash(
          instanceIndex.add(time.add(randUint()).add(randUint()))
        )
          .mul(boundsDepth)
          .add(boundsDepth.mul(-0.5));
      });
    });

    const computeParticles = computeUpdate()
      .compute(maxParticleCount)
      .setName('WaterCycleRainParticles');

    const rainMaterial = new THREE.MeshBasicNodeMaterial();
    rainMaterial.colorNode = uv()
      .x.sub(0.5)
      .abs()
      .mul(-22)
      .exp()
      .mul(uv().y.mul(-6).exp())
      .mul(uv().y.oneMinus().mul(2.4).saturate());
    rainMaterial.vertexNode = billboarding({
      position: positionBuffer.toAttribute(),
    });
    rainMaterial.opacity = config?.rain?.opacity ?? 0.45;
    rainMaterial.side = THREE.DoubleSide;
    rainMaterial.forceSinglePass = true;
    rainMaterial.depthWrite = false;
    rainMaterial.depthTest = true;
    rainMaterial.transparent = true;

    const rainParticles = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      rainMaterial
    );
    rainParticles.scale.set(
      config?.rain?.streakWidth ?? 0.06,
      config?.rain?.streakLength ?? 1.6,
      1
    );
    rainParticles.count = clampDropCount(config?.rain?.dropCount);
    rainParticles.frustumCulled = false;
    scene.add(rainParticles);

    const rippleTimeNode = rippleTimeBuffer.element(instanceIndex).x;
    const ripplePositionAttribute = ripplePositionBuffer.toAttribute();
    const sampleSurfaceYNode = (positionXZ) => {
      const first = texture(firstDisplacement, positionXZ.div(firstWaveLength));
      const second = texture(
        secondDisplacement,
        positionXZ.div(secondWaveLength)
      );
      const third = texture(thirdDisplacement, positionXZ.div(thirdWaveLength));

      return first.y.add(second.y).add(third.y);
    };

    const rippleSurfacePositionNode = Fn(() => {
      const sampleXZ = ripplePositionAttribute.xz.add(positionGeometry.xz);
      return vec3(
        sampleXZ.x,
        sampleSurfaceYNode(sampleXZ).add(0.02),
        sampleXZ.y
      );
    });

    const impactFoamSplat = Fn(() => {
      const centerDistance = uv().add(vec2(-0.5)).length();
      const progress = rippleTimeNode.saturate();

      const ringRadius = progress.mul(0.5);
      const ringThickness = mix(0.015, 0.09, progress);
      const ringDistance = centerDistance.sub(ringRadius).div(ringThickness);
      const ring = ringDistance.mul(ringDistance).mul(-1).exp();
      const ringFade = progress.oneMinus().pow(1.6);

      const splashCore = centerDistance
        .mul(centerDistance)
        .mul(-40)
        .exp()
        .mul(progress.oneMinus().pow(6));

      return ring.mul(ringFade).add(splashCore).mul(impactBrightness);
    });

    const impactMaterial = new THREE.MeshBasicNodeMaterial();
    impactMaterial.colorNode = impactFoamSplat();
    impactMaterial.positionNode = rippleSurfacePositionNode();
    impactMaterial.opacity = 1;
    impactMaterial.side = THREE.DoubleSide;
    impactMaterial.forceSinglePass = true;
    impactMaterial.depthWrite = false;
    impactMaterial.depthTest = false;
    impactMaterial.transparent = true;
    impactMaterial.blending = THREE.AdditiveBlending;

    const impactGeometry = new THREE.PlaneGeometry(1, 1);
    impactGeometry.rotateX(-Math.PI / 2);

    const impactParticles = new THREE.Mesh(impactGeometry, impactMaterial);
    impactParticles.scale.set(impactSize.value, impactSize.value, 1);
    impactParticles.count = clampDropCount(config?.rain?.dropCount);
    impactParticles.frustumCulled = false;
    impactParticles.renderOrder = 1;
    impactScene.add(impactParticles);

    const initRenderTarget = gl.getRenderTarget?.() || null;
    gl.setRenderTarget(impactFoamRT);
    gl.clear(true, true, true);
    gl.setRenderTarget(initRenderTarget);

    gl.compute(computeInit);

    rainRef.current = {
      boundsDepth,
      boundsWidth,
      ceiling,
      computeParticles,
      impactBrightness,
      impactCamera,
      impactFoamDecay,
      impactFoamRT,
      impactParticles,
      impactScene,
      impactLifetime,
      impactSize,
      decayGeometry,
      decayMaterial,
      decayPlane,
      impactGeometry,
      impactMaterial,
      rainMaterial,
      rainParticles,
      speed,
      streakLength,
      spawnRange,
      firstWaveLength,
      secondWaveLength,
      thirdWaveLength,
    };

    return () => {
      rainRef.current = null;

      scene.remove(rainParticles);
      rainParticles.geometry.dispose();
      rainMaterial.dispose();
      impactScene.remove(decayPlane);
      impactScene.remove(impactParticles);
      decayGeometry.dispose();
      decayMaterial.dispose();
      impactGeometry.dispose();
      impactMaterial.dispose();
    };
  }, [gl, scene, waterRuntime]);

  useFrame(() => {
    const runtime = rainRef.current;
    if (!runtime) {
      return;
    }

    runtime.boundsWidth.value = config?.rain?.boundsWidth ?? 100;
    runtime.boundsDepth.value = config?.rain?.boundsDepth ?? 100;
    runtime.ceiling.value = config?.rain?.ceiling ?? 35;
    runtime.spawnRange.value = config?.rain?.spawnRange ?? 20;
    runtime.speed.value = config?.rain?.speed ?? 20;
    runtime.streakLength.value = config?.rain?.streakLength ?? 1.6;
    runtime.impactLifetime.value = config?.rain?.impactLifetime ?? 1.4;
    runtime.impactSize.value = config?.rain?.impactSize ?? 2.8;
    runtime.impactBrightness.value = config?.rain?.impactBrightness ?? 1;
    runtime.impactFoamDecay.value = config?.rain?.impactFoamDecay ?? 0.08;
    runtime.firstWaveLength.value = waterRuntime.waveLengths?.[0] ?? 250;
    runtime.secondWaveLength.value = waterRuntime.waveLengths?.[1] ?? 17;
    runtime.thirdWaveLength.value = waterRuntime.waveLengths?.[2] ?? 5;
    const rainEnabled = config?.rain?.enabled !== false;

    runtime.rainParticles.count = clampDropCount(config?.rain?.dropCount);
    runtime.impactParticles.count = runtime.rainParticles.count;
    runtime.rainMaterial.opacity = config?.rain?.opacity ?? 0.45;
    runtime.rainParticles.visible = rainEnabled;
    runtime.impactParticles.visible = rainEnabled;

    const nextStreakWidth = config?.rain?.streakWidth ?? 0.06;
    const nextStreakLength = config?.rain?.streakLength ?? 1.6;
    runtime.rainParticles.scale.set(nextStreakWidth, nextStreakLength, 1);

    const nextImpactSize = config?.rain?.impactSize ?? 2.8;
    runtime.impactParticles.scale.set(nextImpactSize, nextImpactSize, 1);
    runtime.decayPlane.scale.set(
      runtime.boundsWidth.value,
      runtime.boundsDepth.value,
      1
    );
    runtime.decayMaterial.opacity = runtime.impactFoamDecay.value;

    runtime.impactCamera.left = -runtime.boundsWidth.value * 0.5;
    runtime.impactCamera.right = runtime.boundsWidth.value * 0.5;
    runtime.impactCamera.top = runtime.boundsDepth.value * 0.5;
    runtime.impactCamera.bottom = -runtime.boundsDepth.value * 0.5;
    runtime.impactCamera.updateProjectionMatrix();

    if (rainEnabled) {
      gl.compute(runtime.computeParticles);
    }

    const previousRenderTarget = gl.getRenderTarget?.() || null;
    gl.setRenderTarget(runtime.impactFoamRT);
    gl.render(runtime.impactScene, runtime.impactCamera);
    gl.setRenderTarget(previousRenderTarget);
  });

  return null;
}
