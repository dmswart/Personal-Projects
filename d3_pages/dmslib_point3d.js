(function($) {
    // -----------------------------------------------------------------
    // $.Point3D
    //   (other)
    //   ()
    //   (x, y, z)
    // -----------------------------------------------------------------
    $.Point3D = function(a, b, c) {
        if (a instanceof $.Point3D && b === undefined && c === undefined) {
            this.x = a.x;
            this.y = a.y;
            this.z = a.z;
        } else if (a === undefined && b === undefined && c === undefined) {
            this.x = 0.0;
            this.y = 0.0;
            this.z = 0.0;
        } else {
            this.x = a;
            this.y = b;
            this.z = c;
        }
    };

    $.Point3D.prototype = {
        copy: function() {return new $.Point3D(this);},
        
        // chained arithmetic
        equals: function(other) { return Math.abs(this.x - other.x) < DMSLib.EPSILON &&
                                         Math.abs(this.y - other.y) < DMSLib.EPSILON &&
                                         Math.abs(this.z - other.z) < DMSLib.EPSILON;
        },
        nequal: function(other) {return !this.equals(other);},
        negate: function() {return new $.Point3D(-this.x, -this.y, -this.z);},
        add: function(other) {return new $.Point3D(this.x + other.x, this.y + other.y, this.z + other.z);},
        sub: function(other) {return new $.Point3D(this.x - other.x, this.y - other.y, this.z - other.z);},
        mul: function(scalar) {return new $.Point3D(this.x * scalar, this.y * scalar, this.z * scalar);},
        div: function(scalar) {return new $.Point3D(this.x / scalar, this.y / scalar, this.z / scalar);},

        // accessors
        theta: function() {
            // azimuthal, the angle about the z axis starting from the x axis
            return Math.atan2(this.y, this.x);
        },
        setTheta: function(val) {
            var oldR = this.R();
            var oldPhi = this.phi();
            this.x = oldR * Math.sin(oldPhi) * Math.cos(val);
            this.y = oldR * Math.sin(oldPhi) * Math.sin(val);
            this.z = oldR * Math.cos(oldPhi);
        },

        phi: function() {
            var r = this.R();
            if (r == 0) { return 0; }
            return Math.acos(this.z / r);
        },
        setPhi: function(val) {
            var oldR = this.R();
            var oldTheta = this.theta();
            this.x = oldR * Math.sin(val) * Math.cos(oldTheta);
            this.y = oldR * Math.sin(val) * Math.sin(oldTheta);
            this.z = oldR * Math.cos(val);
        },
        
        R2: function() { return this.x * this.x + this.y * this.y + this.z * this.z; },
        R: function() { return Math.sqrt(this.R2()); },
        setR: function(val) {
            var r = this.R();
            if (r != 0) {this.scale(val / r);}
        },

        // regular functions
        normalized: function() {
            var factor = 1.0;
            var r = this.R();
            if (r != 0) {
                factor /= r;
                return new $.Point3D(this.x * factor, this.y * factor, this.z * factor);
            }
        },
        toString: function() {
            return '(' + this.x + ',' + this.y + ',' + this.z + ')';
        },
        normalize: function() {
            var r = this.R();
            if (r !== 0) {
                this.scale(1.0 / r);
            }
        },
        scale: function(factor) {
            this.x *= factor;
            this.y *= factor;
            this.z *= factor;
        },
        scaledTo: function(newLength) {
            var result = new $.Point3D(this);
            result.setR(newLength);
            return result;
        },

        projected: function() {
            // projected through origin onto z=1 plane
            if (this.z == 0.0) {return new Point2D(1e10, 1e10);}
            return new $.Point2D(this.x / this.z, this.y / this.z);
        },
        stereographicToPlane: function() {
            if (this.z == 1.0) { return Point2D.origin(); }
            return new $.Point2D(this.x / (1.0 - this.z), this.y / (1.0 - this.z));
        },
        mercator: function() {
            var latitude = $.QUARTERTAU - this.phi();
            return new $.Point2D(this.theta(), Math.log((Math.sin(latitude) + 1.0) / Math.cos(latitude)));
        },
        jitter: function(radius) {
            return this.add($.Point3D.random(radius));
        }
    };

    // static variables, functions
    $.Point3D.origin = function() { return new $.Point3D(0.0, 0.0, 0.0); };
    $.Point3D.xAxis = function() { return new $.Point3D(1.0, 0.0, 0.0); };
    $.Point3D.yAxis = function() { return new $.Point3D(0.0, 1.0, 0.0); };
    $.Point3D.zAxis = function() { return new $.Point3D(0.0, 0.0, 1.0); };

    $.Point3D.fromSphericalCoordinates = function(r, phi, theta) {
        // R distance from origin
        // Phi inclination/declination, angle down from +z axis
        // Theta azimuthal, the angle about the z axis starting from the x axis
        return new $.Point3D(r * Math.sin(phi) * Math.cos(theta),
                           r * Math.sin(phi) * Math.sin(theta),
                           r * Math.cos(phi));
    },
    $.Point3D.fromCylindricalCoordinates = function(r, z, theta) {
        // R distance from origin
        // Z distance up from XY Plane (z-coord)
        // Theta azimuthal, the angle about the z axis starting from the x axis
        return new $.Point3D(r * Math.cos(theta), r * Math.sin(theta), z);
    };
    $.Point3D.fromMercator = function(pos) {
        var latitude = Math.atan(Math.sinh(pos.y));
        return $.Point3D.fromSphericalCoordinates(1.0, $.QUARTERTAU - latitude, pos.x);
    };
    $.Point3D.random = function(maxRadius = 1.0) {
        var result = new $.Point3D(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        while (result.R() > 1.0) {
            result = new $.Point3D(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        }
        return result.mul(maxRadius);
    };

    $.Point3D.dot = function(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; };
    $.Point3D.cross = function(a, b) {
        return new $.Point3D(a.y * b.z - a.z * b.y,
                             a.z * b.x - a.x * b.z,
                             a.x * b.y - a.y * b.x);
    };
    $.Point3D.angle = function(a, b, c) {
        // returns angle of ABC (B is vertex)
        if (a.sub(b).r == 0 || c.sub(b).r == 0) {
            return 0;
        }

        var dotProduct = $.Point3D.dot(a.sub(b).normalized(), c.sub(b).normalized());
        if (dotProduct <= -1) { return $.HALFTAU; }
        if (dotProduct >= 1) { return 0.0; }
        return Math.acos(dotProduct);
    };
    $.Point3D.sphereAngle = function(a, b, c) {
        // returns the positive angle between the plane containing points ABO and the plane containing points CBO
        var normal1 = $.Point3D.cross(a.sub(b), b);
        var normal2 = $.Point3D.cross(c.sub(b), b);

        return $.Point3D.angle(normal1, $.Point3D.origin(), normal2);
    };

    $.Point3D.signedSphereAngle = function(a, b, c) {
        let angle = $.Point3D.sphereAngle(a, b, c);
        if($.Point3D.dot($.Point3D.cross(a.sub(b), c.sub(b)), c) < 0) angle *= -1;
        return angle;
    }

    $.Point3D.sphereDeflection = function(a, b, c) {
        // returns the signed angle a path from a to b needs to turn at point b in order to head towards c
        let unsignedDeflection = Math.PI - $.Point3D.sphereAngle(a, b, c);

        let normalAtoB = $.Point3D.cross(a, b);
        let cGoesLeft = $.Point3D.dot(c.sub(b), normalAtoB) > 0;

        return cGoesLeft ? unsignedDeflection : -unsignedDeflection;
    }

    $.Point3D.average = function(arrayOfPoints) {
        let sum = arrayOfPoints.reduce((a, p) => a.add(p), $.Point3D.origin());
        return sum.div(arrayOfPoints.length);
    };
    $.Point3D.equidistantFrom3Points = function(a, b, c) {
        function planeNormal(a, b) {
            midAB = a.add(b).normalized();
            midABDir = DMSLib.Point3D.cross(a, b.sub(a));
            return DMSLib.Point3D.cross(midAB, midABDir);
        }
        return DMSLib.Point3D.cross(planeNormal(a, b),planeNormal(b, c)).normalized();
    };

})(DMSLib);
