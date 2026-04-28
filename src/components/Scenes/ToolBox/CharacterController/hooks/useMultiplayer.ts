/* eslint-disable no-underscore-dangle */
import PartySocket from 'partysocket';
import * as THREE from 'three';

import { useEffect, useRef, useState } from 'react';

import { useGame } from '../../../../../modules/ecctrl/Ecctrl';

declare const __PARTY_HOST__: string;

export interface CharacterStateData {
  position: { x: number; y: number; z: number };
  rotation: number;
  velocity: { x: number; z: number };
  jumping: boolean;
  sprinting: boolean;
  model: string;
  color: string;
  curAnimation?: string;
  name?: string;
}

export interface RemotePlayer extends CharacterStateData {
  id: string;
  interpolatedPosition?: { x: number; y: number; z: number };
}

interface UseMultiplayerProps {
  roomId: string;
  ecctrlRef: React.RefObject<any>;
  playerId: string;
  playerColor: string;
  playerModel?: string;
  enabled?: boolean;
}

interface ServerMessage {
  type: string;
  playerId?: string;
  data?: unknown;
  timestamp?: number;
  players?: Array<{ id: string; connId: string }>;
}

export interface RemoteShot {
  id: string;
  position: number[];
  direction: number[];
}

export function useMultiplayer({
  roomId,
  ecctrlRef,
  playerId,
  playerColor,
  playerModel = 'Capsule',
  enabled = true,
}: UseMultiplayerProps) {
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [remoteShots, setRemoteShots] = useState<RemoteShot[]>([]);
  const socketRef = useRef<PartySocket | null>(null);
  const lastSyncRef = useRef<number>(0);
  const playerModelRef = useRef(playerModel);
  playerModelRef.current = playerModel;
  const stateHistoryRef = useRef<
    Map<string, Array<CharacterStateData & { timestamp: number }>>
  >(new Map());
  const SYNC_INTERVAL = 100; // ms between state broadcasts

  useEffect(() => {
    if (!enabled || !playerId) return;

    const host = __PARTY_HOST__ || `${window.location.hostname}:1999`;
    // Must use wss:// on HTTPS pages — browsers block ws:// as mixed content.
    // In dev the Vite proxy converts wss://host:3000/parties/* → ws://localhost:1999/parties/*.
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    const socket = new PartySocket({
      host,
      room: roomId,
      protocol,
    } as any);

    socket.addEventListener('open', () => {
      console.log('Connected to room:', roomId);
    });

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.type) {
          case 'player-joined':
            console.log('Player joined:', message.playerId);
            break;

          case 'player-left':
            setRemotePlayers((prev) =>
              prev.filter((p) => p.id !== message.playerId)
            );
            stateHistoryRef.current.delete(message.playerId!);
            break;

          case 'existing-players':
            console.log('Existing players:', message.players?.length);
            break;

          case 'player-state': {
            const remotePlayerId = message.playerId;
            if (remotePlayerId === playerId) return;

            const stateData = message.data as CharacterStateData;
            const timestamp = message.timestamp || Date.now();

            // Store state history for interpolation
            if (!stateHistoryRef.current.has(remotePlayerId!)) {
              stateHistoryRef.current.set(remotePlayerId!, []);
            }
            const history = stateHistoryRef.current.get(remotePlayerId!)!;
            history.push({ ...stateData, timestamp });

            // Keep only last 3 states for interpolation
            if (history.length > 3) {
              history.shift();
            }

            // Update remote player
            setRemotePlayers((prev) => {
              const existing = prev.findIndex((p) => p.id === remotePlayerId);
              const newPlayer = interpolatePlayer(
                remotePlayerId!,
                stateData,
                history
              );

              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = newPlayer;
                return updated;
              }
              return [...prev, newPlayer];
            });
            break;
          }

          case 'shot-fired': {
            const d = message.data as {
              position: number[];
              direction: number[];
            };
            const shot: RemoteShot = {
              id: `${message.playerId}-${message.timestamp}`,
              position: d.position,
              direction: d.direction,
            };
            setRemoteShots((prev) => [...prev, shot]);
            setTimeout(
              () =>
                setRemoteShots((prev) => prev.filter((s) => s.id !== shot.id)),
              8000
            );
            break;
          }

          case 'chat':
            console.log(`[${message.playerId}]: ${message.data}`);
            break;

          default:
            console.log(`Received ${message.type} from ${message.playerId}`);
        }
      } catch (err) {
        // Ignore non-JSON messages (e.g., PartyKit protocol messages)
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [roomId, playerId, enabled]);

  // Broadcast local player state at intervals
  useEffect(() => {
    if (!socketRef.current || !enabled || !playerId) return;

    const broadcast = () => {
      const now = Date.now();
      if (now - lastSyncRef.current < SYNC_INTERVAL) return;

      lastSyncRef.current = now;

      const group = ecctrlRef?.current?.group;
      if (!group) return;

      const worldPos = new THREE.Vector3();
      group.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      group.getWorldQuaternion(worldQuat);
      const worldEuler = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ');

      socketRef.current!.send(
        JSON.stringify({
          type: 'player-state',
          playerId,
          data: {
            position: {
              x: worldPos.x,
              y: worldPos.y,
              z: worldPos.z,
            },
            rotation: worldEuler.y,
            velocity: { x: 0, z: 0 },
            jumping: false,
            sprinting: false,
            model: playerModelRef.current,
            color: playerColor,
            curAnimation: useGame.getState().curAnimation,
          },
        })
      );
    };

    const interval = setInterval(broadcast, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [ecctrlRef, playerId, playerColor, enabled]);

  const sendShot = (position: number[], direction: number[]) => {
    if (!socketRef.current) return;
    socketRef.current.send(
      JSON.stringify({
        type: 'shot-fired',
        playerId,
        data: { position, direction },
      })
    );
  };

  return {
    remotePlayers,
    remoteShots,
    sendShot,
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
  };
}

function interpolatePlayer(
  playerId: string,
  currentState: CharacterStateData,
  history: Array<CharacterStateData & { timestamp: number }>
): RemotePlayer {
  if (history.length < 2) {
    return {
      id: playerId,
      ...currentState,
      interpolatedPosition: currentState.position,
    };
  }

  const now = Date.now();
  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  const timeDiff = current.timestamp - previous.timestamp;
  const timeElapsed = now - previous.timestamp;
  const alpha = Math.min(1, timeElapsed / timeDiff);

  const interpolatedPosition = {
    x: previous.position.x + (current.position.x - previous.position.x) * alpha,
    y: previous.position.y + (current.position.y - previous.position.y) * alpha,
    z: previous.position.z + (current.position.z - previous.position.z) * alpha,
  };

  return {
    id: playerId,
    ...currentState,
    interpolatedPosition,
  };
}
