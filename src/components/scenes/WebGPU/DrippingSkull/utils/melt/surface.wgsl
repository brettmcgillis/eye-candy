fn meltBlob(i: i32, p: vec3f, n: vec3f, blobs: texture_2d<f32>) -> vec4f {
  let c = textureLoad(blobs, vec2i(i, 0), 0);
  let m = textureLoad(blobs, vec2i(i, 2), 0);
  let d = p - c.xyz;
  if (dot(d, d) >= m.w * m.w) { return vec4f(0.0); }
  let facing = smoothstep(0.0, 0.45, dot(n, m.xyz));
  let t = textureLoad(blobs, vec2i(i, 1), 0);
  if (facing <= 0.0 || t.w <= 0.0) { return vec4f(0.0); }
  let tail = length(t.xyz);
  let down = t.xyz / tail;
  let side = cross(m.xyz, down);
  let u = dot(d, down); let v = dot(d, side); let w = dot(d, m.xyz);
  let ax = c.w * select(1.1, tail, u < 0.0);
  let tp = select(0.0, 0.25 * (tail - 1.0), u < 0.0);
  let tt = clamp(-u / ax, 0.0, 1.0);
  let av = c.w * (1.0 - tp * tt);
  let dav = select(0.0, c.w * tp / ax, u < 0.0 && tt < 1.0);
  let iu = 1.0 / (ax * ax); let iv = 1.0 / (av * av); let iw = 1.0 / (m.w * m.w);
  let s2 = u * u * iu + v * v * iv + w * w * iw;
  if (s2 >= 1.0) { return vec4f(0.0); }
  let q = 1.0 - s2; let k = t.w * facing; let h = k * q * q;
  let dh = -4.0 * k * q * ((u * iu - v * v * iv / av * dav) * down + v * iv * side + w * iw * m.xyz);
  let hp = pow(h, 1.5);
  return vec4f(hp * dh, hp * h);
}

fn meltDeriv(x: f32) -> f32 {
  return select(6.0 * x * (1.0 - x), 0.0, x <= 0.0 || x >= 1.0);
}

fn meltTrail(j: i32, p: vec3f, n: vec3f, chain: vec4f, trails: texture_2d<f32>, points: i32) -> vec4f {
  let b = textureLoad(trails, vec2i(0, j), 0);
  let db = p - b.xyz;
  if (dot(db, db) >= b.w * b.w) { return chain; }
  let tp = textureLoad(trails, vec2i(points + 1, j), 0);
  var a = textureLoad(trails, vec2i(1, j), 0);
  var prevDir = vec3f(0.0); var cum = 0.0; var cv = chain.w; var cg = chain.xyz;
  for (var k = 2; k <= points; k++) {
    let e = textureLoad(trails, vec2i(k, j), 0);
    if (e.w <= 0.0) { break; }
    let ab = e.xyz - a.xyz;
    let l2 = max(dot(ab, ab), 1e-10); let ll = sqrt(l2);
    let fu = dot(p - a.xyz, ab) / l2; let f = clamp(fu, 0.0, 1.0);
    let inside = select(0.0, 1.0, fu > 0.0 && fu < 1.0);
    let r = p - a.xyz - f * ab;
    let th = max(mix(a.w, e.w, f), 1e-7); let sq = sqrt(th);
    let iw = 1.0 / (0.64 * th); let D = 0.56 * sq + 0.006;
    let rn = dot(r, n) / D; let r2 = dot(r, r); let s = r2 * iw + rn * rn;
    let dir = ab / ll;
    if (s < 1.0) {
      let dist = (cum + f * ll) * tp.y;
      let xh = tp.z + dist; let xt = tp.w - dist;
      let sH = smoothstep(0.0, 1.0, xh); let sT = smoothstep(0.0, 1.0, xt);
      let tf = sH * sT;
      let dtf = inside * tp.y * (meltDeriv(xh) * sT - sH * meltDeriv(xt)) / ll * ab;
      let Q = 1.0 - s * s; let T = th * tf; let v = T * Q * Q;
      let dth = inside * (e.w - a.w) / l2 * ab; let dT = tf * dth + th * dtf;
      let drn = n - inside * ab * (dot(ab, n) / l2);
      let ds = 2.0 * iw * r + (-r2 * iw / th - 2.0 * rn * rn / D * 0.28 / sq) * dth + 2.0 * rn / D * drn;
      let g = Q * Q * dT - 4.0 * T * s * Q * ds;
      let cosb = select(1.0, dot(prevDir, dir), k > 2);
      let kc = 0.03 + 0.4 * (1.0 - cosb); let kb = min(T * kc, min(v, cv));
      var t = step(cv, v);
      if (kb > 1e-12) { t = clamp(0.5 + 0.5 * (v - cv) / kb, 0.0, 1.0); }
      var dk = kc * dT;
      if (kb == v) { dk = g; } else if (kb == cv) { dk = cg; }
      cv = mix(cv, v, t) + kb * t * (1.0 - t);
      cg = mix(cg, g, t) + t * (1.0 - t) * dk;
    }
    prevDir = dir; a = e; cum += ll;
  }
  return vec4f(cg, cv);
}

