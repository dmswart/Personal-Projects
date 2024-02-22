var Globemaker = Globemaker || {};

// given a point on sphere, and a line segment
function calcRelative3DPointToLine(pt, seg) {
    let result = {};
    // pointOnSphere is now relative to segment starting at z axis pointing towards x
    var ptOnSphere = seg.aRot.inverse().apply(pt);
    var angle = DMSLib.fixAnglePositive(Math.atan2(ptOnSphere.x, ptOnSphere.z)); // at z towards x

    if (angle < seg.length || angle > DMSLib.TAU + seg.length) {
        // closest orthoganally
        result.theta = ptOnSphere.y > 0 ? DMSLib.QUARTERTAU : -DMSLib.QUARTERTAU;
        result.closestPt = angle;
        if (seg.length < 0)
            result.closestPt -= DMSLib.TAU; // should match sign
        result.distance = Math.abs(Math.asin(ptOnSphere.y));
    } else if (DMSLib.angleBetween(angle, 0) < DMSLib.angleBetween(angle, seg.length)) {
        // angle to a (z-axis) is TAU - angle, angle to b (end of rot.) is angle - length
        // so point on sphere is closer to start (z-axis) than to end (end of rot).
        result.theta = ptOnSphere.theta();
        result.closestPt = 0.0;
        result.distance = ptOnSphere.phi();
    } else {
        // point on sphere is closer to end (end of rot.) than to start (z-axis)
        ptOnSphere = new DMSLib.Point3D(
            Math.sin(Math.atan2(ptOnSphere.x, ptOnSphere.z) - seg.length) * Math.sqrt(1.0 - ptOnSphere.y * ptOnSphere.y),
            ptOnSphere.y,
            Math.cos(Math.atan2(ptOnSphere.x, ptOnSphere.z) - seg.length) * Math.sqrt(1.0 - ptOnSphere.y * ptOnSphere.y));
   
        // now it's same as previous case except for closest pt.
        result.theta = ptOnSphere.theta();
        result.closestPt = seg.length;
        result.distance = ptOnSphere.phi();
    }
    return result;
}

// given a point on the plane, and a line segment
function calcRelative2DPointToLine(pt, seg) {
    let result = {};
    let bToPt = pt.sub(seg.b);
    let aToPt = pt.sub(seg.a);
    let sgn = Math.sign(seg.length);

    if (DMSLib.Point2D.dot(bToPt, seg.aDir) * sgn > 0.0) {
        // beyond point B
        result.theta = DMSLib.fixAngle(bToPt.theta() - seg.aDir.theta());
        result.distance = bToPt.R();
        result.closestPt = seg.length;
    } else if (DMSLib.Point2D.dot(aToPt, seg.aDir) * sgn < 0.0) {
        // beyond point A
        result.theta = DMSLib.fixAngle(aToPt.theta() - seg.aDir.theta());
        result.distance = aToPt.R();
        result.closestPt = 0.0;
    } else {
        let anglePtAB = DMSLib.fixAngle(aToPt.theta() - seg.aDir.theta());
        signedDist = Math.sin(anglePtAB) * aToPt.R();
        result.closestPt = Math.cos(anglePtAB) * aToPt.R();
        result.theta = signedDist > 0.0 ? DMSLib.QUARTERTAU : -DMSLib.QUARTERTAU;
        result.distance = Math.abs(signedDist);
    }
    return result;
}

// given a point on the plane and an arc
function calcRelative2DPointToArc(pt, seg) {
    let result = {};
    let signRadius = Math.sign(seg.radiusOnPlane);

    // arc goes from a to b around center c.
    let p_withCAsOrigin = pt.sub(seg.centerPt);
    angleAlongArc = DMSLib.fixAnglePositive((p_withCAsOrigin.theta() - seg.a.sub(seg.centerPt).theta()) * signRadius);

    if (angleAlongArc < seg.rotateAngleOnPlane || angleAlongArc > DMSLib.TAU + seg.rotateAngleOnPlane) {   // closest orthoganally
        let Rdist = p_withCAsOrigin.R() - Math.abs(seg.radiusOnPlane);  // how far out from center wrt. arc, (closer values -ve, farther +ve).
        result.closestPt = (seg.rotateAngleOnPlane > 0) ? angleAlongArc : angleAlongArc - DMSLib.TAU;
        result.theta = ((Rdist < 0) ? DMSLib.QUARTERTAU : -DMSLib.QUARTERTAU) * signRadius;
        result.distance = Math.abs(Rdist);
    } else if (DMSLib.angleBetween(angleAlongArc, 0) < DMSLib.angleBetween(angleAlongArc, seg.rotateAngleOnPlane)) {
        let aToPt = pt.sub(seg.a);
        result.closestPt = 0;
        result.theta = DMSLib.fixAngle(aToPt.theta() - seg.aDir.theta());
        result.distance = aToPt.R();
    } else {
        let bToPt = pt.sub(seg.b);
        result.closestPt = seg.rotateAngleOnPlane;
        result.theta = DMSLib.fixAngle(bToPt.theta() - seg.aDir.theta() + seg.rotateAngleOnPlane);
        result.distance = bToPt.R();
    }

    result.closestPt *= seg.rotateAngleOnSphere / seg.rotateAngleOnPlane 

    return result;
}

