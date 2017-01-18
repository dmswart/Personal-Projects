var display_radius_3d = 330;

var to_beat_3D = function(x,y,target) {
    var result = target.pixel(x, y) / 255.0;
    var latitude = (y / target.height) * DMSLib.HALFTAU;
    var result = 1 - ((1-result) * Math.sin(latitude));
    
    return result;
};

var tsp_dist_3D = function(a,b) {
    var a_3d = DMSLib.Point3D.fromSphericalCoords(1.0, a.y / 720 * DMSLib.HALFTAU, a.x / 1280 * DMSLib.TAU);
    var b_3d = DMSLib.Point3D.fromSphericalCoords(1.0, b.y / 720 * DMSLib.HALFTAU, b.x / 1280 * DMSLib.TAU);
    return a_3d.sub(b_3d).R();
}

var display = function(pt) {
    return DMSLib.Point3D.fromSphericalCoords(display_radius_3d, pt.y / 720 * DMSLib.HALFTAU, pt.x / 1280 * DMSLib.TAU)
            .add(new DMSLib.Point3D(640, 360, 0));
};


var line_function_3D = d3.svg.line() 
        .defined(function(d) {return display(d).z > 0;})
        .x(function(d) {return 1280-display(d).x;})
        .y(function(d) {return display(d).y;})
        .interpolate('linear');


var convert_to_3D_app = function() {
    svg.
    __to_beat = to_beat_3D;
    __tsp_dist = tsp_dist_3D;
    lineFunction = line_function_3D;
    
    background_image
        .attr("x", 640 - display_radius_3d)
        .attr("y", 360 - display_radius_3d)
        .attr("width", display_radius_3d * 2)
        .attr("height", display_radius_3d * 2)
        .attr("xlink:href", 'sphere.png');
    
    update_line();
};

