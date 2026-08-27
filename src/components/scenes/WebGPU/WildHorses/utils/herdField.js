import { Fn, Loop, float, int, vec3 } from 'three/tsl';

// The horses stand still and the field travels through them, so every blade
// meets each horse once per lap. Both helpers below loop the herd in world XZ
// rather than field UV, which keeps the falloff circular no matter how the
// terrain extent is scaled.

// Displaces a blade away from any horse it is passing, weighted by `tip` so the
// base stays planted and only the upper blade leans. The push is radial and the
// bend is downward, which together read as grass parting rather than sliding.
export const herdPush = /* @__PURE__ */ Fn(([basePosition, tip, herd]) => {
  const offset = vec3(0).toVar();

  Loop({ start: int(0), end: herd.count, type: 'int' }, ({ i }) => {
    const horse = herd.positions.element(i);
    const away = basePosition.xz.sub(horse).toVar();
    const distance = away.length().toVar();
    const influence = distance.smoothstep(herd.pushRadius, 0.0).mul(tip);

    const direction = away.div(distance.max(0.0001));
    offset.xz.addAssign(direction.mul(influence).mul(herd.pushStrength));
    offset.y.subAssign(influence.mul(herd.bend));
  });

  return offset;
});

// wolf2 darkens the ground and grass with a soft radial blob under the animal
// rather than a real shadow map. Same trick, looped over the herd.
export const herdShadow = /* @__PURE__ */ Fn(([basePosition, herd]) => {
  const darkness = float(0).toVar();

  Loop({ start: int(0), end: herd.count, type: 'int' }, ({ i }) => {
    const horse = herd.positions.element(i);
    const distance = basePosition.xz.sub(horse).length();

    darkness.addAssign(
      distance.smoothstep(herd.shadowRadius, 0.0).mul(herd.shadowStrength)
    );
  });

  return darkness.min(1.0);
});
