import { If, vec3 } from 'three/tsl';

export const DEBUG_VIEWS = [
  'Off',
  'Ridge Map',
  'Normals',
  'Diffuse',
  'Height',
  'Erosion',
  'Trees',
];

// The reference's debug buffers, folded into the image pass instead of tiled
// down the side of the frame.
export default function applyDebugView({
  color,
  data,
  debugView,
  diffuse,
  hit,
}) {
  If(debugView.equal(1), () => {
    color.assign(vec3(data.ridgemap.mul(data.ridgemap)));
  })
    .ElseIf(debugView.equal(2), () => {
      color.assign(data.normal.xzy.mul(0.5).add(0.5));
    })
    .ElseIf(debugView.equal(3), () => {
      color.assign(diffuse.pow(1 / 2.2));
    })
    .ElseIf(debugView.equal(4), () => {
      color.assign(vec3(data.height));
    })
    .ElseIf(debugView.equal(5), () => {
      color.assign(vec3(data.erosion.mul(0.5).add(0.5)));
    })
    .ElseIf(debugView.equal(6), () => {
      color.assign(vec3(data.trees));
    });

  If(debugView.greaterThan(0).and(hit.lessThan(0)), () => {
    color.assign(vec3(0));
  });
}
