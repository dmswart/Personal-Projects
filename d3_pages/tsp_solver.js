var randomizePts = function(pts, startIdx, endIdx) {
    var i;
    var x;
    var tmp;

    for (i = startIdx + 1; i < endIdx; i++) {
        x = Math.floor(Math.random() * (endIdx - i)) + i;

        tmp = pts[x].copy();
        pts[x] = pts[i].copy();
        pts[i] = tmp.copy();
    }
};

var doInsertionHeuristic = function(pts, startIdx, endIdx) {
    var i;
    var j;

    for (i = startIdx + 2; i < endIdx; i++) {
        // find j such that Sum( [j,i] [i,j+1] -[j,j+1] )  is minimized
        var newpt = pts[i].copy();
        var minidx = -1;
        var mindist = 10000;

        for (j = Math.max(0, startIdx); j < i; j++) {
            var a = pts[j];
            var b = pts[(j + 1) % i];

            var dist = a.sub(newpt).R() + newpt.sub(b).R() - a.sub(b).R();
            if (dist < mindist) {
                mindist = dist;
                minidx = j;
            }
        }

        //now insert newpt after pts[minidx], shift everything else forward by one
        for (j = i; j > minidx + 1; j--) {
            pts[j] = pts[j - 1];
        }
        pts[minidx + 1] = newpt;
    }
};

var doTwoOpt = function(pts, startIdx, endIdx, useMaxes) {
    var changed = false;
    var a1;
    var b1;
    var a2;
    var b2;
    var a1toa2;
    var b1tob2;
    var a1tob1;
    var a2tob2;
    for (a1 = startIdx + 1; a1 < endIdx; a1++) {
        for (b1 = a1 + 2; b1 < endIdx; b1++) {
            a2 = (a1 + 1) % pts.length;
            b2 = (b1 + 1) % pts.length;

            a1toa2 = pts[a2].sub(pts[a1]).R();
            b1tob2 = pts[b2].sub(pts[b1]).R();
            a1tob1 = pts[b1].sub(pts[a1]).R();
            a2tob2 = pts[b2].sub(pts[a2]).R();

            if (!useMaxes && a1tob1 + a2tob2 < a1toa2 + b1tob2 ||
                useMaxes && Math.max(a1tob1, a2tob2) < Math.max(a1toa2, b1tob2)) {
                // swap [a2 ... b1]
                var from;
                var to;
                for (idx = 0; a2 + idx < b1 - idx; idx++) {
                    from = (a2 + idx) % pts.length;
                    to = (b1 - idx) % pts.length;
                    tmp = pts[from].copy();
                    pts[from] = pts[to].copy();
                    pts[to] = tmp.copy();
                }
                changed = true;
            }
        }
    }

    return changed;
};
