var DMSLib = DMSLib || {};

DMSLib.EPSILON = 1.0e-8;
DMSLib.TAU = Math.PI * 2.0;
DMSLib.HALFTAU = Math.PI;
DMSLib.QUARTERTAU = Math.PI * 0.5;
DMSLib.TWOTAU = Math.PI * 4.0;

// put theta between -HALFTAU and HALFTAU
DMSLib.fixAngle = function(theta) {
    while (theta < -this.HALFTAU) {theta += this.TAU;}
    while (theta > this.HALFTAU) {theta -= this.TAU;}
    return theta;
};

// difference between angles
DMSLib.angleBetween = function(angleA, angleB) {
    return Math.abs(DMSLib.fixAngle(angleA - angleB));
}


// put theta between 0 and TAU
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

DMSLib.dot = function(a, b) {
    if(a instanceof DMSLib.Point2D) {
        return DMSLib.Point2D.dot(a, b);
    } else {
        return DMSLib.Point3D.dot(a, b);
    }
}
DMSLib.cross = function(a, b) {
    if(a instanceof DMSLib.Point2D) {
        return DMSLib.Point2D.cross(a, b);
    } else {
        return DMSLib.Point3D.cross(a, b);
    }
}

DMSLib.erf = function(x) {
    // constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    // Save the sign of x
    let sign = Math.sign(x);
    x = Math.abs(x);

    // A&S formula 7.1.26
    var t = 1.0/(1.0 + p*x);
    var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);

    return sign*y;
}
