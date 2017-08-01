var Globemaker = Globemaker || {};

(function($) {
    // -----------------------------------------------------------------
    // RelativePosition
    // -----------------------------------------------------------------
    $.RelativePosition = function(pt, seg) {
        if (pt instanceof DMSLib.Point3D) {
            // given a point on sphere
            this.seg = seg;
            var pt_on_sphere = seg.a_rot.inverse().apply(pt);
            var angle = DMSLib.fixAnglePositive(Math.atan2(pt_on_sphere.x, pt_on_sphere.z));

            if (angle < seg.length) {
                // closest orthoganally
                this.theta = pt_on_sphere.y > 0 ? DMSLib.QUARTERTAU : -DMSLib.QUARTERTAU;
                this.closest_pt = angle;
                this.distance = Math.abs(Math.asin(pt_on_sphere.y));
            } else if ((DMSLib.TAU - angle) < (angle - seg.length)) {
                // angle to a (z-axis) is TAU - angle, angle to b (end of rot.) is angle - length
                // so point on sphere is closer to start (z-axis) than to end (end of rot).
                this.theta = pt_on_sphere.theta();
                this.closest_pt = 0.0;
                this.distance = pt_on_sphere.phi();
            } else {
                // point on sphere is closer to end (end of rot.) than to start (z-axis)
                pt_on_sphere = new DMSLib.Point3D(
                    Math.sin(Math.atan2(pt_on_sphere.x, pt_on_sphere.z) - seg.length) * Math.sqrt(1.0 - pt_on_sphere.y * pt_on_sphere.y),
                    pt_on_sphere.y,
                    Math.cos(Math.atan2(pt_on_sphere.x, pt_on_sphere.z) - seg.length) * Math.sqrt(1.0 - pt_on_sphere.y * pt_on_sphere.y) );
    
                // now it's same as previous case except for closest pt.
                this.theta = pt_on_sphere.theta();
                this.closest_pt = segment.length;
                this.distance = pt_on_sphere.phi();
            }
        } else if (pt instanceof DMSLib.Point2D) {
            // given a point on the plane
            this.seg = seg;
            var b_to_pt = pt.sub(seg.b);
            var a_to_pt = pt.sub(seg.a);

            if ( DMSLib.Point2D.dot(b_to_pt, seg.a_to_b_dir) > 0.0 ) {
                this.theta = DMSLib.fixAngle(a_to_pt.theta() - seg.a_to_b_dir.theta());
                this.closest_pt = segment.length;
                this.distance = b_to_pt.r();
            } else if ( DMSLib.Point2D.dot(a_to_pt, seg.a_to_b_dir) < 0.0 ) {
                this.theta = DMSLib.fixAngle(a_to_pt - seg.a_to_b_dir.theta());
                this.closest_pt = 0.0;
                this.distance = a_to_pt.r();
            } else {
                var angle_pt_a_b = DMSLib.fixAngle(a_to_pt.theta() - seg.a_to_b_dir.theta());
                this.distance = Math.sin( angle_pt_a_b ) * a_to_pt.r();
                this.closest_pt = Math.cos( angle_pt_a_b ) * a_to_pt.r();
                this.theta = this.distance > 0.0 ? DMS.QUARTERTAU : -DMS.QUARTERTAU; 
                this.distance = Math.abs(this.distance);
            }
        }
    };



    $.RelativePosition.prototype = {
        // accessors
        point_on_sphere : function() {
            var result
            if(this.closest_pt < DMSLib.EPSILON) {
                // if closest point is at a...
                result = DMSLib.Point3D.fromSphericalCoordinates(1.0, this.distance, this.theta);
            } else if(this.closest_pt >= this.seg.length - DMSLib.EPSILON) {
                // closest point is at b...
                var tmp_pt = DMSLib.Point3D.fromSphericalCoordinates(1.0, this.distance, this.theta);

                // this is as if b is at z-axis, we need to rotate around y axis by closest_pt
                result = new DMSLib.Point3D( Math.sin(Math.atan2(tmp_pt.x, tmp_pt.z) + this.closest_pt) * Math.sqrt(1.0 - tmp_pt.y * tmp_pt.y),
                                             tmp_pt.y,
                                             Math.cos(Math.atan2(tmp_pt.x, tmp_pt.z) + this.closest_pt) * Math.sqrt(1.0 - tmp_pt.y * tmp_pt.y) );
            } else if ( Math.abs(this.theta - DMSLib.QUARTERTAU) < DMSLib.EPSILON) {
                // right side
                result = new DMSLib.Point3D( Math.cos(this.distance) * Math.sin( this.closest_pt ),
                                             Math.sin(this.distance),
                                             Math.cos(this.distance) * Math.cos( this.closest_pt ) );
            } else {
                // left side
                result = new DMSLib.Point3D( Math.cos(this.distance) * Math.sin( this.closest_pt ),
                                             -Math.sin(this.distance),
                                             Math.cos(this.distance) * Math.cos( this.closest_pt ) );
            }

            return this.seg.a_rot.apply(result);
        },

        point_on_plane : function() {
            return this.seg.a
                     .add( this.seg.a_to_b_dir.scaledTo( this.closest_pt ) )
                     .add(new DMSLib.Point2D.fromPolar(this.distance, seg.a_to_b_dir.theta() + this.theta());
        }
    };

    // static variables, functions
    $.RelativePosition.isNearerOnSphere = function( pt3d, seg, criteria ) {
        var pt_on_sphere = seg.a_rot.inverse().apply(pt3d);  // we think of our segment starting at z and rotating towards x
        var angle = DMSLib.fixAnglePositive(Math.atan2(pt_on_sphere.x, pt_on_sphere.z);

        if( angle < seg.length ) {
            // closest orthogonally
            return (Math.abs(Math.asin(pt_on_sphere.Y)) * seg.strength < criteria - DMSLib.EPSILON);
        } else if( (DMSLib.TAU - angle) < (angle - seg.length) ) {
            // angle to A (z-axis) is TWO_PI-angle, angle to B (end of rot.) is angle-length
            // point on sphere is closer to z axis then to end of rot.
            return (pt_on_sphere.phi() * seg.strength < criteria - DMSLib.EPSILON);
        } else {
            // pt_on_sphere is closer to end of rotation then to z axis
            //rotate pt_on_sphere about y (from x to z) by grSegments[dtCurrent.nIdx].length
            pt_on_sphere = new Point3D( 
                Math.sin(Math.atan2(pt_on_sphere.X, pt_on_sphere.Z)-seg.length) * Math.Sqrt(1.0-pt_on_sphere.Y*pt_on_sphere.Y),
                pt_on_sphere.Y,
                Math.cos(Math.atan2(pt_on_sphere.X, pt_on_sphere.Z)-seg.length) * Math.Sqrt(1.0-pt_on_sphere.Y*pt_on_sphere.Y) );

            return (pt_on_sphere.phi() * seg.strength < criteria - DMSLib.EPSILON);
        } /* else if */      
    };

})(Globemaker);
