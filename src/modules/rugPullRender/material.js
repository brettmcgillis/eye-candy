import {
  Fn,
  PI,
  abs,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  frontFacing,
  fwidth,
  hash,
  ivec2,
  length,
  max,
  mix,
  normalView,
  positionView,
  select,
  smoothstep,
  textureLoad,
  uniform,
  uv,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const placeholder = () => {
  const tex = new THREE.DataTexture(new Uint8Array([200, 160, 120, 255]), 1, 1);
  tex.needsUpdate = true;
  return tex;
};

// The pile, one knot per texel: colour in rgb, standing pile in alpha. Each
// knot is a tuft (a dome in the normal and the shade), worn knots show the
// cotton warps, kilim rows are flat weft ribs, the back of the rug is the
// crisp knot grid, and past the ends the warps hang loose as fringe.
export default function createRugMaterial() {
  const u = {
    cols: uniform(200),
    fringeV: uniform(0.05),
    hideHead: uniform(0),
    kilimV: uniform(0.02),
    pileHeight: uniform(0.6),
    rows: uniform(300),
    sheen: uniform(0.35),
    warp: uniform(new THREE.Color('#ebe2d0')),
  };
  const slot = { nodes: [], tex: placeholder() };
  const knotAt = (coord) => {
    const node = textureLoad(slot.tex, coord);
    slot.nodes.push(node);
    return node;
  };

  const rugV = (v) => v.sub(u.fringeV).div(float(1).sub(u.fringeV.mul(2)));
  const cellOf = (p) => vec2(p.x.mul(u.cols), rugV(p.y).mul(u.rows));
  const knotOf = (cell) =>
    ivec2(
      clamp(floor(cell.x), 0, u.cols.sub(1)),
      clamp(floor(cell.y), 0, u.rows.sub(1))
    );

  const heightAt = (p) => {
    const cell = cellOf(p);
    const f = fract(cell).sub(0.5);
    const pile = knotAt(knotOf(cell)).a;
    return float(1).sub(dot(f, f).mul(2.6)).mul(pile);
  };

  const material = new THREE.MeshPhysicalNodeMaterial({
    roughness: 0.92,
    side: THREE.DoubleSide,
  });

  const shade = Fn(() => {
    const p = uv();
    const cell = cellOf(p).toVar();
    const knot = knotOf(cell);
    const yarn = knotAt(knot).toVar();
    const f = fract(cell).sub(0.5);
    const footprint = length(fwidth(cell));
    const detail = smoothstep(0.9, 0.3, footprint);
    const jitter = hash(knot.x.add(knot.y.mul(4099)))
      .sub(0.5)
      .mul(0.09);
    const dome = float(1)
      .sub(dot(f, f).mul(1.4).mul(u.pileHeight).mul(detail))
      .add(jitter);
    const tuft = yarn.rgb.mul(dome);

    const warpLine = cos(cell.x.mul(PI.mul(4)))
      .mul(0.5)
      .add(0.5);
    const foundation = u.warp.mul(
      mix(0.78, 1, warpLine.mul(detail).oneMinus().max(0.4))
    );
    const bare = yarn.a.oneMinus();
    const worn = mix(tuft, foundation, smoothstep(0.45, 0.95, bare));

    const rugY = rugV(p.y);
    const inKilim = rugY
      .lessThan(u.kilimV)
      .or(rugY.greaterThan(float(1).sub(u.kilimV)));
    const rib = cos(cell.y.mul(PI.mul(6)))
      .mul(0.06)
      .mul(detail)
      .add(0.95);
    const flat = yarn.rgb.mul(rib);
    const front = select(inKilim, flat, worn);

    const gridEdge = max(abs(f.x), abs(f.y));
    const back = yarn.rgb.mul(
      mix(0.82, 0.62, smoothstep(0.42, 0.5, gridEdge).mul(detail))
    );
    return select(frontFacing, front, back);
  });

  const fringeMask = Fn(() => {
    const p = uv();
    const head = p.y.lessThan(u.fringeV);
    const foot = p.y.greaterThan(float(1).sub(u.fringeV));
    const inFringe = head.or(foot);
    const t = select(
      head,
      u.fringeV.sub(p.y),
      p.y.sub(float(1).sub(u.fringeV))
    ).div(max(u.fringeV, 0.0001));
    const strand = p.x.mul(u.cols).mul(0.5);
    const across = abs(fract(strand).sub(0.5));
    const reach = hash(floor(strand).add(select(head, 0, 913)))
      .mul(0.3)
      .oneMinus();
    const alive = across.lessThan(0.3).and(t.lessThan(reach));
    const shown = select(head, u.hideHead.lessThan(0.5), true);
    return select(inFringe, alive.and(shown), true);
  });

  const color = Fn(() => {
    const p = uv();
    const inFringe = p.y
      .lessThan(u.fringeV)
      .or(p.y.greaterThan(float(1).sub(u.fringeV)));
    const strand = fract(p.x.mul(u.cols).mul(0.5)).sub(0.5);
    const cord = u.warp.mul(float(1).sub(abs(strand).mul(0.7)));
    return select(inFringe, cord, shade());
  })();
  material.colorNode = color;
  material.maskNode = fringeMask();
  material.sheenNode = u.sheen;
  material.sheenRoughnessNode = float(0.55);
  material.sheenColorNode = color.mul(1.4);

  material.normalNode = Fn(() => {
    const p = uv();
    const footprint = length(fwidth(cellOf(p)));
    const detail = smoothstep(0.9, 0.3, footprint);
    const h = heightAt(p);
    const dx = heightAt(p.add(p.dFdx())).sub(h);
    const dy = heightAt(p.add(p.dFdy())).sub(h);
    const scale = u.pileHeight
      .mul(detail)
      .mul(0.6)
      .mul(select(frontFacing, 1, 0));
    const dHdxy = vec2(dx, dy).mul(scale);
    const sigmaX = positionView.dFdx().normalize();
    const sigmaY = positionView.dFdy().normalize();
    const n = normalView;
    const r1 = sigmaY.cross(n);
    const r2 = n.cross(sigmaX);
    const det = sigmaX.dot(r1);
    const grad = det.sign().mul(dHdxy.x.mul(r1).add(dHdxy.y.mul(r2)));
    return det.abs().mul(n).sub(grad).normalize();
  })();

  return {
    material,
    u,

    setKnots(tex) {
      const old = slot.tex;
      slot.tex = tex;
      slot.nodes.forEach((node) => {
        node.value = tex; // eslint-disable-line no-param-reassign
      });
      if (old !== tex) old.dispose();
    },

    dispose() {
      material.dispose();
      slot.tex.dispose();
    },
  };
}
