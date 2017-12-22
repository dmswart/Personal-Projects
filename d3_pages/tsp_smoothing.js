var __saTemp = 0;
var __smoothness = 0;
var __stepSize = 1;
var __stepSizeList = [];
var __animation = [];
var __animation2 = [];

// stepsize accessor
var getStepSize = function(idx) {
    if (idx >= __stepSizeList.length) { return 1; }
    if (__stepSizeList[idx] == undefined) { return 1; }
    return __stepSizeList[idx];
};

// animation accessors
var numFrames = function() { return __animation.length; };
var getFrame = function(i) { return __animation[i]; };
var reverseAnimation = function() {
    __animation = __animation.reverse();
    __stepSizeList = __stepSizeList.reverse();
};
var startNewAnimation = function(pts) {
    __animation2 = __animation;
    __animation = [];
    __animation.push(pts.slice());
};

getAnimationPts = function(pts, target, offset) {
    var i;
    var j;
    var result = [];
    var frame;
    var pt;
    var minX = 1028;
    var maxX = 0;
    var offsetX = 0;

    for (i = 0; i < 6; i++) {
        frame = getFrame(Math.floor(i / 5 * (numFrames() - 1)));
        for (var j = 0; j < frame.length; j++) {
            pt = frame[j % frame.length];
            result.push(new DMSLib.Point2D(pt.x + offsetX, pt.y));
            minX = Math.min(minX, pt.x + offsetX);
            maxX = Math.max(maxX, pt.x + offsetX);
        }
        if (endsJoined) {result.push(new DMSLib.Point2D(frame[0].x + offsetX, frame[0].y));}
        result.push(null);
        offsetX = maxX + 20;
    }

    var scale = 1240 / (maxX - minX);
    for (i = 0; i < result.length; i++) {
        if (result[i]) {
            result[i] = new DMSLib.Point2D((result[i].x - minX) * scale + 20,
                                           result[i].y * scale);
        }
    }

    return result;
};

//accessors
setSmoothness = function(val) { __smoothness = val; };
setSaTemp = function(val) { __saTemp = val; };

// stepSize accessor
var setStepsize = function(size) {
    __stepSize = size;
    document.getElementById('stepsize').innerHTML = __stepSize.toString();
};

var scaleStepsize = function(scale) {
    var newVal = __stepSize * scale;
    if (newVal < 1) {newVal = 1;}
    
    setStepsize(newVal);
};

// utility functions
var glueAnimations = function(glueFrames) {
    if (!__animation2.length) { return; }
    
    if (glueFrames == undefined) {glueFrames = 5;}
    
    var newFrame;
    var pt1;
    var pt2;
    for (var i = 1; i < glueFrames - 1; i++) {
        newFrame = [];
        for (var p = 0; p < __animation[0].length; p++) {
            pt1 = __animation[__animation.length - 1][p];
            pt2 = __animation2[__animation2.length - 1][p];
            newFrame[p] = pt1.mul(glueFrames - 1 - i).add(pt2.mul(i)).div(glueFrames - 1);
        }
        __animation.push(newFrame);
    }
    __animation = __animation.concat(__animation2.reverse());
    __animation2 = [];

    // manage size
    while (__animation.length > 40) {
        for (var i = 0; i < __animation.length - 2; i++) {
            __animation.splice(i + 1, 1);
        }
    }
};

var __isValidNewPoint = function(pts, newPt, idx) {
    var a1 = pts[(idx - __stepSize + pts.length) % pts.length];
    var oldA2 = pts[idx];
    var newA2 = newPt;
    var a3 = pts[(idx + __stepSize) % pts.length];

    if (!endsJoined) {
        if (idx + __stepSize >= pts.length) { a3 = pts[pts.length - 1];}
        if (idx - __stepSize < 0) { a1 = pts[0]; }
    }

    var tolerance = Math.min(a1.sub(a3).R()) * 0.2;
    
    for (var i = (idx % __stepSize); i < pts.length; i += __stepSize) {
        var b1 = pts[i];
        var b2 = pts[(i + __stepSize) % pts.length];

        // check proximity
        if (b1 !== a1 && b1 !== oldA2 && b1 !== a3) {
            if (b1.sub(newA2).R() < tolerance) {
                return false;
            }
        }

        // edge intersection
        if (!endsJoined && (i + __stepSize >= pts.length || i - __stepSize < 0)) {continue;}  // don't check the edge between endpts
        if (b1 !== a1 && b1 !== oldA2) {
            if (edgeIntersectsEdge(a1, newA2, b1, b2) ||
                edgeIntersectsEdge(newA2, a3, b1, b2) ||
                edgeIntersectsEdge(oldA2, newA2, b1, b2)) {
                return false;
            }
        }
    }
    return true;
};

