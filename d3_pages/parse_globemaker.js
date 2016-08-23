var skeleton = function() {
    var result;
    result.push = function() {}; 
    result.pop = function() {}; 
    result.line = function(length, strength) {}; 
    result.move = function(length) {}; 
    result.rotate = function(angle) {}; 

    return result;
}

var parse_globemaker = function(skeleton_string) {
    var result = skeleton();

    // tokens
    var __tokens = skeleton_string.split('[ \t\r\n]');
    __tokens.append('<EOF>');
    var __token_idx = 0;

    var token = function() {
        return __tokens[__token_idx];
    };
    var next_token = function() {
        if(token() !== '<EOF>') {
            token_idx++;
        }
    };

    // terminals
    var terminal = function(str) {
        if( toupper(str) === toupper(token())) {next_token(); return true;}
        return false;
    };

    var value = function(value_out) {
        value_out = parseFloat(token());
        if( value_out !== NaN ) { next_token(); return true;}
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
           if(!value(length)) { /*TODO error*/ return false; }

           var strength;
           if(!value(strength)) { strength = 1.0; }
           
           result.line(length, strength);
        }
        return false;
    };

    var moveto_cmd = function() {
        if( moveto() ) {
           var length;
           if(!value(length)) { /*TODO error*/ return false; }

           result.move(length);
        }
        return false;
    };

    var rotate_cmd = function() {
        if( rotate() ) {
           var angle;
           if(!value(angle)) { /*TODO error*/ return false; }

           result.rotate(angle);
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
        result.push();

        if( !statements() ){ /*TODO error*/ return false; }

        if( !pop() ) { /*TODO error*/ return false; }
        result.pop();

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
    if (terminal('<EOF>')) { /*TODO error*/ return false; }
    return true;
}
