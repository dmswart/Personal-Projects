// mesh.js
// Grid mesh construction: validity sampling (rectangle or silhouette mask),
// neighbor/boundary bookkeeping, and initial placement into the destination
// boundary shape. The Mesh class itself is DOM-free so it can be constructed
// inside the Web Worker; only sampleSilhouette() needs canvas/Image (main
// thread only).
(function (root) {
  'use strict';
  var WPN = root.WPN = root.WPN || {};
  var G = WPN.Geometry;

  var DIRS = ['N', 'S', 'E', 'W'];

  function Mesh(rows, cols, valid) {
    this.rows = rows;
    this.cols = cols;
    this.valid = valid; // Uint8Array length rows*cols
    var n = rows * cols;
    this.x = new Float64Array(n);
    this.y = new Float64Array(n);
    this.theta = new Float64Array(n);
    this.r = new Float64Array(n);
    // Debug aid: each boundary vertex's fraction (0..1) around the traced
    // contour loop, so callers can e.g. color-code the boundary order.
    // -1 for non-boundary (or not-yet-placed) vertices.
    this.boundaryT = new Float64Array(n).fill(-1);
    this.constrained = new Uint8Array(n);
    this.validIndices = [];

    for (var rIdx = 0; rIdx < rows; rIdx++) {
      for (var cIdx = 0; cIdx < cols; cIdx++) {
        var i = this.idx(rIdx, cIdx);
        if (!this.valid[i]) continue;
        this.validIndices.push(i);
        var missing = false;
        for (var d = 0; d < DIRS.length; d++) {
          if (this.neighborIdx(rIdx, cIdx, DIRS[d]) < 0) { missing = true; break; }
        }
        this.constrained[i] = missing ? 1 : 0;
      }
    }

    // Precompute edges (E and S direction only, to avoid duplicates) for
    // rendering, and image-mapping faces: a quad [nw,ne,se,sw] when all 4
    // corners of a grid cell are valid, or a single triangle with just the
    // 3 present corners (in nw,ne,se,sw order) when exactly one corner is
    // missing -- e.g. at a silhouette's staircase edge -- so imagery can
    // still be interpolated across that half of the cell.
    this.edges = [];
    this.faces = [];
    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        var v = this.idx(r2, c2);
        if (!this.valid[v]) continue;
        var e = this.neighborIdx(r2, c2, 'E');
        var s = this.neighborIdx(r2, c2, 'S');
        if (e >= 0) this.edges.push([v, e]);
        if (s >= 0) this.edges.push([v, s]);
      }
    }
    for (var r3 = 0; r3 < rows - 1; r3++) {
      for (var c3 = 0; c3 < cols - 1; c3++) {
        var nw = this.idx(r3, c3), ne = this.idx(r3, c3 + 1);
        var sw = this.idx(r3 + 1, c3), se = this.idx(r3 + 1, c3 + 1);
        var corners = [nw, ne, se, sw];
        var present = corners.filter(function (idx) { return this.valid[idx]; }, this);
        if (present.length >= 3) this.faces.push(present);
      }
    }
  }

  Mesh.prototype.idx = function (r, c) { return r * this.cols + c; };

  Mesh.prototype.rowCol = function (i) { return { r: Math.floor(i / this.cols), c: i % this.cols }; };

  Mesh.prototype.neighborIdx = function (r, c, dir) {
    var nr = r, nc = c;
    if (dir === 'N') nr = r - 1;
    else if (dir === 'S') nr = r + 1;
    else if (dir === 'E') nc = c + 1;
    else if (dir === 'W') nc = c - 1;
    if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return -1;
    var i = this.idx(nr, nc);
    return this.valid[i] ? i : -1;
  };

  // ---- Silhouette / validity mask helpers ----

  // Flood-fill to keep only the largest 4-connected component of `valid`.
  function keepLargestComponent(rows, cols, valid) {
    var visited = new Uint8Array(rows * cols);
    var bestComp = null, bestSize = 0;
    for (var start = 0; start < rows * cols; start++) {
      if (!valid[start] || visited[start]) continue;
      var stack = [start];
      visited[start] = 1;
      var comp = [start];
      while (stack.length) {
        var cur = stack.pop();
        var r = Math.floor(cur / cols), c = cur % cols;
        var neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
        for (var k = 0; k < 4; k++) {
          var nr = neighbors[k][0], nc = neighbors[k][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          var ni = nr * cols + nc;
          if (valid[ni] && !visited[ni]) {
            visited[ni] = 1;
            stack.push(ni);
            comp.push(ni);
          }
        }
      }
      if (comp.length > bestSize) { bestSize = comp.length; bestComp = comp; }
    }
    var out = new Uint8Array(rows * cols);
    if (bestComp) for (var i = 0; i < bestComp.length; i++) out[bestComp[i]] = 1;
    return out;
  }

  // Drop valid points that have zero valid 4-neighbors (can't be meshed).
  function removeIsolated(rows, cols, valid) {
    var out = valid.slice();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        if (!out[i]) continue;
        var hasNeighbor = false;
        var deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var k = 0; k < 4; k++) {
          var nr = r + deltas[k][0], nc = c + deltas[k][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (out[nr * cols + nc]) { hasNeighbor = true; break; }
        }
        if (!hasNeighbor) out[i] = 0;
      }
    }
    return out;
  }

  // Sample a black & white (or inverted) silhouette image onto a rows x cols
  // grid. Pixels with luminance below 128 count as "inside" the shape,
  // unless `invert` is set. Requires document/canvas (main thread only).
  function sampleSilhouette(image, rows, cols, invert) {
    var canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, cols, rows);
    var data = ctx.getImageData(0, 0, cols, rows).data;
    var valid = new Uint8Array(rows * cols);
    for (var i = 0; i < rows * cols; i++) {
      var o = i * 4;
      var lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
      var alpha = data[o + 3];
      var inside = (alpha > 10) && (lum < 128);
      if (invert) inside = (alpha > 10) && !inside;
      valid[i] = inside ? 1 : 0;
    }
    valid = keepLargestComponent(rows, cols, valid);
    valid = removeIsolated(rows, cols, valid);
    return valid;
  }

  function allValid(rows, cols) {
    var valid = new Uint8Array(rows * cols);
    valid.fill(1);
    return valid;
  }

  // Map a mesh (row, col) to a point inside `box` = {x, y, width, height}.
  // Shared by the SVG rendering (draw.js) and the image warp (imageMap.js).
  function gridToBox(mesh, row, col, box) {
    var fx = mesh.cols > 1 ? col / (mesh.cols - 1) : 0.5;
    var fy = mesh.rows > 1 ? row / (mesh.rows - 1) : 0.5;
    return { x: box.x + fx * box.width, y: box.y + fy * box.height };
  }

  // Order boundary vertices by walking the contour locally (8-connected,
  // least-turn greedy walk) rather than sorting by angle around the global
  // centroid. A global angle sort breaks down on concave / notched shapes
  // (e.g. a shape with a thin appendage) because points that are far apart
  // along the true perimeter can share a similar angle from the centroid.
  function traceBoundaryLoop(mesh, boundary) {
    var byIdx = Object.create(null);
    boundary.forEach(function (b) { byIdx[b.idx] = b; });

    function neighborsOf(b) {
      var out = [];
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          var nr = b.row + dr, nc = b.col + dc;
          if (nr < 0 || nr >= mesh.rows || nc < 0 || nc >= mesh.cols) continue;
          var entry = byIdx[mesh.idx(nr, nc)];
          if (entry) out.push(entry);
        }
      }
      return out;
    }
    // True (orthogonal N/S/E/W) mesh edges, as opposed to the diagonal
    // 8-connectivity only used to bridge gaps at pixel-staircase corners.
    function isOrthogonal(a, b) { return a.row === b.row || a.col === b.col; }
    function angleOf(a, b) { return Math.atan2(b.row - a.row, b.col - a.col); }
    function turnAmount(heading, angle) {
      var d = angle - heading;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      return Math.abs(d);
    }

    var start = boundary[0];
    for (var s = 1; s < boundary.length; s++) {
      var b = boundary[s];
      if (b.row < start.row || (b.row === start.row && b.col < start.col)) start = b;
    }

    var visited = Object.create(null);
    var order = [start];
    visited[start.idx] = true;
    var current = start, heading = null;

    while (order.length < boundary.length) {
      var candidates = neighborsOf(current).filter(function (n) { return !visited[n.idx]; });
      // Prefer real mesh edges (orthogonal neighbors) over diagonal-only
      // shortcuts. Without this, a diagonal "least turn" candidate can look
      // more attractive than the actual next cell along the boundary at a
      // pixel-staircase corner, stranding that cell to be picked up later
      // by the nearest-point fallback below — which can jump clear across
      // the shape and badly scramble the arc-length ordering.
      var orthoCandidates = candidates.filter(function (n) { return isOrthogonal(current, n); });
      if (orthoCandidates.length > 0) candidates = orthoCandidates;
      var next;
      if (candidates.length === 0) {
        // Fallback: jump to the nearest unvisited boundary point.
        var remaining = boundary.filter(function (b2) { return !visited[b2.idx]; });
        if (remaining.length === 0) break;
        next = remaining[0];
        var bestD = G.dist(current.col, current.row, next.col, next.row);
        for (var ri = 1; ri < remaining.length; ri++) {
          var d2 = G.dist(current.col, current.row, remaining[ri].col, remaining[ri].row);
          if (d2 < bestD) { bestD = d2; next = remaining[ri]; }
        }
      } else if (heading === null) {
        candidates.sort(function (a, b2) { return angleOf(current, a) - angleOf(current, b2); });
        next = candidates[0];
      } else {
        next = candidates[0];
        var bestTurn = turnAmount(heading, angleOf(current, next));
        for (var ci = 1; ci < candidates.length; ci++) {
          var t = turnAmount(heading, angleOf(current, candidates[ci]));
          if (t < bestTurn) { bestTurn = t; next = candidates[ci]; }
        }
      }
      heading = angleOf(current, next);
      visited[next.idx] = true;
      order.push(next);
      current = next;
    }
    return order;
  }

  // ---- Initial placement ----
  // Interior points get a simple bounding-box guess; boundary points get
  // snapped to the nearest point on the destination boundary shape and left
  // for the relaxation algorithm to untangle any resulting folds. The traced
  // contour order (see traceBoundaryLoop) is only used to assign each point
  // an arc-length fraction for the rainbow debug coloring.
  function computeInitialPlacement(mesh, boundaryShape, box) {
    // box = {x, y, width, height} destination-space box to map the raw
    // (row, col) grid into, before boundary vertices get snapped to the
    // shape's perimeter.
    for (var k = 0; k < mesh.validIndices.length; k++) {
      var i = mesh.validIndices[k];
      var rc = mesh.rowCol(i);
      var p0 = gridToBox(mesh, rc.r, rc.c, box);
      mesh.x[i] = p0.x;
      mesh.y[i] = p0.y;
    }

    // Gather boundary (constrained) vertices, then order them by tracing
    // the contour locally.
    var boundary = [];
    for (var k2 = 0; k2 < mesh.validIndices.length; k2++) {
      var i2 = mesh.validIndices[k2];
      if (!mesh.constrained[i2]) continue;
      var rc2 = mesh.rowCol(i2);
      boundary.push({ idx: i2, row: rc2.r, col: rc2.c });
    }
    if (boundary.length === 0) return;
    boundary = traceBoundaryLoop(mesh, boundary);

    // Cumulative distance (in row/col space) around the loop, used only to
    // give each boundary point an arc-length fraction for the rainbow color.
    var cumulative = [0];
    var total = 0;
    for (var m = 1; m <= boundary.length; m++) {
      var a = boundary[m - 1], b = boundary[m % boundary.length];
      total += G.dist(a.col, a.row, b.col, b.row);
      cumulative.push(total);
    }
    if (total === 0) total = 1;

    for (var n = 0; n < boundary.length; n++) {
      var idx = boundary[n].idx;
      var snapped = boundaryShape.closestPoint(mesh.x[idx], mesh.y[idx]);
      mesh.x[idx] = snapped.x;
      mesh.y[idx] = snapped.y;
      mesh.boundaryT[idx] = cumulative[n] / total;
    }
  }

  WPN.Mesh = Mesh;
  WPN.MeshUtil = {
    keepLargestComponent: keepLargestComponent,
    removeIsolated: removeIsolated,
    sampleSilhouette: sampleSilhouette,
    allValid: allValid,
    gridToBox: gridToBox,
    computeInitialPlacement: computeInitialPlacement
  };
})(typeof window !== 'undefined' ? window : self);
