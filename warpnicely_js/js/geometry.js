// geometry.js
// Vector helpers and destination boundary shapes (circle, regular polygon,
// oval, Reuleaux triangle, lens, parallelogram).
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

  // Closest point on the arc of (center, radius) swept from startAngle to
  // endAngle (radians, going in the direction of increasing angle), plus
  // the distance. Falls back to whichever arc endpoint is nearer when the
  // point's own angle to center isn't within the swept range.
  function closestPointOnArc(point, center, radius, startAngle, endAngle) {
    if(startAngle > endAngle) {
      var temp = startAngle; startAngle = endAngle; endAngle = temp; // swap
    }
    var twoPi = 2 * Math.PI;
    var norm = function (a) { return ((a % twoPi) + twoPi) % twoPi; };
    var angle = Math.atan2(point.y - center.y, point.x - center.x);
    var span = norm(endAngle - startAngle);
    var rel = norm(angle - startAngle);
    if (rel <= span) {
      var x = center.x + radius * Math.cos(angle), y = center.y + radius * Math.sin(angle);
      return { x: x, y: y, dist: dist(point.x, point.y, x, y) };
    }
    var sx = center.x + radius * Math.cos(startAngle), sy = center.y + radius * Math.sin(startAngle);
    var ex = center.x + radius * Math.cos(endAngle), ey = center.y + radius * Math.sin(endAngle);
    var ds = dist(point.x, point.y, sx, sy), de = dist(point.x, point.y, ex, ey);
    return ds <= de ? { x: sx, y: sy, dist: ds } : { x: ex, y: ey, dist: de };
  }

  // Picks the nearest of a list of {x, y, dist} candidates (as returned by
  // closestPointOnSegment / closestPointOnArc), e.g. one per edge or arc of
  // a shape's boundary.
  function closestOf(candidates) {
    var best = candidates[0];
    for (var i = 1; i < candidates.length; i++) if (candidates[i].dist < best.dist) best = candidates[i];
    return { x: best.x, y: best.y };
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
    var candidates = [];
    for (var i = 0; i < this.sides; i++) {
      var a = this.vertices[i], b = this.vertices[(i + 1) % this.sides];
      candidates.push(closestPointOnSegment(x, y, a.x, a.y, b.x, b.y));
    }
    return closestOf(candidates);
  };

  // ---- Oval boundary shape: a square capped by two semicircles ----
  // Fully determined by center + width (square side length = cap diameter),
  // laid out with the caps on the left/right so the long axis is horizontal.
  function Oval(cx, cy, width) {
    this.cx = cx; this.cy = cy; this.width = width;
    var r = width / 2;
    this.r = r;
    this.c1 = { x: cx - r, y: cy }; // left cap center
    this.c2 = { x: cx + r, y: cy }; // right cap center
  }
  Oval.prototype.closestPoint = function (x, y) {
    var r = this.r, c1 = this.c1, c2 = this.c2, point = { x: x, y: y };
    var candidates = [
      closestPointOnArc(point, c2, r, -Math.PI / 2, Math.PI / 2), // right cap, bulges +x
      closestPointOnArc(point, c1, r, Math.PI / 2, 3 * Math.PI / 2), // left cap, bulges -x
      closestPointOnSegment(x, y, c1.x, c1.y - r, c2.x, c2.y - r), // top
      closestPointOnSegment(x, y, c1.x, c1.y + r, c2.x, c2.y + r) // bottom
    ];
    return closestOf(candidates);
  };

  // ---- Reuleaux triangle boundary shape ----
  // Equilateral triangle (vertex distance = circumradius) where each edge is
  // replaced by the arc, of radius = side length, centered on the opposite
  // vertex. Single size parameter: width = side length.
  function ReuleauxTriangle(cx, cy, width) {
    this.cx = cx; this.cy = cy; this.width = width;
    var circumradius = width / Math.sqrt(3);
    function vertex(angle) {
      return { x: cx + circumradius * Math.cos(angle), y: cy + circumradius * Math.sin(angle) };
    }
    this.C = vertex(-Math.PI / 2);    // top
    this.A = vertex(Math.PI / 6);     // bottom right
    this.B = vertex(5 * Math.PI / 6); // bottom left
    this.vertices = [this.A, this.B, this.C];
  }
  ReuleauxTriangle.prototype.closestPoint = function (x, y) {
    var p = { x: x, y: y }, w = this.width;
    var candidates = [
      closestPointOnArc(p, this.C, w, Math.PI / 3, 2 * Math.PI / 3),  // A to B, centered on C
      closestPointOnArc(p, this.A, w, -Math.PI, -2 * Math.PI / 3),    // B to C, centered on A
      closestPointOnArc(p, this.B, w, -Math.PI / 3, 0)                // C to A, centered on B
    ];
    return closestOf(candidates);
  };

  // ---- Lens boundary shape: two arcs meeting at 90 degrees ----
  // Two equal circles whose centers and cusp points all sit at distance
  // `radius` from the shape's center (the four points form a diamond) --
  // that configuration is exactly what makes the arcs meet at 90 degrees.
  function Lens(cx, cy, radius) {
    this.cx = cx; this.cy = cy; this.radius = radius;
    this.r = radius * Math.SQRT2; // arc radius
    this.top = { x: cx, y: cy - radius };
    this.bottom = { x: cx, y: cy + radius };
    this.leftCusp = { x: cx - radius, y: cy };
    this.rightCusp = { x: cx + radius, y: cy };
  }
  Lens.prototype.closestPoint = function (x, y) {
    var point = { x: x, y: y };
    function angleTo(center, p) { return Math.atan2(p.y - center.y, p.x - center.x); }
    var candidates = [
      closestPointOnArc(point, this.top, this.r, angleTo(this.top, this.rightCusp), angleTo(this.top, this.leftCusp)),
      closestPointOnArc(point, this.bottom, this.r, angleTo(this.bottom, this.leftCusp), angleTo(this.bottom, this.rightCusp))
    ];
    return closestOf(candidates);
  };

  // ---- Parallelogram boundary shape ----
  // Fixed template scaled by `scale`: (-1,-0.5), (0,-0.5), (1,0.5), (0,0.5).
  function Parallelogram(cx, cy, scale) {
    this.cx = cx; this.cy = cy; this.scale = scale;
    var base = [[-1, -0.5], [0, -0.5], [1, 0.5], [0, 0.5]];
    this.vertices = base.map(function (p) { return { x: cx + p[0] * scale, y: cy + p[1] * scale }; });
  }
  Parallelogram.prototype.closestPoint = function (x, y) {
    var candidates = [];
    for (var i = 0; i < 4; i++) {
      var a = this.vertices[i], b = this.vertices[(i + 1) % 4];
      candidates.push(closestPointOnSegment(x, y, a.x, a.y, b.x, b.y));
    }
    return closestOf(candidates);
  };

  // ---- Heart boundary shape ----
  function Heart(cx, cy, scale) {
    this.cx = cx; this.cy = cy; this.scale = scale;
    var yOffset = 0.914; // centers the [0, 2*sqrt2] template height on cy
    function pt(px, py) { return { x: cx + px * scale, y: cy + (py - yOffset) * scale }; }
    this.A = pt(-2, 0); this.B = pt(-1, 0); this.C = pt(0, 0);
    this.D = pt(1, 0); this.E = pt(2, 0);
    this.F = pt(-Math.SQRT2, Math.SQRT2); this.G = pt(Math.SQRT2, Math.SQRT2);
    this.H = pt(0, 2 * Math.SQRT2);
    this.scale = scale;
  }
  Heart.prototype.closestPoint = function (x, y) {
    var point = { x: x, y: y };
    var B = this.B, C = this.C, D = this.D, F = this.F, G = this.G, H = this.H;

    // Angles hardcoded relative to each arc's own center (0 = +x axis):
    // F and A sit at 3*PI/4 and PI from C; E and G sit at 0 and PI/4 from C.
    // A and C are antipodal around B (PI apart), as are C and E around D --
    // for those, -PI..0 (through -PI/2, the top) is the correct half, while
    // the other 180-degree half (0..PI, through the bottom) is not; that
    // choice can't be recovered from the endpoints themselves, so it's
    // hardcoded here instead of derived with atan2.
    var candidates = [
      // lines: H-F , G-H.
      // hips: F-A (arc r=2 centered C), E-G (arc r=2 centered C),
      // bumps: A-C (arc r=1 centered B), C-E (arc r=1 centered D),
      closestPointOnSegment(x, y, H.x, H.y, F.x, F.y),
      closestPointOnSegment(x, y, H.x, H.y, G.x, G.y),
      closestPointOnArc(point, C, 2*this.scale, 3 * Math.PI / 4, Math.PI),
      closestPointOnArc(point, C, 2*this.scale, 0, Math.PI / 4),
      closestPointOnArc(point, B, this.scale, -Math.PI, 0),
      closestPointOnArc(point, D, this.scale, -Math.PI, 0)
    ];
    return closestOf(candidates);
  };

  function makeBoundaryShape(spec) {
    if (spec.type === 'circle') return new Circle(spec.cx, spec.cy, spec.radius);
    if (spec.type === 'polygon') return new RegularPolygon(spec.cx, spec.cy, spec.radius, spec.sides, spec.rotation);
    if (spec.type === 'oval') return new Oval(spec.cx, spec.cy, spec.width);
    if (spec.type === 'reuleaux') return new ReuleauxTriangle(spec.cx, spec.cy, spec.width);
    if (spec.type === 'lens') return new Lens(spec.cx, spec.cy, spec.radius);
    if (spec.type === 'parallelogram') return new Parallelogram(spec.cx, spec.cy, spec.scale);
    if (spec.type === 'heart') return new Heart(spec.cx, spec.cy, spec.scale);
    throw new Error('Unknown boundary shape type: ' + spec.type);
  }

  WPN.Geometry = {
    dist: dist,
    closestPointOnSegment: closestPointOnSegment,
    closestPointOnArc: closestPointOnArc,
    Circle: Circle,
    RegularPolygon: RegularPolygon,
    Oval: Oval,
    ReuleauxTriangle: ReuleauxTriangle,
    Lens: Lens,
    Parallelogram: Parallelogram,
    Heart: Heart,
    makeBoundaryShape: makeBoundaryShape
  };
})(typeof window !== 'undefined' ? window : self);
