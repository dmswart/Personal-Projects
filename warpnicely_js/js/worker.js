// worker.js
// Runs the relaxation iterations off the UI thread. Yields between batches
// with setTimeout(0) so a 'cancel' message can always be observed promptly.
importScripts('geometry.js', 'mesh.js', 'algorithm.js');

var mesh = null;
var boundaryShape = null;
var cancelled = false;
var rng = WPN.Algorithm.makeRng(Date.now());

self.onmessage = function (e) {
  var msg = e.data;
  if (msg.type === 'start') {
    mesh = new WPN.Mesh(msg.rows, msg.cols, new Uint8Array(msg.valid));
    mesh.x.set(new Float64Array(msg.x));
    mesh.y.set(new Float64Array(msg.y));
    mesh.theta.set(new Float64Array(msg.theta));
    mesh.r.set(new Float64Array(msg.r));
    boundaryShape = WPN.Geometry.makeBoundaryShape(msg.boundaryShape);
    cancelled = false;
    runLoop(msg.options || {});
  } else if (msg.type === 'cancel') {
    cancelled = true;
  }
};

function snapshotBuffers() {
  return { x: mesh.x.slice().buffer, y: mesh.y.slice().buffer };
}

function postProgress(iterations, C) {
  var snap = snapshotBuffers();
  self.postMessage({ type: 'progress', iterations: iterations, C: C, x: snap.x, y: snap.y }, [snap.x, snap.y]);
}

function postDone(reason, iterations, C) {
  var snap = snapshotBuffers();
  self.postMessage({ type: 'done', reason: reason, iterations: iterations, C: C, x: snap.x, y: snap.y }, [snap.x, snap.y]);
}

function runLoop(options) {
  var batchSize = options.batchSize || 10000;
  var convergenceThreshold = (options.convergenceThreshold === undefined) ? 1.0 : options.convergenceThreshold;
  var maxIterations = options.maxIterations || 2000000;
  var iterations = 0;
  var prevC = WPN.Algorithm.computeConformality(mesh);

  function step() {
    if (cancelled) { postDone('cancelled', iterations, prevC); return; }
    try {
      WPN.Algorithm.runBatch(mesh, boundaryShape, batchSize, rng);
    } catch (err) {
      self.postMessage({ type: 'error', message: err && err.message ? err.message : String(err) });
      return;
    }
    iterations += batchSize;
    var C = WPN.Algorithm.computeConformality(mesh);
    postProgress(iterations, C);

    if (Math.abs(prevC - C) < convergenceThreshold) {
      postDone('converged', iterations, C);
      return;
    }
    prevC = C;
    if (iterations >= maxIterations) {
      postDone('maxIterations', iterations, C);
      return;
    }
    setTimeout(step, 0);
  }
  step();
}
