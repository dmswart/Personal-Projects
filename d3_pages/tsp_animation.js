// TODO - dedicated line update with transitions.

var __fifo;
var __pregenerateSegmentData = function() {
    __fifo = [];
    var saved = {start: startIdx, end: endIdx};
    for (i = 0; i < numFrames(); i++) {
        var pts = getFrame(i);
        indexPoints(pts);

        var frameMovement = i ? movement(getFrame(i), getFrame(i - 1)) : 0;
        if (pts[0] instanceof DMSLib.Point3D) { frameMovement *= 1000; }

        startIdx = Math.floor(saved.start / getStepSize(i));
        endIdx = Math.floor(saved.end / getStepSize(i));
        // speed offset.x += 0.4;
        __fifo.push({frame: buildSegmentData(decimatePts(pts, getStepSize(i)), offset),
                    movement: frameMovement});

        if (getStepSize(i + 1) !== getStepSize(i)) {
            startIdx = Math.floor(saved.start / getStepSize(i + 1));
            endIdx = Math.floor(saved.end / getStepSize(i + 1));
            __fifo.push({frame: buildSegmentData(decimatePts(pts, getStepSize(i + 1)), offset),
                        movement: 0});
        }
    }
    startIdx = saved.start;
    endIdx = saved.end;
};

var takeTour = function() {
    if (startIdx >= endIdx) {
        clearTimeout(timer);
        timer = null;
        d3.select('#TakeTour').property('value', 'Take Tour');
        return;
    }

    var totalFrameTime = 0;
    while (totalFrameTime < 20 && startIdx < endIdx) {
        startIdx++;
        var frameTime = 1000 / pps;
        totalFrameTime += frameTime;
    }

    d3.select('#startIdx').property('value', startIdx);
    updateLine();
    timer = setTimeout(function() {takeTour(); }, frameTime);
};

var getLatLongTilt = function(idx, dontAddMidpoint) {
    var thisPt;
    var nextPt;
    var midPt;
    if (dontAddMidpoint == undefined) {
        // we insert a midpoint
        thisPt = tour[(idx + tour.length) % tour.length];
        nextPt = tour[(idx + tour.length + 1) % tour.length];
        midPt = thisPt.add(nextPt).normalized();
        tour.splice(idx + 1, 0, midPt);
    } else {
        thisPt = tour[(idx + tour.length) % tour.length];
        nextPt = tour[(idx + tour.length - 1) % tour.length];
        midPt = tour[idx];
    }

    var result = {lat: -90.0 + midPt.phi() / Math.PI * 180.0,
                  long: 90.0 - midPt.theta() / Math.PI * 180.0,
                  tilt: 0.0,
                  idx: idx + 1};

    var long = DMSLib.Rotation.fromAngleAxis(result.long * Math.PI / 180.0, DMSLib.Point3D.zAxis() );
    var lat = DMSLib.Rotation.fromAngleAxis(result.lat * Math.PI / 180.0, DMSLib.Point3D.xAxis() );
    var rot = lat.combine(long);
    var pt1 = rot.apply(thisPt);
    var pt2 = rot.apply(nextPt);
    var delta = pt2.sub(pt1);

    result.tilt = Math.atan2(delta.z, -delta.x) * 180.0 / Math.PI;
    return result;
};

var getAngleNear = function(a, b) {
    while (a < b - 180.0) {a += 360.0;}
    while (a > b + 180.0) {a -= 360.0;}
    return a;
};

var __wzOrigin;
var __wzDestination;
var __wzStartMs;

