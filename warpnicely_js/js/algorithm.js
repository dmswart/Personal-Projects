// algorithm.js
// The core "Warping Pictures Nicely" iterative relaxation (Swart, Bridges
// 2011). Pure functions operating on a WPN.Mesh's typed arrays, safe to run
// inside a Web Worker. See Table 1 of the paper for the pseudocode this
// mirrors.
(function (root) {
  'use strict';
  var WPN = root.WPN = root.WPN || {};

  var HALF_PI = Math.PI / 2;

  // Endpoint of one arm of vertex i's "plus sign" (position + theta + r),
  // where armOffset is the angle of that arm relative to theta (0=E, +90=N
  // in our row/col-consistent convention, since screen y grows downward the
  // literal compass direction doesn't matter as long as it's self-consistent).
  function armEndpoint(mesh, i, armOffset) {
    var a = mesh.theta[i] + armOffset;
    return {
      x: mesh.x[i] + mesh.r[i] * Math.cos(a),
      y: mesh.y[i] + mesh.r[i] * Math.sin(a)
    };
  }

  // Tweak a single vertex per the paper's Table 1, then (if it is a boundary
  // vertex) snap it to the nearest point on the destination boundary shape.
  function tweakVertex(mesh, boundaryShape, i) {
    var r = Math.floor(i / mesh.cols), c = i % mesh.cols;
    var n = mesh.neighborIdx(r, c, 'N');
    var s = mesh.neighborIdx(r, c, 'S');
    var e = mesh.neighborIdx(r, c, 'E');
    var w = mesh.neighborIdx(r, c, 'W');

    var count = (n >= 0 ? 1 : 0) + (s >= 0 ? 1 : 0) + (e >= 0 ? 1 : 0) + (w >= 0 ? 1 : 0);
    if (count === 0) return; // isolated point, nothing to do

    var px = 0, py = 0, theta = 0, rr = 0;
    var vx = mesh.x[i], vy = mesh.y[i];

    if (n >= 0 && s >= 0) {
      px += mesh.x[n] + mesh.x[s];
      py += mesh.y[n] + mesh.y[s];
      theta += 2 * (Math.atan2(mesh.y[n] - mesh.y[s], mesh.x[n] - mesh.x[s]) + HALF_PI);
      rr += WPN.Geometry.dist(mesh.x[n], mesh.y[n], vx, vy) + WPN.Geometry.dist(mesh.x[s], mesh.y[s], vx, vy);
    } else if (n >= 0) { // south neighbor missing: v is on the boundary
      var epS = armEndpoint(mesh, n, HALF_PI); // south arm of N
      px += epS.x; py += epS.y;
      theta += Math.atan2(mesh.y[n] - vy, mesh.x[n] - vx) + HALF_PI;
      rr += WPN.Geometry.dist(mesh.x[n], mesh.y[n], vx, vy);
    } else if (s >= 0) { // north neighbor missing
      var epN = armEndpoint(mesh, s, -HALF_PI); // north arm of S
      px += epN.x; py += epN.y;
      theta += Math.atan2(mesh.y[s] - vy, mesh.x[s] - vx) - HALF_PI;
      rr += WPN.Geometry.dist(mesh.x[s], mesh.y[s], vx, vy);
    }

    if (e >= 0 && w >= 0) {
      px += mesh.x[e] + mesh.x[w];
      py += mesh.y[e] + mesh.y[w];
      theta += 2 * (Math.atan2(mesh.y[e] - mesh.y[w], mesh.x[e] - mesh.x[w]));
      rr += WPN.Geometry.dist(mesh.x[e], mesh.y[e], vx, vy) + WPN.Geometry.dist(mesh.x[w], mesh.y[w], vx, vy);
    } else if (e >= 0) { // west neighbor missing
      var epW = armEndpoint(mesh, e, Math.PI); // west arm of E
      px += epW.x; py += epW.y;
      theta += Math.atan2(mesh.y[e] - vy, mesh.x[e] - vx);
      rr += WPN.Geometry.dist(mesh.x[e], mesh.y[e], vx, vy);
    } else if (w >= 0) { // east neighbor missing
      var epE = armEndpoint(mesh, w, 0); // east arm of W
      px += epE.x; py += epE.y;
      theta += Math.atan2(mesh.y[w] - vy, mesh.x[w] - vx) - Math.PI;
      rr += WPN.Geometry.dist(mesh.x[w], mesh.y[w], vx, vy);
    }

    px /= count; py /= count; theta /= count; rr /= count;

    if (mesh.constrained[i]) {
      var proj = boundaryShape.closestPoint(px, py);
      px = proj.x; py = proj.y;
    }

    mesh.theta[i] = theta; mesh.r[i] = rr;
    mesh.x[i] = px; mesh.y[i] = py;
  }

  // Conformality metric C from the paper: sum, over every vertex and every
  // existing neighbor direction, of the (normalized) distance between that
  // vertex's plus-sign arm endpoint and the neighbor's actual position.
  function computeConformality(mesh) {
    var C = 0;
    for (var k = 0; k < mesh.validIndices.length; k++) {
      var i = mesh.validIndices[k];
      var r = Math.floor(i / mesh.cols), c = i % mesh.cols;
      if (mesh.r[i] <= 0) continue;
      var dirs = [
        ['N', -HALF_PI], ['S', HALF_PI], ['E', 0], ['W', Math.PI]
      ];
      for (var d = 0; d < dirs.length; d++) {
        var ni = mesh.neighborIdx(r, c, dirs[d][0]);
        if (ni < 0) continue;
        var ep = armEndpoint(mesh, i, dirs[d][1]);
        C += WPN.Geometry.dist(ep.x, ep.y, mesh.x[ni], mesh.y[ni]) / mesh.r[i];
      }
    }
    return C;
  }

  // Simple xorshift-ish PRNG so runs can be reproducible if ever needed.
  function makeRng(seed) {
    var s = seed >>> 0 || 123456789;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function runBatch(mesh, boundaryShape, iterations, rng) {
    var n = mesh.validIndices.length;
    if (n === 0) return;
    for (var it = 0; it < iterations; it++) {
      var pick = mesh.validIndices[(rng() * n) | 0];
      tweakVertex(mesh, boundaryShape, pick);
    }
  }

  WPN.Algorithm = {
    tweakVertex: tweakVertex,
    computeConformality: computeConformality,
    runBatch: runBatch,
    makeRng: makeRng
  };
})(typeof window !== 'undefined' ? window : self);
