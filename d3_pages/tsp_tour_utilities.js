var calc_centroid = function(pts) {
    var result = new DMSLib.Point2D();
    pts.forEach( function(pt) {
        result = result.add(pt);
    });
    return result.div(pts.length);
};

var avg_R = function(pts) {
    var total = 0;

    pts.forEach( function(pt) {
        total += pt.R();
    });
    return total / pts.length;
};

var is_cw = function(pts) {
    // get lowest rightmost point
    var lr = 0, idx;
    for(idx = 1; idx < pts.length; idx++) {
        if( (pts[idx].y < pts[lr].y) || (pts[idx].y === pts[lr].y && pts[idx].x > pts[lr].x) ) {
            lr = idx;
        }
    }

    var a, b, c;
    a = pts[(lr + pts.length-1) % pts.length];
    b = pts[lr];
    c = pts[(lr + 1) % pts.length];

    return (a.x * b.y - a.y * b.x +
        a.y * c.x - a.x * c.y +
        b.x * c.y - c.x * b.y) > 0.0;
};

var normalize = function(pts) {
    var centroid = calc_centroid(pts),
        i,
        factor;

    for (i = 0; i < pts.length; i++) {
        pts[i] = pts[i].sub(centroid);
    }

    factor = 0.5 / avg_R(pts);
    for (i = 0; i < pts.length; i++) {
        pts[i].scale(factor);
    }
};

var copy_pts = function(pts) {
    var result = [];

    pts.forEach(function(pt) {
        result.push(new DMSLib.Point2D(pt));
    });

    return result;
};

var movement = function(pts, saved_pts) {
    var result = 0;
    for (var i = 0; i < pts.length; i++) {
        result += pts[i].sub(saved_pts[i]).R();
    }
    return result / pts.length;
};

var match_other = function(pts, other) {
    if(other.length !== pts.length) {
        return;
    }

    // fix winding
    if(is_cw(other) !== is_cw(pts)) {
        pts = pts.reverse();
    }

    var best_mvmt = movement(pts, other);
    var result = pts;

    for(shift = 0; shift<pts.length; shift++) {
        var candidate = pts.slice(shift, pts.length).concat(pts.slice(0, shift));
        var mvmt = movement(candidate, other)
        if(mvmt < best_mvmt) {
            best_mvmt = mvmt;
            result = candidate;
        }
    }

    return result;
};


// returns true iff the line from a1->a2 intersects with b1->b2
var edge_intersects_edge = function(a1, a2, b1, b2) {
    // shortcut
    if( Math.max(a1.x, a2.x) < Math.min(b1.x, b2.x) ||
        Math.max(b1.x, b2.x) < Math.min(a1.x, a2.x) ||
        Math.max(a1.y, a2.y) < Math.min(b1.y, b2.y) ||
        Math.max(b1.y, b2.y) < Math.min(a1.y, a2.y) ) {
        return false;
    }

    det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y);
    if (det === 0) return false;

    lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
    gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
};