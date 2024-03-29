var DMSLib = DMSLib || {};

(function($) {
    // -----------------------------------------------------------------
    // Point2D
    //   (other)
    //   ()
    //   (x, y)
    // -----------------------------------------------------------------
    $.Point2D = function(a, b) {
        if (a instanceof $.Point2D && b === undefined) {
            this.x = a.x;
            this.y = a.y;
        } else if (a === undefined && b === undefined) {
            this.x = 0.0;
            this.y = 0.0;
        } else {
            this.x = a;
            this.y = b;
        }
    };

    $.Point2D.prototype = {
        copy : function() {return new $.Point2D(this);},
        
        // chained arithmetic
        equals : function(other) {return this.x == other.x && this.y == other.y;},
        nequal : function(other) {return this.x != other.x || this.y !== other.y;},
        negate : function() {return new $.Point2D(-this.x, -this.y);},
        invert : function() { 
            // complex inversion 
            if (this.R() < $.EPSILON) {
                return Point2D.origin();
            }
            var factor = this.x * this.x + this.y * this.y;
            return new $.Point2D(this.x, -this.y).div(factor);
        },
        add : function(other) {return new $.Point2D(this.x + other.x, this.y + other.y);},
        sub : function(other) {return new $.Point2D(this.x - other.x, this.y - other.y);},
        mul : function(val) {
            if (val instanceof $.Point2D) {
                // complex multiplication
                return new $.Point2D(this.x * val.x - this.y * val.y, this.x * val.y + this.y * val.x);
            }
            return new $.Point2D(this.x * val, this.y * val);
        },
        div : function(val) {
            if (val instanceof $.Point2D) {
                // complex division
                return this.mul(val.invert());
            }
            return new $.Point2D(this.x / val, this.y / val);
        },
        pow : function(d) {
            return $.Point2D.fromPolar(Math.pow(this.R(), d), this.theta() * d);
        },

        // accessors
        theta : function() {
            return Math.atan2(this.y, this.x);
        },
        setTheta : function(val) {
            var r = this.R();
            this.x = r * Math.cos(val);
            this.y = r * Math.sin(val);
        },
        R2 : function() { return this.x * this.x + this.y * this.y; },
        R : function() { return Math.sqrt(this.R2()); },
        setR : function(val) {
            var r = this.R();
            if (r != 0) { this.scale(val/r); }
        },

        // regular functions
        normalized : function() {
            var factor = 1.0;
            var r = this.R();
            if( r != 0 ) {
                factor /= r;
                return new $.Point2D(this.x * factor, this.y * factor);
            }
        },
        toString : function() {
            return '(' + this.x + ',' + this.y + ')'; 
        },
        normalize : function() {
            var r = this.R();
            if (r !== 0) {
                this.scale(1.0 / r);
            }
        },
        scale : function(factor) {
            this.x *= factor;
            this.y *= factor;
        },
        scaledTo : function(new_length) {
            var result = new $.Point2D(this);
            result.setR(new_length);
            return result;
        },
        invStereographicToSphere : function() {
            return new $.Point3D( 2.0 * this.x, 
                                  2.0 * this.y,
                                  -1 + this.x * this.x + this.y * this.y ).normalized();
        },
        jitter : function(radius) {
            return this.add($.Point2D.random(radius));
        }
    };

    // static variables, functions
    $.Point2D.origin = function() { return new $.Point2D(0.0, 0.0); };
    $.Point2D.xAxis = function() { return new $.Point2D(1.0, 0.0); };
    $.Point2D.yAxis = function() { return new $.Point2D(0.0, 1.0); };

    $.Point2D.fromPolar = function(r, theta) {return new $.Point2D(r * Math.cos(theta), r * Math.sin(theta));};
    $.Point2D.random = function(max_radius) {
        var result = new $.Point2D(Math.random()*2-1, Math.random()*2-1);
        while (result.R() > 1.0) {
            result = new $.Point2D(Math.random()*2-1, Math.random()*2-1);
        }
        return result.mul(max_radius);
    };
    $.Point2D.dot = function(a, b) { return a.x * b.x + a.y * b.y; }
    $.Point2D.cross = function(a, b) { return new $.Point3D(0, 0, a.x * b.y - a.y * b.x); }
    $.Point2D.angle = function(a, b, c) {
        if (a.sub(b).r == 0 || c.sub(b).r == 0) {
            return 0;
        }

        var dot_product = $.Point2D.dot(a.sub(b).normalized(), c.sub(b).normalized());
        if ( dot_product <= -1 ) { return $.HALFTAU; }
        if ( dot_product >= 1 ) { return 0.0; }
        return Math.acos(dot_product);
    };
    $.Point2D.deflection = function(a, b, c) {
        // returns the signed angle a path from a to b needs to turn at point b in order to head towards c
        let unsignedDeflection = Math.PI - $.Point2D.angle(a, b, c);

        let ab = b.sub(a);
        let bc = c.sub(b);
        let goesLeft = ab.x * bc.y > ab.y * bc.x;

        return goesLeft ? unsignedDeflection : -unsignedDeflection;
    };
    $.Point2D.intersect2Lines = function(a, adir, b, bdir) {
        // using https://en.wikipedia.org/w/index.php?title=Line%E2%80%93line_intersection
        let [x1, y1, x2, y2] = [a.x, a.y, a.add(adir).x, a.add(adir).y];
        let [x3, y3, x4, y4] = [b.x, b.y, b.add(bdir).x, b.add(bdir).y];

        denom =  (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
        if (Math.abs(denom) < 1e-5) return null;

        numer1 = (x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4);
        numer2 = (x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4);
        return new $.Point2D(numer1/denom, numer2/denom);
    }
})(DMSLib);
