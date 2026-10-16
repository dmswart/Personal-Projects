// Surface mesh + discrete closed curve on it.
// A curve is { pos: Vector3[], face: number[] } where face[i] is the triangle containing pos[i].
// Segments pos[i] -> pos[i+1] (indices wrap around) are straight 3D chords.

// Weld, center and scale geometries to an indexed triangle mesh of unit bounding radius.
function makeSurface(geometries) {
  const parts = geometries.map(g => {
    g = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name);
    return g;
  });
  let g = parts.length === 1 ? parts[0] : THREE.BufferGeometryUtils.mergeBufferGeometries(parts);
  g.center();
  g.computeBoundingSphere();
  g.scale(1 / g.boundingSphere.radius, 1 / g.boundingSphere.radius, 1 / g.boundingSphere.radius);
  g = THREE.BufferGeometryUtils.mergeVertices(g, 1e-5);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

// All closed loops where the plane {x : normal.x = offset} cuts the mesh.
function planeLoops(geometry, normal, offset) {
  const pos = geometry.attributes.position;
  const idx = geometry.index.array;
  const nv = pos.count, nf = idx.length / 3;
  const v = new THREE.Vector3();
  const d = new Float64Array(nv);
  for (let i = 0; i < nv; i++) d[i] = v.fromBufferAttribute(pos, i).dot(normal) - offset || 1e-12;

  const edgeFaces = new Map();          // crossed edge key -> faces sharing it
  const faceEdges = new Array(nf);      // crossed face -> its two crossed edge keys
  for (let f = 0; f < nf; f++) {
    const keys = [];
    for (let k = 0; k < 3; k++) {
      const a = idx[3 * f + k], b = idx[3 * f + (k + 1) % 3];
      if (d[a] * d[b] < 0) keys.push(Math.min(a, b) * nv + Math.max(a, b));
    }
    if (keys.length !== 2) continue;
    faceEdges[f] = keys;
    for (const key of keys) {
      if (!edgeFaces.has(key)) edgeFaces.set(key, []);
      edgeFaces.get(key).push(f);
    }
  }

  const edgePoint = key => {
    const a = Math.floor(key / nv), b = key % nv;
    const t = d[a] / (d[a] - d[b]);
    return new THREE.Vector3().fromBufferAttribute(pos, a)
      .lerp(new THREE.Vector3().fromBufferAttribute(pos, b), t);
  };

  const visited = new Uint8Array(nf);
  const loops = [];
  for (let f0 = 0; f0 < nf; f0++) {
    if (!faceEdges[f0] || visited[f0]) continue;
    const loop = { pos: [], face: [] };
    let f = f0, eIn = faceEdges[f0][0], closed = false;
    while (f !== undefined && !visited[f]) {
      visited[f] = 1;
      loop.pos.push(edgePoint(eIn));
      loop.face.push(f);
      const eOut = faceEdges[f][0] === eIn ? faceEdges[f][1] : faceEdges[f][0];
      const next = edgeFaces.get(eOut).find(g => g !== f);
      if (next === f0) closed = true;
      f = next;
      eIn = eOut;
    }
    if (closed) loops.push(loop);
  }
  return loops;
}

function curveLength(curve) {
  let L = 0;
  for (let i = 0; i < curve.pos.length; i++) L += curve.pos[i].distanceTo(curve.pos[(i + 1) % curve.pos.length]);
  return L;
}

// Buckets point positions into a 3D grid of cubes with side `cellSize`, keyed by cube indices, so
// pairTerm can look up roughly-nearby points without checking every other point. Each point's cell is
// fixed at build time (indexCell), not re-derived from its current position later: a point can be
// perturbed by a tiny amount to probe a gradient, and that must not change which cell it's looked up in,
// or the probes on either side of the perturbation could end up summing over different neighbors.
function buildGrid(x, cellSize) {
  const cellOf = p => [Math.floor(p.x / cellSize), Math.floor(p.y / cellSize), Math.floor(p.z / cellSize)];
  const indexCell = x.map(cellOf), cells = new Map();
  indexCell.forEach((c, i) => {
    const key = c.join(',');
    const bucket = cells.get(key);
    if (bucket) bucket.push(i); else cells.set(key, [i]);
  });
  return { indexCell, cells };
}

