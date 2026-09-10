import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const BORDER_OPTIONS = ['None', 'Box', 'Circle'];

export const indexOf = (options, value) => Math.max(0, options.indexOf(value));

// One flat bag, mirroring the flat Leva schema. Everything the walk reads is a
// uniform so a control edit never rebuilds the pipeline — only resolution and
// the line ceiling do.
export default function createUniforms() {
  return {
    axisAngle: uniform(Math.PI / 2),
    axisCell: uniform(40),
    axisWander: uniform(1.4),
    axisWeight: uniform(0.5),
    border: uniform(1),
    borderMargin: uniform(0.05),
    borderWidth: uniform(1.5),
    // Texels a line keeps between itself and anything already drawn, its own
    // earlier passes included. This is the gap you see between the rings of a
    // spiral and between the runs of a switchback.
    clearance: uniform(4),
    curlEvolve: uniform(0.04),
    curlScale: uniform(1),
    curlWeight: uniform(0.35),
    emitInward: uniform(0),
    // What it costs to point away from where the fields want to go, against
    // what it costs to turn at all. Straight wins until straight is taken.
    flowCost: uniform(0.6),
    lifeSteps: uniform(4000),
    lineWidth: uniform(0.7),
    reactionWeight: uniform(0.35),
    shape: uniform(0),
    shapeOffsetX: uniform(0),
    shapeOffsetY: uniform(0),
    shapeRotation: uniform(0),
    shapeSize: uniform(0.3),
    spawnSalt: uniform(0),
    stagger: uniform(400),
    stepLength: uniform(3),
    time: uniform(0),
    turnCost: uniform(2.5),
    wobble: uniform(0.15),
  };
}

// The compose material's own uniforms. Split from the walk's because nothing
// here changes what gets drawn, only how the finished page reads.
export function createInkUniforms() {
  return {
    groundColor: uniform(new THREE.Color('#07060a')),
    lineColor: uniform(new THREE.Color('#e8e3d5')),
    lineSoftness: uniform(0.08),
    lineThreshold: uniform(0.25),
    paletteMix: uniform(1),
    paletteShift: uniform(0),
  };
}
