var Globemaker = Globemaker || {};

(function($) {
    // -----------------------------------------------------------------
    // $.Segment
    // -----------------------------------------------------------------
    $.Segment = function(a_on_sphere, a_on_plane, b_on_plane, strength, is_zero_length) {
        this.a_rot = a_on_sphere;
        this.a = a_on_plane;
        this.b = b_on_plane;
        this.strength = strength;

        this.a_to_b_dir = this.a.sub(this.b).normalized();
        if (is_zero_length) { this.b = new DMSLib.Point3D(this.a); }
        this.length = this.b.sub(this.a).r();
    };

    $.Segment.prototype = {
        // regular functions
        getOpposite : function() {
            if (this.a.equals(this.b)) {
                var b_on_sphere = DMSLib.Rotation.fromAngleAxis(DMSLib.HALFTAU, DMSLib.Point3D.z_axis())
                                    .combine( this.a_rot );
                return new $.Segment(b_on_sphere, this.b, this.b.sub(this.a_to_b_dir), strength, true);
            }

            var b_on_sphere = DMSLib.Rotation.fromAngleAxis(DMSLib.HALFTAU, DMSLib.Point3D.z_axis())
                                 .combine( DMSLib.Rotation.fromAngleAxis(this.length.negate(), DMSLib.Point3D.y_axis()) )
                                 .combine( this.a_rot );
            return new $.Segment(b_on-sphere, this.b, this.a, strength, false); 
            //TODO double check that a * b = b.combine(a) for rotations
        }
    };

})(Globemaker);
