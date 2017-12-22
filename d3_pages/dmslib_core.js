var DMSLib = DMSLib || {};

DMSLib.EPSILON = 1.0e-8;
DMSLib.TAU = Math.PI * 2.0;
DMSLib.HALFTAU = Math.PI;
DMSLib.QUARTERTAU = Math.PI * 0.5;
DMSLib.TWOTAU = Math.PI * 4.0;

DMSLib.fixAngle = function(theta) {
    while (theta < -this.HALFTAU) {theta += this.TAU;}
    while (theta > this.HALFTAU) {theta -= this.TAU;}
    return theta;
};

DMSLib.fixAnglePositive = function(theta) {
    while (theta < 0) {theta += this.TAU;}
    while (theta > this.TAU) {theta -= this.TAU;}
    return theta;
};

DMSLib.smooth = function(x) {
    if (x <= 0.0) {return 0.0;}
    if (x >= 1.0) {return 1.0;}

    // 0 < x < 1
    x = (x - 0.5) * this.TAU; // -PI < x < PI
    x = Math.sin(x); //-1 < x < 1
    x = (x + 1.0) / 2.0; //0 < x < 1

    return x;
};
