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
    return new DMSLib.Point2D(-pt.x * display_radius_3d + 640,
                              -pt.z * display_radius_3d + 360)
};

var __to3D = function(obj) {
    if (obj instanceof DMSLib.Point2D) {
        return DMSLib.Point3D.fromSphericalCoords(1.0, obj.y / 720 * DMSLib.HALFTAU, obj.x / 1280 * DMSLib.TAU);
    }
    
    if(Array.isArray(obj)) {
        for(i=0; i<obj.length; i++) {
            obj[i] = __to3D(obj[i]);
        }
    }
    return obj;
};

var __to3D_int = [];
for(var x=0; x<1280; x++) {
    for (var y = 0; y<720; y++) {
        __to3D_int[y*1280+x] = __to3D(new DMSLib.Point2D(x, y));
    }
}

var __to2D = function(obj) {
    if (obj instanceof DMSLib.Point3D) {
        return new DMSLib.Point2D(DMSLib.fixAnglePositive(obj.theta()) / DMSLib.TAU * 1280,
                                  obj.phi() / DMSLib.HALFTAU * 720);
    }
    
    if(Array.isArray(obj)) {
        for(i=0; i<obj.length; i++) {
            obj[i] = __to2D(obj[i]);
        }
    }
    return obj;
}


var set_pointspread_3D = function(pts, target_in) {
    var target = target_in;
    if(target === undefined) { target = DMSLib.Point3D.origin(); }
    
    for(i=0; i<3; i++) {
        var offset = calc_centroid(pts).sub(target); 
        for (var i = 0; i < pts.length; i++) {
            pts[i] = pts[i].sub(offset).normalized();
        }
    } 
};

var build_segment_data_3D = function() {
    var result = [];

    for(var i=0; i<tour.length; i++) {
        var next = (i+1)%tour.length;

        if(tour[i] === null || tour[next] === null || tour[i].y < 0 || tour[next].y < 0) { continue; }
        
        var pt1 = __display(tour[i]);
        var pt2 = __display(tour[next]);
        
        var entry = {x1: pt1.x, x2: pt2.x, y1: pt1.y, y2: pt2.y,
            idx: i, color: inside_color};
        
        if(i < start_idx) { entry.color = start_color; }
        if(i >= end_idx) { entry.color = end_color; }
        result.push(entry);
    }
    return result;
};

var stipple_3D = function (iter) {
    // initialize accumulator variables
    var newpos = [],
        x, y, weight, pt, idx;

    // initialize weights and sums, mark up index
    for (idx = 0; idx < tour.length; idx++) {
        tour[idx].idx = idx;
        newpos.push(new DMSLib.Point3D());
    }

    var search_radius = Math.pow(avg_edge(tour), 2) * 5;
    var tree = new kdTree(tour.slice(), function (a, b) {
        return b.sub(a).R2();
    }, ["x", "y", "z"]);

    // add weighted images pixels to nearest cities
    for (x = 0; x < target.width; x++) {
        for (y = 0; y < target.height; y++) {
            if (target.pixel(x, y) === 255) continue;

            weight = 1 - (target.pixel(x, y) / 255) * Math.sin(y / 720 * DMSLib.HALFTAU);
            pt = __to3D_int[y * 1280 + x];

            var result = tree.nearest(pt, 1, search_radius);
            if (result && result[0]) {
            idx = result[0][0].idx;
                newpos[idx] = newpos[idx].add(pt.mul(weight));
            }
        }
    }

    // calculate weighted average
    for (idx = start_idx + 1; idx < end_idx; idx++) {
        if (newpos[idx].R()) {
            tour[idx] = newpos[idx].scaledTo(1);
        }
    }
    update_line();

    if (iter === undefined) iter = 10;
    if (iter != 0) {
        timer = setTimeout(function () {
            stipple(iter - 1);
        }, 21);
    } else {
        clearTimeout(timer);
        timer = null;
        d3.select('#Stipple').property('value', 'Stipple');
    }
};

var edge_intersects_edge_3D = function (a1, a2, b1, b2) {
    // shortcuts
    if( a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
        return false;
    }
    if( Math.max(a1.x, a2.x) < Math.min(b1.x, b2.x) ||
        Math.max(b1.x, b2.x) < Math.min(a1.x, a2.x) ||
        Math.max(a1.y, a2.y) < Math.min(b1.y, b2.y) ||
        Math.max(b1.y, b2.y) < Math.min(a1.y, a2.y) ||
        Math.max(a1.z, a2.z) < Math.min(b1.z, b2.z) ||
        Math.max(b1.z, b2.z) < Math.min(a1.z, a2.z) ) {
        return false;
    }
    
    var a1_x_a2 = DMSLib.Point3D.cross(a1, a2);
    var b1_x_b2 = DMSLib.Point3D.cross(b1, b2);
    var u = DMSLib.Point3D.cross(a1_x_a2, b1_x_b2).normalized();
    
    //check u
    var a1_x_u = DMSLib.Point3D.cross(a1, u);
    var u_x_a2 = DMSLib.Point3D.cross(u, a2);
    var u_is_between_a = DMSLib.Point3D.dot(a1_x_u, a1_x_a2) > DMSLib.EPSILON &&
                         DMSLib.Point3D.dot(u_x_a2, a1_x_a2) > DMSLib.EPSILON;
    var b1_x_u = DMSLib.Point3D.cross(b1, u);
    var u_x_b2 = DMSLib.Point3D.cross(u, b2);
    var u_is_between_b = DMSLib.Point3D.dot(b1_x_u, b1_x_b2) > DMSLib.EPSILON &&
                         DMSLib.Point3D.dot(u_x_b2, b1_x_b2) > DMSLib.EPSILON;
    
    if(u_is_between_a && u_is_between_b) { return true; }
    
    // check u's antipode v
    var v = u.negate();
    var a1_x_v = DMSLib.Point3D.cross(a1, v);
    var v_x_a2 = DMSLib.Point3D.cross(v, a2);
    var v_is_between_a = DMSLib.Point3D.dot(a1_x_v, a1_x_a2) > DMSLib.EPSILON &&
                         DMSLib.Point3D.dot(v_x_a2, a1_x_a2) > DMSLib.EPSILON;
    var b1_x_v = DMSLib.Point3D.cross(b1, v);
    var v_x_b2 = DMSLib.Point3D.cross(v, b2);
    var v_is_between_b = DMSLib.Point3D.dot(b1_x_v, b1_x_b2) > DMSLib.EPSILON &&
                         DMSLib.Point3D.dot(v_x_b2, b1_x_b2) > DMSLib.EPSILON;
    
    if(v_is_between_a && v_is_between_b) { return true; }

    return false;
};

var convert_to_3D_app = function() {
    __to_beat = to_beat_3D;
    __tsp_dist = tsp_dist_3D;
    build_segment_data = build_segment_data_3D;
    final_result = function(result) { return __to3D(result);}
    get_pointspread = calc_centroid;
    set_pointspread = set_pointspread_3D;
    stipple = stipple_3D;
    tour_angle = DMSLib.Point3D.sphereAngle;
    edge_intersects_edge = edge_intersects_edge_3D; 

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

