var Globemaker = Globemaker || {};

(function($) {
    // -----------------------------------------------------------------
    // $.Segment
    // -----------------------------------------------------------------
    $.Segment = function(aOnSphere, aOnPlane, bOnPlane, strength, isZeroLength) {
        this.aRot = aOnSphere;
        this.a = aOnPlane;
        this.b = bOnPlane;
        this.strength = strength;

        this.aToBDir = this.a.sub(this.b).normalized();
        if (isZeroLength) {this.b = new DMSLib.Point3D(this.a);}
        this.length = this.b.sub(this.a).r();
    };

    $.Segment.prototype = {
        // regular functions
        getOpposite: function() {
            if (this.a.equals(this.b)) {
                var bOnSphere = DMSLib.Rotation.fromAngleAxis(DMSLib.HALFTAU, DMSLib.Point3D.zAxis())
                                    .combine(this.aRot);
                return new $.Segment(bOnSphere, this.b, this.b.sub(this.aToBDir), strength, true);
            }

            var bOnSphere = DMSLib.Rotation.fromAngleAxis(DMSLib.HALFTAU, DMSLib.Point3D.zAxis())
                                 .combine(DMSLib.Rotation.fromAngleAxis(this.length.negate(), DMSLib.Point3D.yAxis()))
                                 .combine(this.aRot);
            return new $.Segment(bOnSphere, this.b, this.a, strength, false);
            //TODO double check that a * b = b.combine(a) for rotations
        }
    };

})(Globemaker);
