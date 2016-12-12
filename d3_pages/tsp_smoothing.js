var __sa_temp = 3,
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


//sa_temp accessor
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

    if(ground_mode && (idx + __step_size >= pts.length)) { a3 = pts[pts.length-1]; }

    var tolerance = Math.min(a1.sub(a3).R()) * 0.2;

    for (var i = 0; i < pts.length; i+=__step_size) {
        var b1 = pts[i];
        var b2 = pts[(i+__step_size)%pts.length];

        // check proximity
        if(b1 !== a1 && b1 !== old_a2 && b1 !== a3) {
            if (b1.sub(new_a2).R() < tolerance) {
                return false;
            }
        }

        // edge intersection
        if(ground_mode && i===pts.length-__step_size) {continue;} // don't check the edge between endpts
        if (b1 !== a1 && b1 !== old_a2) {
            if (edge_intersects_edge(a1, new_a2, b1, b2) || edge_intersects_edge(new_a2, a3, b1, b2)) {
                return false;
            }
        }
    }
    return true;
};


var smooth = function(max_mvmt) {
    var pointspread = get_pointspread(tour);

    // if max_mvt = undefined, it's first frame: start animation
    if (max_mvmt === undefined) {
        max_mvmt = 0;

        set_stepsize(1);

        start_new_animation(tour);
    }

    var saved_tour = tour.slice();

    if( avg_bend(tour, __step_size) < 0.08) { // ~5 degrees
        scale_stepsize(2);
    }

    var num_iter, idx, prev, next, new_pt;
    for (num_iter = 0; num_iter < 2000; num_iter++) {
        
        if(ground_mode && xs_are_strictly_increasing(tour)) {
            //totally gonna cheat
            for (idx = 1; idx < tour.length-1; idx++) {
                var final_pt = tour[0].mul(tour.length-1-idx).add(tour[tour.length-1].mul(idx)).div(tour.length-1);
                tour[idx] = tour[idx].mul(0.75).add(final_pt.mul(0.25));
            }
        } else {
            var new_tour = [];
            for (idx = 0; idx < tour.length; idx+=__step_size) {
    
                prev = (idx - __step_size + tour.length) % tour.length;
                next = (idx + __step_size) % tour.length;
                if(ground_mode && (idx + __step_size >= tour.length)) {next = tour.length-1;}
    
                new_pt = tour[idx].add(tour[prev]).add(tour[next]).div(3);
    
                if (__is_valid_new_point(tour, new_pt, idx)) {
                    new_tour[idx] = new_pt;
                } else {
                    new_tour[idx] = tour[idx];
                }
            }
    
            if(ground_mode) {
                // pin endpoints
                new_tour[0] = tour[0];
                new_tour[tour.length-1] = tour[tour.length-1];
            }
            fill_in_tour(new_tour, tour.length);
            tour = new_tour;
            if(!ground_mode) {set_pointspread(tour, pointspread);}
        }

        var mvmt = movement(tour, saved_tour);
        if (max_mvmt === undefined || max_mvmt === 0) { max_mvmt = mvmt; }
        if(mvmt >= max_mvmt) { break; }
    }

    // if this is first time through, we use this amount of movement as the step amount.
    __animation.push(tour.slice());

    updateLine();

    if (mvmt < max_mvmt) {
        clearTimeout(timer);
        timer = null;
        d3.select('#Smooth').property('value', 'Smooth');
    } else {
        timer = setTimeout(function() {smooth(max_mvmt); }, 21);
    }
};


var optimize_animation = function() {
    glue_animations();
 
    var num_pts = get_frame(0).length;

    for(var f = 1; f < num_frames()-1; f++) {
        var new_frame = [];
        var avg_edge_size = avg_edge(tour);
        for(var p = 0; p < num_pts; p+=__step_size) {
            var prev = (p + num_pts - __step_size) % num_pts;
            var next = (p + __step_size) % num_pts;

            if(ground_mode) {
                if(p===0) {prev = 0;} 
                if(p + __step_size >= num_pts) {next = num_pts-1;}
            }

            var newpt = __animation[f][p]
                    .add(__animation[f+1][p])
                    .add(__animation[f-1][p])
                    .add(__animation[f][prev].mul(0.05))
                    .add(__animation[f][next].mul(0.05))
                    .div(3.1)
                    .add(DMSLib.Point2D.fromPolar(Math.random() * avg_edge_size * (__sa_temp / 10),
                                                  Math.random() * DMSLib.TAU));

            if( __is_valid_new_point(__animation[f], newpt, p)) {
                new_frame[p] = newpt;
            } else {
                new_frame[p] = __animation[f][p];
            }
        }

        if(ground_mode) {
            if(new_frame[num_pts-1] === undefined) {
                // write in the last point so we can fill things in if nec.
                new_frame[num_pts - 1] = __animation[f][num_pts - 1];
            }
            new_frame[0].y = 467;
            new_frame[num_pts-1].y = 467;
        }

        fill_in_tour(new_frame, num_pts);
        __animation[f] = new_frame;
    }

    tour = __animation[Math.floor(num_frames()/2)];
    updateLine();

    timer = setTimeout(function() {optimize_animation();}, 11);
};

//TODO - remove external globals? (ground_mode, timer, tour)
// TODO - fix bug where gluing two animations causes line to go through itself
