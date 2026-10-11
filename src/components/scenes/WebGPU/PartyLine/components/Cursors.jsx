/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { Color } from 'three';

import { INK_COLORS, isInkIndex, playerHex } from '../utils/palette';
import { QUANT } from '../utils/quantize';
import Pencil, { setPencilFlipped } from './Pencil';

const STALE_MS = 6000;
const EASE = 0.35;
const Z = 20;
const INK = INK_COLORS.map(({ hex }) => new Color(hex));

function placePencil(group, rect, u, v, down, ink, erasing) {
  const [x, y] = rect.toWorld(u, v);
  group.position.set(x, y, Z);
  const shadow = group.getObjectByName('shadow');
  if (shadow) shadow.position.set(down ? 2 : 6, down ? -2 : -6, 0);
  const tip = group.getObjectByName('tip');
  if (tip) tip.material.color.copy(INK[ink]);
  if (group.userData.erasing !== erasing) {
    group.userData.erasing = erasing;
    setPencilFlipped(group, erasing);
  }
}

function Cursors({
  localCursorRef,
  localErasing = false,
  localInk,
  players,
  rectRef,
  room,
  scale,
  selfId,
}) {
  const remoteRef = useRef(new Map());
  const groupsRef = useRef(new Map());
  const playersRef = useRef(players);
  playersRef.current = players;

  useEffect(() => {
    if (!room) return undefined;
    const remote = remoteRef.current;
    return room.subscribeCursor((pid, data) => {
      if (!data) {
        remote.delete(pid);
        return;
      }
      const next = {
        at: performance.now(),
        down: data[2],
        erasing: data[4] === 1,
        ink: isInkIndex(data[3]) ? data[3] : null,
        u: data[0] / QUANT,
        v: data[1] / QUANT,
      };
      const entry = remote.get(pid);
      if (entry) Object.assign(entry, next);
      else remote.set(pid, { ...next, du: next.u, dv: next.v });
    });
  }, [room]);

  useFrame(() => {
    const rect = rectRef.current;
    const now = performance.now();
    groupsRef.current.forEach((group, pid) => {
      const penInk = playersRef.current?.[pid]?.color ?? 0;
      if (pid === selfId) {
        const local = localCursorRef.current;
        group.visible = local.visible;
        if (!local.visible) return;
        const ink = isInkIndex(localInk) ? localInk : penInk;
        placePencil(
          group,
          rect,
          local.u,
          local.v,
          local.down,
          ink,
          localErasing
        );
        return;
      }
      const entry = remoteRef.current.get(pid);
      const live = entry && now - entry.at < STALE_MS;
      group.visible = Boolean(live);
      if (!live) return;
      entry.du += (entry.u - entry.du) * EASE;
      entry.dv += (entry.v - entry.dv) * EASE;
      const ink = entry.ink ?? penInk;
      placePencil(
        group,
        rect,
        entry.du,
        entry.dv,
        entry.down,
        ink,
        entry.erasing
      );
    });
  });

  const bind = (pid) => (group) => {
    if (group) groupsRef.current.set(pid, group);
    else groupsRef.current.delete(pid);
  };

  return Object.entries(players ?? {}).map(([pid, player]) => (
    <Pencil
      avatar={player.avatar}
      color={playerHex(player.color)}
      key={pid}
      label={player.name}
      ref={bind(pid)}
      scale={scale}
    />
  ));
}

export default memo(Cursors);