// Indices of points in point i's own cell (as of buildGrid) and the 26 neighboring cells, excluding i
// itself and its two immediate curve neighbors (cyclic index distance <= 1).
function nearbyIndices(grid, i, n) {
  const [cx, cy, cz] = grid.indexCell[i], out = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = grid.cells.get(`${cx + dx},${cy + dy},${cz + dz}`);
        if (!bucket) continue;
        for (const m of bucket) {
          const raw = Math.abs(m - i);
          if (Math.min(raw, n - raw) > 1) out.push(m);
        }
      }
  return out;
}

// Resample to n points evenly spaced by arc length along the existing polyline.
function resample(curve, n) {
  const m = curve.pos.length, L = curveLength(curve);
  const out = { pos: [], face: [] };
  let i = 0, s0 = 0, seg = curve.pos[0].distanceTo(curve.pos[1 % m]);
  for (let k = 0; k < n; k++) {
    const s = k * L / n;
    while (s0 + seg < s && i < m - 1) {
      s0 += seg;
      i++;
      seg = curve.pos[i].distanceTo(curve.pos[(i + 1) % m]);
    }
    const t = seg > 0 ? (s - s0) / seg : 0;
    out.pos.push(curve.pos[i].clone().lerp(curve.pos[(i + 1) % m], t));
    out.face.push(curve.face[i]);
  }
  return out;
}

// Initial curve: the longest closed plane section over a few random planes, resampled to n points.
function initialLoop(geometry, n) {
  let best = null, bestL = 0;
  for (let t = 0; t < 20; t++) {
    const normal = new THREE.Vector3().randomDirection();
    for (const loop of planeLoops(geometry, normal, (Math.random() - 0.5) * 0.4)) {
      const L = curveLength(loop);
      if (L > bestL) { best = loop; bestL = L; }
    }
  }
  return best && resample(best, n);
}

// Mesh data for walking: vertices, vertex normals, face normals, nbr[3f+k] = face across edge k of f.
function buildTopology(geometry) {
  const P = geometry.attributes.position, N = geometry.attributes.normal, idx = geometry.index.array;
  const verts = [], vnorm = [], fnorm = [];
  for (let i = 0; i < P.count; i++) {
    verts.push(new THREE.Vector3().fromBufferAttribute(P, i));
    vnorm.push(new THREE.Vector3().fromBufferAttribute(N, i));
  }
  const nf = idx.length / 3, nbr = new Int32Array(3 * nf).fill(-1), edges = new Map();
  let area = 0;
  for (let f = 0; f < nf; f++) {
    const a = verts[idx[3 * f]], b = verts[idx[3 * f + 1]], c = verts[idx[3 * f + 2]];
    const cr = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    area += cr.length() / 2;
    fnorm.push(cr.normalize());
    for (let k = 0; k < 3; k++) {
      const u = idx[3 * f + k], v = idx[3 * f + (k + 1) % 3];
      const key = Math.min(u, v) * P.count + Math.max(u, v);
      const other = edges.get(key);
      if (other === undefined) edges.set(key, 3 * f + k);
      else { nbr[3 * f + k] = Math.floor(other / 3); nbr[other] = f; }
    }
  }
  return { verts, vnorm, fnorm, idx, nbr, area };
}

