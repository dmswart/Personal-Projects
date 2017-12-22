var tourAngle = DMSLib.Point2D.angle;

var getPointspread = function(pts) {
    var center = calcCentroid(pts);
    
    var avgR = 0;
    pts.forEach(function(pt) {
        avgR += pt.sub(center).R();
    });
    avgR /= pts.length;

    return {center: center, avgR: avgR};
};

var setPointspread = function(pts, target) {
    // first offset them to the origin.
    var center = calcCentroid(pts);
    var i;
    for (i = 0; i < pts.length; i++) {
        pts[i] = pts[i].sub(center);
    }

    // now set radius;
    var factor = target.avgR / avgR(pts);
    for (i = 0; i < pts.length; i++) {
        pts[i] = pts[i].mul(factor);
    }

    // now offset it to the target center
    for (i = 0; i < pts.length; i++) {
        pts[i] = pts[i].add(target.center);
    }
};

var calcCentroid = function(pts, weights) {
    var result = pts[0].mul(0);
    var sum = 0;

    for (var i = 0; i < pts.length; i++) {
        var weight = weights == undefined ? 1 : weights[i];
        result = result.add(pts[i].mul(weight));
        sum += weight;
    }
    return result.div(sum);
};

var avgR = function(pts) {
    var total = 0;

    pts.forEach(function(pt) {
        total += pt.R();
    });
    return total / pts.length;
};

var avgEdge = function(pts) {
    var total = pts[pts.length - 1].sub(pts[0]).R();
    for (var i = 0; i < pts.length - 2; i++) {
        total += pts[i].sub(pts[i + 1]).R();
    }
    return total / pts.length;
};

var isCw = function(pts) {
    // get lowest rightmost point
    var lr = 0;
    for (var idx = 1; idx < pts.length; idx++) {
        if ((pts[idx].y < pts[lr].y) || (pts[idx].y == pts[lr].y && pts[idx].x > pts[lr].x)) {
            lr = idx;
        }
    }

    var a = pts[(lr + pts.length - 1) % pts.length];
    var b = pts[lr];
    var c = pts[(lr + 1) % pts.length];

    return (a.x * b.y - a.y * b.x +
        a.y * c.x - a.x * c.y +
        b.x * c.y - c.x * b.y) > 0.0;
};

var movement = function(pts, savedPts) {
    var result = 0;
    for (var i = 0; i < pts.length; i++) {
        result += pts[i].sub(savedPts[i]).R();
    }
    return result / pts.length;
};

var matchOther = function(pts, other) {
    var bestMvmt = movement(pts, other) + 1;
    var result;
    var candidate;
    var mvmt;
    
    if (other.length !== pts.length) {
        return pts;
    }

    for (dir = 0; dir < 2; dir++) {
        if (dir == 1) {pts = pts.reverse();}
        
        for (shift = 0; shift < pts.length; shift++) {
            candidate = pts.slice(shift, pts.length).concat(pts.slice(0, shift));
            mvmt = movement(candidate, other);
            if (mvmt < bestMvmt) {
                bestMvmt = mvmt;
                result = candidate;
            }
        }
    }
    
    return result;
};

// returns true iff the line from a1->a2 intersects with b1->b2
var edgeIntersectsEdge = function(a1, a2, b1, b2) {
    // shortcut
    if (Math.max(a1.x, a2.x) < Math.min(b1.x, b2.x) ||
        Math.max(b1.x, b2.x) < Math.min(a1.x, a2.x) ||
        Math.max(a1.y, a2.y) < Math.min(b1.y, b2.y) ||
        Math.max(b1.y, b2.y) < Math.min(a1.y, a2.y)) {
        return false;
    }

    det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y);
    if (det == 0) {return false;}

    lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
    gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
};

var avgBend = function(pts, stepSize) {
    var result = 0;
    var count = 0;
    var a = pts[pts.length - 3 * stepSize];
    var b = pts[pts.length - 2 * stepSize];
    var c = pts[pts.length - 1 * stepSize];
    for (idx = 0; idx < pts.length; idx += stepSize) {
        a = b;
        b = c;
        c = pts[idx];
        result += DMSLib.HALFTAU - tourAngle(a, b, c);
        count++;
    }
    
    return result / count;
};

