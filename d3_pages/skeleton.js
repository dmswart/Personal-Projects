function skeleton_node(length, strength, theta) {
    this.parent = null;
    this.children = [];

    this.length = length;
    this.strength = strength;
    this.theta = theta;
    this.global_state = {x:0, y:0, theta:0};

    this.add_child = function(node) {
        this.children.push(node);
        node.parent = this;
    }

    this.calc_global_state = function() {
       var parent_state = this.parent !== null ?
                          this.parent.global_state :
                          {x:250, y:250, theta:0};

       this.global_state.theta = parent_state.theta + this.theta;
       this.global_state.x = parent_state.x + Math.cos(this.global_state.theta) * this.length;
       this.global_state.y = parent_state.y + Math.sin(this.global_state.theta) * this.length;

        this.children.forEach(function(child) {child.calc_global_state();});
    }

    this.line_list = function() {
        var result = [];
        if( this.parent !== null && this.strength > 0 ) {
            var parent_state = this.parent.global_state;
            result.push({x1:parent_state.x, y1:parent_state.y, x2:this.global_state.x, y2:this.global_state.y});
        }
        this.children.forEach(function(child) {result = result.concat(child.line_list());});
        return result;
    }
}

function skeleton(scale) {
    this.__scale = scale;
    this.__parent_node = new skeleton_node(0, 0, 0);
    this.__current_node = this.__parent_node;

    this.__node_stack = [];

    this.push = function() {
        this.__node_stack.push(this.__current_node);
    };
    this.pop = function() {
        this.__current_node = this.__node_stack.pop();
    };

    this.line = function(length, strength) {
        var new_node = new skeleton_node(length * this.__scale, strength, 0);
        this.__current_node.add_child(new_node);
        this.__current_node = new_node;
    }
    this.move = function(length) {
        var new_node = new skeleton_node(length * this.__scale, 0, 0);
        this.__current_node.add_child(new_node);
        this.__current_node = new_node;
    };
    this.rotate = function(theta) {
        var new_node = new skeleton_node(0, 0, theta * Math.PI);
        this.__current_node.add_child(new_node);
        this.__current_node = new_node;
    };

    this.save = function(label) {
        //TODO
    };

    this.toString = function() {
        this.__parent_node.calc_global_state();
        var result = "";
        var line_list = this.__parent_node.line_list();
        line_list.forEach(function(line) {
            result += 'M' + String(line.x1) + ',' + String(line.y1) + ' ';
            result += 'L' + String(line.x2) + ',' + String(line.y2) + ' ';
        });
        return result;
    };
}
