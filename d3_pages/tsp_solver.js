var randomize_pts = function(pts, fix_end_pts) {
    var begin, end, i, x, tmp;

    begin = fix_end_pts ? 1 : 0;
    end = fix_end_pts ? pts.length-2 : pts.length-1;
    for(i=begin; i<end; i++) {
        x = Math.floor(Math.random() * (end-i)) + i+1;

        tmp = new DMSLib.Point2D(pts[x]);
        pts[x] = new DMSLib.Point2D(pts[i]);
        pts[i] = new DMSLib.Point2D(tmp);
    }
};

var do_insertion_heuristic = function(pts, fix_end_pts) { 
    var begin, end, i, j;

    begin = fix_end_pts ? 1 : 0;
    end = fix_end_pts ? pts.length-2 : pts.length-1;
    for (i = begin+1; i<=end; i++) {
        // find j such that Sum( [j,i] [i,j+1] -[j,j+1] )  is minimized
        var newpt = new DMSLib.Point2D(pts[i]),
            minidx = -1,
            mindist = 10000;

        for (j = 0; j < i; j++) {
            var a = pts[j];
            var b = pts[(j+1)%i];

            var dist = a.sub(newpt).R() + newpt.sub(b).R() - a.sub(b).R();
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


var do_two_opt = function(pts, use_maxes, fix_end_pts) { 
    var changed = false;
    var a1, b1, a2, b2,
        a1toa2, b1tob2, a1tob1, a2tob2;
    for (a1 = 0; a1 < pts.length; a1++) {
        for (b1 = a1 + 2; b1 < pts.length; b1++) {
            a2 = (a1 + 1) % pts.length;
            b2 = (b1 + 1) % pts.length;
            if(fix_end_pts && (b1>=pts.length-1)) { continue;}

            a1toa2 = pts[a2].sub(pts[a1]).R();
            b1tob2 = pts[b2].sub(pts[b1]).R();
            a1tob1 = pts[b1].sub(pts[a1]).R();
            a2tob2 = pts[b2].sub(pts[a2]).R();

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
