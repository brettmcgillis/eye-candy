import * as THREE from 'three';
import {
  Fn,
  mix,
  texture as tslTexture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import React, { useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

import { textureFile, videoFile } from '../../../../utils/appUtils';

extend(THREE_WEBGPU);

// They Live-style commands. Black-on-transparent PNGs (already set in the Muro
// Slant "OBEY" face); we composite them as black text over a white field while
// the panel "glitches out", tiled down the tall ad rectangle.
export const THEY_LIVE_MESSAGES = [
  'obey.png',
  'consume.png',
  'buy.png',
  'conform.png',
  'submit.png',
  'stayAsleep.png',
].map((f) => textureFile(`theyLive/${f}`));

useTexture.preload(THEY_LIVE_MESSAGES);

// Default playlist (a single clip) — scenes pass their own `artSources`.
const DEFAULT_ART = [{ type: 'video', src: videoFile('watercolor.mp4') }];

const inUnitBox = (p) =>
  p.x
    .step(0.0)
    .mul(p.x.oneMinus().step(0.0))
    .mul(p.y.step(0.0))
    .mul(p.y.oneMinus().step(0.0));

function buildAdColorNode(uniforms, artTexture, glitchTexture) {
  return Fn(() => {
    // Each sign face uses a different atlas sub-rect; remap it to a consistent
    // 0..1 box, with optional per-face flips for mirrored UVs.
    const local = uv().sub(uniforms.uvOrigin).div(uniforms.uvSpan);
    const screenUv = vec2(
      mix(local.x, local.x.oneMinus(), uniforms.flipX),
      mix(local.y, local.y.oneMinus(), uniforms.flipY)
    );

    // --- Art (video or image): aspect-fit + centered, framed (not stretched). ---
    const artUv = screenUv
      .sub(0.5)
      .sub(uniforms.artOffset)
      .div(uniforms.artScale)
      .add(0.5);
    const art = tslTexture(artTexture, artUv).rgb;
    const showColor = mix(uniforms.artBg, art, inUnitBox(artUv));

    // --- They Live overlay: slogan tiled vertically, black text on white. ---
    const u = screenUv.x.sub(0.5).div(uniforms.textWidth).add(0.5);
    const vCell = screenUv.y.mul(uniforms.textTile).fract();
    const v = vCell.sub(0.5).div(uniforms.textHeight).add(0.5);
    const textUv = vec2(u, v);
    const textAlpha = tslTexture(glitchTexture, textUv).a.mul(
      inUnitBox(textUv)
    );
    const glitchColor = mix(vec3(1.0), vec3(0.0), textAlpha);

    return mix(showColor, glitchColor, uniforms.glitchMix);
  });
}

export default function CRTAdGlitchMaterial({
  // Playlist of art the panel cycles through: { type:'video'|'image', src }.
  artSources = DEFAULT_ART,
  // Where this face starts in the art/slogan cycle, so faces stay out of sync.
  startOffset = 0,
  // Art fit. `artScale` is a vec2 so a non-square panel can correct stretch and
  // shrink the clip into a centered, framed ad.
  artScale = { x: 0.8, y: 0.55 },
  artOffset = { x: 0, y: 0 },
  artBg = '#0a0a0a',
  // Atlas sub-rect of this face's UVs (from the geometry) + optional flips, so
  // every panel shares a consistent, centered 0..1 space.
  uvOrigin = { x: 0, y: 0 },
  uvSpan = { x: 1, y: 1 },
  flipX = false,
  flipY = false,
  // They Live overlay, tiled down the rectangle.
  textTile = 3,
  textWidth = 0.8,
  textHeight = 0.7,
  // How long each art clip shows (random in [min,max] s) and the glitch burst.
  artMinDur = 5,
  artMaxDur = 11,
  glitchDuration = 0.6,
  glitchStutter = 0.82,
  side = THREE.FrontSide,
}) {
  const messages = useTexture(THEY_LIVE_MESSAGES);

  // Load every still image in the playlist once (drei caches across faces).
  const imageSrcs = useMemo(
    () => artSources.filter((a) => a.type === 'image').map((a) => a.src),
    [artSources]
  );
  const loadedImages = useTexture(
    imageSrcs.length ? imageSrcs : [THEY_LIVE_MESSAGES[0]]
  );
  const imageMap = useMemo(() => {
    const map = new Map();
    if (imageSrcs.length) {
      imageSrcs.forEach((src, i) => {
        const tex = loadedImages[i];
        tex.colorSpace = THREE.SRGBColorSpace;
        map.set(src, tex);
      });
    }
    return map;
  }, [imageSrcs, loadedImages]);

  // One reusable <video> + VideoTexture; the playlist swaps its `src`.
  const videoElRef = useRef(null);
  const videoTexRef = useRef(null);
  const videoSrcRef = useRef(null);

  // Node whose `.value` we swap between the video texture and image textures.
  const artTextureNode = useMemo(
    () => new THREE_WEBGPU.TextureNode(new THREE.Texture()),
    []
  );
  const glitchTextureNode = useMemo(
    () => new THREE_WEBGPU.TextureNode(messages[0]),
    [messages]
  );

  const uniforms = useMemo(
    () => ({
      glitchMix: uniform(0),
      uvOrigin: uniform(new THREE.Vector2(uvOrigin.x, uvOrigin.y)),
      uvSpan: uniform(new THREE.Vector2(uvSpan.x, uvSpan.y)),
      flipX: uniform(flipX ? 1 : 0),
      flipY: uniform(flipY ? 1 : 0),
      artScale: uniform(new THREE.Vector2(artScale.x, artScale.y)),
      artOffset: uniform(new THREE.Vector2(artOffset.x, artOffset.y)),
      artBg: uniform(new THREE.Color(artBg)),
      textTile: uniform(textTile),
      textWidth: uniform(textWidth),
      textHeight: uniform(textHeight),
    }),
    []
  );

  useEffect(() => {
    uniforms.uvOrigin.value.set(uvOrigin.x, uvOrigin.y);
    uniforms.uvSpan.value.set(uvSpan.x, uvSpan.y);
    uniforms.flipX.value = flipX ? 1 : 0;
    uniforms.flipY.value = flipY ? 1 : 0;
    uniforms.artScale.value.set(artScale.x, artScale.y);
    uniforms.artOffset.value.set(artOffset.x, artOffset.y);
    uniforms.artBg.value.set(artBg);
    uniforms.textTile.value = textTile;
    uniforms.textWidth.value = textWidth;
    uniforms.textHeight.value = textHeight;
  }, [
    artBg,
    artOffset.x,
    artOffset.y,
    artScale.x,
    artScale.y,
    flipX,
    flipY,
    textHeight,
    textTile,
    textWidth,
    uniforms,
    uvOrigin.x,
    uvOrigin.y,
    uvSpan.x,
    uvSpan.y,
  ]);

  // Create the reusable video element + texture once.
  useEffect(() => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    videoElRef.current = video;
    videoTexRef.current = tex;

    return () => {
      video.pause();
      video.remove();
      tex.dispose();
      videoElRef.current = null;
      videoTexRef.current = null;
      videoSrcRef.current = null;
    };
  }, []);

  const material = useMemo(() => {
    const next = new THREE_WEBGPU.MeshBasicNodeMaterial({
      side,
      toneMapped: false,
    });
    next.colorNode = buildAdColorNode(
      uniforms,
      artTextureNode,
      glitchTextureNode
    )();
    return next;
  }, [artTextureNode, glitchTextureNode, side, uniforms]);

  // Point the art node at playlist item `i` (swapping the video src as needed).
  const showArt = (i) => {
    const item = artSources[i];
    if (!item) return;
    if (item.type === 'image') {
      videoElRef.current?.pause();
      const tex = imageMap.get(item.src);
      if (tex) artTextureNode.value = tex;
      return;
    }
    const video = videoElRef.current;
    if (!video || !videoTexRef.current) return;
    if (videoSrcRef.current !== item.src) {
      videoSrcRef.current = item.src;
      video.src = item.src;
    }
    video.play().catch(() => {});
    artTextureNode.value = videoTexRef.current;
  };

  // Cycle: art plays -> glitch to slogan -> next art -> next slogan -> ...
  const sched = useRef({
    started: false,
    phase: 'art',
    art: 0,
    slogan: 0,
    end: 0,
  }).current;

  const artDuration = () => artMinDur + Math.random() * (artMaxDur - artMinDur);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const artLen = artSources.length;
    if (!artLen || !videoTexRef.current) return;

    if (!sched.started) {
      sched.started = true;
      sched.art = startOffset % artLen;
      sched.slogan = startOffset % messages.length;
      sched.phase = 'art';
      sched.end = t + artDuration();
      showArt(sched.art);
      return;
    }

    if (sched.phase === 'glitch') {
      // Stutter between the command and a glimpse of the art beneath it.
      uniforms.glitchMix.value = Math.random() < glitchStutter ? 1 : 0;
    }

    if (t < sched.end) return;

    if (sched.phase === 'art') {
      // Glitch out to the current slogan.
      glitchTextureNode.value = messages[sched.slogan % messages.length];
      sched.phase = 'glitch';
      sched.end = t + glitchDuration;
    } else {
      // Resolve to the NEXT art + advance the slogan cursor for next time.
      uniforms.glitchMix.value = 0;
      sched.art = (sched.art + 1) % artLen;
      sched.slogan = (sched.slogan + 1) % messages.length;
      showArt(sched.art);
      sched.phase = 'art';
      sched.end = t + artDuration();
    }
  });

  return <primitive object={material} attach="material" />;
}
