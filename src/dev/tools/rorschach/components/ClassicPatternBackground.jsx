import React, { useEffect, useRef } from 'react';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  applyPatternSettings,
  createPatternUniforms,
  patternColorNode,
} from '@modules/rorschach';

// The dev page's backdrop is the kernel's pattern field, drawn directly. It was
// a hand-maintained GLSL copy of the same shader, which is precisely how the
// page and the ink layer drifted apart: the same slider names meant different
// fields. There is one field now, in patternField.js, and this renders it.

export default function ClassicPatternBackground({ settings }) {
  const canvasRef = useRef(null);
  const settingsRef = useRef(settings);
  const uniformsRef = useRef(null);
  const seedRef = useRef(Math.random() * 200 - 100);

  useEffect(() => {
    settingsRef.current = settings;
    if (uniformsRef.current) {
      applyPatternSettings(uniformsRef.current, {
        ...settings,
        seed: seedRef.current,
      });
    }
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    let disposed = false;
    let renderer = null;
    let animationFrame = 0;

    const uniforms = createPatternUniforms({
      ...settingsRef.current,
      seed: seedRef.current,
    });
    uniformsRef.current = uniforms;

    const inkColor = new THREE.Color(settingsRef.current.inkColor);
    // A uniform node, not a bare Vector3: `vec3()` of a plain vector bakes the
    // colour into the graph as a constant and the Ink swatch stops doing
    // anything.
    const inkUniform = uniform(
      new THREE.Vector3(inkColor.r, inkColor.g, inkColor.b)
    );
    const background = new THREE.Color();

    const material = new THREE.NodeMaterial();
    material.colorNode = patternColorNode(uniforms, inkUniform);
    material.transparent = true;
    material.depthTest = false;
    material.depthWrite = false;
    const quad = new THREE.QuadMesh(material);

    async function start() {
      renderer = new THREE.WebGPURenderer({ alpha: true, canvas });
      await renderer.init();
      if (disposed) {
        renderer.dispose();
        return;
      }

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );
      let elapsed = 0;
      let lastFrame = performance.now();

      const draw = (now) => {
        const { current } = settingsRef;
        const pixelRatio = current.highDpi ? window.devicePixelRatio : 1;
        const width = Math.max(1, Math.floor(canvas.clientWidth));
        const height = Math.max(1, Math.floor(canvas.clientHeight));

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);

        const delta = Math.min((now - lastFrame) / 1000, 0.1);
        lastFrame = now;
        if (!reducedMotion.matches && !document.hidden) {
          elapsed += delta * current.speed;
        }
        uniforms.patternTime.value = elapsed;

        inkColor.set(current.inkColor);
        inkUniform.value.set(inkColor.r, inkColor.g, inkColor.b);
        background.set(current.backgroundColor);
        renderer.setClearColor(background, 1);

        quad.render(renderer);
        animationFrame = requestAnimationFrame(draw);
      };

      draw(performance.now());
    }

    start().catch((error) => {
      canvas.dataset.webgpuError = error.message;
    });

    return () => {
      disposed = true;
      uniformsRef.current = null;
      cancelAnimationFrame(animationFrame);
      material.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="rw-pattern-background"
      ref={canvasRef}
    />
  );
}
