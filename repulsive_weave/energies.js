// Energies on a closed curve. Each has total(curve, S) and local(curve, S, i): the energy whose
// change under moving point i gives that point's step.

// TODO (point-based tangent-point energy):
// 1. Without Resample, two crossing edges settle with the crossing centered at both edges' midpoints --
//    an edge doesn't seem free to slide along the OTHER edge's direction, even though that would stay
//    orthogonal and should be fine. May mean point-pair energy should really be edge-pair (integrate
//    over where along the edge the crossing falls, not just the two endpoints). Fix this first.
// 2. Sometimes a 3-way crossing settles at 120 degrees with a small triangle between the 3 edges that
//    doesn't grow -- want each edge pushed away from the other two's crossing (away from the small
//    triangle, growing it). Suspect this is caused by #1; revisit after that's fixed.
// 3. Without Resample the curve spaces out evenly but isn't smooth; with Resample it's smooth but loses
//    that even spacing. Want both at once -- maybe Resample should preserve local spacing ratios instead
//    of forcing strict uniform arc length?

const ALPHA = 2, BETA = 4.5
const GAMMA = 2.0;
const COULOMB_ALPHA = 2, COULOMB_WEIGHT = 1.9;

// Equation 3 of "Repulsive Curves": k(p, q, T) = |T x (p - q)|^alpha / |p - q|^beta, with T = Tp.
function tangentPointKernel(p, q, Tp, Tq) {
  const dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z;
  const cx = Tp.y * dz - Tp.z * dy, cy = Tp.z * dx - Tp.x * dz, cz = Tp.x * dy - Tp.y * dx;
  const c2 = cx * cx + cy * cy + cz * cz, d2 = dx * dx + dy * dy + dz * dz;
  return Math.pow(c2, ALPHA / 2) / Math.pow(d2, BETA / 2);
}

// Forgives orthogonality: |Tp . Tq|^gamma times the tangent-point kernel. The tangent-point kernel is
// zero whenever p - q is parallel to Tp (e.g. two straight, aligned strands), so add a small Coulomb
// term (Repulsive Curves Equation 2: 1/|p - q|^alpha) to punish coincident strands.
function obliqueKernel(p, q, Tp, Tq) {
  return Math.pow(Math.abs(Tp.dot(Tq)), GAMMA) * tangentPointKernel(p, q, Tp, Tq) +
    COULOMB_WEIGHT / Math.pow(p.distanceTo(q), 2.0);
}

// return tangent of catmull rom spline that goes through the points in x at index i
function tangentVector(x, i) {
  const n = x.length;
  const next = x[(i + 1) % n];
  const prev = x[(i + n - 1) % n];
  return new THREE.Vector3().subVectors(next, prev).multiplyScalar(0.5);
}

// What point i feels from nearby points (via curve.grid), each carrying its own point tangent.
// Excludes x's two immediate neighbors (done inside nearbyIndices, since it also has to exclude x itself).
// Like calcStep, this only accumulates influence onto x, so the flow isn't the exact gradient of total().
function pairTerm(curve, i, k) {
  const x = curve.pos, n = x.length, Px = x[i], Tx = tangentVector(x, i).normalize();
  let e = 0;
  for (const m of nearbyIndices(curve.grid, i, n)) {
    const Py = x[m];
    const Ty = tangentVector(x, m), speed = Ty.length();
    e += k(Py, Px, Ty.normalize(), Tx) * speed;
  }
  return e;
}

function makePairEnergy(k) {
  const CELL_SIZE_FACTOR = 3; 
  return {
    total(curve) {
      curve.grid = buildGrid(curve.pos, CELL_SIZE_FACTOR * curveLength(curve) / curve.pos.length);
      let e = 0;
      for (let i = 0; i < curve.pos.length; i++) e += pairTerm(curve, i, k);
      return e;
    },
    local(curve, S, i) {
      if (!curve.grid) curve.grid = buildGrid(curve.pos, CELL_SIZE_FACTOR * curveLength(curve) / curve.pos.length);
      return pairTerm(curve, i, k);
    },
  };
}

const TangentPointEnergy = makePairEnergy(tangentPointKernel);
const ObliqueCrossingEnergy = makePairEnergy(obliqueKernel);

// Signed turning angle at point j, measured in the tangent plane of the smooth (interpolated) normal.
function turningAngle(curve, S, j) {
  const x = curve.pos, n = x.length;
  const p = x[j], a = x[(j + n - 1) % n], b = x[(j + 1) % n];
  const N = normalAt(S, curve.face[j], p);
  const u = new THREE.Vector3().subVectors(p, a), v = new THREE.Vector3().subVectors(b, p);
  u.addScaledVector(N, -u.dot(N));
  v.addScaledVector(N, -v.dot(N));
  return Math.atan2(new THREE.Vector3().crossVectors(u, v).dot(N), u.dot(v));
}

// Discrete integral of squared geodesic curvature: sum of theta_j^2 / s_j, where theta_j is the
// turning angle at point j and s_j is the average length of the two adjacent edges.
function geodesicTerm(curve, S, j) {
  const x = curve.pos, n = x.length, p = x[j];
  const s = (p.distanceTo(x[(j + n - 1) % n]) + p.distanceTo(x[(j + 1) % n])) / 2;
  const theta = turningAngle(curve, S, j);
  return theta * theta / s;
}

const GeodesicCurvatureEnergy = {
  total(curve, S) {
    let e = 0;
    for (let j = 0; j < curve.pos.length; j++) e += geodesicTerm(curve, S, j);
    return e;
  },
  local(curve, S, i) {
    const n = curve.pos.length;
    return geodesicTerm(curve, S, (i + n - 1) % n) + geodesicTerm(curve, S, i) +
           geodesicTerm(curve, S, (i + 1) % n);
  },
};

// Growth: snapshot angles and edge lengths at Run; every edge wants GROWTH x its length, every angle
// wants its snapshot value. In the plane the minimum is the scaled curve; on a surface Gauss-Bonnet
// forbids that and the least-squares compromise spreads the angle changes along the curve.
const GROWTH = Math.cbrt(2), ANGLE_WEIGHT = 10;

function makeGrowthEnergy(curve, S) {
  resampleCurve(S, curve, Math.round(GROWTH * curve.pos.length)); // so edges grow back to about their current length.
  const n = curve.pos.length;
  const theta0 = curve.pos.map((_, j) => turningAngle(curve, S, j));
  const target = curve.pos.map((p, e) => GROWTH * p.distanceTo(curve.pos[(e + 1) % n]));
  const bend = (c, S, j) => {
    const d = turningAngle(c, S, j) - theta0[j];
    return ANGLE_WEIGHT * d * d;
  };
  const stretch = (c, e) => {
    const d = c.pos[e].distanceTo(c.pos[(e + 1) % n]) / target[e] - 1;
    return d * d;
  };
  return {
    total(c, S) {
      let e = 0;
      for (let j = 0; j < n; j++) e += bend(c, S, j) + stretch(c, j);
      return e;
    },
    local(c, S, i) {
      const a = (i + n - 1) % n, b = (i + 1) % n;
      return bend(c, S, a) + bend(c, S, i) + bend(c, S, b) + stretch(c, a) + stretch(c, i);
    },
  };
}