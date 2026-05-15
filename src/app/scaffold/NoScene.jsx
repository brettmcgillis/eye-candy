import { TextureLoader } from 'three';

import React, { useEffect, useMemo, useState } from 'react';

import { Html } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';

import { imageFile } from '../../utils/appUtils';

const NO_SCENE_IMAGE_FILES = [
  'reversal.png',
  'bret.png',
  'turbo_flex.png',
  'squares.png',
];
const NO_SCENE_IMAGE_FRAME_SIZE = 520;
const NO_SCENE_MAX_DIMENSION = 360;
const NO_SCENE_MIN_FRAME_SIZE = 180;
const NO_SCENE_MIN_IMAGE_SIZE = 120;
const NO_SCENE_VIEWPORT_FRAME_RATIO = 0.62;
const NO_SCENE_VIEWPORT_IMAGE_RATIO = 0.48;

function getResponsiveSize() {
  if (typeof window === 'undefined') {
    return {
      frameSize: NO_SCENE_IMAGE_FRAME_SIZE,
      maxImageDimension: NO_SCENE_MAX_DIMENSION,
    };
  }

  const minViewportDimension = Math.min(window.innerWidth, window.innerHeight);
  return {
    frameSize: Math.min(
      NO_SCENE_IMAGE_FRAME_SIZE,
      Math.max(
        NO_SCENE_MIN_FRAME_SIZE,
        Math.floor(minViewportDimension * NO_SCENE_VIEWPORT_FRAME_RATIO)
      )
    ),
    maxImageDimension: Math.min(
      NO_SCENE_MAX_DIMENSION,
      Math.max(
        NO_SCENE_MIN_IMAGE_SIZE,
        Math.floor(minViewportDimension * NO_SCENE_VIEWPORT_IMAGE_RATIO)
      )
    ),
  };
}

function pickRandom(list, previous) {
  if (!list.length) return null;
  if (list.length === 1) return list[0];

  let next = previous;
  while (next?.src === previous?.src) {
    next = list[Math.floor(Math.random() * list.length)];
  }

  return next;
}

export default function NoScene() {
  const [currentImage, setCurrentImage] = useState(null);
  const [responsiveSize, setResponsiveSize] = useState(getResponsiveSize);

  const imageSources = useMemo(
    () =>
      [...new Set(NO_SCENE_IMAGE_FILES)].map((fileName) => imageFile(fileName)),
    []
  );
  const imageTextures = useLoader(TextureLoader, imageSources);
  const availableImages = useMemo(
    () =>
      imageTextures
        .map((texture, index) => ({
          src: imageSources[index],
          width: texture.image?.naturalWidth ?? texture.image?.width ?? 0,
          height: texture.image?.naturalHeight ?? texture.image?.height ?? 0,
        }))
        .filter((image) => image.width > 0 && image.height > 0),
    [imageSources, imageTextures]
  );
  const currentImageMaxDimension = Math.max(
    currentImage?.width ?? 0,
    currentImage?.height ?? 0
  );
  const imageScale =
    currentImageMaxDimension > 0
      ? Math.min(1, responsiveSize.maxImageDimension / currentImageMaxDimension)
      : 1;

  useEffect(() => {
    const handleResize = () => {
      setResponsiveSize(getResponsiveSize());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!availableImages.length) return undefined;

    setCurrentImage((previous) => pickRandom(availableImages, previous));

    return undefined;
  }, [availableImages]);

  if (!availableImages.length || !currentImage) {
    return null;
  }

  return (
    <>
      <color attach="background" args={['#fff']} />
      <Html center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: responsiveSize.frameSize,
            height: responsiveSize.frameSize,
            pointerEvents: 'none',
          }}
        >
          <img
            src={currentImage.src}
            alt=""
            aria-hidden="true"
            style={{
              width: currentImage.width,
              height: currentImage.height,
              transform: `scale(${imageScale})`,
              transformOrigin: 'center center',
              objectFit: 'contain',
              opacity: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </div>
      </Html>
    </>
  );
}
