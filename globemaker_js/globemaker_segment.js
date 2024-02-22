var Globemaker = Globemaker || {};

//
//  radiusOnPlane:       +ve means arcing ccw
//  rotateAngleOnplane:  how far to rotate on the plane (possibly negative)
//  centerPt             center point on the plane 
//  endPlanarPos         you know, b
//  endPlanarTheta       direction vector at end of arc
//
//  rotateAxisOnSphere   the axis point on sphere closest to the arc (where |sphere radius| < pi/2)
//  rotateAngleOnSphere  simply rotate a to b (independent of length < 0, or radius < 0)
//  radiusOnSphere       +ve means arcing ccw.
//
//  NOTE!  radius on sphere is _different_ from radius on plane  
Globemaker.arcValues = function(sweep, radius, startPlanarPos, startPlanarTheta) {
    let r = {};

    // all values HALFTAU apart are equivalent. We want |radius| < QUARTERTAU
    radius = 0.5 * DMSLib.fixAngle(radius*2); 

    // planar stuff
    if(Math.abs(radius) < DMSLib.QUARTERTAU - 1e-5) {
        r.radiusOnPlane = Math.tan(radius);
        r.rotateAngleOnPlane = sweep * Math.cos(radius) * Math.sign(radius);

        let startToCenter = DMSLib.Point2D.fromPolar(r.radiusOnPlane, startPlanarTheta + DMSLib.QUARTERTAU);
        let centerToStart = startToCenter.negate();
        r.centerPt = startPlanarPos.add(startToCenter);
        let centerToEnd = DMSLib.Point2D.fromPolar(centerToStart.R(), centerToStart.theta() + r.rotateAngleOnPlane);

        r.endPlanarPos = r.centerPt.add(centerToEnd);
        r.endPlanarTheta = startPlanarTheta + r.rotateAngleOnPlane;
    } else {
        r.endPlanarPos = startPlanarPos.add(DMSLib.Point2D.fromPolar(sweep, startPlanarTheta));
        r.endPlanarTheta = startPlanarTheta;
    }

    // spherical stuff () axis of rotation for arc is radius from zaxis to yaxis)
    r.rotateAngleOnSphere = sweep * Math.sign(radius)
    r.rotateAxisOnSphere = new DMSLib.Point3D(0, Math.sin(radius), Math.cos(radius));
    r.radiusOnSphere = radius;

    return r;
};

(function($) {
    // -----------------------------------------------------------------
    // $.Segment
    // -----------------------------------------------------------------
    $.Segment = function(aOnSphere, aOnPlane, aDir, strength, length, radius) {
        this.aRot = aOnSphere;      // rotates z-axis-towards-x to the position and location of a
        this.a = aOnPlane;
        this.aDir = aDir;           // Point2D vector
        this.strength = strength;
        this.length = length;       // length as given

        this.b = aOnPlane.add(aDir.scaledTo(length));  // value of end point if going in a straight line

        if(radius === null || radius === undefined) return;

        arcCalcs = Globemaker.arcValues(length, radius, aOnPlane, aDir.theta());
        this.b = arcCalcs.endPlanarPos;
        if (arcCalcs.radiusOnPlane !== undefined) {
            Object.assign(this, arcCalcs);
        }
    };

})(Globemaker);
