export default function createKinetics(overrides) {
  const spinning = new Map();
  return {
    clear: () => spinning.clear(),
    stop: (control) => spinning.delete(control),
    release(gesture, cancel) {
      if (gesture.hit.kind !== 'ball' || cancel || !gesture.velocity) return;
      const keys = gesture.hit.signals.map(
        (s) => `${gesture.hit.control}:${s}`
      );
      spinning.set(gesture.hit.control, {
        keys,
        velocity: [...gesture.velocity],
      });
    },
    step(delta) {
      if (delta <= 0) return;
      const decay = Math.exp(-5 * delta);
      spinning.forEach(({ keys, velocity }, control) => {
        keys.forEach((key, i) => {
          overrides.set(
            key,
            overrides.get(key) + (velocity[i] * (1 - decay)) / 5
          );
        });
        const next = velocity.map((v) => v * decay);
        if (Math.hypot(...next) < 0.005) spinning.delete(control);
        else spinning.set(control, { keys, velocity: next });
      });
    },
  };
}
