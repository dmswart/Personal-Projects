var DMSLib = DMSLib || {};

(function($) {
    // -----------------------------------------------------------------
    // Rotation
    // -----------------------------------------------------------------
    $.Rotation = function(a, b, c, d) {
        if (a instanceof $.Rotation && b === undefined) {
            this._q0 = a._q0;
            this._qx = a._qx;
            this._qy = a._qy;
            this._qz = a._qz;
            this._matrix = a._matrix;
        } else if (a === undefined) {
            this._q0 = 1.0;
            this._qx = 0.0;
            this._qy = 0.0;
            this._qz = 0.0;
            this._matrix = null;
        } else {
            var mag = Math.sqrt(a*a + b*b + c*c + d*d);
            this._q0 = a / mag;
            this._qx = b / mag;
            this._qy = c / mag;
            this._qz = d / mag;
            this._matrix = null;
        }

    };

    $.Rotation.prototype = {
        // accessors
        angle : function() { return 2.0 * Math.acos(this._q0);},
        setAngle : function(val) { 
            var new axis = axis.scaledTo(Math.sin(val / 2.0));
            this._q0 = Math.cos(val / 2.0);
            this._qx = new_axis.x;
            this._qy = new_axis.y;
            this._qz = new_axis.z;
            this._matrix = null; 
        }

        axis : function() { return new $.Point3D(this._qx, this._qy, this.qz).Normalized(); }
        setAxis : function(val)
        {
            var new_axis = val.scaledTo( Math.sin(Math.acos(this._q0) );
            this._qx = new_axis.x;
            this._qy = new_axis.y;
            this._qz = new_axis.z;
            this._fixup(); 
        }

        // functions
        inverse : function() { return new $.rotation(this._q0, this._qx, this._qy, this._qz); },

        compose : function(other) {
            var q0 = this._q0 * other._q0 - this._qx * other._qx - this._qy * other._qy - this._qz * other._qz;
            var qx = this._q0 * other._qx + this._qx * other._q0 + this._qy * other._qz - this._qz * other._qy;
            var qy = this._q0 * other._qy + this._qy * other._q0 + this._qz * other._qx - this._qx * other._qz;
            var qz = this._q0 * other._qz + this._qz * other._q0 + this._qx * other._qy - this._qy * other._qx;
            return new $.Rotation(q0, qx, qy, qz);
        },
       
        toString : function() { return '(' + this._q0 + ',' + this._qx + ',' + this._qy + ',' + this._qz + ')'; },

        apply : function(point) {
            if( this._matrix == null ) {
                this._matrix = [ [1-2*this._qy*this._qy-2*this._qz*this._qz, 2*this._qx*this._qy - 2*this._q0*this._qz, 2*this._q0*this._qy + 2*this._qx*this._qz],
                                 [2*this._q0*this._qz + 2*this._qx*this._qy, 1-2*this._qx*this._qx-2*this._qz*this._qz, 2*this._qy*this._qz - 2*this._q0*this._qx],
                                 [2*this._qx*this._qz - 2*this._q0*this._qy, 2*this._q0*this._qx + 2*this._qy*this._qz, 1-2*this._qx*this._qx-2*this._qy*this._qy] ];
            }

            var x = this._matrix[0][0] * point.x + this._matrix[0][1] * point.y + this._matrix[0][2] * point.z;
            var y = this._matrix[1][0] * point.x + this._matrix[1][1] * point.y + this._matrix[1][2] * point.z;
            var z = this._matrix[2][0] * point.x + this._matrix[2][1] * point.y + this._matrix[2][2] * point.z);
            return new $.Point3D(x, y, z);
        },
    };

    $.Rotation.fromAngleAxis = function(angle, axis) {
        var q0 = Math.cos(angle / 2.0);

        var q_axis = axis.scaledTo(Math.sin(angle/2.0));
        var qx = q_axis.x;
        var qy = q_axis.y;
        var qz = q_axis.z;

        return new $.Rotation(q0, qx, qy, qz);
    };

    $.Rotation.identity = function() { return new $.Rotation(); }
    

    // -----------------------------------------------------------------
    // Transform
    // -----------------------------------------------------------------
    $.Transform = function(a, b) {
        if (a isinstance of $.Transform && b == undefined) {
            this.rotation = a.rotation;
            this.translation = a.translation;
        } else if (a == undefined && b == undefined ){
            this.rotation = $.Rotation();
            this.translation = $.Point3D();
        } else {
            this.rotation = a;
            this.translation = b;
        }
    };

    $.Transform.prototype = {
         apply : function(point) {return this.rotation.apply(point).add(this.translation);}
    };

})(DMSLib);