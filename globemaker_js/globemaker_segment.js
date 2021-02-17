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
        this.aToBDirTheta = aToBDir.theta();
        this.strength = strength;
        this.length = length;
    };

})(Globemaker);
