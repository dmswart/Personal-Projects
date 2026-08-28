// geometry.js
// Vector helpers and destination boundary shapes (circle / regular polygon).
// Loaded as a classic script in both the main thread and the Web Worker
// (via importScripts), so it must not touch the DOM.
(function (root) {
  'use strict';
  var WPN = root.WPN = root.WPN || {};

  function dist(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Closest point on segment a-b to point p, plus the distance.
  function closestPointOnSegment(px, py, ax, ay, bx, by) {
    var abx = bx - ax, aby = by - ay;
    var lenSq = abx * abx + aby * aby;
    var t = lenSq > 0 ? ((px - ax) * abx + (py - ay) * aby) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    var x = ax + abx * t, y = ay + aby * t;
    return { x: x, y: y, dist: dist(px, py, x, y) };
  }

  // ---- Circle boundary shape ----
  function Circle(cx, cy, radius) {
    this.cx = cx; this.cy = cy; this.radius = radius;
  }
  Circle.prototype.closestPoint = function (x, y) {
    var a = Math.atan2(y - this.cy, x - this.cx);
    if (x === this.cx && y === this.cy) a = -Math.PI / 2; // arbitrary, degenerate
    return {
      x: this.cx + this.radius * Math.cos(a),
      y: this.cy + this.radius * Math.sin(a)
    };
  };

  // ---- Regular polygon boundary shape ----
  function RegularPolygon(cx, cy, circumradius, sides, rotation) {
    this.cx = cx; this.cy = cy; this.circumradius = circumradius; this.sides = sides;
    this.rotation = (rotation === undefined) ? -Math.PI / 2 : rotation;
    this.vertices = [];
    for (var k = 0; k < sides; k++) {
      var a = this.rotation + k * 2 * Math.PI / sides;
      this.vertices.push({ x: cx + circumradius * Math.cos(a), y: cy + circumradius * Math.sin(a) });
    }
  }
  RegularPolygon.prototype.closestPoint = function (x, y) {
    var best = null;
    for (var i = 0; i < this.sides; i++) {
      var a = this.vertices[i], b = this.vertices[(i + 1) % this.sides];
      var c = closestPointOnSegment(x, y, a.x, a.y, b.x, b.y);
      if (!best || c.dist < best.dist) best = c;
    }
    return { x: best.x, y: best.y };
  };

  function makeBoundaryShape(spec) {
    if (spec.type === 'circle') return new Circle(spec.cx, spec.cy, spec.radius);
    if (spec.type === 'polygon') return new RegularPolygon(spec.cx, spec.cy, spec.radius, spec.sides, spec.rotation);
    throw new Error('Unknown boundary shape type: ' + spec.type);
  }

  WPN.Geometry = {
    dist: dist,
    closestPointOnSegment: closestPointOnSegment,
    Circle: Circle,
    RegularPolygon: RegularPolygon,
    makeBoundaryShape: makeBoundaryShape
  };
})(typeof window !== 'undefined' ? window : self);
