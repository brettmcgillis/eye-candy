const GRACE_MS = 2500;
const TICK_MS = 50;
const HEARTBEAT_MS = 3000;
const SNAP_RETRY_MS = 2000;
const HELLO = '@hello';

function outranks(a, b) {
  if (a.priority !== b.priority) return a.priority > b.priority;
  if (a.bornAt !== b.bornAt) return a.bornAt < b.bornAt;
  return a.id < b.id;
}

export default function createRoom({
  transport,
  rules,
  getConfig = () => ({}),
  now = () => Date.now(),
  graceMs = GRACE_MS,
  tickMs = TICK_MS,
  priority = 0,
}) {
  const { selfId } = transport;
  const peers = new Set(transport.getPeers());
  const listeners = { change: new Set(), ops: new Set(), cursor: new Set() };
  const queued = [];
  const offs = [];

  let hostId = null;
  let hostBornAt = 0;
  let hostPriority = 0;
  let members = [];
  let meta = null;
  let metaJson = '';
  let publicMeta = null;
  let epoch = 0;
  let log = [];
  let pending = [];
  let pendingReset = false;
  let clockOffset = 0;
  let profile = null;
  let snapRequestedAt = 0;
  let lastBeatAt = 0;
  let ticker = null;
  let graceTimer = null;
  let snapshot = null;

  const isHost = () => hostId === selfId;

  function emitChange() {
    snapshot = {
      epoch,
      hostId,
      isHost: isHost(),
      meta: publicMeta,
      peers: [...peers],
      selfId,
    };
    listeners.change.forEach((fn) => fn(snapshot));
  }

  function emitOps(reset, ops) {
    listeners.ops.forEach((fn) => fn({ epoch, ops, reset }));
  }

  function adoptMeta(next) {
    meta = next;
    metaJson = JSON.stringify(next);
    publicMeta = JSON.parse(metaJson);
  }

  function makeCtx() {
    return {
      clear() {
        epoch += 1;
        log = [];
        pending = [];
        pendingReset = true;
      },
      config: getConfig(),
      emit: (op) => pending.push(op),
      getLog: () => log.concat(pending),
      members: [selfId, ...peers],
      meta,
      now: now(),
      selfId,
    };
  }

  function metaMessage(beat = false) {
    return {
      beat,
      bornAt: hostBornAt,
      epoch,
      hostNow: now(),
      members,
      meta: publicMeta,
      priority: hostPriority,
      seq: log.length,
    };
  }

  function addMember(id, memberPriority) {
    if (members.some((member) => member.id === id)) return false;
    members = [...members, { id, priority: memberPriority }];
    return true;
  }

  function removeMember(id) {
    const before = members.length;
    members = members.filter((member) => member.id !== id);
    return members.length !== before;
  }

  function flush() {
    const json = JSON.stringify(meta);
    const metaChanged = json !== metaJson;
    if (metaChanged) {
      metaJson = json;
      publicMeta = JSON.parse(json);
      transport.send('meta', metaMessage());
    }
    if (pendingReset || pending.length) {
      const ops = pending;
      const reset = pendingReset;
      const seq0 = log.length;
      pending = [];
      pendingReset = false;
      ops.forEach((op) => log.push(op));
      transport.send('ops', { epoch, ops, seq0 });
      if (metaChanged) emitChange();
      emitOps(reset, ops);
      return;
    }
    if (metaChanged) emitChange();
  }

  function handleAction(ctx, action, from) {
    if (action?.type === HELLO) rules.onJoin?.(ctx, from, action.profile);
    else rules.onAction?.(ctx, action, from);
  }

  function hostRun(fn) {
    fn(makeCtx());
    flush();
  }

  function hostTick() {
    hostRun((ctx) => rules.onTick?.(ctx));
    if (now() - lastBeatAt < HEARTBEAT_MS) return;
    lastBeatAt = now();
    transport.send('meta', metaMessage(true));
  }

  function sendSnap(target) {
    transport.send('snap', { ...metaMessage(), epoch, log }, target);
  }

  function stopHosting() {
    clearInterval(ticker);
    ticker = null;
  }

  function becomeHost(previousHost) {
    hostId = selfId;
    hostPriority = priority;
    if (previousHost) removeMember(previousHost);
    addMember(selfId, priority);
    if (!meta) {
      hostBornAt = now();
      meta = {};
      rules.init?.(makeCtx());
    }
    clockOffset = 0;
    hostRun((ctx) => {
      if (previousHost) rules.onLeave?.(ctx, previousHost);
      if (profile) rules.onJoin?.(ctx, selfId, profile);
    });
    transport.send('meta', metaMessage());
    lastBeatAt = now();
    ticker = setInterval(hostTick, tickMs);
    queued.splice(0).forEach((action) => {
      hostRun((ctx) => handleAction(ctx, action, selfId));
    });
    emitChange();
  }

  function requestSnap() {
    if (!hostId || isHost()) return;
    if (snapRequestedAt && now() - snapRequestedAt < SNAP_RETRY_MS) return;
    snapRequestedAt = now();
    transport.send('need', null, hostId);
  }

  function adoptHost(id, bornAt) {
    hostId = id;
    hostBornAt = bornAt;
    snapRequestedAt = 0;
    requestSnap();
    transport.send('hi', { priority }, id);
    if (profile) transport.send('act', { profile, type: HELLO }, id);
    queued.splice(0).forEach((action) => transport.send('act', action, id));
  }

  function onMeta(message, from) {
    const { beat, bornAt, epoch: e, hostNow, meta: next, seq } = message;
    const claim = { bornAt, id: from, priority: message.priority ?? 0 };
    if (isHost()) {
      if (!outranks(claim, { bornAt: hostBornAt, id: selfId, priority })) {
        transport.send('meta', metaMessage(), from);
        return;
      }
      stopHosting();
      hostId = null;
    } else if (
      hostId &&
      hostId !== from &&
      peers.has(hostId) &&
      outranks(
        { bornAt: hostBornAt, id: hostId, priority: hostPriority },
        claim
      )
    ) {
      return;
    }
    hostPriority = claim.priority;
    members = message.members ?? members;
    clockOffset = hostNow - now();
    adoptMeta(next);
    if (hostId !== from) adoptHost(from, bornAt);
    else if (beat && (e !== epoch || seq !== log.length)) requestSnap();
    emitChange();
  }

  function onSnap(message, from) {
    const { bornAt, epoch: e, hostNow, log: l, meta: next } = message;
    if (from !== hostId) return;
    snapRequestedAt = 0;
    hostBornAt = bornAt;
    members = message.members ?? members;
    clockOffset = hostNow - now();
    adoptMeta(next);
    epoch = e;
    log = l;
    emitChange();
    emitOps(true, log);
    if (priority > hostPriority) becomeHost(null);
  }

  function onOps({ epoch: e, ops, seq0 }, from) {
    if (from !== hostId || isHost()) return;
    let reset = false;
    if (e !== epoch) {
      if (seq0 !== 0) {
        requestSnap();
        return;
      }
      epoch = e;
      log = [];
      reset = true;
    }
    if (!reset && seq0 + ops.length <= log.length) return;
    if (seq0 !== log.length) {
      requestSnap();
      return;
    }
    ops.forEach((op) => log.push(op));
    if (reset) emitChange();
    emitOps(reset, ops);
  }

  function electFrom(previousHost) {
    const present = members
      .filter(({ id }) => id !== previousHost)
      .filter(({ id }) => id === selfId || peers.has(id));
    const next = present.length
      ? present.reduce((best, member) =>
          member.priority > best.priority ? member : best
        ).id
      : [selfId, ...peers].sort()[0];
    if (next === selfId) becomeHost(previousHost);
    else emitChange();
  }

  function onPeerLeave(id) {
    peers.delete(id);
    if (isHost()) {
      hostRun((ctx) => rules.onLeave?.(ctx, id));
      if (removeMember(id)) transport.send('meta', metaMessage());
    } else if (id === hostId) {
      hostId = null;
      electFrom(id);
      return;
    }
    emitChange();
  }

  function onPeerJoin(id) {
    peers.add(id);
    if (isHost()) transport.send('meta', metaMessage(), id);
    emitChange();
  }

  offs.push(
    transport.on('meta', onMeta),
    transport.on('snap', onSnap),
    transport.on('ops', onOps),
    transport.on('act', (action, from) => {
      if (isHost()) hostRun((ctx) => handleAction(ctx, action, from));
    }),
    transport.on('need', (_, from) => {
      if (isHost()) sendSnap(from);
    }),
    transport.on('hi', (data, from) => {
      if (isHost() && addMember(from, data?.priority ?? 0))
        transport.send('meta', metaMessage());
    }),
    transport.on('cur', (data, from) =>
      listeners.cursor.forEach((fn) => fn(from, data))
    ),
    transport.onPeerJoin(onPeerJoin),
    transport.onPeerLeave(onPeerLeave)
  );

  graceTimer = setTimeout(() => {
    if (!hostId) electFrom(null);
  }, graceMs);

  emitChange();

  const subscribe = (set) => (fn) => {
    set.add(fn);
    return () => set.delete(fn);
  };

  function dispatch(action) {
    if (isHost()) hostRun((ctx) => handleAction(ctx, action, selfId));
    else if (hostId) transport.send('act', action, hostId);
    else queued.push(action);
  }

  return {
    dispatch,
    getLog: () => log,
    getSnapshot: () => snapshot,
    hostNow: () => now() + clockOffset,
    leave() {
      clearTimeout(graceTimer);
      stopHosting();
      offs.forEach((off) => off());
      transport.leave();
    },
    selfId,
    sendCursor: (data) => transport.send('cur', data),
    setProfile(next) {
      profile = next;
      dispatch({ profile: next, type: HELLO });
    },
    subscribe: subscribe(listeners.change),
    subscribeCursor: subscribe(listeners.cursor),
    subscribeOps: subscribe(listeners.ops),
  };
}
