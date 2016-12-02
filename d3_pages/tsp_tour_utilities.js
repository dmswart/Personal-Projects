var get_pointspread = function(pts) {
    var center = calc_centroid(pts);
    
    var avgR = 0;
    pts.forEach( function(pt) {
        avgR += pt.sub(center).R();
    });
    avgR /= pts.length;

    return {center:center, avgR:avgR};
};

var set_pointspread = function(pts, target) {
    // first offset them to the origin.
    var center = calc_centroid(pts); 
    var i;
    for(i=0; i<pts.length; i++) {
        pts[i] = pts[i].sub(center);
    }

    // now set radius;
    var factor = target.avgR / avgR(pts);
    for(i=0; i<pts.length; i++) {
        pts[i] = pts[i].mul(factor);
    }

    // now offset it to the target center
    for(i=0; i<pts.length; i++) {
        pts[i] = pts[i].add(target.center);
    }
};

var calc_centroid = function(pts) {
    var result = new DMSLib.Point2D();
    pts.forEach( function(pt) {
        result = result.add(pt);
    });
    return result.div(pts.length);
};

var avgR = function(pts) {
    var total = 0;

    pts.forEach( function(pt) {
        total += pt.R();
    });
    return total / pts.length;
};

var avg_edge = function(pts) {
    var total = pts[pts.length-1].sub(pts[0]).R();
    for(var i=0; i<pts.length-2; i++) {
        total += pts[i].sub(pts[i+1]).R();
    }
    return total / pts.length;
}

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

var avg_bend = function(pts, step_size) {
    var result = 0,
        count = 0,
        a = pts[pts.length-3*step_size],
        b = pts[pts.length-2*step_size],
        c = pts[pts.length-1*step_size];
    for(idx=0; idx<pts.length; idx+=step_size) {
        a = b;
        b = c;
        c = pts[idx];
        result += DMSLib.HALFTAU - DMSLib.Point2D.angle(a,b,c);
        count++;
    }
    
    return result / count;
};

var fill_in_tour = function(pts, num_pts) {
    //assumes pts[0] is filled in
    var from, to, from_pt, to_pt;
    
    for(from = 0; from < num_pts-1; from=to) {
        to = from+1;
        while(pts[to%num_pts] === undefined) {to++;}
    
        from_pt = pts[from];
        to_pt = pts[to%num_pts];
        for(var i=1; from+i<to; i++) {
            pts[from+i] = from_pt.mul(to-from-i).add(to_pt.mul(i)).div(to-from);
        }
    }
};

var find_direction_most_pt = function(pts, x, y) {
    var result = 0;
    var best_value = x*pts[0].x + y*pts[0].y;
    for(var i=1; i<pts.length; i++) {
        var value = x*pts[i].x + y*pts[i].y;
        if(value > best_value) {
            best_value = value;
            result = i;
        }
    }
    return result;
};

var find_closest_pt = function(pts, pt) {
    var result = 0;
    var min_dist = pt.sub(pts[0]).R(); 

    for(var i=1; i<pts.length; i++) {
        var dist = pt.sub(pts[i]).R(); 
        if(dist < min_dist) {
            min_dist = dist;
            result = i;
        }
    }
    return result;
};

var increase_number = function(pts, num) {
    while(pts.length < num) {
        // find idx of longest edge
        var idx = 0;
        var max_edge = pts[0].sub(pts[1]).R();
        for(var i=1; i<pts.length-1; i++) {
            var dist = pts[i].sub(pts[i+1]).R();
            if(dist > max_edge) {
                max_edge = dist;
                idx = i;
            }
        }

        // insert a vertex half way in between
        var new_pt = pts[idx].add(pts[idx+1]).mul(0.5);
        pts.splice(idx+1, 0, new_pt);
    }
}