function calcRelative3DPointToArc(pt, seg) {
    let result = {};
    let signRadius = Math.sign(seg.radiusOnSphere);

    let aOnSphere = seg.aRot.apply(DMSLib.Point3D.zAxis());
    rotateSuchThatArcAxisIsAtZ = DMSLib.Rotation.fromVectorToVector(seg.rotateAxisOnSphere, DMSLib.Point3D.zAxis());
    aOnSphere = rotateSuchThatArcAxisIsAtZ.apply(aOnSphere);
    pt_ = rotateSuchThatArcAxisIsAtZ.apply(pt);
    angleAlongArc = DMSLib.fixAnglePositive((pt_.theta() - aOnSphere.theta()) * signRadius);

    if (angleAlongArc < seg.length || angleAlongArc > DMSLib.TAU + seg.length) {   // closest orthoganally
        result.closestPt = (seg.length > 0) ? angleAlongArc : angleAlongArc - DMSLib.TAU;
        phiDiff = pt_.phi() - aOnSphere.phi();
        result.theta = (phiDiff < 0 ? DMSLib.QUARTERTAU : -DMSLib.QUARTERTAU) * signRadius;
        result.distance = Math.abs(phiDiff);
    } else if (DMSLib.angleBetween(angleAlongArc, 0) < DMSLib.angleBetween(angleAlongArc, seg.length)) {
        // same as implementation for line 
        pt_ = seg.aRot.inverse().apply(pt);
        result.theta = pt_.theta();
        result.closestPt = 0.0;
        result.distance = pt_.phi();
    } else {
        result.closestPt = seg.length;

        let aToZ = seg.aRot.inverse();  // a rot takes zaxis to a
        let aToB = DMSLib.Rotation.fromAngleAxis(seg.rotateAngleOnSphere, seg.rotateAxisOnSphere);
        let bToA = aToB.inverse();
        let bToZ = aToZ.combine(bToA);
        pt_ = bToZ.apply(pt);

        result.theta = pt_.theta();
        result.distance = pt_.phi();
    }

    return result;
}