// Where the ray p + t d (d in the plane of face f) leaves f, ignoring local edge `skip`: { t, k } or null.
function exitEdge(S, f, p, d, skip) {
  const { verts, fnorm, idx } = S, n = fnorm[f];
  const e = new THREE.Vector3(), w = new THREE.Vector3(), c = new THREE.Vector3();
  let best = Infinity, bk = -1;
  for (let k = 0; k < 3; k++) {
    if (k === skip) continue;
    const a = verts[idx[3 * f + k]];
    e.subVectors(verts[idx[3 * f + (k + 1) % 3]], a);
    const den = c.crossVectors(d, e).dot(n);
    if (!(den > 1e-15)) continue; // only edges the ray exits through
    const t = Math.max(0, c.crossVectors(w.subVectors(a, p), e).dot(n) / den);
    if (t < best) { best = t; bk = k; }
  }
  return bk < 0 ? null : { t: best, k: bk };
}

// Local index in face g of the edge with vertices ia, ib.
function edgeIndexIn(S, g, ia, ib) {
  for (let k = 0; k < 3; k++) {
    const u = S.idx[3 * g + k], v = S.idx[3 * g + (k + 1) % 3];
    if ((u === ia && v === ib) || (u === ib && v === ia)) return k;
  }
  return -1;
}

// Straightest geodesic (Polthier-Schmies): go straight within a face; at an edge, rotate the
// direction about the edge into the next face (unfolding). Returns { face, pos } or null.
// If faces is given, each face entered is pushed onto it.
function walk(S, f, p, d, s, faces) {
  const { verts, fnorm, idx, nbr } = S;
  p = p.clone(); d = d.clone();
  const e = new THREE.Vector3(), w = new THREE.Vector3();
  let skip = -1;
  for (let iter = 0; iter < 1000; iter++) {
    const exit = exitEdge(S, f, p, d, skip);
    if (!exit) return null;
    if (exit.t >= s) return { face: f, pos: p.addScaledVector(d, s) };
    p.addScaledVector(d, exit.t);
    s -= exit.t;
    const g = nbr[3 * f + exit.k];
    if (g < 0) return { face: f, pos: p }; // mesh boundary: stop at the edge
    const ia = idx[3 * f + exit.k], ib = idx[3 * f + (exit.k + 1) % 3];
    e.subVectors(verts[ib], verts[ia]).normalize();
    const along = d.dot(e), perp = Math.sqrt(Math.max(0, 1 - along * along));
    d.copy(e).multiplyScalar(along).addScaledVector(w.crossVectors(e, fnorm[g]), perp).normalize();
    skip = edgeIndexIn(S, g, ia, ib);
    f = g;
    if (faces) faces.push(f);
  }
  return null;
}

// Barycentric coordinates [u, v, w] of p with respect to face f's vertices.
function barycentric(S, f, p) {
  const { verts, idx } = S;
  const a = verts[idx[3 * f]];
  const v0 = new THREE.Vector3().subVectors(verts[idx[3 * f + 1]], a);
  const v1 = new THREE.Vector3().subVectors(verts[idx[3 * f + 2]], a);
  const v2 = new THREE.Vector3().subVectors(p, a);
  const d00 = v0.dot(v0), d01 = v0.dot(v1), d11 = v1.dot(v1), d20 = v2.dot(v0), d21 = v2.dot(v1);
  const den = d00 * d11 - d01 * d01;
  const v = (d11 * d20 - d01 * d21) / den, w = (d00 * d21 - d01 * d20) / den;
  return [1 - v - w, v, w];
}

// Smooth (Phong) normal: barycentric interpolation of vertex normals.
function normalAt(S, f, p) {
  const { vnorm, idx } = S, [u, v, w] = barycentric(S, f, p);
  return new THREE.Vector3()
    .addScaledVector(vnorm[idx[3 * f]], u).addScaledVector(vnorm[idx[3 * f + 1]], v)
    .addScaledVector(vnorm[idx[3 * f + 2]], w).normalize();
}

