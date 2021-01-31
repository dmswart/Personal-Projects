var Globemaker = Globemaker || {};

(function($) {
    // -----------------------------------------------------------------
    // $.Segment
    // -----------------------------------------------------------------
    $.Segment = function(aOnSphere, aOnPlane, aToBDir, strength, length) {
        this.aRot = aOnSphere;
        this.a = aOnPlane;
        this.b = aOnPlane.add(aToBDir.scaledTo(length));

        this.aToBDir = aToBDir;
        this.strength = strength;
        this.length = length;
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
