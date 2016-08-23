function skeleton() {
    this.state = [];
    this.__planepos = {x:250, y:250};
    this.__planedir = {x:200, y:0};
    this.__string = 'M' + String(this.__planepos.x) + ',' + String(this.__planepos.y) + ' ';

    this.push = function() {}; 
    this.pop = function() {}; 
    this.line = function(length, strength) {
        this.__planepos.x += length * this.__planedir.x;
        this.__planepos.y += length * this.__planedir.y;
        this.__string += 'L' + String(this.__planepos.x) + ',' + String(this.__planepos.y) + ' ';
    }; 
    this.move = function(length) {
        this.__planepos.x += length * this.__planedir.x;
        this.__planepos.y += length * this.__planedir.y;
        this.__string += 'L' + String(this.__planepos.x) + ',' + String(this.__planepos.y) + ' ';
    };
    this.rotate = function(angle) {
        var theta = Math.atan2(this.__planedir.y, this.__planedir.x);
        theta = theta + (angle * Math.PI);
        this.__planedir = {x: Math.cos(theta) * 200, y: Math.sin(theta) * 200};
    }

    this.toString = function() { return this.__string; }
}

var parse_globemaker = function(skeleton_string, skeleton_obj) {
    // tokens
    skeleton_string += ' <EOF>';
    var __tokens = skeleton_string.split(/[ \t\r\n][ \t\r\n]*/);
    var __token_idx = 0;

    var token = function() {
        return __tokens[__token_idx];
    };
    var next_token = function() {
        if(token() !== '<EOF>') {
            __token_idx++;
        }
    };

    // terminals
    var terminal = function(str) {
        if( str.toUpperCase() === token().toUpperCase()) {next_token(); return true;}
        return false;
    };

    var __value = 0;
    var value = function() {
        __value = parseFloat(token());
        if( !isNaN(__value) ) { next_token(); return true;}
        return false;
    };

    // commands
    var lineto = function() {
        if( terminal('l') || terminal('line') || terminal('lineto') ) {return true;}
        return false;
    };

    var moveto = function() {
        if( terminal('m') || terminal('move') || terminal('moveto') ) {return true;}
        return false;
    };

    var rotate = function() {
        if( terminal('r') || terminal('rotate') ) {return true;}
        return false;
    };
    
    var lineto_cmd = function() {
        if( lineto() ) {
           var length;
           if(!value()) { /*TODO error*/ return false; }
           else { length = __value; }

           var strength;
           if(!value()) { strength = 1.0; }
           else { strength = __value; }
           
           skeleton_obj.line(length, strength);
           return true;
        }
        return false;
    };

    var moveto_cmd = function() {
        if( moveto() ) {
           var length;
           if(!value()) { /*TODO error*/ return false; }

           skeleton_obj.move(__value);
           return true;
        }
        return false;
    };

    var rotate_cmd = function() {
        if( rotate() ) {
           var angle;
           if(!value()) { /*TODO error*/ return false; }

           skeleton_obj.rotate(__value);
           return true;
        }
        return false;
    };
    
    // stack fnality
    var pop = function() {
        if( terminal('}') || terminal('pop') ) {return true;}
        return false;
    };
    
    var push = function() {
        if( terminal('{') || terminal('push') ) {return true;}
        return false;
    };
    
    var stacked = function() {
        if( !push() ) { return false; }
        skeleton_obj.push();

        if( !statements() ){ /*TODO error*/ return false; }

        if( !pop() ) { /*TODO error*/ return false; }
        skeleton_obj.pop();

        return true;
    };

    // big stuff
    var statement = function() {
        if (stacked()) { return true; }
        if (lineto_cmd()) { return true; }
        if (moveto_cmd()) { return true; }
        if (rotate_cmd()) { return true; }
        return false;
    };

    var statements = function() {
        if (!statement()) { return false; }
        while (statement()) {}
        return true;
    };

    if (!statements()) { return false; }
    if (!terminal('<EOF>')) { /*TODO error*/ return false; }
    return true;
}
