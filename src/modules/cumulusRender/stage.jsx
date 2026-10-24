/* eslint-disable no-await-in-loop */
import React from 'react';

import { createRoot, extend } from '@react-three/fiber';

import * as THREE from 'three';

import { frameThought } from '@modules/cumulus';
import { aimCamera } from '@modules/renderStage';

import CumulusStage from './CumulusStage';
import { plotFrame } from './capture';

export default async function createCumulusStage({ canvas, options }) {
  extend(THREE);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: options.samples > 0,
    canvas,
    preserveDrawingBuffer: true,
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearAlpha(0);
  const root = createRoot(canvas);
  await root.configure({
    camera: { far: 100, fov: options.fov, near: 0.01, position: [0, 1, 8] },
    dpr: options.pixelRatio,
    frameloop: 'never',
    gl: renderer,
    shadows: options.shadows ? 'soft' : false,
    size: { height: options.height, left: 0, top: 0, width: options.width },
  });
  let disposed = false;
  let state;
  let clock = 0;
  let bounds;
  let view;
  let mounts = 0;
  let inks = {};
  let ready = false;
  const subjectRef = { current: null };
  const onReady = (value) => {
    state = value;
    ready = true;
  };
  const mount = (config) =>
    root.render(
      <CumulusStage
        key={mounts}
        config={config}
        onReady={onReady}
        subjectRef={subjectRef}
        transparent={options.transparent}
      />
    );
  const stage = {
    get camera() {
      return state?.camera;
    },
    get renderer() {
      return renderer;
    },
    get bounds() {
      return bounds;
    },
    get clock() {
      return clock;
    },
    async load(drawn) {
      mounts += 1;
      inks = {};
      ready = false;
      let failure = null;
      mount(drawn.config);
      const deadline = performance.now() + 60000;
      while (!ready) {
        if (disposed) throw new Error('Cumulus stage disposed');
        if (performance.now() > deadline)
          failure = new Error('Cumulus assets did not finish loading');
        if (failure) throw failure;
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
      }
      state.clock.elapsedTime = 0;
      state.clock.oldTime = 0;
      clock = 0;
      state.advance(0, true);
      const box = new THREE.Box3();
      const local = new THREE.Box3();
      const matrix = new THREE.Matrix4();
      const instance = new THREE.Matrix4();
      subjectRef.current.updateWorldMatrix(true, true);
      subjectRef.current.traverseVisible((node) => {
        if (!node.geometry?.attributes?.position) return;
        node.geometry.computeBoundingBox();
        if (node.isInstancedMesh) {
          for (let i = 0; i < node.count; i += 1) {
            node.getMatrixAt(i, instance);
            matrix.multiplyMatrices(node.matrixWorld, instance);
            box.union(
              local.copy(node.geometry.boundingBox).applyMatrix4(matrix)
            );
          }
        } else
          box.union(
            local.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld)
          );
      });
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const points = [];
      [box.min.x, box.max.x].forEach((x) =>
        [box.min.y, box.max.y].forEach((y) =>
          [box.min.z, box.max.z].forEach((z) => points.push([x, y, z]))
        )
      );
      bounds = {
        center: sphere.center.toArray(),
        radius: Math.max(sphere.radius, 1),
        points,
      };
      stage.aim(frameThought({ bounds, config: drawn.config, options }));
      stage.step(drawn.config.frameTime ?? 0);
      return bounds;
    },
    // A changed config on the mounted subject: no remount, reframe or clock
    // reset, so a live view keeps its camera and time.
    update(drawn) {
      inks = {};
      mount(drawn.config);
    },
    aim(next) {
      view = next;
      aimCamera(state.camera, next, options.width / options.height);
    },
    step(seconds) {
      const targetTime = Math.round(seconds * 60) / 60;
      if (targetTime < clock - 1e-6)
        throw new Error('Reload the generation before rewinding its clock');
      while (clock < targetTime - 1e-7) {
        clock = Math.round(clock * 60 + 1) / 60;
        state.advance(clock, true);
      }
      state.advance(clock, true);
    },
    draw(next = view, seconds = clock) {
      stage.aim(next);
      stage.step(seconds);
    },
    capture(next = view, seconds = clock) {
      stage.draw(next, seconds);
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const context = copy.getContext('2d');
      context.drawImage(canvas, 0, 0);
      return {
        data: context.getImageData(0, 0, copy.width, copy.height).data,
        height: copy.height,
        width: copy.width,
      };
    },
    svg(next = view, plotOptions = options) {
      stage.draw(next);
      return plotFrame({
        camera: state.camera,
        inks,
        options: plotOptions,
        renderer,
        scene: state.scene,
        subject: subjectRef.current,
        target: next.target,
      });
    },
    resize(width, height) {
      renderer.setSize(width, height, false);
    },
    dispose() {
      disposed = true;
      root.unmount();
      renderer.dispose();
    },
  };
  return stage;
}
