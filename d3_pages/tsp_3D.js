var displayRadius3d = 330;

var toBeat3D = function(x, y, target) {
    var result = target.pixel(x, y) / 255.0;
    var phi = y / target.height * DMSLib.HALFTAU;
    var result = 1 - ((1 - result) * Math.sin(phi));
    
    return result;
};

var tspDist3D = function(a, b) {
    var a3d = DMSLib.Point3D.fromSphericalCoordinates(1.0, a.y / 720 * DMSLib.HALFTAU, a.x / 1280 * DMSLib.TAU);
    var b3d = DMSLib.Point3D.fromSphericalCoordinates(1.0, b.y / 720 * DMSLib.HALFTAU, b.x / 1280 * DMSLib.TAU);
    return a3d.sub(b3d).R();
};

var __display = function(pt) {
    return new DMSLib.Point2D(-pt.x * displayRadius3d, -pt.z * displayRadius3d);
};

var __to3D = function(obj) {
    if (obj instanceof DMSLib.Point2D) {
        return DMSLib.Point3D.fromSphericalCoordinates(1.0, obj.y / 720 * DMSLib.HALFTAU, obj.x / 1280 * DMSLib.TAU);
    }
    
    if (Array.isArray(obj)) {
        for (i = 0; i < obj.length; i++) {
            obj[i] = __to3D(obj[i]);
        }
    }
    return obj;
};

// lookup table to go from 2D to 3D quickly
var __to3DLut = [];
for (var x = 0; x < 1280; x++) {
    for (var y = 0; y < 720; y++) {
        __to3DLut[y * 1280 + x] = __to3D(new DMSLib.Point2D(x, y));
    }
}

var __to2D = function(obj) {
    if (obj instanceof DMSLib.Point3D) {
        return new DMSLib.Point2D(DMSLib.fixAnglePositive(obj.theta()) / DMSLib.TAU * 1280,
                                  obj.phi() / DMSLib.HALFTAU * 720);
    }
    
    if (Array.isArray(obj)) {
        for (i = 0; i < obj.length; i++) {
            obj[i] = __to2D(obj[i]);
        }
    }
    return obj;
};

var setPointspread3D = function(pts, targetIn) {
    var target = targetIn;
    if (target == undefined) {target = DMSLib.Point3D.origin();}
    
    for (i = 0; i < 3; i++) {
        var offset = calcCentroid(pts).sub(target);
        for (var i = 0; i < pts.length; i++) {
            pts[i] = pts[i].sub(offset).normalized();
        }
    }
};

var buildSegmentData3D = function(pts, offset) {
    var result = [];

    var lat = DMSLib.Rotation.fromAngleAxis(offset.y * Math.PI / 180, DMSLib.Point3D.xAxis());
    var long = DMSLib.Rotation.fromAngleAxis(offset.x * Math.PI / 180, DMSLib.Point3D.zAxis());
    var rot = lat.combine(long);

    for (var i = 0; i < pts.length; i++) {
        var next = (i + 1) % pts.length;

        if (pts[i] == null || pts[next] == null) { continue; }  // skip empty points

        var thisPt = rot.apply(pts[i]);
        var nextPt = rot.apply(pts[next]);

        if (thisPt.y < -DMSLib.EPSILON && nextPt.y < -DMSLib.EPSILON) { continue; }  // skip points on far side of sphere
        
        var pt1 = __display(thisPt);
        var pt2 = __display(nextPt);
        
        if (nextPt.y < -DMSLib.EPSILON) {
            var t = (0 - thisPt.y) / (nextPt.y - thisPt.y);
            var intercept = thisPt.mul(1 - t).add(nextPt.mul(t)).normalized();
            pt2 = __display(intercept);
        } else if (thisPt.y < -DMSLib.EPSILON) {
            var t = (0 - thisPt.y) / (nextPt.y - thisPt.y);
            var intercept = thisPt.mul(1 - t).add(nextPt.mul(t)).normalized();
            pt1 = __display(intercept);
        }
        
        var entry = {x1: pt1.x, x2: pt2.x, y1: pt1.y, y2: pt2.y,
            idx: pts[i].idx, color: insideColor};
        
        if (i < startIdx) { entry.color = startColor; }
        if (i >= endIdx) { entry.color = endColor; }
        result.push(entry);
    }
    return result;
};

