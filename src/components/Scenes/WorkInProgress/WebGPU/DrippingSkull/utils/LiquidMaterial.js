import {
  cameraPosition,
  clamp,
  cos,
  dot,
  float,
  normalWorld,
  normalize,
  positionWorld,
  pow,
  reflect,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const TAU = Math.PI * 2;

// Creates the shared iridescent liquid material used on both sphere and skull MC meshes.
// Uniforms are exposed via mat.liquidUniforms for per-frame updates from config.
export default function createLiquidMaterial() {
  const paletteA = uniform(new THREE.Color(0.35, 0.3, 0.4));
  const paletteB = uniform(new THREE.Color(0.25, 0.1, 0.1));
  const paletteBrightness = uniform(3.0);
  const paletteSpeed = uniform(0.2);

  // IQ palette: a + b * cos(2π * freq + time * speed + worldY * spatial)
  // positionWorld.y creates a vertical color gradient that shifts as drips fall
  const phase = time.mul(paletteSpeed).add(positionWorld.y.mul(1.5));
  const tint = paletteA
    .add(paletteB.mul(cos(vec3(1, 0.3, 6).mul(TAU).add(phase))))
    .mul(paletteBrightness);

  // Fresnel rim glow — bright at silhouette edges
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const NdotV = clamp(dot(normalWorld, viewDir), 0, 1);
  const fresnel = pow(float(1).sub(NdotV), 3);

  // Reflected highlight — purple tint from above
  const reflected = reflect(viewDir.negate(), normalWorld);
  const topLight = pow(
    clamp(
      dot(reflected, vec3(0, 1, 0))
        .mul(0.4)
        .add(0.5),
      0,
      1
    ),
    1.5
  );

  const emissive = vec3(0.7, 0.2, 0.7)
    .mul(topLight)
    .add(vec3(0.4, 0.08, 0.08).mul(fresnel));

  const mat = new THREE.MeshStandardNodeMaterial({
    colorNode: tint,
    emissiveNode: emissive,
    metalness: 0.8,
    roughness: 0.2,
  });

  mat.liquidUniforms = { paletteA, paletteB, paletteBrightness, paletteSpeed };
  return mat;
}
