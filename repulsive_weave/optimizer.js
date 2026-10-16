// Gradient flow, as in doSphereStep() in globeweaver/wormsphere.js: each point's step is the negative
// gradient of energy.local(), by central differences along T (toward the next point) and N = normal x T.
// All points move along the surface at once, then smoothCurve() optionally runs.
// Before scaling, each step can be averaged with its neighbours stepAvg times, damping zigzags.
// Steps are scaled uniformly so the largest is maxStep = stepFrac * sqrt(surface area) / n.
// Stops after maxIters, or if the gradient vanishes.
class GradientFlow {
  constructor(S, curve, energy, { stepFrac, maxIters, smooth, stepAvg }) {
    Object.assign(this, { S, curve, energy, maxIters, smooth, stepAvg });
    this.E = energy.total(curve, S);
    this.L0 = curveLength(curve);
    this.maxStep0 = this.maxStep = stepFrac * Math.sqrt(S.area) / curve.pos.length;
    this.iters = 0;
    this.g0 = null;
    this.gRatio = 1;
    this.done = false;
  }

  // Descent direction for point i (a 3D vector in its tangent plane).
  descent(i, h) {
    const { S, curve, energy } = this, x = curve.pos, n = x.length, p = x[i];
    const normal = normalAt(S, curve.face[i], p);
    const T = new THREE.Vector3().subVectors(x[(i + 1) % n], p);
    T.addScaledVector(normal, -T.dot(normal)).normalize();
    const N = new THREE.Vector3().crossVectors(normal, T);
    const at = (d, s) => {
      x[i] = p.clone().addScaledVector(d, s);
      return energy.local(curve, S, i);
    };
    const gT = (at(T, -h) - at(T, h)) / (2 * h);
    const gN = (at(N, -h) - at(N, h)) / (2 * h);
    x[i] = p;
    return T.multiplyScalar(gT).addScaledVector(N, gN);
  }

  step() {
    const { S, curve } = this, x = curve.pos, n = x.length;
    const avg = curveLength(curve) / n;
    const g = x.map((_, i) => this.descent(i, 1e-4 * avg));
    averageSteps(S, curve, g, this.stepAvg);
    const gMax = Math.max(...g.map(v => v.length()));
    if (this.g0 === null) this.g0 = gMax;
    this.gRatio = gMax / this.g0;
    if (!(gMax > 0)) {
      this.done = true;
      return;
    }
    const scale = this.maxStep / gMax;
    for (let i = 0; i < n; i++) {
      // Rotate (not project) from the smooth tangent plane into the flat face, so steps keep their angle to a crease.
      const q = new THREE.Quaternion().setFromUnitVectors(normalAt(S, curve.face[i], x[i]), S.fnorm[curve.face[i]]);
      moveAlongSurface(S, curve, i, g[i].multiplyScalar(scale).applyQuaternion(q));
    }


    if (this.smooth) smoothCurve(S, curve);

    this.E = this.energy.total(curve, S);

    if (++this.iters >= this.maxIters) this.done = true;
  }
}

// Step averaging: a cheap preconditioner, i.e. a "Sobolev gradient" (Neuberger 1997; for curves,
// Sundaramoorthi et al., "Sobolev Active Contours", 2007; Repulsive Curves does it exactly with a
// fractional Sobolev solve). Curvature energies are stiff: a wiggle of wavelength L has a gradient
// ~ (n/L)^4 times that of a whole-curve mode, so the largest step (which sets the uniform scale) is
// always wiggle noise and the global shape barely moves. Each (1/4, 1/2, 1/4) pass scales a mode of
// wavelength L points by cos^2(pi/L): a 2-point zigzag vanishes in one pass, but with n = 100, 4-, 8- and
// 16-point modes need roughly 20, 60, 190 passes to fall back to the whole-curve gradient's size.
// Every factor is >= 0, so the averaged step is still downhill and fixed points don't change.
// Averages the step vectors g (one per curve point) in place.
function averageSteps(S, curve, g, passes) {
  const x = curve.pos, n = x.length;
  for (let k = 0; k < passes; k++) {
    const s = g.map((v, i) => v.clone().multiplyScalar(2).add(g[(i + n - 1) % n]).add(g[(i + 1) % n])
      .multiplyScalar(0.25));
    g.forEach((v, i) => {
      const N = normalAt(S, curve.face[i], x[i]);
      v.copy(s[i]).addScaledVector(N, -s[i].dot(N)); // neighbours' tangent planes differ slightly
    });
  }
}
