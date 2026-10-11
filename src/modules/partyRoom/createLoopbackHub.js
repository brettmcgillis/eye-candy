export default function createLoopbackHub({ latencyMs = 0 } = {}) {
  const nodes = new Map();

  const deliver = (fn, delayMs = latencyMs) => {
    if (delayMs > 0) setTimeout(fn, delayMs);
    else queueMicrotask(fn);
  };

  function connect(selfId, { joinDelayMs = 0 } = {}) {
    const node = {
      handlers: new Map(),
      joinFns: new Set(),
      leaveFns: new Set(),
      linked: new Set(),
    };

    [...nodes.keys()].forEach((id) => {
      deliver(() => {
        const other = nodes.get(id);
        if (!other || !nodes.has(selfId)) return;
        other.linked.add(selfId);
        node.linked.add(id);
        other.joinFns.forEach((fn) => fn(selfId));
        node.joinFns.forEach((fn) => fn(id));
      }, latencyMs + joinDelayMs);
    });
    nodes.set(selfId, node);

    return {
      selfId,
      getPeers: () => [...node.linked],
      send(channel, data, target) {
        const targets = target ? [target] : [...node.linked];
        const payload = structuredClone(data);
        targets.forEach((id) => {
          if (!node.linked.has(id)) return;
          deliver(() => {
            if (!nodes.has(selfId)) return;
            nodes
              .get(id)
              ?.handlers.get(channel)
              ?.forEach((fn) => fn(structuredClone(payload), selfId));
          });
        });
      },
      on(channel, fn) {
        if (!node.handlers.has(channel)) node.handlers.set(channel, new Set());
        node.handlers.get(channel).add(fn);
        return () => node.handlers.get(channel).delete(fn);
      },
      onPeerJoin(fn) {
        node.joinFns.add(fn);
        return () => node.joinFns.delete(fn);
      },
      onPeerLeave(fn) {
        node.leaveFns.add(fn);
        return () => node.leaveFns.delete(fn);
      },
      leave() {
        if (!nodes.delete(selfId)) return;
        node.linked.forEach((id) => {
          const other = nodes.get(id);
          if (!other) return;
          other.linked.delete(selfId);
          deliver(() => other.leaveFns.forEach((fn) => fn(selfId)));
        });
        node.linked.clear();
      },
    };
  }

  return { connect };
}
