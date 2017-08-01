var unique_id = 0;

function skeleton_node(length, strength, theta) {
	if( strength > 0 ) { this.type = 'line'; }
    else if ( strength === 0 && this.length !== 0 ) { this.type = 'move'; }
    else if ( strength < 0 && this.length !== 0 ) { this.type = 'move_on_plane'; }
    else if ( theta !== 0 ) { this.type = 'rotate'; }
    else { this.type = 'none'; }

    this.parent = null;
    this.children = [];

    this.length = length;
    this.strength = strength;
    this.theta = theta;
	this.id = unique_id++; 

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

    this.list = function(type) {
        var result = [];
        var valid = false;

        if( this.parent !== null && this.type === type ) {
            var parent_state = this.parent.global_state;
            result.push({x1:parent_state.x, y1:parent_state.y, x2:this.global_state.x, y2:this.global_state.y, id:this.id});
        }
        this.children.forEach(function(child) {result = result.concat(child.list(type));});
        return result;
    }
}

function skeleton(scale) {
    // private
    this.__id_counter;
    this.__scale = scale;
    this.__parent_node = new skeleton_node(0, 0, 0);
    this.__current_node = this.__parent_node;

    this.__node_stack = [];

    // construction commands
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
    this.move_in_plane = function(length) {
        var new_node = new skeleton_node(length * this.__scale, -1, 0);
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


    // init before use
    this.init = function() { this.__parent_node.calc_global_state(); }

    this.list = function(type) {return this.__parent_node.list(type); };

}