// Walk point i along the surface by displacement v (direction flattened into its face, length |v|).
function moveAlongSurface(S, curve, i, v) {
  const fn = S.fnorm[curve.face[i]];
  const d = v.clone().addScaledVector(fn, -v.dot(fn));
  if (d.lengthSq() < 1e-30) return;
  const moved = walk(S, curve.face[i], curve.pos[i], d.normalize(), v.length());
  if (moved) {
    curve.pos[i] = moved.pos;
    curve.face[i] = moved.face;
  }
}

// After smoothPath() in globeweaver/paths.js: every point moves halfway toward the position its
// neighbours predict, using 4-point cubic interpolation so arcs barely shrink. The neighbours are
// expressed as surface vectors at the point, so the prediction is made within the surface and doesn't
// cut across creases.
function smoothCurve(S, curve) {
  const x = curve.pos, F = curve.face, n = x.length;
  const v = (i, k) => {
    const j = (i + k + n) % n;
    return surfaceVector(S, F[i], x[i], F[j], x[j]);
  };
  const shift = x.map((_, i) => new THREE.Vector3()
    .addScaledVector(v(i, -2), -1).addScaledVector(v(i, -1), 4)
    .addScaledVector(v(i, 1), 4).addScaledVector(v(i, 2), -1)
    .divideScalar(12));
  for (let i = 0; i < n; i++) moveAlongSurface(S, curve, i, shift[i]);
}

// Respace to m points (default: the current count) evenly by surface arc length. Positions are placed
// along a Catmull-Rom spline through (i-1, i, i+1, i+2) -- rewritten as vectors from point i so they can
// be combined and walked directly, the same trick smoothCurve uses -- instead of walking the straight
// chord to i+1, which always cuts corners and shrinks the curve. Arc length still uses the straight
// chord lengths (not this curved path's true length): the spacing is only approximately even, but exact
// would mean integrating a cubic's arc length, which isn't worth it here.
function resampleCurve(S, curve, m = curve.pos.length) {
  const x = curve.pos, F = curve.face, n = x.length;
  const v = x.map((_, i) => surfaceVector(S, F[i], x[i], F[(i + 1) % n], x[(i + 1) % n]));
  const back = x.map((_, i) => surfaceVector(S, F[i], x[i], F[(i + n - 1) % n], x[(i + n - 1) % n]));
  const ahead = x.map((_, i) => surfaceVector(S, F[i], x[i], F[(i + 2) % n], x[(i + 2) % n]));
  const len = v.map(a => a.length());
  const L = len.reduce((a, b) => a + b, 0);
  const pos = [], face = [];
  let i = 0, s0 = 0;
  for (let k = 0; k < m; k++) {
    const s = k * L / m;
    while (i < n - 1 && s0 + len[i] <= s) s0 += len[i++];
    let w = false;
    if (s > s0 && len[i] > 0) {
      const t = (s - s0) / len[i];
      const offset = new THREE.Vector3()
        .addScaledVector(back[i], -t + 2 * t * t - t * t * t)
        .addScaledVector(v[i], t + 4 * t * t - 3 * t * t * t)
        .addScaledVector(ahead[i], -t * t + t * t * t)
        .multiplyScalar(0.5);
      w = offset.lengthSq() > 1e-30 && walk(S, F[i], x[i], offset.clone().normalize(), offset.length());
    }
    pos.push(w ? w.pos : x[i]);
    face.push(w ? w.face : F[i]);
  }
  curve.pos = pos;
  curve.face = face;
}

// Tangent vector at p (in face f's plane) pointing along shortestPath() toward q, with that path's length.
function surfaceVector(S, f, p, fq, q) {
  const pts = [p, ...shortestPath(S, f, p, fq, q), q];
  let len = 0;
  for (let k = 1; k < pts.length; k++) len += pts[k].distanceTo(pts[k - 1]);
  const first = pts.find(a => a.distanceToSquared(p) > 1e-24);
  return first ? first.clone().sub(p).setLength(len) : new THREE.Vector3();
}

