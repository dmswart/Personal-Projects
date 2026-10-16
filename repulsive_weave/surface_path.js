// Shortest path between two points on the mesh. A strip of faces is unfolded flat and the funnel
// algorithm (string pulling) finds the shortest path through it. The first strip comes from a greedy
// walk toward q; it's then refined by walking straight toward q's unfolded position, which picks the
// strip a straight (geodesic) line actually passes through. Exact within the final strip.

// Faces visited by heading straight for q from p (unfolding q across a shared edge when adjacent),
// or null if the walk doesn't reach face fq.
function faceStrip(S, f, p, fq, q) {
  const { verts, fnorm, idx, nbr } = S;
  p = p.clone();
  const faces = [f];
  const e = new THREE.Vector3(), v = new THREE.Vector3(), aim = new THREE.Vector3();
  let skip = -1;
  for (let iter = 0; iter < 200 && f !== fq; iter++) {
    const n = fnorm[f];
    aim.subVectors(q, p);
    for (let k = 0; k < 3; k++) {
      if (nbr[3 * f + k] !== fq) continue;
      const a = verts[idx[3 * f + k]];
      e.subVectors(verts[idx[3 * f + (k + 1) % 3]], a).normalize();
      v.subVectors(q, a);
      const along = v.dot(e), out = v.addScaledVector(e, -along).length();
      aim.copy(a).addScaledVector(e, along).addScaledVector(v.crossVectors(e, n), out).sub(p);
    }
    aim.addScaledVector(n, -aim.dot(n));
    if (aim.lengthSq() < 1e-30) return null;
    const exit = exitEdge(S, f, p, aim.normalize(), skip);
    if (!exit) return null;
    p.addScaledVector(aim, exit.t);
    const g = nbr[3 * f + exit.k];
    if (g < 0) return null;
    skip = edgeIndexIn(S, g, idx[3 * f + exit.k], idx[3 * f + (exit.k + 1) % 3]);
    f = g;
    faces.push(f);
  }
  return f === fq ? faces : null;
}

const cross2 = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

// Lay the strip flat with p at the origin. Returns the portals (shared edges, as 2D left/right points
// plus their 3D vertices, left/right as seen travelling from p toward q) and q's flat position.
function unfoldStrip(S, faces, p, q) {
  const { verts, idx, fnorm } = S, f0 = faces[0];
  const e1 = new THREE.Vector3().subVectors(verts[idx[3 * f0 + 1]], verts[idx[3 * f0]]).normalize();
  const e2 = new THREE.Vector3().crossVectors(fnorm[f0], e1);
  const flat = new Map();
  for (let k = 0; k < 3; k++) {
    const d = new THREE.Vector3().subVectors(verts[idx[3 * f0 + k]], p);
    flat.set(idx[3 * f0 + k], { x: d.dot(e1), y: d.dot(e2) });
  }
  const portals = [];
  for (let s = 0; s + 1 < faces.length; s++) {
    const f = faces[s], g = faces[s + 1];
    const fv = [0, 1, 2].map(k => idx[3 * f + k]), gv = [0, 1, 2].map(k => idx[3 * g + k]);
    const [ia, ib] = fv.filter(u => gv.includes(u)), ic = fv.find(u => !gv.includes(u));
    const id = gv.find(u => u !== ia && u !== ib);
    const A = flat.get(ia), B = flat.get(ib), C = flat.get(ic);
    // Place g's third vertex on the far side of edge AB from C, with its true edge lengths.
    const lab = Math.hypot(B.x - A.x, B.y - A.y), lad = verts[ia].distanceTo(verts[id]), lbd = verts[ib].distanceTo(verts[id]);
    const along = (lad * lad - lbd * lbd + lab * lab) / (2 * lab), h = Math.sqrt(Math.max(0, lad * lad - along * along));
    const ux = (B.x - A.x) / lab, uy = (B.y - A.y) / lab, side = cross2(A, B, C) > 0 ? -1 : 1;
    const D = { x: A.x + along * ux - side * h * uy, y: A.y + along * uy + side * h * ux };
    // Facing away from C across AB, A is on the left when C is right of A->B.
    portals.push(cross2(A, B, C) < 0
      ? { l: A, r: B, l3: verts[ia], r3: verts[ib] }
      : { l: B, r: A, l3: verts[ib], r3: verts[ia] });
    flat.clear();
    flat.set(ia, A).set(ib, B).set(id, D);
  }
  const fq = faces[faces.length - 1], [u, v, w] = barycentric(S, fq, q);
  const P = [0, 1, 2].map(k => flat.get(idx[3 * fq + k]));
  return { portals, e1, e2, q2: { x: u * P[0].x + v * P[1].x + w * P[2].x, y: u * P[0].y + v * P[1].y + w * P[2].y } };
}