fn meltField(p: vec3f, n: vec3f, blobs: texture_2d<f32>, trails: texture_2d<f32>, grid: texture_2d<f32>, gridMin: vec3f, gridSize: f32, blobCount: i32, trailCount: i32, maxBlobs: i32, points: i32) -> vec4f {
  let g = clamp(vec3i(floor((p - gridMin) / gridSize * 8.0)), vec3i(0), vec3i(7));
  let cell = g.x + 8 * (g.y + 8 * g.z);
  var sum = vec4f(0.0); var tsum = vec4f(0.0); var chain = vec4f(0.0); var cid = -1.0;
  let count = i32(textureLoad(grid, vec2i(cell, 0), 0).x + 0.5);
  let brute = count > 47; let n0 = select(count, blobCount + trailCount, brute);
  for (var k = 0; k < n0; k++) {
    var id: i32;
    if (brute) { id = select(maxBlobs + k - blobCount, k, k < blobCount); }
    else { id = i32(textureLoad(grid, vec2i(cell, (k + 1) >> 2), 0)[(k + 1) & 3] + 0.5); }
    if (id < maxBlobs) { sum += meltBlob(id, p, n, blobs); continue; }
    let j = id - maxBlobs;
    let ch = textureLoad(trails, vec2i(points + 1, j), 0).x;
    if (ch != cid) {
      if (chain.w > 0.0) { let hp = pow(chain.w, 0.6); tsum += hp * chain; }
      cid = ch; chain = vec4f(0.0);
    }
    chain = meltTrail(j, p, n, chain, trails, points);
  }
  if (chain.w > 0.0) { let hp = pow(chain.w, 0.6); tsum += hp * chain; }
  if (tsum.w > 1e-30) {
    let T = pow(tsum.w, 1.0 / 1.6); let dT = tsum.xyz * pow(T, -0.6);
    let tp = pow(T, 1.5); sum += tp * vec4f(dT, T);
  }
  if (sum.w <= 1e-30) { return vec4f(0.0); }
  let H = pow(sum.w, 0.4);
  return vec4f(sum.xyz * pow(H, -1.5), H);
}

fn meltKnot(pools: texture_2d<f32>, row: i32, i: i32, dr: f32, poolN: i32) -> vec3f {
  if (i < 0) { let s = textureLoad(pools, vec2i(3 - i, row), 0).xyz; return vec3f(-s.x, s.yz); }
  if (i >= poolN) { return vec3f(f32(i) * dr, 0.0, 0.0); }
  return textureLoad(pools, vec2i(3 + i, row), 0).xyz;
}