var fillInTour = function(pts, numPts) {
    //assumes pts[0] is filled in
    var from;
    var to;
    var fromPt;
    var toPt;
    
    for (from = 0; from < numPts - 1; from = to) {
        to = from + 1;
        while (pts[to % numPts] == undefined) {to++;}
    
        fromPt = pts[from];
        toPt = pts[to % numPts];
        for (var i = 1; from + i < to; i++) {
            pts[from + i] = fromPt.mul(to - from - i).add(toPt.mul(i)).div(to - from);
        }
    }
};

var findDirectionMostPt = function(pts, x, y) {
    var result = 0;
    var bestValue = x * pts[0].x + y * pts[0].y;
    for (var i = 1; i < pts.length; i++) {
        var value = x * pts[i].x + y * pts[i].y;
        if (value > bestValue) {
            bestValue = value;
            result = i;
        }
    }
    return result;
};

var findClosestPt = function(pts, pt) {
    var result = 0;
    var minDist = pt.sub(pts[0]).R();

    for (var i = 1; i < pts.length; i++) {
        var dist = pt.sub(pts[i]).R();
        if (dist < minDist) {
            minDist = dist;
            result = i;
        }
    }
    return result;
};

var increaseNumber = function(pts, num, startIdx, endIdx) {
    if (startIdx == undefined) {startIdx = -1;}
    if (endIdx == undefined) {endIdx = pts.length;}

    // increase as necessary
    while (endIdx - startIdx - 1 < num) {
        // find idx of longest edge
        var idx = -1;
        var maxEdge = 0;
        for (var i = startIdx + 1; i < endIdx - 1; i++) {
            var dist = pts[i].sub(pts[i + 1]).R();
            if (dist > maxEdge) {
                maxEdge = dist;
                idx = i;
            }
        }

        // insert a vertex half way in between
        var newPt = pts[idx].add(pts[idx + 1]).mul(0.5);
        pts.splice(idx + 1, 0, newPt);
        endIdx++;
    }

    // or decrease as necessary
    while (endIdx - startIdx - 1 > num) {
        // find idx of straightest edge
        var idx = -1;
        var minAngle = DMSLib.TAU;
        for (var i = startIdx + 1; i < endIdx - 2; i++) {
            var angle = Math.abs(tourAngle(pts[i], pts[i + 1], pts[i + 2]) -
                                  DMSLib.HALFTAU);
            if (angle < minAngle) {
                minAngle = angle;
                idx = i;
            }
        }

        pts.splice(idx + 1, 1);
        endIdx--;
    }
};

var xsAreMonotonic = function(pts, startIdx, endIdx) {
    if (startIdx == -1 && endIdx == pts.length) {
        return false;
    }

    var increasing = pts[startIdx + 1].x > pts[startIdx + 2].x;
     
    for (var i = startIdx + 1; i < endIdx - 1; i++) {
        if (increasing && pts[i].x <= pts[i + 1].x ||
           !increasing && pts[i].x >= pts[i + 1].x) {
            return false;
        }
    }
    return true;
};

var doesTourCross = function(pts, closed) {
    var i;
    var j;
    var iNext;
    var jNext;
    var endIdx = closed ? pts.length : pts.length - 1;
    
    for (i = 0; i < endIdx; i++) {
        iNext = (i + 1) % pts.length;
        for (j = i + 1; j < endIdx; j++) {
            jNext = (j + 1) % pts.length;
            if (i == jNext || j == iNext) {
                continue;
            } else if (edgeIntersectsEdge(pts[i], pts[iNext], pts[j], pts[jNext])) {
                return true;
            }
        }
    }
    
    return false;
};

var indexPoints = function(pts) {
    for (var i = 0; i < pts.length; i++) {
        if (pts[i] !== null) {
            pts[i].idx = i;
        }
    }
};

var decimatePts = function(pts, step) {
    if (step == undefined) {step = 1;}
    var result = [];
    for (var i = 0; i < pts.length; i += step) {
        result.push(pts[i]);
    }
    return result;
};
