var DMSLib = DMSLib || {};

(function($) {
    // -----------------------------------------------------------------
    // Rotation
    //     (other)
    //     ()
    //     (q0, qx, qy, qz)
    // -----------------------------------------------------------------
    $.Rotation = function(a, b, c, d) {
        if (a instanceof $.Rotation && b === undefined) {
            this._q0 = a._q0;
            this._qx = a._qx;
            this._qy = a._qy;
            this._qz = a._qz;
        } else if (a === undefined) {
            this._q0 = 1.0;
            this._qx = 0.0;
            this._qy = 0.0;
            this._qz = 0.0;
        } else {
            var mag = Math.sqrt(a * a + b * b + c * c + d * d);
            this._q0 = a / mag;
            this._qx = b / mag;
            this._qy = c / mag;
            this._qz = d / mag;
        }

        this._matrix = null;
    };

    $.Rotation.prototype = {
        // accessors
        angle: function() { return 2.0 * Math.acos(this._q0);},
        setAngle: function(val) {
            var newAxis = this.axis().scaledTo(Math.sin(val / 2.0));
            this._q0 = Math.cos(val / 2.0);
            this._qx = newAxis.x;
            this._qy = newAxis.y;
            this._qz = newAxis.z;
            this._matrix = null;
        },

        axis: function() { return new $.Point3D(this._qx, this._qy, this._qz).normalized(); },
        setAxis: function(val) {
            var newAxis = val.scaledTo(Math.sin(Math.acos(this._q0)));
            this._qx = newAxis.x;
            this._qy = newAxis.y;
            this._qz = newAxis.z;
            this._matrix = null;
        },

        // functions
        inverse: function() { return new $.Rotation(-this._q0, this._qx, this._qy, this._qz); },

        combine: function(other) {
            var q0 = this._q0 * other._q0 - this._qx * other._qx - this._qy * other._qy - this._qz * other._qz;
            var qx = this._q0 * other._qx + this._qx * other._q0 + this._qy * other._qz - this._qz * other._qy;
            var qy = this._q0 * other._qy + this._qy * other._q0 + this._qz * other._qx - this._qx * other._qz;
            var qz = this._q0 * other._qz + this._qz * other._q0 + this._qx * other._qy - this._qy * other._qx;
            return new $.Rotation(q0, qx, qy, qz);
        },
       
        toString: function() { return '(' + this._q0 + ',' + this._qx + ',' + this._qy + ',' + this._qz + ')'; },

        apply: function(point) {
            if (this._matrix == null) {
                this._matrix = [[1 - 2 * this._qy * this._qy - 2 * this._qz * this._qz, 2 * this._qx * this._qy - 2 * this._q0 * this._qz,     2 * this._q0 * this._qy + 2 * this._qx * this._qz],
                                [2 * this._q0 * this._qz + 2 * this._qx * this._qy,     1 - 2 * this._qx * this._qx - 2 * this._qz * this._qz, 2 * this._qy * this._qz - 2 * this._q0 * this._qx],
                                [2 * this._qx * this._qz - 2 * this._q0 * this._qy,     2 * this._q0 * this._qx + 2 * this._qy * this._qz,     1 - 2 * this._qx * this._qx - 2 * this._qy * this._qy]];
            }

            var x = this._matrix[0][0] * point.x + this._matrix[0][1] * point.y + this._matrix[0][2] * point.z;
            var y = this._matrix[1][0] * point.x + this._matrix[1][1] * point.y + this._matrix[1][2] * point.z;
            var z = this._matrix[2][0] * point.x + this._matrix[2][1] * point.y + this._matrix[2][2] * point.z;
            return new $.Point3D(x, y, z);
        }
    };

    $.Rotation.fromAngleAxis = function(angle, axis) {
        var q0 = Math.cos(angle / 2.0);

        var qAxis = axis.scaledTo(Math.sin(angle / 2.0));
        var qx = qAxis.x;
        var qy = qAxis.y;
        var qz = qAxis.z;

        return new $.Rotation(q0, qx, qy, qz);
    };

    $.Rotation.fromVectorToVector = function(from, to) {
        var axis = $.Point3D.cross(from, to);
        var angle = $.Point3D.angle(from, $.Point3D.origin(), to);
        return $.Rotation.fromAngleAxis(angle, axis);
    };

    $.Rotation.random = function() {
        var angle = Math.acos(Math.random()*2-1);
        var axis = $.Point3D.random(1.0);
        return $.Rotation.fromAngleAxis(angle, axis);
    }

    $.Rotation.identity = function() { return new $.Rotation(); };

    $.Rotation.average = function(arrayOfRotations) {
        let zs = arrayOfRotations.map(r => r.apply($.Point3D.zAxis()));
        let sumz = zs.reduce((a, z) => a.add(z), $.Point3D.origin());
        let avgz = sumz.div(arrayOfRotations.length);

        let xs = arrayOfRotations.map(r => r.apply($.Point3D.xAxis()));
        let sumx = xs.reduce((a, x) => a.add(x), $.Point3D.origin());
        let avgx = sumx.div(arrayOfRotations.length);

        let rotZ = $.Rotation.fromVectorToVector($.Point3D.zAxis(), avgz);
        let rotatedX = rotZ.apply($.Point3D.xAxis());
        let rotX = $.Rotation.fromVectorToVector(rotatedX, avgx);
        return rotX.combine(rotZ);
    };

    // -----------------------------------------------------------------
    // Transform
    //   (a: Transform)
    //   ()
    //   (a: Rotation, b: Point3D)
    // -----------------------------------------------------------------
    $.Transform = function(a, b) {
        if (a instanceof $.Transform && b == undefined) {
            this.rotation = new $.Rotation(a.rotation);
            this.translation = new $.Point3D(a.translation);
        } else if (a == undefined && b == undefined) {
            this.rotation = new $.Rotation();
            this.translation = new $.Point3D();
        } else {
            this.rotation = new $.Rotation(a);
            this.translation = new $.Point3D(b);
        }
    };

    $.Transform.prototype = {
        apply: function(point) {return this.rotation.apply(point).add(this.translation);}
    };

})(DMSLib);
