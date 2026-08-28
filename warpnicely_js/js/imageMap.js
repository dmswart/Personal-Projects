// imageMap.js
// Final step: warp a user-supplied source image onto the destination canvas
// using the converged mesh, one quad face at a time (split into two
// textured triangles using the standard canvas affine-transform trick).
(function () {
  'use strict';
  var WPN = window.WPN = window.WPN || {};

  // Nudge a triangle's vertices outward from its centroid by `amount`
  // pixels, purely for the clip region, so adjacent triangles overlap by a
  // hair instead of leaving anti-aliased seams between them.
  function dilateTriangle(pts, amount) {
    var cx = (pts[0].x + pts[1].x + pts[2].x) / 3;
    var cy = (pts[0].y + pts[1].y + pts[2].y) / 3;
    return pts.map(function (p) {
      var dx = p.x - cx, dy = p.y - cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: p.x + dx / len * amount, y: p.y + dy / len * amount };
    });
  }

  // Draw the portion of `image` inside triangle `src` (image pixel coords)
  // into triangle `dst` (canvas coords) on ctx.
  function drawTexturedTriangle(ctx, image, src, dst, seamPad) {
    ctx.save();
    var clipPts = dilateTriangle(dst, seamPad);
    ctx.beginPath();
    ctx.moveTo(clipPts[0].x, clipPts[0].y);
    ctx.lineTo(clipPts[1].x, clipPts[1].y);
    ctx.lineTo(clipPts[2].x, clipPts[2].y);
    ctx.closePath();
    ctx.clip();

    var x0 = src[0].x, y0 = src[0].y, x1 = src[1].x, y1 = src[1].y, x2 = src[2].x, y2 = src[2].y;
    var u0 = dst[0].x, v0 = dst[0].y, u1 = dst[1].x, v1 = dst[1].y, u2 = dst[2].x, v2 = dst[2].y;

    var denom = x0 * (y1 - y2) - y0 * (x1 - x2) + (x1 * y2 - x2 * y1);
    if (Math.abs(denom) < 1e-10) { ctx.restore(); return; }

    var a = (u0 * (y1 - y2) - y0 * (u1 - u2) + (u1 * y2 - u2 * y1)) / denom;
    var b = (v0 * (y1 - y2) - y0 * (v1 - v2) + (v1 * y2 - v2 * y1)) / denom;
    var c = (x0 * (u1 - u2) - u0 * (x1 - x2) + (x1 * u2 - x2 * u1)) / denom;
    var d = (x0 * (v1 - v2) - v0 * (x1 - x2) + (x1 * v2 - x2 * v1)) / denom;
    var e = (x0 * (y1 * u2 - y2 * u1) - y0 * (x1 * u2 - x2 * u1) + u0 * (x1 * y2 - x2 * y1)) / denom;
    var f = (x0 * (y1 * v2 - y2 * v1) - y0 * (x1 * v2 - x2 * v1) + v0 * (x1 * y2 - x2 * y1)) / denom;

    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }

  // mesh: converged WPN.Mesh (mesh.x/mesh.y are destination coords already
  // in `destBox` space). sourceBox: {x,y,width,height} the (row,col) grid
  // was originally sampled over, in the source image's own pixel space.
  // destToCanvasScale may be a single number (uniform) or {x, y} (independent
  // per axis, e.g. to fit a non-square image). If reverse is set, `image` is
  // read using destPoint and the result is drawn using sourcePoint instead
  // -- i.e. maps a destination-shaped image back onto the source's grid.
  // seamPad (canvas px, default 1.5) should scale up with canvas resolution
  // so triangle-edge overlap stays proportionally the same size.
  function warpImageToCanvas(image, mesh, sourceBox, canvas, destToCanvasScale, destOffset, reverse, seamPad) {
    if (seamPad === undefined) seamPad = 1.5;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function sourcePoint(idx) {
      var rc = mesh.rowCol(idx);
      return WPN.MeshUtil.gridToBox(mesh, rc.r, rc.c, sourceBox);
    }
    function destPoint(idx) {
      var scale = destToCanvasScale;
      var sx = typeof scale === 'number' ? scale : scale.x;
      var sy = typeof scale === 'number' ? scale : scale.y;
      return {
        x: (mesh.x[idx] - destOffset.x) * sx,
        y: (mesh.y[idx] - destOffset.y) * sy
      };
    }
    var readPoint = reverse ? destPoint : sourcePoint;
    var writePoint = reverse ? sourcePoint : destPoint;

    mesh.faces.forEach(function (face) {
      if (face.length === 4) {
        var a = face[0], b = face[1], c = face[2], d = face[3];
        var srcA = readPoint(a), srcB = readPoint(b), srcC = readPoint(c), srcD = readPoint(d);
        var dstA = writePoint(a), dstB = writePoint(b), dstC = writePoint(c), dstD = writePoint(d);
        drawTexturedTriangle(ctx, image, [srcA, srcB, srcC], [dstA, dstB, dstC], seamPad);
        drawTexturedTriangle(ctx, image, [srcA, srcC, srcD], [dstA, dstC, dstD], seamPad);
      } else if (face.length === 3) {
        // Exactly one corner of this grid cell is missing (e.g. a
        // silhouette's staircase edge) -- still interpolate imagery across
        // the triangle formed by the 3 vertices that are present.
        var p = face[0], q = face[1], w = face[2];
        drawTexturedTriangle(ctx, image, [readPoint(p), readPoint(q), readPoint(w)], [writePoint(p), writePoint(q), writePoint(w)], seamPad);
      }
    });
  }

  WPN.ImageMap = {
    drawTexturedTriangle: drawTexturedTriangle,
    warpImageToCanvas: warpImageToCanvas
  };
})();