fn meltPools(p: vec3f, n: vec3f, offset: vec3f, tangent1: vec3f, tangent2: vec3f, height: f32, pools: texture_2d<f32>, poolCount: i32, poolN: i32) -> mat3x4f {
  var off = offset; var t1 = tangent1; var t2 = tangent2; var h = height;
  for (var k = 0; k < poolCount; k++) {
    let a = textureLoad(pools, vec2i(0, k), 0);
    if (a.w <= 0.0) { continue; }
    let d = p + off - a.xyz; let s = length(d);
    if (s >= a.w) { continue; }
    let nb = textureLoad(pools, vec2i(2, k), 0).xyz;
    let face = smoothstep(-0.3, 0.1, dot(n, nb));
    if (face <= 0.0) { continue; }
    let hn = dot(d, nb); let pv = d - nb * hn; let rho = length(pv);
    let gz = textureLoad(pools, vec2i(1, k), 0); let g = gz.xyz;
    var rad = normalize(cross(nb, select(vec3f(0.0, 0.0, 1.0), vec3f(1.0, 0.0, 0.0), abs(nb.x) < 0.9)));
    if (rho > 1e-6) { rad = pv / rho; }
    let dr = a.w / f32(poolN - 1); let u = s / dr; let i = i32(u); let t = u - f32(i);
    let k0 = meltKnot(pools, k, i - 1, dr, poolN); let k1 = meltKnot(pools, k, i, dr, poolN);
    let k2 = meltKnot(pools, k, i + 1, dr, poolN); let k3 = meltKnot(pools, k, i + 2, dr, poolN);
    let cb = k2 - k0; let cc = 2.0 * k0 - 5.0 * k1 + 4.0 * k2 - k3; let cd = 3.0 * (k1 - k2) + k3 - k0;
    let c = 0.5 * (2.0 * k1 + t * (cb + t * (cc + t * cd)));
    let dc = 0.5 * (cb + t * (2.0 * cc + t * 3.0 * cd)) / dr;
    let r = c.x; let z = c.y; let w = c.z;
    var e = nb; var q = dc.x; var dq = 0.0; var rr = dc.x;
    if (s > 1e-6) { e = d / s; q = r / s; dq = (dc.x - q) / s; }
    if (rho > 1e-6) { rr = r / rho; }
    let x = clamp(z / max(gz.w, 1e-5), 0.0, 1.0); let keep = 1.0 - x * x * (3.0 - 2.0 * x);
    let dkeep = -6.0 * x * (1.0 - x) / max(gz.w, 1e-5) * dc.y;
    let q2 = q * q; let sk = pv * q + nb * (hn * q2);
    let m = mix(sk, rad * r + nb * (hn * q2 * keep), w) + g * z;
    let lath = rad * r + nb * (hn * q2 * keep) - sk;
    let a1 = dot(rad, t1); let b1 = dot(nb, t1); let e1 = dot(e, t1); let h1 = b1 * q2 + 2.0 * hn * q * dq * e1;
    let m1 = (1.0 - w) * ((t1 - nb * b1) * q + pv * (dq * e1) + nb * h1) + w * ((t1 - nb * b1 - rad * a1) * rr + rad * (dc.x * e1) + nb * (h1 * keep + hn * q2 * dkeep * e1)) + (lath * dc.z + g * dc.y) * e1;
    let a2 = dot(rad, t2); let b2 = dot(nb, t2); let e2 = dot(e, t2); let h2 = b2 * q2 + 2.0 * hn * q * dq * e2;
    let m2 = (1.0 - w) * ((t2 - nb * b2) * q + pv * (dq * e2) + nb * h2) + w * ((t2 - nb * b2 - rad * a2) * rr + rad * (dc.x * e2) + nb * (h2 * keep + hn * q2 * dkeep * e2)) + (lath * dc.z + g * dc.y) * e2;
    off += (m - d) * face; t1 = mix(t1, m1, face); t2 = mix(t2, m2, face); h = max(h, z * face);
  }
  return mat3x4f(vec4f(off, h), vec4f(t1, 0.0), vec4f(t2, 0.0));
}
