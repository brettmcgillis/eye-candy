import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import createRoom from './createRoom';

const EMPTY_SNAPSHOT = {
  epoch: 0,
  hostId: null,
  isHost: false,
  meta: null,
  peers: [],
  selfId: null,
};
const noopSubscribe = () => () => {};

export default function useRoom({
  createTransport,
  getConfig,
  priority = 0,
  roomKey,
  rules,
}) {
  const [room, setRoom] = useState(null);
  const createTransportRef = useRef(createTransport);
  const getConfigRef = useRef(getConfig);
  createTransportRef.current = createTransport;
  getConfigRef.current = getConfig;

  useEffect(() => {
    if (!roomKey) return undefined;
    const next = createRoom({
      getConfig: () => getConfigRef.current?.() ?? {},
      priority,
      rules,
      transport: createTransportRef.current(roomKey),
    });
    setRoom(next);
    return () => {
      next.leave();
      setRoom(null);
    };
  }, [priority, roomKey, rules]);

  const snapshot = useSyncExternalStore(
    room ? room.subscribe : noopSubscribe,
    () => room?.getSnapshot() ?? EMPTY_SNAPSHOT
  );

  return { room, ...snapshot };
}
