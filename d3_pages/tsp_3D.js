var display_radius_3d = 330;

var to_beat_3D = function(x,y,target) {
    var result = target.pixel(x, y) / 255.0;
    var phi = y / target.height * DMSLib.HALFTAU;
    var result = 1 - ((1-result) * Math.sin(phi));
    
    return result;
};

var tsp_dist_3D = function(a,b) {
    var a_3d = DMSLib.Point3D.fromSphericalCoords(1.0, a.y / 720 * DMSLib.HALFTAU, a.x / 1280 * DMSLib.TAU);
    var b_3d = DMSLib.Point3D.fromSphericalCoords(1.0, b.y / 720 * DMSLib.HALFTAU, b.x / 1280 * DMSLib.TAU);
    return a_3d.sub(b_3d).R();
}

var __display = function(pt) {
    return pt.mul(display_radius_3d)
             .add(new DMSLib.Point3D(640, 360, 0));
};

var __to3D = function(obj) {
    if(Array.isArray(obj)) {
        for(i=0; i<obj.length; i++) {
            obj[i] = __to3D(obj[i]);
        }
        return obj;
    } else {
        return DMSLib.Point3D.fromSphericalCoords(1.0,
                                                  obj.y / 720 * DMSLib.HALFTAU,
                                                  obj.x / 1280 * DMSLib.TAU);
    }
};

var __to3D_int = [];
for(var x=0; x<1280; x++) {
    for (var y = 0; y<720; y++) {
        __to3D_int[y*1280+x] = __to3D(new DMSLib.Point2D(x, y));
    }
}


var line_function_3D = d3.svg.line() 
        .defined(function(d) {return __display(d).z > 0;})
        .x(function(d) {return 1280-__display(d).x;})
        .y(function(d) {return __display(d).y;})
        .interpolate('linear');



var stipple_3D = function (iter) {
    // initialize accumulator variables
    var newpos = [];
    var i;

    // add weighted images pixels to nearest cities
    for(var x=0; x<target.width; x++) {
        for(var y = 0; y < target.height; y++) {
            var weight = 255-target.pixel(x,y);
            
            if(weight > 0) {
                weight *= Math.sin(y / target.height * DMSLib.HALFTAU);
                
                var pt = __to3D_int[y*1280+x];
                var idx = find_nearest_neighbor_idx(pt, tour);
                newpos[idx] = newpos[idx] ? newpos[idx].add(pt.mul(weight)) : pt.mul(weight);
            }
        }
    }

    // calculate weighted average and show
    for(i=start_idx+1; i<end_idx; i++) {
        if(newpos[i]) {
            tour[i] = newpos[i].scaledTo(1);
        }
    }
    update_line();

    if(iter===undefined) iter=20;
    if(iter!=0) {
        timer = setTimeout(function() {stipple(iter-1); }, 21);
    } else {
        clearTimeout(timer);
        timer = null;
        d3.select('#Stipple').property('value', 'Stipple');
    }
};

var set_pointspread_3D = function(pts, target) {
    var offset = target.sub(calc_centroid(pts));

    for(var i=0; i<pts.length; i++) {
       pts[i] = pts[i].add(offset).normalized();
    }
};

var convert_to_3D_app = function() {
    __to_beat = to_beat_3D;
    __tsp_dist = tsp_dist_3D;
    lineFunction = line_function_3D;
    final_result = function(result) { return __to3D(result);}
    stipple = stipple_3D;
    get_pointspread = calc_centroid;
    set_pointspread = set_pointspread_3D;

    __to3D(__animation);
    __to3D(__animation2);
    __to3D(tour);
    
    background_image
        .attr("x", 640 - display_radius_3d)
        .attr("y", 360 - display_radius_3d)
        .attr("width", display_radius_3d * 2)
        .attr("height", display_radius_3d * 2)
        .attr("xlink:href", 'sphere.png');
    
    update_line();
};

