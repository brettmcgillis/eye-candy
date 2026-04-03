import { CanvasTexture } from 'three';

export function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Fully randomised phases — each cloud gets independent values every session.
export function buildPhases() {
  const rnd = () => Math.random() * Math.PI * 2;
  return {
    temperature: rnd(),
    equilibrium: rnd(),
    coherence: rnd(),
    freeEnergy: rnd(),
    scaleDepth: rnd(),
    boundRadius: rnd(),
    viscosity: rnd(),
    mass: rnd(),
    maxSpeed: rnd(),
    halfLife: rnd(),
    // Orbit frequency multipliers (0.3–1.7)
    orbitX: 0.3 + Math.random() * 1.4,
    orbitY: 0.3 + Math.random() * 1.4,
    orbitZ: 0.3 + Math.random() * 1.4,
  };
}

// All params oscillate independently — nothing is static.
export function evolveParams(t, phases) {
  return {
    temperature: 1.0 + 0.7 * Math.sin(t * 0.007 + phases.temperature),
    equilibrium: 1.3 + 0.6 * Math.sin(t * 0.0045 + phases.equilibrium),
    coherence: 1.2 + 0.5 * Math.sin(t * 0.006 + phases.coherence),
    scaleDepth: 0.35 + 0.2 * Math.sin(t * 0.009 + phases.scaleDepth),
    freeEnergy: 1.4 + 0.7 * Math.sin(t * 0.0055 + phases.freeEnergy),
    boundRadius: 5.5 + 2.0 * Math.sin(t * 0.003 + phases.boundRadius),
    viscosity: 0.015 + 0.012 * Math.sin(t * 0.011 + phases.viscosity),
    mass: 1.0 + 0.4 * Math.sin(t * 0.008 + phases.mass),
    maxSpeed: 4.0 + 2.0 * Math.sin(t * 0.006 + phases.maxSpeed),
    halfLife: 0.979 + 0.009 * Math.sin(t * 0.013 + phases.halfLife),
  };
}
