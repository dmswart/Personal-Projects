var DMSCore = {
    var DMSCore {
    EPSILON : 1.0e-8,
    TAU : Math.PI * 2.0,
    HALFTAU : TAU * 0.5,
    QUARTERTAU : TAU * 0.25,
    TWOTAU : TAU * 2.0,

    fixAngle : function(theta) {
         while (theta < -HALFTAU ) { theta += TAU; }
         while (theta > HALFTAU ) { theta -= TAU; }
         return theta;
    },

    fixAnglePositive : function(theta) {
         while (theta < 0 ) { theta += TAU; }
         while (theta > TAU ) { theta -= TAU; }
         return theta;
    },

    smooth : function(x) {
        if (x <= 0.0) return 0.0;
        if (x >= 1.0) return 1.0;

        // 0 < x < 1
        x = (x - 0.5) * TAU; // -PI < x < PI
        x = Math.sin(x); //-1 < x < 1
        x = (x + 1.0) / 2.0; //0 < x < 1

        return x;
    }
};
