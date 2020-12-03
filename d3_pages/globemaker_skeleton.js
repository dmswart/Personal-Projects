var uniqueId = 0;

// type:  'line', 'move', 'moveOnPlane', 'rotate', or 'none'
// value: amount to move, or rotate
// strength: (for line only, how strong the new segment is)
// scale: how many pixels we're scaling up the plane by.
function SkeletonNode(type, value, strength, scale) {
    this.parent = null;
    this.children = [];

    // set local node values
    this.type = type;
    this.length = ['line', 'move', 'moveOnPlane'].includes(this.type) ? value : 0;
    this.theta = 'rotate' === this.type ? value : 0;
    this.strength = strength;
    this.scale = scale;
    this.id = uniqueId++;

    this.globalState = {}; //TBD!

    this.addChild = function(node) {
        this.children.push(node);
        node.parent = this;
    };

    this.calcGlobalState = function() {
        var parentState = (this.parent != null) ?
                           this.parent.globalState :
                           {plane_pos: new point2D(250, 250), plane_theta: 0, sphere_rot: new Rotation()};

        // calculate global state from parent state + local values
        // first plane values
        this.globalState.plane_theta = parentState.plane.theta + this.theta;
        this.globalState.plane_pos = parentState.pos.add(Point2D.fromPolar(this.length * this.scale, this.globalState.plane.theta));
        // for sphere value, each line, move, starts locally at z axis and rotates/moves towards x axis
        const local_rotation = new Rotation.fromAngleAxis(this.theta, Point3D.zAxis());
        const local_move = Rotation.fromAngleAxis( (this.type === 'move' || this.type === 'line') ? this.length : 0, Point3D.yAxis);
        this.globalState.sphere_rot = parentState.sphere_rot.combine(local_rotation).combine(local_move);

        this.children.forEach(function(child) {child.calcGlobalState();});
    };

    this.list = function(type) {
        var result = [];
        var valid = false;

        if (this.parent !== null && this.type === type) {
            var parentState = this.parent.globalState;
            result.push({x1: parentState.plane_pos.x, y1: parentState.plane_pos.y,
                         x2: this.globalState.plane_pos.x, y2: this.globalState.plane_pos.y,
                         id: this.id});
        }
        this.children.forEach(function(child) {result = result.concat(child.list(type));});
        return result;
    };
}

function skeleton(scale) {
    // private
    this.__idCounter;
    this.__scale = scale;
    this.__parentNode = new SkeletonNode(0, 0, 0);
    this.__currentNode = this.__parentNode;

    this.__nodeStack = [];

    // construction commands
    this.push = function() {
        this.__nodeStack.push(this.__currentNode);
    };
    this.pop = function() {
        this.__currentNode = this.__nodeStack.pop();
    };

    this.line = function(length, strength) {
        var newNode = new SkeletonNode('line', length * this.__scale, strength);
        this.__currentNode.addChild(newNode);
        this.__currentNode = newNode;
    };

    this.move = function(length) {
        var newNode = new SkeletonNode('move', length * this.__scale, 0);
        this.__currentNode.addChild(newNode);
        this.__currentNode = newNode;
    };
    this.moveInPlane = function(length) {
        var newNode = new SkeletonNode('moveInPlane', length * this.__scale, 0);
        this.__currentNode.addChild(newNode);
        this.__currentNode = newNode;
    };
    this.rotate = function(theta) {
        var newNode = new SkeletonNode('rotate', theta * Math.PI, 0);
        this.__currentNode.addChild(newNode);
        this.__currentNode = newNode;
    };
    this.save = function(label) {
        //TODO
    };

    // init before use
    this.init = function() { this.__parentNode.calcGlobalState(); };

    this.list = function(type) {return this.__parentNode.list(type); };
}
