var parse_globemaker = function(skeleton_string, skeleton_obj) {
    // tokenize
    skeleton_string = skeleton_string.replace(/#.*/g, ' ');
    skeleton_string = skeleton_string.replace(/{/g, ' { ');
    skeleton_string = skeleton_string.replace(/}/g, ' } ');
    skeleton_string = '<BOF> ' + skeleton_string + ' <EOF>';
    var __tokens = skeleton_string.split(/[ \t\r\n]+/);
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

    var __label = '';
    var label = function() {
        __label = token;
        if(/[A..Za..z]+/.test(token())) { next_token(); return true;}
        return false;
    };

    // commands
    var save = function() {
        if( terminal('s') || terminal('save') ) {return true;}
        return false;
    };

    var line = function() {
        if( terminal('l') || terminal('line') ) {return true;}
        return false;
    };

    var move = function() {
        if( terminal('m') || terminal('move') ) {return true;}
        return false;
    };

    var rotate = function() {
        if( terminal('r') || terminal('rotate') ) {return true;}
        return false;
    };
    
    var line_cmd = function() {
        if( line() ) {
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

    var move_cmd = function() {
        if( move() ) {
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

    var save_cmd = function() {
        if( save() ) {
           if(!label()) { /*TODO error*/ return false; }

           skeleton_obj.save(__label);
           return true;
        }
        return false;
    };


    // big stuff
    var statement = function() {
        if (stacked()) { return true; }
        if (save_cmd()) { return true; }
        if (line_cmd()) { return true; }
        if (move_cmd()) { return true; }
        if (rotate_cmd()) { return true; }
        return false;
    };

    var statements = function() {
        if (!statement()) { return false; }
        while (statement()) {}
        return true;
    };

    if (!terminal('<BOF>')) { /* TODO error */ return false; }
    if (!statements()) { /* TODO error */ return false; }
    if (!terminal('<EOF>')) { /*TODO error*/ return false; }
    return true;
}
