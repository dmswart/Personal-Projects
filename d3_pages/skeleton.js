function skeleton(scale) {
    this.__scale = scale;
    this.__planepos = {x:250, y:250};
    this.__planedir = {x:scale, y:0};
    this.__string = 'M' + String(this.__planepos.x) + ',' + String(this.__planepos.y) + ' ';

    this.__state = [];

    this.getState = function() {
        return { pos: {x: this.__planepos.x, y: this.__planepos.y},
                 dir: {x: this.__planedir.x, y: this.__planedir.y} };
    };
    this.setState = function(state) {
        this.__planepos.x = state.pos.x;
        this.__planepos.y = state.pos.y;
        this.__planedir.x = state.dir.x;
        this.__planedir.y = state.dir.y;
    };

    this.push = function() {
        this.__state.push(this.getState()); 
    };
    this.pop = function() {
        if(this.__state.length)  {
            this.setState(this.__state.pop());
        }
        this.__string += 'M' + String(this.__planepos.x) + ',' + String(this.__planepos.y) + ' ';
    };

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
        this.__planedir = {x: Math.cos(theta) * this.__scale, y: Math.sin(theta) * this.__scale};
    };

    this.toString = function() { return this.__string; };
}