// schedule:
// t=0s start orientation
// t=1s start zoom out
// t=3s start tour
// t=4s end zoom out, begin rotation
// t=9s end rotation, start zoom in
// t=10s tour should end about now
// t=12s end zoom in
var worldZoom = function(elapsedMs) {
    // if we're beginning
    if (elapsedMs == undefined) {
        __wzOrigin = getLatLongTilt(startIdx);
        startIdx++;
        endIdx++;
        __wzDestination = getLatLongTilt(endIdx);
        endIdx++;

        __wzDestination.long = getAngleNear(__wzDestination.long, __wzOrigin.long);
        __wzDestination.lat = getAngleNear(__wzDestination.lat, __wzOrigin.lat);
        __wzDestination.tilt = getAngleNear(__wzDestination.tilt, __wzOrigin.tilt);
 
        __wzStartMs = (new Date()).getTime();
 
        offset.x = __wzOrigin.long;
        offset.y = __wzOrigin.lat;
        tilt = __wzOrigin.tilt;
        zoomLevel = 120;

        elapsedMs = 0;
    }

    // if we're done
    if (elapsedMs > 22000) {
        clearTimeout(timer);
        timer = null;
        d3.select('#WorldZoom').property('value', 'World Zoom');
        return;
    }

    elapsedMs = ((new Date()).getTime() - __wzStartMs);
    var t;

    // tilt
    if (elapsedMs >= 6000 && elapsedMs < 18000) {
        t = d3.ease('exp-in-out')((elapsedMs - 6000) / 12000);
 
        startIdx =  Math.floor(__wzOrigin.idx + t * (__wzDestination.idx - __wzOrigin.idx));
        offset.x = __wzOrigin.long + t * (__wzDestination.long - __wzOrigin.long);
        offset.y = __wzOrigin.lat + t * (__wzDestination.lat - __wzOrigin.lat);
        tilt = __wzOrigin.tilt + t * (__wzDestination.tilt - __wzOrigin.tilt);
    } else if (elapsedMs >= 18000) {
        startIdx = __wzDestination.idx;
        offset.x = __wzDestination.long;
        offset.y = __wzDestination.lat;
        tilt = __wzDestination.tilt;
    }

    // zoom
    if (elapsedMs >= 2000 && elapsedMs < 7000) {
        t = d3.ease('exp-in-out')((elapsedMs - 2000) / 5000);
        zoomLevel = 120 + t * (0 - 120);
    } else if (elapsedMs >= 7000 && elapsedMs < 16000) {
        zoomLevel = 0;
    } else if (elapsedMs >= 16000 && elapsedMs < 21000) {
        t = d3.ease('exp-in-out')((elapsedMs - 16000) / 5000);
        zoomLevel = 0 + t * (120.0 - 0);
    } else if (elapsedMs >= 21000) {
        zoomLevel = 120;
    }
 
    updateCamera();
    updateLine();
    timer = setTimeout(function() {worldZoom(elapsedMs);}, 30);
};
 
var miscAnimation = function(step) {
    if (step == undefined) {step = 7;}

    // 0 intro line
    // 5 bounce in and animate
    // 7 water
    if (step == 0) {
        startLine.attr('d', lineFunction([]));
        insideLine.attr('d', lineFunction([{x: 0, y: 467}, {x: 861.88, y: 467}]));
        timer = setTimeout(function() {miscAnimation(step + 1);}, 1000);
    } else if (step == 1) {
        insideLine
            .transition()
            .duration(3000)
            .ease('sin-in-out')
            .attr('d', lineFunction([{x: 640, y: 467}, {x: 3000, y: 467}]));
        timer = setTimeout(function() {miscAnimation(step + 1);}, 3000);
    } else if (step == 2) {
        startLine
            .attr('d', lineFunction([{x: -640, y: 467}, {x: -1, y: 467}]));
        timer = setTimeout(function() {miscAnimation(step + 1);}, 6000);
    } else if (step == 3) {
        startLine
            .transition()
            .duration(3000)
            .ease('sin-out')
            .attr('d', lineFunction([{x: -640, y: 467}, {x: 640, y: 467}]));
        timer = setTimeout(function() {miscAnimation(step + 1);}, 3000);
    } else if (step == 5) {
        endIdx = Math.max(startIdx, 0);
        updateLine();
        timer = setTimeout(function() {miscAnimation(step + 1); }, 1000);
    } else if (step == 6) {
        lineSpace.append('circle')
            .attr('r', 200)
            .attr('cx', tour[endIdx].x)
            .attr('cy', tour[endIdx].y)
            .attr('stroke', 'none')
            .attr('fill', insideColor)
            .attr('opacity', 0)
            .transition()
                .duration(2000)
                .ease('bounce-in')
                .attr('opacity', 1)
                .attr('r', lineThickness / 2);
        d3.select('#TakeTour').property('value', 'Stop');
        d3.select('#Misc').property('value', 'Misc');
        timer = setTimeout(function() {takeTour();}, 2000);
    } else if (step == 7) {
        tour = [];
        for (i = 0; i < 250; i++) {
            tour.push(new DMSLib.Point2D(537 - 5000 + 40 * i, 467 + Math.random() * 10 - 5));
        }
        updateLine();
        timer = setTimeout(function() {miscAnimation(step + 1);}, 1000);
    } else if (step == 8) {
        for (i = 0; i < 250; i++) {
            if (i == 124) {
                tour[i].y = tour[i + 2].y;
            } else if (i == 125) {
                tour[i].y = 467;
            } else if (i == 249) {
                tour[249].y = 467 + Math.random() * 10 - 5;
            } else {
                tour[i].y = tour[i + 1].y;
            }
        }
        updateLine(200);
        timer = setTimeout(function() {miscAnimation(step);}, 200);
    } else {
        clearTimeout(timer);
        timer = null;
        d3.select('#Misc').property('value', 'Misc');
    }
};