var stipple3D = function(iter) {
    // initialize accumulator variables
    var newpos = [];
    var x;
    var y;
    var weight;
    var pt;
    var idx;

    // initialize weights and sums, mark up index
    for (idx = 0; idx < tour.length; idx++) {
        tour[idx].idx = idx;
        newpos.push(new DMSLib.Point3D());
    }

    var searchRadius = Math.pow(avgEdge(tour), 2) * 5;
    var tree = new kdTree(tour.slice(), function(a, b) {
        return b.sub(a).R2();
    }, ['x', 'y', 'z']);

    // add weighted images pixels to nearest cities
    for (x = 0; x < target.width; x++) {
        for (y = 0; y < target.height; y++) {
            if (target.pixel(x, y) == 255) {continue;}

            weight = 1 - (target.pixel(x, y) / 255) * Math.sin(y / 720 * DMSLib.HALFTAU);
            pt = __to3DLut[y * 1280 + x];

            var result = tree.nearest(pt, 1, searchRadius);
            if (result && result[0]) {
                idx = result[0][0].idx;
                newpos[idx] = newpos[idx].add(pt.mul(weight));
            }
        }
    }

    // calculate weighted average
    for (idx = startIdx + 1; idx < endIdx; idx++) {
        if (newpos[idx].R()) {
            tour[idx] = newpos[idx].scaledTo(1);
        }
    }
    updateLine();

    if (iter == undefined) {iter = 10;}
    if (iter != 0) {
        timer = setTimeout(function() {
            stipple(iter - 1);
        }, 21);
    } else {
        clearTimeout(timer);
        timer = null;
        d3.select('#Stipple').property('value', 'Stipple');
    }
};

var edgeIntersectsEdge3D = function(a1, a2, b1, b2) {
    // shortcuts
    if (a1 == b1 || a1 == b2 || a2 == b1 || a2 == b2) {
        return false;
    }
    if (Math.max(a1.x, a2.x) < Math.min(b1.x, b2.x) ||
        Math.max(b1.x, b2.x) < Math.min(a1.x, a2.x) ||
        Math.max(a1.y, a2.y) < Math.min(b1.y, b2.y) ||
        Math.max(b1.y, b2.y) < Math.min(a1.y, a2.y) ||
        Math.max(a1.z, a2.z) < Math.min(b1.z, b2.z) ||
        Math.max(b1.z, b2.z) < Math.min(a1.z, a2.z)) {
        return false;
    }
    
    var a1Xa2 = DMSLib.Point3D.cross(a1, a2);
    var b1Xb2 = DMSLib.Point3D.cross(b1, b2);
    var u = DMSLib.Point3D.cross(a1Xa2, b1Xb2).normalized();
    
    //check u
    var a1Xu = DMSLib.Point3D.cross(a1, u);
    var uXa2 = DMSLib.Point3D.cross(u, a2);
    var uIsBetweenB = DMSLib.Point3D.dot(a1Xu, a1Xa2) > DMSLib.EPSILON &&
                      DMSLib.Point3D.dot(uXa2, a1Xa2) > DMSLib.EPSILON;
    var b1Xu = DMSLib.Point3D.cross(b1, u);
    var uXb2 = DMSLib.Point3D.cross(u, b2);
    var uIsBetweenB = DMSLib.Point3D.dot(b1Xu, b1Xb2) > DMSLib.EPSILON &&
                      DMSLib.Point3D.dot(uXb2, b1Xb2) > DMSLib.EPSILON;
    
    if (uIsBetweenA && uIsBetweenB) { return true; }
    
    // check u's antipode v
    var v = u.negate();
    var a1Xv = DMSLib.Point3D.cross(a1, v);
    var vXa2 = DMSLib.Point3D.cross(v, a2);
    var vIsBetweenA = DMSLib.Point3D.dot(a1Xv, a1Xa2) > DMSLib.EPSILON &&
                      DMSLib.Point3D.dot(vXa2, a1Xa2) > DMSLib.EPSILON;
    var b1Xv = DMSLib.Point3D.cross(b1, v);
    var vXb2 = DMSLib.Point3D.cross(v, b2);
    var vIsBetweenB = DMSLib.Point3D.dot(b1Xv, b1Xb2) > DMSLib.EPSILON &&
                      DMSLib.Point3D.dot(vXb2, b1Xb2) > DMSLib.EPSILON;
    
    if (vIsBetweenA && vIsBetweenB) { return true; }

    return false;
};

var convertTo3DApp = function() {
    __toBeat = toBeat3D;
    __tspDist = tspDist3D;
    buildSegmentData = buildSegmentData3D;
    finalResult = function(result) {return __to3D(result);};
    getPointspread = calcCentroid;
    setPointspread = setPointspread3D;
    stipple = stipple3D;
    tourAngle = DMSLib.Point3D.sphereAngle;
    edgeIntersectsEdge = edgeIntersectsEdge3D;
    pan.x += size.x / 2;
    pan.y += size.y / 2;

    __to3D(__animation);
    __to3D(__animation2);
    __to3D(tour);
    
    backgroundImage
        .attr('x', -displayRadius3d)
        .attr('y', -displayRadius3d)
        .attr('width', displayRadius3d * 2)
        .attr('height', displayRadius3d * 2)
        .attr('xlink:href', 'sphere.png');
    foregroundImage.attr('opacity', 0.0);
    tourOffset.attr('transform', 'translate(0,0)');

    updateCamera();
    updateLine();
};

