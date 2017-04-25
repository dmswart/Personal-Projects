// TODO - dedicated line update with transitions.

var __fifo
var __pregenerate_segment_data = function() {
    __fifo = [];
    var saved = {start: start_idx, end: end_idx};
    for(i=0; i<num_frames(); i++) {
        var pts = get_frame(i);
        index_points(pts);

        var frame_movement = i ? movement(get_frame(i), get_frame(i-1)) : 0;
        if( pts[0] instanceof DMSLib.Point3D) { frame_movement *= 1000; }

        start_idx = Math.floor(saved.start / __step_size_list[i]);
        end_idx = Math.floor(saved.end / __step_size_list[i]);
        __fifo.push( { frame: build_segment_data(decimate_pts(pts, __step_size_list[i]), offset),
                       movement: frame_movement} );

        if(__step_size_list[i+1] !== undefined && __step_size_list[i+1] !== __step_size_list[i]) {
            start_idx = Math.floor(saved.start / __step_size_list[i+1]);
            end_idx = Math.floor(saved.end / __step_size_list[i+1]);
            __fifo.push( { frame: build_segment_data(decimate_pts(pts, __step_size_list[i+1]), offset),
                           movement: 0} );
        }
    }
    start_idx = saved.start;
    end_idx = saved.end;
};

var take_tour = function() {
    end_idx++;
    d3.select('#end_idx').property('value', end_idx);
    update_line();

    if(end_idx < tour.length - 1) {
        var frame_time = 1000 / pps;
        var t = (end_idx+1) / (tour.length+1);
        if(t < 0.2) {frame_time /= (t*5); }
        if(t > 0.8) {frame_time /= ((1-t)*5);}

        timer = setTimeout(function() {take_tour(); }, frame_time);
    } else {
        clearTimeout(timer);
        timer = null;
        d3.select('#TakeTour').property('value', 'Take Tour');
    }
};

var get_lat_long_tilt = function(idx) {
    var this_pt = tour[(idx + tour.length) % tour.length];
    var next_pt = tour[(idx + tour.length + 1) % tour.length];
    var mid_pt = this_pt.add(next_pt).normalized();
    tour.splice(idx+1, 0, mid_pt);

    var result = { lat: -90.0 + mid_pt.phi() / Math.PI * 180.0,
                   long: 90.0 - mid_pt.theta() / Math.PI * 180.0,
                   tilt: 0.0,
                   idx: idx+1};

    var long = DMSLib.Rotation.fromAngleAxis(result.long * Math.PI / 180.0, DMSLib.Point3D.z_axis() );
    var lat = DMSLib.Rotation.fromAngleAxis(result.lat * Math.PI / 180.0, DMSLib.Point3D.x_axis() );
    var rot = lat.combine(long);
    var pt1 = rot.apply(this_pt);
    var pt2 = rot.apply(next_pt);
    var delta = pt2.sub(pt1);

    result.tilt = Math.atan2(delta.z, -delta.x) * 180.0 / Math.PI;
    return result;
}

var get_angle_near = function(a, b) {
   while(a < b - 180.0) { a += 360.0;}
   while(a > b + 180.0) { a -= 360.0;}
   return a;
}


var __wz_origin;
var __wz_destination;
var __wz_start_ms;

