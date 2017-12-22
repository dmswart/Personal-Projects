var Globemaker = Globemaker || {};

(function($) {
    // -----------------------------------------------------------------
    // RelativePosition
    // -----------------------------------------------------------------
    $.RelativePosition = function(pt, seg) {
        if (pt instanceof DMSLib.Point3D) {
            // given a point on sphere
            this.seg = seg;
            var ptOnSphere = seg.aRot.inverse().apply(pt);
            var angle = DMSLib.fixAnglePositive(Math.atan2(ptOnSphere.x, ptOnSphere.z));

            if (angle < seg.length) {
                // closest orthoganally
                this.theta = ptOnSphere.y > 0 ? DMSLib.QUARTERTAU : -DMSLib.QUARTERTAU;
                this.closestPt = angle;
                this.distance = Math.abs(Math.asin(ptOnSphere.y));
            } else if ((DMSLib.TAU - angle) < (angle - seg.length)) {
                // angle to a (z-axis) is TAU - angle, angle to b (end of rot.) is angle - length
                // so point on sphere is closer to start (z-axis) than to end (end of rot).
                this.theta = ptOnSphere.theta();
                this.closestPt = 0.0;
                this.distance = ptOnSphere.phi();
            } else {
                // point on sphere is closer to end (end of rot.) than to start (z-axis)
                ptOnSphere = new DMSLib.Point3D(
                    Math.sin(Math.atan2(ptOnSphere.x, ptOnSphere.z) - seg.length) * Math.sqrt(1.0 - ptOnSphere.y * ptOnSphere.y),
                    ptOnSphere.y,
                    Math.cos(Math.atan2(ptOnSphere.x, ptOnSphere.z) - seg.length) * Math.sqrt(1.0 - ptOnSphere.y * ptOnSphere.y));
    
                // now it's same as previous case except for closest pt.
                this.theta = ptOnSphere.theta();
                this.closestPt = segment.length;
                this.distance = ptOnSphere.phi();
            }
        } else if (pt instanceof DMSLib.Point2D) {
            // given a point on the plane
            this.seg = seg;
            var bToPt = pt.sub(seg.b);
            var aToPt = pt.sub(seg.a);

            if (DMSLib.Point2D.dot(bToPt, seg.aToBDir) > 0.0) {
                this.theta = DMSLib.fixAngle(aToPt.theta() - seg.aToBDir.theta());
                this.closestPt = segment.length;
                this.distance = bToPt.r();
            } else if (DMSLib.Point2D.dot(aToPt, seg.aToBDir) < 0.0) {
                this.theta = DMSLib.fixAngle(aToPt - seg.aToBDir.theta());
                this.closestPt = 0.0;
                this.distance = aToPt.r();
            } else {
                var anglePtAB = DMSLib.fixAngle(aToPt.theta() - seg.aToBDir.theta());
                this.distance = Math.sin(anglePtAB) * aToPt.r();
                this.closestPt = Math.cos(anglePtAB) * aToPt.r();
                this.theta = this.distance > 0.0 ? DMS.QUARTERTAU : -DMS.QUARTERTAU;
                this.distance = Math.abs(this.distance);
            }
        }
    };

    $.RelativePosition.prototype = {
        // accessors
        pointOnSphere: function() {
            var result;
            if (this.closestPt < DMSLib.EPSILON) {
                // if closest point is at a...
                result = DMSLib.Point3D.fromSphericalCoordinates(1.0, this.distance, this.theta);
            } else if (this.closestPt >= this.seg.length - DMSLib.EPSILON) {
                // closest point is at b...
                var tmpPt = DMSLib.Point3D.fromSphericalCoordinates(1.0, this.distance, this.theta);

                // this is as if b is at z-axis, we need to rotate around y axis by closestPt
                result = new DMSLib.Point3D(Math.sin(Math.atan2(tmpPt.x, tmpPt.z) + this.closestPt) * Math.sqrt(1.0 - tmpPt.y * tmpPt.y),
                                            tmpPt.y,
                                            Math.cos(Math.atan2(tmpPt.x, tmpPt.z) + this.closestPt) * Math.sqrt(1.0 - tmpPt.y * tmpPt.y));
            } else if (Math.abs(this.theta - DMSLib.QUARTERTAU) < DMSLib.EPSILON) {
                // right side
                result = new DMSLib.Point3D(Math.cos(this.distance) * Math.sin(this.closestPt),
                                            Math.sin(this.distance),
                                            Math.cos(this.distance) * Math.cos(this.closestPt));
            } else {
                // left side
                result = new DMSLib.Point3D(Math.cos(this.distance) * Math.sin(this.closestPt),
                                            -Math.sin(this.distance),
                                            Math.cos(this.distance) * Math.cos(this.closestPt));
            }

            return this.seg.aRot.apply(result);
        },

        pointOnPlane: function() {
            return this.seg.a
                .add(this.seg.aToBDir.scaledTo(this.closestPt))
                .add(new DMSLib.Point2D.fromPolar(this.distance, seg.aToBDir.theta() + this.theta()));
        }
    };

    // static variables, functions
    $.RelativePosition.isNearerOnSphere = function(pt3d, seg, criteria) {
        var ptOnSphere = seg.aRot.inverse().apply(pt3d);  // we think of our segment starting at z and rotating towards x
        var angle = DMSLib.fixAnglePositive(Math.atan2(ptOnSphere.x, ptOnSphere.z));

        if (angle < seg.length) {
            // closest orthogonally
            return (Math.abs(Math.asin(ptOnSphere.Y)) * seg.strength < criteria - DMSLib.EPSILON);
        } else if ((DMSLib.TAU - angle) < (angle - seg.length)) {
            // angle to A (z-axis) is TWO_PI-angle, angle to B (end of rot.) is angle-length
            // point on sphere is closer to z axis then to end of rot.
            return (ptOnSphere.phi() * seg.strength < criteria - DMSLib.EPSILON);
        } else {
            // ptOnSphere is closer to end of rotation then to z axis
            //rotate ptOnSphere about y (from x to z) by grSegments[dtCurrent.nIdx].length
            ptOnSphere = new Point3D(
                Math.sin(Math.atan2(ptOnSphere.X, ptOnSphere.Z) - seg.length) * Math.Sqrt(1.0 - ptOnSphere.Y * ptOnSphere.Y),
                ptOnSphere.Y,
                Math.cos(Math.atan2(ptOnSphere.X, ptOnSphere.Z) - seg.length) * Math.Sqrt(1.0 - ptOnSphere.Y * ptOnSphere.Y));

            return (ptOnSphere.phi() * seg.strength < criteria - DMSLib.EPSILON);
        } // else if
    };

})(Globemaker);