var __angleThresholdForStepSizeIncrement = 0.08; // ~5 degrees
var smooth = function(maxMvmt) {
    // if maxMvt = undefined, it's first frame: start animation
    if (maxMvmt == undefined) {
        maxMvmt = 0;
        setStepsize(1);
        startNewAnimation(tour);
        __stepSizeList = [1];
    }
    
    var pointspread = getPointspread(getFrame(0));
    var savedTour = tour.slice();

    if (tour.length / __stepSize > 64 && avgBend(tour, __stepSize) < __angleThresholdForStepSizeIncrement) {
        scaleStepsize(2);
    }

    var numIter;
    var idx;
    var prev;
    var next;
    var newPt;

    for (numIter = 0; numIter < 1000; numIter++) {
        var newTour = [];
        for (idx = 0; idx <= startIdx; idx++) {newTour[idx] = tour[idx];}
        for (idx = endIdx; idx < tour.length; idx++) {newTour[idx] = tour[idx];}
        
        if (xsAreMonotonic(tour, startIdx, endIdx)) {
            //totally gonna cheat
            for (idx = startIdx + 1; idx < endIdx; idx++) {
                var finalPt = tour[startIdx].mul(endIdx - 1 - idx).add(tour[endIdx].mul(idx - startIdx)).div(endIdx - startIdx - 1);
                newTour[idx] = tour[idx].mul(0.75).add(finalPt.mul(0.25));
            }
        } else {
            for (idx = startIdx + 1; idx < endIdx; idx += __stepSize) {
                prev = (idx - __stepSize + tour.length) % tour.length;
                next = (idx + __stepSize) % tour.length;
                if (!endsJoined) {
                    if (idx + __stepSize >= tour.length) {next = tour.length - 1;}
                    if (idx - __stepSize < 0) {prev = 0;}
                }
    
                // Chow Glickstein with a parameter of delta = 1/3
                newPt = calcCentroid([tour[prev], tour[idx], tour[next]]);
                
                if (__isValidNewPoint(tour, newPt, idx)) {
                    newTour[idx] = newPt;
                } else {
                    newTour[idx] = tour[idx];
                }
            }
    
            fillInTour(newTour, tour.length);
            if (startIdx < 0) {setPointspread(newTour, pointspread);}
        }
        tour = newTour;

        var mvmt = movement(tour, savedTour);
        if (maxMvmt == 0) { maxMvmt = mvmt; }
        if (mvmt >= maxMvmt) { break; }
    }

    // if this is first time through, we use this amount of movement as the step amount.
    __animation.push(tour.slice());
    __stepSizeList.push(__stepSize);

    updateLine();

    if (mvmt < maxMvmt) {
        clearTimeout(timer);
        timer = null;
        d3.select('#Smooth').property('value', 'Smooth');
    } else {
        timer = setTimeout(function() {smooth(maxMvmt); }, 21);
    }
};

var tighten = function() {
    glueAnimations();
    __stepSizeList = [];

    var numPts = getFrame(0).length;
    var firstCentroid = calcCentroid(getFrame(0));
    var lastCentroid = calcCentroid(getFrame(numFrames() - 1));

    for (var f = 1; f < numFrames() - 1; f++) {
        var p;
        var newFrame = [];
        var avgEdgeSize = avgEdge(tour);
        
        for (p = 0; p <= startIdx; p++) {newFrame[p] = __animation[f][p];}
        for (p = endIdx; p < numPts; p++) {newFrame[p] = __animation[f][p];}
        
        for (p = startIdx + 1; p < endIdx; p += __stepSize) {
            var prev = (p + numPts - __stepSize) % numPts;
            var next = (p + __stepSize) % numPts;

            if (!endsJoined) {
                if (p - __stepSize < 0) {prev = 0;}
                if (p + __stepSize >= numPts) {next = numPts - 1;}
            }

            var newpt = calcCentroid([__animation[f][p],
                                       __animation[f + 1][p],
                                       __animation[f - 1][p],
                                       __animation[f][prev],
                                       __animation[f][next]],
                                      [1, 1, 1, 0.05 * __smoothness, 0.05 * __smoothness])
                        .jitter(avgEdgeSize * (__saTemp / 10));

            if (__isValidNewPoint(__animation[f], newpt, p)) {
                newFrame[p] = newpt;
            } else {
                newFrame[p] = __animation[f][p];
            }
        }

        if (!endsJoined) {
            if (newFrame[numPts - 1] == undefined) {
                // write in the last point so we can fill things in if nec.
                newFrame[numPts - 1] = __animation[f][numPts - 1];
            }
            newFrame[0].y = 467;
            newFrame[numPts - 1].y = 467;
        }

        fillInTour(newFrame, numPts);
        
        if (newFrame[0] instanceof DMSLib.Point3D) {
            var targetCentroid = firstCentroid.mul(numFrames() - 1 - f).add(lastCentroid.mul(f)).div(numFrames() - 1);
            setPointspread(newFrame, targetCentroid);
        }
        
        __animation[f] = newFrame;
    }

    tour = __animation[Math.floor(numFrames() / 2)];
    updateLine();

    timer = setTimeout(function() {tighten();}, 11);
};

//TODO - remove external globals? (startIdx, endIdx, timer, tour)
// TODO - fix bug where tightening animations causes line to go through itself
