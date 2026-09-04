import { NodeAccess, storageTexture, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  createBlurPass,
  createInjectPass,
  createReactPass,
  createSeedPass,
  createShapePass,
} from './reactionCompute';

function createFieldTexture(width, height) {
  const texture = new THREE.StorageTexture(width, height);
  texture.type = THREE.FloatType;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function buildUniforms() {
  return {
    boundaryBounce: uniform(0),
    decayRate: uniform(0.002),
    expansionStrength: uniform(8),
    fieldContrast: uniform(10),
    injectStrength: uniform(1),
    noiseAmount: uniform(0.0025),
    paletteRefresh: uniform(0.008),
    reactionStrength: uniform(0.047),
    seedCenterX: uniform(0.5),
    seedCenterY: uniform(0.5),
    seedRadius: uniform(0.08),
    seedSalt: uniform(Math.random() * 1000),
    time: uniform(0),
  };
}

// The raw and blurred fields each ping-pong between two textures so a pass
// never reads and writes the same one in the same dispatch; the horizontal
// blur scratch texture doesn't need a pair, since it's fully written and then
// fully consumed within one frame, before the next frame's react pass runs
// (the same read-after-write-across-sequential-dispatches ordering the
// IFFT ocean compute in RowItAlone/WaterCycle already relies on).
// `gradientOffset` 4 + `expansionStrength` 8 reproduce the reference shader's
// `pixelSize*4` gradient taps and `pixelSize*8` advection scale one-for-one,
// now that the domain is indexed in texels rather than normalised UV.
export default function createReactionField({
  blurSpread = 1,
  gradientOffset = 4,
  height,
  width,
  wideSpread = 4,
}) {
  const rawTextures = [
    createFieldTexture(width, height),
    createFieldTexture(width, height),
  ];
  const blurredTextures = [
    createFieldTexture(width, height),
    createFieldTexture(width, height),
  ];
  const scratchTexture = createFieldTexture(width, height);
  const wideScratchTexture = createFieldTexture(width, height);
  // Fixed identity: rewritten every frame, never ping-ponged, so the grain
  // material can bind it once and never repoint itself.
  const outputTexture = createFieldTexture(width, height);

  const rawRead = rawTextures.map((tex) =>
    storageTexture(tex).setAccess(NodeAccess.READ_ONLY)
  );
  const rawWrite = rawTextures.map((tex) =>
    storageTexture(tex).setAccess(NodeAccess.WRITE_ONLY)
  );
  const blurredRead = blurredTextures.map((tex) =>
    storageTexture(tex).setAccess(NodeAccess.READ_ONLY)
  );
  const blurredWrite = blurredTextures.map((tex) =>
    storageTexture(tex).setAccess(NodeAccess.WRITE_ONLY)
  );
  const scratchRead = storageTexture(scratchTexture).setAccess(
    NodeAccess.READ_ONLY
  );
  const scratchWrite = storageTexture(scratchTexture).setAccess(
    NodeAccess.WRITE_ONLY
  );
  const wideScratchRead = storageTexture(wideScratchTexture).setAccess(
    NodeAccess.READ_ONLY
  );
  const wideScratchWrite = storageTexture(wideScratchTexture).setAccess(
    NodeAccess.WRITE_ONLY
  );
  const outputWrite = storageTexture(outputTexture).setAccess(
    NodeAccess.WRITE_ONLY
  );

  const uniforms = buildUniforms();

  // One kernel per ping-pong direction, both precompiled up front and chosen
  // at dispatch time by `phase` — the pattern three.js's own
  // webgpu_compute_texture_pingpong example uses.
  const reactPasses = [0, 1].map((from) =>
    createReactPass({
      blurredRead: blurredRead[from],
      gradientOffset,
      height,
      rawRead: rawRead[from],
      rawWrite: rawWrite[1 - from],
      uniforms,
      width,
    })
  );
  const blurHPasses = [0, 1].map((from) =>
    createBlurPass({
      axis: 'x',
      height,
      readTex: rawRead[1 - from],
      spread: blurSpread,
      width,
      writeTex: scratchWrite,
    })
  );
  const blurVPasses = [0, 1].map((from) =>
    createBlurPass({
      axis: 'y',
      height,
      readTex: scratchRead,
      spread: blurSpread,
      width,
      writeTex: blurredWrite[1 - from],
    })
  );
  const wideHPasses = [0, 1].map((from) =>
    createBlurPass({
      axis: 'x',
      height,
      readTex: blurredRead[1 - from],
      spread: wideSpread,
      width,
      writeTex: wideScratchWrite,
    })
  );
  const shapePasses = [0, 1].map((from) =>
    createShapePass({
      blurredRead: blurredRead[1 - from],
      height,
      outputWrite,
      spread: wideSpread,
      uniforms,
      wideRead: wideScratchRead,
      width,
    })
  );
  const seedPasses = [0, 1].map((from) =>
    createSeedPass({
      blurredWrite: blurredWrite[from],
      height,
      rawWrite: rawWrite[from],
      uniforms,
      width,
    })
  );
  const injectPasses = [0, 1].map((from) =>
    createInjectPass({
      blurredRead: blurredRead[from],
      blurredWrite: blurredWrite[1 - from],
      height,
      rawRead: rawRead[from],
      rawWrite: rawWrite[1 - from],
      uniforms,
      width,
    })
  );

  let phase = 0;

  return {
    dispose: () => {
      [
        ...rawTextures,
        ...blurredTextures,
        scratchTexture,
        wideScratchTexture,
        outputTexture,
      ].forEach((tex) => tex.dispose());
    },
    // Non-destructive: blends a soft blob into the running field and advances
    // the ping-pong, leaving everything outside the blob exactly as it was.
    // `strength` below 1 only moves the field part of the way toward the drop,
    // so calling this across successive frames eases one drop in.
    inject: (
      renderer,
      { centerX = 0.5, centerY = 0.5, radius, salt, strength = 1 } = {}
    ) => {
      uniforms.seedCenterX.value = centerX;
      uniforms.seedCenterY.value = centerY;
      if (radius !== undefined) uniforms.seedRadius.value = radius;
      uniforms.seedSalt.value = salt ?? Math.random() * 1000;
      uniforms.injectStrength.value = strength;
      renderer.compute(injectPasses[phase]);
      phase = 1 - phase;
    },
    outputTexture,
    // Writes the same seed pattern into both halves of every ping-pong pair,
    // so the field is consistent no matter which half `phase` picks next.
    reseed: (renderer, { centerX = 0.5, centerY = 0.5, radius, salt } = {}) => {
      uniforms.seedCenterX.value = centerX;
      uniforms.seedCenterY.value = centerY;
      if (radius !== undefined) uniforms.seedRadius.value = radius;
      uniforms.seedSalt.value = salt ?? Math.random() * 1000;
      renderer.compute(seedPasses[0]);
      renderer.compute(seedPasses[1]);
      phase = 0;
    },
    uniforms,
    update: (renderer, elapsedTime) => {
      uniforms.time.value = elapsedTime;
      const from = phase;
      renderer.compute(reactPasses[from]);
      renderer.compute(blurHPasses[from]);
      renderer.compute(blurVPasses[from]);
      renderer.compute(wideHPasses[from]);
      renderer.compute(shapePasses[from]);
      phase = 1 - from;
    },
  };
}
