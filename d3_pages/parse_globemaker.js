var parseGlobemaker = function(skeletonString, skeletonObj) {
    // tokenize
    skeletonString = skeletonString.replace(/#.*/g, ' ');    // comments beginning with #
    skeletonString = skeletonString.replace(/\/\/.*/g, ' '); // comments beginning with double-slashes
    skeletonString = skeletonString.replace(/{/g, ' { ');    // whitespace not required for brackets
    skeletonString = skeletonString.replace(/}/g, ' } ');
    skeletonString = '<BOF> ' + skeletonString + ' <EOF>';   // to help accomodate leading / trailing whitespace
    var __tokens = skeletonString.split(/[ \t\r\n]+/);
    var __tokenIdx = 0;

    var token = function() {
        return __tokens[__tokenIdx];
    };
    var nextToken = function() {
        if (token() !== '<EOF>') {
            __tokenIdx++;
        }
    };

    // terminals
    var terminal = function(str) {
        if (str.toUpperCase() === token().toUpperCase()) {nextToken(); return true;}
        return false;
    };

    var __value = 0;
    var value = function() {
        __value = parseFloat(token());
        if (!isNaN(__value)) { nextToken(); return true;}
        return false;
    };

    var __label = '';
    var label = function() {
        __label = token();
        if (/^[A-Za-z]+$/.test(__label)) { nextToken(); return true;}
        return false;
    };

    // commands
    var save = function() {
        if (terminal('s') || terminal('save')) {return true;}
        return false;
    };

    var line = function() {
        if (terminal('l') || terminal('line')) {return true;}
        return false;
    };

    var move = function() {
        if (terminal('m') || terminal('move')) {return true;}
        return false;
    };

    var moveInPlane = function() {
        if (terminal('o')) {return true;}
        return false;
    };

    var rotate = function() {
        if (terminal('r') || terminal('rotate')) {return true;}
        return false;
    };
    
    var lineCmd = function() {
        if (line()) {
            var length;
            if (!value()) { /*TODO error*/ return false; }
            else { length = __value; }

            var strength;
            if (!value()) { strength = 1.0; }
            else { strength = __value; }
           
            skeletonObj.line(length, strength);
            return true;
        }
        return false;
    };

    var moveInPlaneCmd = function() {
        if (moveInPlane()) {
            var length;
            if (!value()) { /*TODO error*/ return false; }
            skeletonObj.moveInPlane(__value);
            return true;
        }
        return false;
    };

    var moveCmd = function() {
        if (move()) {
            var length;
            if (!value()) { /*TODO error*/ return false; }

            skeletonObj.move(__value);
            return true;
        }
        return false;
    };

    var rotateCmd = function() {
        if (rotate()) {
            var angle;
            if (!value()) { /*TODO error*/ return false; }

            skeletonObj.rotate(__value);
            return true;
        }
        return false;
    };
    
    // stack fnality
    var stackCmd = function() {
        if (terminal('{') || terminal('push')) {
            __value = 1;
        } else if (terminal('}') || terminal('pop')) {
            __value = -1;
        } else if (terminal('p')) {
            if (!value()) { /*TODO error*/ return false; }
        } else {
            return false;
        }

        if (__value > 0) {
            skeletonObj.push();
        } else {
            skeletonObj.pop();
        }
        return true;
    };

    var saveCmd = function() {
        if (save()) {
            if (!label()) { /*TODO error*/ return false; }

            skeletonObj.save(__label);
            return true;
        }
        return false;
    };

    // big stuff
    var statement = function() {
        if (stackCmd()) { return true; }
        if (saveCmd()) { return true; }
        if (lineCmd()) { return true; }
        if (moveCmd()) { return true; }
        if (moveInPlaneCmd()) { return true; }
        if (rotateCmd()) { return true; }
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
    skeletonObj.init();
    return true;
};
