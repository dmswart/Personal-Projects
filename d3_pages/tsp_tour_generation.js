var get_spiral_pts = function(num_pts) {
    var result = [], i;

    // way in
    for(i=0; i<=num_pts/2; i++) {
        result.push( new DMSLib.Point2D.fromPolar(i+30, i/10) );
    }
    // way out
    for(i=num_pts/2; i>=0; i--) {
        result.push( new DMSLib.Point2D.fromPolar(i+60, i/10) );
    }

    return result;
};

var get_circle_pts = function(num_pts) {
    var result = [];
    for(var i=0; i<num_pts; i++) {
        result.push(new DMSLib.Point2D.fromPolar(1, i * DMSLib.TAU / num_pts));
    }
    return result;
};

var get_random_pts = function(num_pts) {
    var result = [];
    for(var i=0; i<num_pts; i++) {
        result.push( new DMSLib.Point2D(Math.random() - 0.5, Math.random() - 0.5).mul(2) );
    }
    return result;
};

var get_house_pts = function() {
    var result = [];
    house_pts.forEach(function(pt) {
        result.push( new DMSLib.Point2D(pt.x, pt.y));
    });
    return result;
};

/////////////////////////// data
var house_pts = [ {x:10,y:1}, {x:9,y:2}, {x:11,y:2}, {x:8,y:3}, {x:12,y:3}, {x:7,y:4}, {x:13,y:4}, {x:6,y:4.95}, {x:7,y:5}, {x:13,y:5}, {x:14,y:4.95}, {x:7,y:6}, {x:13,y:6},
                  {x:7,y:7}, {x:13,y:7}, {x:7,y:8}, {x:13,y:8}, {x:7,y:9}, {x:13,y:9}, {x:7,y:10}, {x:13,y:10}, {x:7,y:11}, {x:13,y:11}, {x:13,y:12}, {x:13,y:13},
                  {x:6,y:12}, {x:7,y:12}, {x:5,y:13}, {x:6,y:13},
                  {x:0,y:14}, {x:1,y:14}, {x:2,y:14}, {x:3,y:14}, {x:4,y:14}, {x:5,y:14}, {x:13,y:14}, {x:14,y:14}, {x:15,y:14}, {x:16,y:14}, {x:17,y:14}, {x:18,y:14}, {x:19,y:14}, {x:20,y:14},
                  {x:0,y:16}, {x:2,y:16}, {x:4,y:16}, {x:6,y:16}, {x:8,y:16}, {x:10,y:16}, {x:14,y:16}, {x:16,y:16}, {x:18,y:16}, {x:20,y:16} ];