var __doZoomTimer = null;
var doZoom = function(zoomOut) {
    if (zoomOut == undefined) {
        if (zoomLevel == 0) {
            backgroundColor.attr('fill', 'white');
            __doZoomTimer = setTimeout(function() { doZoom(true); }, 500);
        } else {
            backgroundColor.attr('fill', '#dfdedf');
            __doZoomTimer = setTimeout(function() { doZoom(false); }, 500);
        }
        return;
    } else if (zoomOut) {
        zoomLevel = -200;
        pan.x = 640;
        pan.y = 360;
        foregroundImage.attr('opacity', 0);
        backgroundColor.transition().duration(2500).ease('cubic-in-out').attr('fill', '#dfdedf');
    } else {
        zoomLevel = 0;
        pan.x = 0;
        pan.y = 0;
        backgroundColor.transition().duration(2500).ease('cubic-in-out').attr('fill', 'white');
        __doZoomTimer = setTimeout(function() { foregroundImage.attr('opacity', 1);}, 2500);
    }

    updateCamera(2500, 'cubic-in-out');
    d3.select('#DoZoom').property('value', 'DoZoom');
};

var animate = function(stage) {
    var frameTime;
    var delay;
    var easing;

    if (stage == undefined) {
        // make sure animation is small enough
        while (__animation.length > 40) {
            for (var i = 0; i < __animation.length - 2; i++) {
                __animation.splice(i + 1, 1);
            }
        }
        // one second breather before we start.
        __pregenerateSegmentData();
        updateLine(undefined, undefined, __fifo.shift().frame);
        timer = setTimeout(function() { animate(0); }, 1000);
        return;
    } else if (__fifo.length == 0) {
        if (true) {
            // we're done - clean up
            clearTimeout(timer);
            timer = null;
            d3.select('#Animate').property('value', 'Animate');
            tour = getFrame(numFrames() - 1);
        } else {
            reverseAnimation();
            __pregenerateSegmentData();
            updateLine(undefined, undefined, __fifo.shift().frame);
            timer = setTimeout(function() { animate(0); }, 50);
            return;
        }
        return;
    } else if (__fifo[0].movement == 0) {
        // do an instant switch - no transition
        frameTime = undefined;
        easing = undefined;
        delay = 30;
    } else {
        // standard
        frameTime = __fifo[0].movement / pps * 1000;
        delay = frameTime;
        easing = 'linear';
    }

    // easing in and out
    if (stage == 0) {
        easing = 'cubic-in';
        frameTime *= 3;
        delay *= 3;
    } else if (__fifo.length == 1) {
        easing = 'cubic-out';
        frameTime *= 3;
        delay *= 3;
    }

    updateLine(frameTime, easing, __fifo.shift().frame);
    timer = setTimeout(function() { animate(1); }, delay);
};

// these two are for touring the rejected scene
var goBack = function() {
    joinEnds(false);
    // tour.unshift(new DMSLib.Point2D(677, 467));
    tour.push(new DMSLib.Point2D(1414, 467));
    endIdx += 1;
    startIdx = 0;
    insideColor = 'black';
    updateLine();
    offset.x = 0;
    updateCamera();
};

var shiftScene = function() {
    pps = 300;
    offset.x = -700;
    updateCamera(7000, 'quad-in-out');
    go('TakeTour');
};

var moveOn = function() {
    offset.x = 700;
    pan.x = -700;
    updateCamera(5000, 'quad-in');
};
