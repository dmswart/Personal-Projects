var __tsp_dist = function(a,b) {
    return a.sub(b).R();
}

var randomize_pts = function(pts, start_idx, end_idx) {
    var i, x, tmp;

    for(i=start_idx+1; i<end_idx; i++) {
        x = Math.floor(Math.random() * (end_idx-i)) + i;

        tmp = new DMSLib.Point2D(pts[x]);
        pts[x] = new DMSLib.Point2D(pts[i]);
        pts[i] = new DMSLib.Point2D(tmp);
    }
};

var do_insertion_heuristic = function(pts, start_idx, end_idx) { 
    var i, j;

    for (i = start_idx+2; i<end_idx; i++) {
        // find j such that Sum( [j,i] [i,j+1] -[j,j+1] )  is minimized
        var newpt = new DMSLib.Point2D(pts[i]),
            minidx = -1,
            mindist = 10000;

        for (j = Math.max(0,start_idx); j < i; j++) {
            var a = pts[j];
            var b = pts[(j+1)%i];

            var dist = __tsp_dist(a,newpt) + __tsp_dist(newpt,b) - __tsp_dist(a,b);
            if (dist < mindist) {
                mindist = dist;
                minidx = j;
            }
        }

        //now insert newpt after pts[minidx], shift everything else forward by one
        for(j=i; j>minidx+1; j--) {
            pts[j] = pts[j - 1];
        }
        pts[minidx+1] = newpt;
    }
};


var do_two_opt = function(pts, start_idx, end_idx, use_maxes) { 
    var changed = false;
    var a1, b1, a2, b2,
        a1toa2, b1tob2, a1tob1, a2tob2;
    for (a1 = start_idx+1; a1 < end_idx; a1++) {
        for (b1 = a1 + 2; b1 < end_idx; b1++) {
            a2 = (a1 + 1) % pts.length;
            b2 = (b1 + 1) % pts.length;

            a1toa2 = __tsp_dist(pts[a2],pts[a1]);
            b1tob2 = __tsp_dist(pts[b2],pts[b1]);
            a1tob1 = __tsp_dist(pts[b1],pts[a1]);
            a2tob2 = __tsp_dist(pts[b2],pts[a2]);

            if (!use_maxes && a1tob1 + a2tob2 < a1toa2 + b1tob2 ||
                use_maxes && Math.max(a1tob1,a2tob2) < Math.max(a1toa2, b1tob2)) {
                // swap [a2 ... b1]
                var from, to;
                for (idx = 0; a2 + idx < b1 - idx; idx++) {
                    from = (a2 + idx) % pts.length;
                    to = (b1 - idx) % pts.length;
                    tmp = new DMSLib.Point2D(pts[from]);
                    pts[from] = new DMSLib.Point2D(pts[to]);
                    pts[to] = new DMSLib.Point2D(tmp);
                }
                changed = true;
            }
        }
    }

    return changed;
};
