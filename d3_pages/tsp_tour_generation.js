var finalResult = function(result) { return result; };

var getSpiralPts = function(numPts, target) {
    var result = [];
    var i;

    // way in
    for (i = 0; i <= numPts / 2; i++) {
        result.push(new DMSLib.Point2D.fromPolar(i + 30, i / 10));
    }
    // way out
    for (i = numPts / 2; i >= 0; i--) {
        result.push(new DMSLib.Point2D.fromPolar(i + 60, i / 10));
    }

    setPointspread(result, {center: new DMSLib.Point2D(target.width / 2, target.height / 2), avgR: target.height / 3});
    return finalResult(result);
};

var getHeadPts = function(numPts, target, offset) {
    var sadness = prompt('enter sadness: 0-100', 0);
    if (offset == undefined) {offset = DMSLib.Point2D();};
    var headPts = [{x: -4.25, y: -4.75}, {x: -9.31, y: -11.37}, {x: -9.19, y: -17.69}, {x: -19.06, y: -17}, {x: -9.94, y: -20.94},
                    {x: -12, y: -25.87}, {x: 4.56, y: -33.81}, {x: 7.44, y: -28.31}, {x: 15.94, y: -32.31}, {x: 9.37, y: -24.81},
                    {x: 15.37, y: -18.75}, {x: 12.12, y: -10.25}, {x: 5.44, y: -11.37}, {x: 11.12, y: -7.19}, {x: 4.25, y: -4.25}];

    var angle = sadness * Math.PI / 200;
    var sinangle = Math.sin(angle);
    var cosangle = Math.cos(angle);
    for (var i = 0; i < headPts.length; i++) {
        y = headPts[i].x * sinangle + headPts[i].y * cosangle;
        x = headPts[i].x * cosangle + headPts[i].y * -sinangle;
        headPts[i] = {x: x, y: y};
    }

    var result = [];
    for (var i = 0; i < headPts.length; i++) {
        result.push(new DMSLib.Point2D(headPts[i].x, headPts[i].y).add(offset));
    }
    return finalResult(result);
};

var getCirclePts = function(numPts, target) {
    var result = [];
    for (var i = 0; i < numPts; i++) {
        result.push(new DMSLib.Point2D.fromPolar(1, i * DMSLib.TAU / numPts));
    }
    setPointspread(result, {center: new DMSLib.Point2D(target.width / 2, target.height / 2), avgR: target.height / 3});
    return finalResult(result);
};

var getRandomPts = function(numPts, target) {
    showPoints = true;
    var result = [];
    for (var i = 0; i < numPts; i++) {
        var x = Math.random() * target.width;
        var y = Math.random() * target.height;
        result.push(new DMSLib.Point2D(x, y));
    }
    return finalResult(result);
};

var __toBeat = function(x, y, target) {return target.pixel(x, y) / 255.0;};
var getTargetPts = function(numPts, target) {
    showPoints = true;
    result = [];
    while (result.length < numPts) {
        var x = Math.random() * target.width;
        var y = Math.random() * target.height;
        var dice = Math.random();
        if (dice > __toBeat(x, y, target)) {
            result.push(new DMSLib.Point2D(x, y));
        }
    }
    return finalResult(result);
};

var getHousePts = function() {
    var result = [];
    housePts.forEach(function(pt) {
        result.push(new DMSLib.Point2D(pt.x, pt.y));
    });
    setPointspread(result, {center: new DMSLib.Point2D(target.width / 2, target.height / 2), avgR: target.height / 3});
    return finalResult(result);
};


var getPtsFromSvg = function(svgString) {
    var result = [];
    var parsePoint = function(pointString) {
        var coordStrings = pointString.split(',');
        if (coordStrings.length !== 2) { return false;}

        var x = parseFloat(coordStrings[0]);
        var y = parseFloat(coordStrings[1]);
        if (x == NaN || y == NaN) {return false;}

        result.push(new DMSLib.Point2D(x,y));
        return true;
    };

    var tourSvgTokens = svgString.split(' ').filter(function(s) {return s !== '';});

    var idx = 0;
    //burn through initial header
    while (idx < tourSvgTokens.length && tourSvgTokens[idx] !== 'd="M') {idx++;}
    idx++;

    // first point
    parsePoint(tourSvgTokens[idx]);

    // skip "C, and two points of first line"
    idx += 3;

    while (idx < tourSvgTokens.length && parsePoint(tourSvgTokens[idx])) {idx += 3;}
    return finalResult(result);
};

var getSvgFromPts = function(ptsIn) {
    var pts = __to2D(ptsIn.slice());

    var result = '<?xml version="1.0" encoding="UTF-8" standalone="no"?> \
                  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" \
                  "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"> \
                  <svg xmlns="http://www.w3.org/2000/svg" \
                  width="1280px" height="720px" \
                  viewBox="0 0 1280 720"> \
                  <path id="Unnamed" \
                  fill="none" stroke="black" stroke-width="1" \
                  d="M ';
    result += pts[0].x.toString() + ',' + pts[0].y.toString() + ' ';
    result += 'C ';
    for (var i = 1; i < pts.length; i++) {
        result += pts[i - 1].x.toString() + ',' + pts[i - 1].y.toString() + ' ';
        result += pts[i].x.toString() + ',' + pts[i].y.toString() + ' ';
        result += pts[i].x.toString() + ',' + pts[i].y.toString() + ' ';
    }
    
    result += '" /> </svg>';
    return result;
};

/////////////////////////// data
var housePts = [{x: 10,y: 1}, {x: 9,y: 2}, {x: 11,y: 2}, {x: 8,y: 3}, {x: 12,y: 3}, {x: 7,y: 4}, {x: 13,y: 4}, {x: 6,y: 4.95}, {x: 7,y: 5}, {x: 13,y: 5}, {x: 14,y: 4.95}, {x: 7,y: 6}, {x: 13,y: 6},
                {x: 7,y: 7}, {x: 13,y: 7}, {x: 7,y: 8}, {x: 13,y: 8}, {x: 7,y: 9}, {x: 13,y: 9}, {x: 7,y: 10}, {x: 13,y: 10}, {x: 7,y: 11}, {x: 13,y: 11}, {x: 13,y: 12}, {x: 13,y: 13},
                {x: 6,y: 12}, {x: 7,y: 12}, {x: 5,y: 13}, {x: 6,y: 13},
                {x: 0,y: 14}, {x: 1,y: 14}, {x: 2,y: 14}, {x: 3,y: 14}, {x: 4,y: 14}, {x: 5,y: 14}, {x: 13,y: 14}, {x: 14,y: 14}, {x: 15,y: 14}, {x: 16,y: 14}, {x: 17,y: 14}, {x: 18,y: 14}, {x: 19,y: 14}, {x: 20,y: 14},
                {x: 0,y: 16}, {x: 2,y: 16}, {x: 4,y: 16}, {x: 6,y: 16}, {x: 8,y: 16}, {x: 10,y: 16}, {x: 14,y: 16}, {x: 16,y: 16}, {x: 18,y: 16}, {x: 20,y: 16}];
