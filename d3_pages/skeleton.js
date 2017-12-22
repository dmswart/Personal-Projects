var uniqueId = 0;

function SkeletonNode(length, strength, theta) {
    if (strength > 0) {this.type = 'line';}
    else if (strength === 0 && this.length !== 0) { this.type = 'move'; }
    else if (strength < 0 && this.length !== 0) { this.type = 'moveOnPlane'; }
    else if (theta !== 0) { this.type = 'rotate'; }
    else { this.type = 'none'; }

    this.parent = null;
    this.children = [];

    this.length = length;
    this.strength = strength;
    this.theta = theta;
    this.id = uniqueId++;

    this.globalState = {x: 0, y: 0, theta: 0};

    this.addChild = function(node) {
        this.children.push(node);
        node.parent = this;
    };

    this.calcGlobalState = function() {
        var parentState = (this.parent != null) ?
                           this.parent.globalState :
                           {x: 250, y: 250, theta: 0};

        this.globalState.theta = parentState.theta + this.theta;
        this.globalState.x = parentState.x + Math.cos(this.globalState.theta) * this.length;
        this.globalState.y = parentState.y + Math.sin(this.globalState.theta) * this.length;

        this.children.forEach(function(child) {child.calcGlobalState();});
    };

    this.list = function(type) {
        var result = [];
        var valid = false;

        if (this.parent !== null && this.type === type) {
            var parentState = this.parent.globalState;
            result.push({x1: parentState.x, y1: parentState.y, x2: this.globalState.x, y2: this.globalState.y, id: this.id});
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
        var newNode = new SkeletonNode(length * this.__scale, strength, 0);
        this.__currentNode.addChild(newNode);
        this.__currentNode = newNode;
    };

    this.move = function(length) {
        var newNode = new SkeletonNode(length * this.__scale, 0, 0);
        this.__currentNode.addChild(newNode);
        this.__currentNode = newNode;
    };
    this.moveInPlane = function(length) {
        var newNode = new SkeletonNode(length * this.__scale, -1, 0);
        this.__currentNode.addChild(newNode);
        this.__currentNode = newNode;
    };
    this.rotate = function(theta) {
        var newNode = new SkeletonNode(0, 0, theta * Math.PI);
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
