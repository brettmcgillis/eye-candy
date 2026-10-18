import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

import createCampfirePasses from '../../utils/campfire/createCampfirePasses';
import { fireLifeAt } from '../../utils/campfire/fireLighting';
import GhostFireLights from './GhostFireLights';

const CHANNEL_TEXTURES = {
  noise: textureFile('campfire/noise.jpg'),
  rock: textureFile('campfire/rock.jpg'),
};
const SKY_FACES = [0, 1, 2, 3, 4, 5].map((i) =>
  textureFile(`campfire/sky_${i}.png`)
);

useTexture.preload(Object.values(CHANNEL_TEXTURES));
useLoader.preload(THREE.CubeTextureLoader, [SKY_FACES]);

// Shadertoy's channel samplers: repeat, mipmapped, vflipped, linear (not sRGB).
function prepareChannel(map) {
  const channel = map;
  channel.wrapS = THREE.RepeatWrapping;
  channel.wrapT = THREE.RepeatWrapping;
  channel.colorSpace = THREE.NoColorSpace;
  channel.flipY = true;
  channel.needsUpdate = true;
}

// Renders the frame itself (useFrame priority 2); the Image pass applies the
// original's tonemap, so the renderer's is off while this is mounted.
function CampfireLocation({ config }) {
  const gl = useThree((state) => state.gl);
  const clock = useThree((state) => state.clock);
  const burnRef = useRef({
    burnSeconds: 80,
    hold: 1,
    mode: 'cycle',
    startTime: 0,
  });
  const { noise, rock } = useTexture(CHANNEL_TEXTURES);
  const [sky] = useLoader(THREE.CubeTextureLoader, [SKY_FACES]);

  const passes = useMemo(() => {
    prepareChannel(noise);
    prepareChannel(rock);
    const cube = sky;
    cube.colorSpace = THREE.NoColorSpace;
    cube.needsUpdate = true;
    return createCampfirePasses({ noise, rock, sky });
  }, [noise, rock, sky]);
  useEffect(() => () => passes.dispose(), [passes]);

  useEffect(() => {
    const previous = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    return () => {
      gl.toneMapping = previous;
    };
  }, [gl]);

  const fireOffset = useMemo(
    () =>
      new THREE.Vector3(
        config.campfirePosition.x,
        config.campfirePosition.y,
        config.campfirePosition.z
      ),
    [config.campfirePosition]
  );
  const ghostCentre = useMemo(
    () =>
      new THREE.Vector3(
        config.ghostPosition.x,
        config.ghostPosition.y - 0.35 * config.ghostScale,
        config.ghostPosition.z
      ),
    [config.ghostPosition, config.ghostScale]
  );

  useEffect(() => {
    burnRef.current.startTime = clock.elapsedTime;
  }, [clock, config.campfireBurnMode, config.campfireBurnSeconds]);

  useEffect(() => {
    const burn = burnRef.current;
    burn.mode = config.campfireBurnMode;
    burn.hold = config.campfireFireLife;
    burn.burnSeconds = config.campfireBurnSeconds;
  }, [
    config.campfireBurnMode,
    config.campfireBurnSeconds,
    config.campfireFireLife,
  ]);

  // Above 1: GhostCharacter's Outline renders the scene to the canvas at priority 1.
  useFrame((state, delta) => {
    passes.render({
      camera: state.camera,
      delta,
      fireLife: fireLifeAt({
        ...burnRef.current,
        time: state.clock.elapsedTime,
      }),
      fireOffset,
      renderer: state.gl,
      height: config.campfireResolution,
      scene: state.scene,
      time: state.clock.elapsedTime,
    });
  }, 2);

  return (
    <GhostFireLights
      burnRef={burnRef}
      fireOffset={fireOffset}
      ghostCentre={ghostCentre}
      strength={config.campfireGhostLight}
    />
  );
}

export default memo(CampfireLocation);
