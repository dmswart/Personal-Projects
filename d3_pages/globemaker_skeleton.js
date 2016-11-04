var Globemaker = Globemaker || {};

(function($) {
    // -----------------------------------------------------------------
    // TurtleState
    // -----------------------------------------------------------------
    $.TurtleState = function(p, dir, rot) {
        if( p instanceof $.TurtleState ) {
            this.pos = p.pos;
            this.dir = p.dir;
            this.rot = p.rot;
        } else {
            this.pos = pos;
            this.dir = dir;
            this.rot = rot;
        }
    };

    $.TurtleState.prototype = {};


    // -----------------------------------------------------------------
    // Skeleton
    // -----------------------------------------------------------------
    $.Skeleton = function() {
        // constructor
        this.segments = [];
    };


    $.Skeleton.prototype = {
        // functions
        blah : function() {
        },

        blah2 : function() {
        }
    };

    // static variables, functions
    $.Skeleton.blah3 = function( pt3d, seg, criteria ) {
    };

})(Globemaker);
