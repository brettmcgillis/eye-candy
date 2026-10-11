import { joinRoom, selfId } from 'trystero';

export default function createTrysteroTransport({
  appId,
  roomKey,
  turnConfig,
  onJoinError,
}) {
  const room = joinRoom(
    { appId, ...(turnConfig ? { turnConfig } : {}) },
    roomKey,
    onJoinError ? { onJoinError } : undefined
  );
  const channels = new Map();
  const joinFns = new Set();
  const leaveFns = new Set();

  room.onPeerJoin = (id) => joinFns.forEach((fn) => fn(id));
  room.onPeerLeave = (id) => leaveFns.forEach((fn) => fn(id));

  function channel(name) {
    if (!channels.has(name)) {
      const handlers = new Set();
      const action = room.makeAction(name);
      action.onMessage = (data, { peerId }) =>
        handlers.forEach((fn) => fn(data, peerId));
      channels.set(name, { action, handlers });
    }
    return channels.get(name);
  }

  return {
    selfId,
    getPeers: () => Object.keys(room.getPeers()),
    send(name, data, target) {
      channel(name)
        .action.send(data, target ? { target } : undefined)
        .catch(() => {});
    },
    on(name, fn) {
      const { handlers } = channel(name);
      handlers.add(fn);
      return () => handlers.delete(fn);
    },
    onPeerJoin(fn) {
      joinFns.add(fn);
      return () => joinFns.delete(fn);
    },
    onPeerLeave(fn) {
      leaveFns.add(fn);
      return () => leaveFns.delete(fn);
    },
    leave: () => room.leave(),
  };
}
