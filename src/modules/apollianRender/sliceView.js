import {
  Break,
  Fn,
  If,
  Loop,
  abs,
  exp,
  float,
  fwidth,
  max,
  mix,
  positionGeometry,
  round,
  select,
  smoothstep,
  sqrt,
  tanh,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import createObjectField from './fields';
import { paletteColor, paletteCoordinate } from './palette';

const LIGHT_HEIGHT = 1.25;
const PAPER_DEPTH = -0.125;
const EYE_HEIGHT = 10;
const SHADOW_SHARPNESS = 15;
const PAPER_GAIN = 3.2;

// "Apollian with a twist" seen from above: the slice floats over a sheet of
// paper, two lights cast it down onto the paper, and the solid glows into
// the dark round it. Its fixed hues are the palette here, and the slice is
// any plane through the object.
export default function buildSliceMaterial(family, u, buffers) {
  const field = createObjectField(family, u, buffers);

  const pointAt = (frame, offset) =>
    u.sliceCentre
      .add(u.sliceNormal.mul(offset))
      .add(u.sliceU.mul(frame.x.mul(u.sliceHalf)))
      .add(u.sliceV.mul(frame.y.mul(u.sliceHalf)));
  const frameDistance = (frame, offset) =>
    field.sliceDistance(pointAt(frame, offset)).div(u.sliceHalf);

  const color = Fn(() => {
    const q = uv();
    const frame = q.mul(2).sub(1).mul(vec2(u.sliceAspect, 1));
    const aa = float(2).div(u.resolution.y);
    const l = frame.length();
    const col = vec3(0).toVar();

    const lights = (point) => {
      const ro = vec3(0, EYE_HEIGHT, 0);
      const pp = vec3(point.x, 0, point.y);
      const rd = pp.sub(ro).normalize();
      const bp = ro.add(
        rd.mul(
          float(EYE_HEIGHT - PAPER_DEPTH)
            .negate()
            .div(rd.y)
        )
      );
      const lp1 = vec3(0.5, LIGHT_HEIGHT, 0.5);
      const lp2 = vec3(-0.5, LIGHT_HEIGHT, 0.5);
      const srd1 = lp1.sub(bp).normalize();
      const srd2 = lp2.sub(bp).normalize();
      const st1 = float(-PAPER_DEPTH).div(srd1.y);
      // The original steps both shadow rays by the first light's length.
      const sp1 = bp.add(srd1.mul(st1));
      const sp2 = bp.add(srd2.mul(st1));
      const sd1 = frameDistance(vec2(sp1.x, sp1.z), float(0));
      const sd2 = frameDistance(vec2(sp2.x, sp2.z), float(0));
      const bl1 = lp1.sub(bp).dot(lp1.sub(bp));
      const bl2 = lp2.sub(bp).dot(lp2.sub(bp));
      const lit = exp(max(sd1, 0).mul(-SHADOW_SHARPNESS))
        .oneMinus()
        .div(bl1)
        .add(
          exp(max(sd2, 0).mul(-SHADOW_SHARPNESS)).oneMinus().mul(0.5).div(bl2)
        );
      return lit.mul(float(1).sub(tanh(l.mul(0.75)))).mul(0.5 * PAPER_GAIN);
    };

    const paper = mix(
      u.slicePaper,
      u.slicePaper.mul(lights(frame)),
      u.sliceShadow
    );
    col.assign(paper);

    If(u.sliceMode.equal(2), () => {
      const count = u.stackCount;
      const centre = count.toFloat().sub(1).mul(0.5);
      Loop({ end: count, start: 0, type: 'int' }, ({ i }) => {
        const layer = count.sub(1).sub(i).toFloat();
        const k = layer.sub(centre);
        const at = frame.sub(u.stackShift.xy.mul(k));
        const offset = k.mul(u.stackSpacing);
        const d = frameDistance(at, offset);
        If(d.lessThan(aa), () => {
          const t = layer.div(count.sub(1).max(1).toFloat());
          const fill = paletteColor(paletteCoordinate(t, u), u);
          const edge = smoothstep(
            aa.mul(u.sliceLine.add(1)).negate(),
            aa.negate(),
            d
          );
          col.assign(mix(fill, fill.mul(0.25), edge.mul(u.sliceLine.min(1))));
          Break();
        });
      });
    }).Else(() => {
      const point = pointAt(frame, float(0));
      const info = field.sliceInfo(point);
      const d = info.x.div(u.sliceHalf);
      const bcol = paletteColor(paletteCoordinate(info.y, u), u);
      col.assign(mix(col, bcol, smoothstep(aa.negate(), aa, d.negate())));
      col.addAssign(
        sqrt(bcol.zxy)
          .mul(u.sliceGlow)
          .mul(exp(tanh(l).mul(100).add(10).mul(max(d, 0)).negate()))
      );

      If(u.sliceMode.equal(1), () => {
        const sign = select(u.bandSide.equal(1), float(-1), float(1));
        const lo = select(
          u.bandSide.equal(2),
          u.bandCount.sub(1).negate(),
          float(0)
        );
        const m = info.x.mul(sign).div(u.bandStep);
        const k = round(m);
        const kept = k
          .greaterThanEqual(lo)
          .and(k.lessThanEqual(u.bandCount.sub(1)));
        const line = float(1).sub(
          smoothstep(0, fwidth(m).mul(u.sliceLine.max(0.01)), abs(m.sub(k)))
        );
        const span = u.bandCount.sub(1).sub(lo).max(1);
        const ink = paletteColor(paletteCoordinate(k.sub(lo).div(span), u), u);
        col.assign(mix(col, ink, select(kept, line, float(0))));
      });
    });

    return vec4(col, 1);
  })();

  const material = new THREE.MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.colorNode = color;
  return material;
}
