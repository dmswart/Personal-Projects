var __sa_temp = 0,
    __smoothness = 0,
    __step_size=1;
var __animation = [],
    __animation2 = [];

// animation accessors
var num_frames = function() { return __animation.length; };
var get_frame = function(i) { return __animation[i]; };
var reverse_animation = function() { __animation = __animation.reverse(); };
var start_new_animation = function(pts) {
    __animation2 = __animation;
    __animation = [];
    __animation.push(pts.slice());
};

get_animation_pts = function(pts, target, offset) {
    var i, j,
        result = [],
        frame, pt,
        min_x = 1028 
        max_x = 0,
        offset_x = 0;

    for(i=0; i<6; i++ ) {
        frame = get_frame(Math.floor(i/5*(num_frames()-1)));
        for(var j=0; j<=frame.length; j++) {
            pt = frame[j%frame.length];
            result.push(new DMSLib.Point2D(pt.x+offset_x, pt.y));
            min_x = Math.min(min_x, pt.x+offset_x);
            max_x = Math.max(max_x, pt.x+offset_x);
        }
        result.push(null);
        offset_x = max_x + 20;
    }

    var scale = 1240 / (max_x - min_x);
    for(i=0; i<result.length; i++) {
        if(result[i]) {
            result[i] = new DMSLib.Point2D((result[i].x - min_x) * scale + 20,
                                           result[i].y * scale);
        }
    }

    return result;
};

//accessors
set_smoothness = function(val) { __smoothness = val; }
set_sa_temp = function(val) { __sa_temp = val; }

// step_size accessor 
var set_stepsize = function(size) {
    __step_size = size;
    document.getElementById('stepsize').innerHTML = __step_size.toString();
};

var scale_stepsize = function(scale) {
    var new_val = __step_size * scale;
    if(new_val < 1) {new_val = 1;}
    
    set_stepsize(new_val);
};


// utility functions 
var glue_animations = function(glue_frames) {
    if(!__animation2.length) { return; }
    
    if(glue_frames === undefined) {glue_frames = 5;}
    
    var new_frame, pt1, pt2;
    for(var i=1; i<glue_frames-1; i++) {
        new_frame = [];
        for(var p=0; p<__animation[0].length; p++) {
            pt1 = __animation[__animation.length-1][p];
            pt2 = __animation2[__animation2.length-1][p];
            new_frame[p] = pt1.mul(glue_frames-1-i).add(pt2.mul(i)).div(glue_frames-1);
        }
        __animation.push(new_frame);
    }
    __animation = __animation.concat(__animation2.reverse());
    __animation2 = [];
};


var __is_valid_new_point = function(pts, new_pt, idx) {
    var a1 = pts[(idx - __step_size + pts.length) % pts.length];
    var old_a2 = pts[idx];
    var new_a2 = new_pt;
    var a3 = pts[(idx + __step_size) % pts.length];

    if(!ends_joined) {
        if(idx + __step_size >= pts.length) { a3 = pts[pts.length-1]; }
        if(idx - __step_size < 0) { a1 = pts[0]; }
    } 

    var tolerance = Math.min(a1.sub(a3).R()) * 0.2;
    
    for (var i = (idx%__step_size); i < pts.length; i+=__step_size) {
        var b1 = pts[i];
        var b2 = pts[(i+__step_size)%pts.length];

        // check proximity
        if(b1 !== a1 && b1 !== old_a2 && b1 !== a3) {
            if (b1.sub(new_a2).R() < tolerance) {
                return false;
            }
        }

        // edge intersection
        if(!ends_joined && (i + __step_size >= pts.length || i - __step_size < 0)) {continue;} // don't check the edge between endpts
        if (b1 !== a1 && b1 !== old_a2) {
            if (edge_intersects_edge(a1, new_a2, b1, b2) || 
                edge_intersects_edge(new_a2, a3, b1, b2) ||
                edge_intersects_edge(old_a2, new_a2, b1, b2)) {
                return false;
            }
        }
    }
    return true;
};