// schedule:
// t=0s start orientation
// t=1s start zoom out
// t=3s start tour
// t=4s end zoom out, begin rotation
// t=9s end rotation, start zoom in
// t=10s tour should end about now
// t=12s end zoom in
var world_zoom = function(elapsed_ms) {
   // if we're beginning
   if(elapsed_ms === undefined) {
       __wz_origin = get_lat_long_tilt(start_idx);
       start_idx++;
       end_idx++;
       __wz_destination = get_lat_long_tilt(end_idx);
       end_idx++;

       __wz_destination.long = get_angle_near(__wz_destination.long, __wz_origin.long);
       __wz_destination.lat = get_angle_near(__wz_destination.lat, __wz_origin.lat);
       __wz_destination.tilt = get_angle_near(__wz_destination.tilt, __wz_origin.tilt);

       __wz_start_ms = (new Date()).getTime();

       offset.x = __wz_origin.long;
       offset.y = __wz_origin.lat;
       tilt = __wz_origin.tilt;
       zoom_level = 120;

       elapsed_ms = 0;
   }

   // if we're done
   if (elapsed_ms > 22000) {
       clearTimeout(timer);
       timer = null;
       d3.select('#WorldZoom').property('value', 'World Zoom');
       return;
   }

   elapsed_ms = ((new Date()).getTime() - __wz_start_ms);
   var t;

   // tilt
   if (elapsed_ms >= 6000 && elapsed_ms < 18000) {
       t = d3.ease('exp-in-out')( (elapsed_ms - 6000) / 12000 );

       start_idx =  Math.floor(__wz_origin.idx + t * (__wz_destination.idx-__wz_origin.idx));
       offset.x = __wz_origin.long + t * (__wz_destination.long - __wz_origin.long);
       offset.y = __wz_origin.lat + t * (__wz_destination.lat - __wz_origin.lat);
       tilt = __wz_origin.tilt + t * (__wz_destination.tilt - __wz_origin.tilt);
   } else if (elapsed_ms >= 18000) {
       start_idx = __wz_destination.idx;
       offset.x = __wz_destination.long;
       offset.y = __wz_destination.lat;
       tilt = __wz_destination.tilt;
   }

   // zoom
   if (elapsed_ms >= 2000 && elapsed_ms < 7000) {
       t = d3.ease('exp-in-out')( (elapsed_ms - 2000) / 5000 );
       zoom_level = 120 + t * (0 - 120);
   } else if (elapsed_ms >= 7000 && elapsed_ms < 16000) {
       zoom_level = 0;
   } else if (elapsed_ms >= 16000 && elapsed_ms < 21000) {
       t = d3.ease('exp-in-out')( (elapsed_ms - 16000) / 5000 );
       zoom_level = 0 + t * (120.0 - 0);
   } else if (elapsed_ms >= 21000) {
       zoom_level = 120;
   }

   update_camera();
   update_line();
   timer = setTimeout(function() {world_zoom(elapsed_ms);}, 30);
};

var misc_animation = function(step) {
    if(step===undefined) {step=5;}

    if(step===0) {
        start_line.attr('d', lineFunction([]));
        inside_line.attr('d', lineFunction([{x:0,y:467}, {x:861.88,y:467}]));
        timer = setTimeout(function() {misc_animation(step+1);}, 1000);
    } else if(step===1) {
        inside_line
            .transition()
            .duration(3000)
            .ease('sin-in-out')
            .attr('d', lineFunction([{x:640,y:467},{x:3000,y:467}]));
        timer = setTimeout(function() {misc_animation(step+1);}, 3000);
    } else if(step===2) {
        start_line
            .attr('d', lineFunction([{x:-640,y:467},{x:-1,y:467}]));
        timer = setTimeout(function() {misc_animation(step+1);}, 6000);
    } else if(step===3) {
        start_line
            .transition()
            .duration(3000)
            .ease('sin-out')
            .attr('d', lineFunction([{x:-640,y:467},{x:640,y:467}]));
        timer = setTimeout(function() {misc_animation(step+1);}, 3000);
    } else if(step==5) {
        end_idx = Math.max(start_idx,0);
        update_line();
        timer = setTimeout(function () { misc_animation(step + 1); }, 1000);
    } else if(step==6) {
        line_space.append('circle')
            .attr('r', 200)
            .attr('cx', tour[end_idx].x)
            .attr('cy', tour[end_idx].y)
            .attr('stroke', 'none')
            .attr('fill', inside_color)
            .attr('opacity', 0)
            .transition()
                .duration(2000)
                .ease('bounce-in')
                .attr('opacity', 1)
                .attr('r', line_hickness/2);
        d3.select('#TakeTour').property('value', 'Stop');
        d3.select('#Misc').property('value', 'Misc');
        timer = setTimeout(function() {take_tour();}, 2000);
    } else {
        clearTimeout(timer);
        timer = null;
        d3.select('#Misc').property('value', 'Misc');
    }
};

var animate = function(stage) {
    var frame_time, delay, easing;

    if(stage === undefined) {
        // one second breather before we start.
        __pregenerate_segment_data();
        update_line(undefined, undefined, __fifo.shift().frame);
        timer = setTimeout(function () { animate(0); }, 1000);
        return;
    } else if (__fifo.length === 0) {
        // we're done - clean up
        clearTimeout(timer);
        timer = null;
        d3.select('#Animate').property('value', 'Animate');
        tour = tour.slice();
        return;
    } else if (__fifo[0].movement === 0) {
        // do an instant switch - no transition
        frame_time = undefined;
        easing = undefined;
        delay=30;
    } else {
        // standard
        frame_time = __fifo[0].movement / pps * 1000;
        delay = frame_time;
        easing = 'linear';
    }

    // easing in and out
    if(stage===0) {
        easing = 'cubic-in';
        frame_time *= 3;
        delay *= 3;
    } else if(__fifo.length === 1) {
        easing = 'cubic-out';
        frame_time *= 3;
        delay *= 3;
    }

    // tour = get_frame(frame);
    update_line(frame_time, easing, __fifo.shift().frame);
    timer = setTimeout(function () { animate(1); }, delay);
};
