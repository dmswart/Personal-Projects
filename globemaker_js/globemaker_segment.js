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
Globemaker.arcValues = function(sweep, radiusOnSphere, startPlanarPos, startPlanarTheta) {
    let r = {};

    // all values HALFTAU apart are equivalent. We want |radius| < QUARTERTAU
    radiusOnSphere = 0.5 * DMSLib.fixAngle(radiusOnSphere*2); 

    // planar stuff
    if(Math.abs(radiusOnSphere) < DMSLib.QUARTERTAU - 1e-5) {
        r.radiusOnPlane = Math.tan(radiusOnSphere);
        r.rotateAngleOnPlane = sweep * Math.cos(radiusOnSphere) * Math.sign(radiusOnSphere);

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

    // spherical stuff () axis of rotation for arc is radiusOnSphere from zaxis to yaxis)
    r.rotateAngleOnSphere = sweep * Math.sign(radiusOnSphere)
    r.rotationAxisAtZ = new DMSLib.Point3D(0, Math.sin(radiusOnSphere), Math.cos(radiusOnSphere));
    r.radiusOnSphere = radiusOnSphere;

    return r;
};

(function($) {
    // -----------------------------------------------------------------
    // $.Segment
    // -----------------------------------------------------------------
    $.Segment = function(aRot, a, aDir, strength, length, radius) {
        this.aRot = aRot;      // rotates z-axis-towards-x to the position and location of a
        this.a = a;
        this.aDir = aDir;           // Point2D vector
        this.strength = strength;
        this.length = length;       // length as given
        this.radiusOnSphere = radius;

        this.initialize();
    };

    $.Segment.prototype = {
        initialize: function() {
            if (this.radiusOnSphere === null || this.radiusOnSphere===undefined) {
                // boring line segment
                this.b = this.a.add(this.aDir.scaledTo(this.length));  // value of end point if going in a straight line
                return;
            }

            arcCalcs = Globemaker.arcValues(this.length, this.radiusOnSphere, this.a, this.aDir.theta());
            this.b = arcCalcs.endPlanarPos;
            delete this.radiusOnPlane;
            if (arcCalcs.radiusOnPlane !== undefined) {
                Object.assign(this, arcCalcs);
                this.rotateAxisOnSphere = this.aRot.apply(this.rotationAxisAtZ);
            }
        },
        isArc: function() {return this.radiusOnPlane !== null && this.radiusOnPlane !== undefined;},
    }

})(Globemaker);