var __angle_threshold_for_step_size_increment = 0.08; // ~5 degrees
var smooth = function(max_mvmt) {
    // if max_mvt = undefined, it's first frame: start animation
    if (max_mvmt === undefined) {
        max_mvmt = 0;
        set_stepsize(1);
        start_new_animation(tour);
    }
    
    var pointspread = get_pointspread(get_frame(0));
    var saved_tour = tour.slice();

    if( avg_bend(tour, __step_size) < __angle_threshold_for_step_size_increment) {
        scale_stepsize(2);
    }

    var num_iter, idx, prev, next, new_pt;
    for (num_iter = 0; num_iter < 1000; num_iter++) {

        var new_tour = [];
        for(idx=0; idx<=start_idx; idx++) {new_tour[idx] = tour[idx];}
        for(idx=end_idx; idx<tour.length; idx++) {new_tour[idx] = tour[idx];}
        
        if(xs_are_monotonic(tour, start_idx, end_idx)) {
            //totally gonna cheat
            for (idx = start_idx+1; idx < end_idx; idx++) {
                var final_pt = tour[start_idx].mul(end_idx-1-idx).add(tour[end_idx].mul(idx-start_idx)).div(end_idx-start_idx-1);
                new_tour[idx] = tour[idx].mul(0.75).add(final_pt.mul(0.25));
            }
        } else {
            for (idx = start_idx+1; idx < end_idx; idx+=__step_size) {
                prev = (idx - __step_size + tour.length) % tour.length;
                next = (idx + __step_size) % tour.length;
                if(!ends_joined) {
                    if (idx + __step_size >= tour.length) {next = tour.length-1;}
                    if (idx - __step_size < 0) {prev = 0;}
                }
    
                // Chow Glickstein with a parameter of delta = 1/3
                new_pt = calc_centroid([tour[prev], tour[idx], tour[next]]);
                
    
                if (__is_valid_new_point(tour, new_pt, idx)) {
                    new_tour[idx] = new_pt;
                } else {
                    new_tour[idx] = tour[idx];
                }
            }
    
            fill_in_tour(new_tour, tour.length);
            if(start_idx < 0) {set_pointspread(new_tour, pointspread);}
        }
        tour = new_tour;

        var mvmt = movement(tour, saved_tour);
        if (max_mvmt === 0) { max_mvmt = mvmt; }
        if (mvmt >= max_mvmt) { break; }
    }

    // if this is first time through, we use this amount of movement as the step amount.
    __animation.push(tour.slice());

    update_line();

    if (mvmt < max_mvmt) {
        clearTimeout(timer);
        timer = null;
        d3.select('#Smooth').property('value', 'Smooth');
    } else {
        timer = setTimeout(function() {smooth(max_mvmt); }, 21);
    }
};


var tighten = function() {
    glue_animations();
 
    var num_pts = get_frame(0).length;

    for(var f = 1; f < num_frames()-1; f++) {
        var p;
        var new_frame = [];
        var avg_edge_size = avg_edge(tour);
        
        for(p=0; p<=start_idx; p++) {new_frame[p] = __animation[f][p];}
        for(p=end_idx; p<num_pts; p++) {new_frame[p] = __animation[f][p];}
        
        for(p = start_idx+1; p < end_idx; p+=__step_size) {
            var prev = (p + num_pts - __step_size) % num_pts;
            var next = (p + __step_size) % num_pts;

            if(!ends_joined) {
                if(p - __step_size < 0) {prev = 0;} 
                if(p + __step_size >= num_pts) {next = num_pts-1;}
            }

            var newpt = calc_centroid([__animation[f][p],
                                       __animation[f+1][p],
                                       __animation[f-1][p],
                                       __animation[f][prev],
                                       __animation[f][next]],
                                      [1, 1, 1, 0.05 * __smoothness, 0.05 * __smoothness])
                        .jitter(avg_edge_size * (__sa_temp / 10));

            if( __is_valid_new_point(__animation[f], newpt, p)) {
                new_frame[p] = newpt;
            } else {
                new_frame[p] = __animation[f][p];
            }
        }

        if(!ends_joined) {
            if(new_frame[num_pts-1] === undefined) {
                // write in the last point so we can fill things in if nec.
                new_frame[num_pts - 1] = __animation[f][num_pts - 1];
            }
            new_frame[0].y = 467;
            new_frame[num_pts-1].y = 467;
        }

        fill_in_tour(new_frame, num_pts);
        if(!does_tour_cross(new_frame, ends_joined)) {
            __animation[f] = new_frame;
        }
    }

    tour = __animation[Math.floor(num_frames()/2)];
    update_line();

    timer = setTimeout(function() {tighten();}, 11);
};

//TODO - remove external globals? (start_idx, end_idx, timer, tour)
// TODO - fix bug where tightening animations causes line to go through itself
