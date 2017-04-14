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
                .attr('r', line_thickness/2);
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