(function($) {
    // -----------------------------------------------------------------
    // RelativePosition
    // 
    // to create give as input, a point (either on sphere or plane)
    // and a segment (which exists on both sphere and plane) 
    // 
    // will calculate 
    //    closestpoint: 'distance' along the segment that given point is closest to. (from 0..segment length)
    //    theta: the angle towards the given point, (direction of segment at closestpoint is 0) 
    //    distance: distance between given point and closest point
    // -----------------------------------------------------------------
    $.RelativePosition = function(pt, seg) {
        this.seg = seg;

        if (pt instanceof DMSLib.Point3D && seg.radiusOnPlane === undefined )
            Object.assign(this, calcRelative3DPointToLine(pt, seg));
        else if (pt instanceof DMSLib.Point2D && seg.radiusOnPlane === undefined )
            Object.assign(this, calcRelative2DPointToLine(pt, seg));
        else if (pt instanceof DMSLib.Point3D && seg.radiusOnPlane !== undefined) 
            Object.assign(this, calcRelative3DPointToArc(pt, seg));
        else if (pt instanceof DMSLib.Point2D && seg.radiusOnPlane !== undefined) 
            Object.assign(this, calcRelative2DPointToArc(pt, seg));
    }; 

    $.RelativePosition.prototype = {
        // accessors
        pointOnSphere: function() {
            var result;
            if (this.closestPt === 0) { //  ********************* if closest point is at pt a...
                atZ = DMSLib.Point3D.fromSphericalCoordinates(1.0, this.distance, this.theta);
                return this.seg.aRot.apply(atZ);
            } else if (this.closestPt === this.seg.length) { // **************** closest point is at b...
                var atZ = DMSLib.Point3D.fromSphericalCoordinates(1.0, this.distance, this.theta);

                // this is as if b is at z-axis, we need to rotate around y axis by closestPt
                if(this.seg.rotateAngleOnSphere === undefined) {

                    result = new DMSLib.Point3D(Math.sin(Math.atan2(atZ.x, atZ.z) + this.closestPt) * Math.sqrt(1.0 - atZ.y * atZ.y),
                                                atZ.y,
                                                Math.cos(Math.atan2(atZ.x, atZ.z) + this.closestPt) * Math.sqrt(1.0 - atZ.y * atZ.y));
                    return this.seg.aRot.apply(result);
                } else {
                    let zToA = this.seg.aRot;  // a rot takes zaxis to a
                    let aToB = DMSLib.Rotation.fromAngleAxis(this.seg.rotateAngleOnSphere, this.seg.rotateAxisOnSphere);
                    let zToB  = aToB.combine(zToA)
                    return zToB.apply(atZ);
                }
            } else if(this.seg.rotateAngleOnSphere === undefined) { // ************** closest point is along the line segment.
                result = new DMSLib.Point3D(Math.cos(this.distance) * Math.sin(this.closestPt),
                                            Math.sin(this.distance) * Math.sign(this.theta),
                                            Math.cos(this.distance) * Math.cos(this.closestPt));
                return this.seg.aRot.apply(result);
            } else { // *********************** closest point is along the arc.
                atZ = new DMSLib.Point3D(0, Math.sin(this.distance) * Math.sign(this.theta), Math.cos(this.distance));
                // this is as if closest pt is at z axis pointing to x.

                let zToA = this.seg.aRot;  // a rot takes zaxis to a
                let aToCP = DMSLib.Rotation.fromAngleAxis(this.closestPt * Math.sign(this.seg.radiusOnSphere), this.seg.rotateAxisOnSphere);
                let zToCP  = aToCP.combine(zToA)
                return zToCP.apply(atZ);
            }
        },

        pointOnPlane: function() {
            if(this.seg.rotateAngleOnPlane === undefined) {
                return this.seg.a
                    .add(this.seg.aDir.scaledTo(this.closestPt))
                    .add(DMSLib.Point2D.fromPolar(this.distance, this.seg.aDir.theta() + this.theta));
            } else {
                // calc closest point (cp)
                cpAngle = this.closestPt * this.seg.rotateAngleOnPlane / this.seg.rotateAngleOnSphere;
                var signDueToRadius = this.seg.radiusOnPlane > 0 ? 1.0: -1.0;
                
                var cpOnPlane = this.seg.centerPt
                    .add(DMSLib.Point2D.fromPolar(
                        Math.abs(this.seg.radiusOnPlane),
                        this.seg.aDir.theta() + (cpAngle - DMSLib.QUARTERTAU) * signDueToRadius)); // TODO check that this didn't change, then delete previous

                var cpDirTheta = this.seg.aDir.theta() + cpAngle * signDueToRadius;
                return cpOnPlane.add(DMSLib.Point2D.fromPolar(this.distance, cpDirTheta + this.theta));
            }
        }
    };

    // static variables, functions
    $.RelativePosition.isNearerOnSphere = function(pt3d, seg, criteria) {
        rp = new $.RelativePosition(pt3d, seg);
        return rp.distance * seg.strength < criteria - DMSLib.EPSILON;
        /*
        var ptOnSphere = seg.aRot.inverse().apply(pt3d);  // we think of our segment starting at z and rotating towards x
        var angle = DMSLib.fixAnglePositive(Math.atan2(ptOnSphere.x, ptOnSphere.z));

        if (angle < seg.length || angle > DMSLib.TAU + seg.length) {
            // closest orthogonally
            return (Math.abs(Math.asin(ptOnSphere.y)) * seg.strength < criteria - DMSLib.EPSILON);
        } else if (DMSLib.angleBetween(angle, 0) < DMSLib.angleBetween(angle, seg.length)) {
            // angle to A (z-axis) is TWO_PI-angle, angle to B (end of rot.) is angle-length
            // point on sphere is closer to z axis then to end of rot.
            return (ptOnSphere.phi() * seg.strength < criteria - DMSLib.EPSILON);
        } else {
            // ptOnSphere is closer to end of rotation then to z axis
            //rotate ptOnSphere about y (from x to z) by grSegments[dtCurrent.nIdx].length
            ptOnSphere = new DMSLib.Point3D(
                Math.sin(Math.atan2(ptOnSphere.x, ptOnSphere.z) - seg.length) * Math.sqrt(1.0 - ptOnSphere.y * ptOnSphere.y),
                ptOnSphere.y,
                Math.cos(Math.atan2(ptOnSphere.x, ptOnSphere.z) - seg.length) * Math.sqrt(1.0 - ptOnSphere.y * ptOnSphere.y));

            return (ptOnSphere.phi() * seg.strength < criteria - DMSLib.EPSILON);
        } // else if
        */
    };

})(Globemaker);