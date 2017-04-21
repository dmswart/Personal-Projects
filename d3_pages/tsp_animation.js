// TODO - pregenerate line segment data for animations - dedicated line update with transitions.
var __pregenerated_segment_data
var __pregenerate_segment_data = function() {
    __pregenerated_segment_data = [];
    for(i=0; i<num_frames(); i++) {
        var pts = get_frame(i);
        index_points(pts);
        __pregenerated_segment_data[i] = build_segment_data(pts, offset);
    }
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
}

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

var animate = function(frame) {
    var frame_time, delay, easing;

    if(frame === undefined) {
        frame = 0;
        frame_time = undefined;
        delay = 1000;
        __pregenerate_segment_data();
    } else if (frame === num_frames()) {
        clearTimeout(timer);
        timer = null;
        d3.select('#Animate').property('value', 'Animate');
        tour = tour.slice();
        return;
    } else {
        frame_time = movement(get_frame(frame), get_frame(frame-1)) / pps * 1000;
        if(get_frame(frame)[0] instanceof DMSLib.Point3D) { frame_time *= 1000;}
        delay = frame_time;
        easing = 'linear';
    }

    if(frame===1) {
        easing = 'cubic-in';
        frame_time *= 3;
        delay *= 3;
    } else if(frame === num_frames()-1) {
        easing = 'cubic-out';
        frame_time *= 3;
        delay *= 3;
    }

    // tour = get_frame(frame);
    update_line(frame_time, easing, __pregenerated_segment_data[frame]);
    timer = setTimeout(function () { animate(frame + 1); }, delay);
};