// Simple stupid funnel algorithm (Mononen). Returns the corner points and the portal index of each.
function funnel(portals) {
  const same = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 1e-12;
  let apex = portals[0].l, left = apex, right = apex, ai = 0, li = 0, ri = 0;
  const pts = [apex], at = [0];
  for (let i = 1; i < portals.length; i++) {
    const pl = portals[i].l, pr = portals[i].r;
    if (cross2(apex, right, pr) >= 0) { // pr tightens the right side
      if (same(apex, right) || cross2(apex, left, pr) < 0) { right = pr; ri = i; }
      else { // crossed over the left side: left becomes a corner
        pts.push(left); at.push(li);
        apex = left; ai = li; right = left; ri = li; i = ai;
        continue;
      }
    }
    if (cross2(apex, left, pl) <= 0) { // pl tightens the left side
      if (same(apex, left) || cross2(apex, right, pl) > 0) { left = pl; li = i; }
      else {
        pts.push(right); at.push(ri);
        apex = right; ai = ri; left = right; li = ri; i = ai;
        continue;
      }
    }
  }
  pts.push(portals[portals.length - 1].l); at.push(portals.length - 1);
  return { pts, at };
}

// Shortest path from p (in face f) to q (in face fq): the 3D points where it crosses mesh edges,
// excluding p and q. Empty if p and q share a face, or if no strip was found.
function shortestPath(S, f, p, fq, q) {
  const faces = faceStrip(S, f, p, fq, q);
  if (!faces || faces.length < 2) return [];
  let best = stripPath(S, faces, p, q);
  for (let iter = 0; iter < 5; iter++) {
    const walked = [f];
    walk(S, f, p, best.aim, 1.5 * best.straight, walked);
    const k = walked.indexOf(fq);
    if (k < 1) break;
    const cand = stripPath(S, walked.slice(0, k + 1), p, q);
    if (!(cand.length < best.length - 1e-12)) break;
    best = cand;
  }
  return best.pts;
}

// Funnel path through one strip: crossing points, its length, and the straight-line direction (3D, in
// the first face) and distance to q's unfolded position.
function stripPath(S, faces, p, q) {
  const { portals, q2, e1, e2 } = unfoldStrip(S, faces, p, q);
  const all = [{ l: { x: 0, y: 0 }, r: { x: 0, y: 0 } }, ...portals, { l: q2, r: q2 }];
  const { pts, at } = funnel(all);
  let length = 0;
  for (let k = 1; k < pts.length; k++) length += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
  const straight = Math.hypot(q2.x, q2.y);
  const aim = e1.clone().multiplyScalar(q2.x / straight).addScaledVector(e2, q2.y / straight);
  const out = [];
  let seg = 0;
  for (let j = 1; j <= portals.length; j++) {
    while (at[seg + 1] < j) seg++;
    const a = pts[seg], b = pts[seg + 1], { l, r, l3, r3 } = all[j];
    // Where segment a->b crosses portal l->r, as a fraction t from l.
    const dx = b.x - a.x, dy = b.y - a.y;
    const den = (r.x - l.x) * dy - (r.y - l.y) * dx;
    let t = Math.abs(den) < 1e-15 ? 0 : ((a.x - l.x) * dy - (a.y - l.y) * dx) / den;
    t = Math.min(1, Math.max(0, t));
    const pt = l3.clone().lerp(r3, t);
    if (!out.length || out[out.length - 1].distanceToSquared(pt) > 1e-24) out.push(pt);
  }
  return { pts: out, length, aim, straight };
}
