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

    // global state has positions in *image* coordinates
    this.globalState = {}; //TBD!

    this.addChild = function(node) {
        this.children.push(node);
        node.parent = this;
    };

    this.calcGlobalState = function() {
        var parentState = (this.parent != null) ?
                           this.parent.globalState :
                           {plane_pos: new DMSLib.Point2D(0, 0), plane_theta: 0, sphere_rot: new DMSLib.Rotation()};

        // calculate global state from parent state + local values
        // first plane values
        this.globalState.plane_theta = parentState.plane_theta + this.theta;
        this.globalState.plane_pos = parentState.plane_pos.add(DMSLib.Point2D.fromPolar(this.length * this.scale, this.globalState.plane_theta));
        // for sphere value, each line, move, starts locally at z axis and rotates/moves towards x axis
        const local_rotation = new DMSLib.Rotation.fromAngleAxis(this.theta, DMSLib.Point3D.zAxis());
        const local_move = DMSLib.Rotation.fromAngleAxis( (this.type === 'move' || this.type === 'line') ? this.length : 0, DMSLib.Point3D.yAxis());
        this.globalState.sphere_rot = parentState.sphere_rot.combine(local_rotation).combine(local_move);

        this.children.forEach(function(child) {child.calcGlobalState();});
    };

    this.multiplyLengths = function(scaleFactor) {
        this.length *= scaleFactor;
        this.children.forEach(function(child) {child.multiplyLengths(scaleFactor);});
    }

    // recursive calculation of plane info (x1, y1, x2, y2, id)
    this.list = function(type) {
        let result = [];
        let valid = false;

        if (this.parent !== null && this.type === type) {
            let parentState = this.parent.globalState;
            result.push({x1: parentState.plane_pos.x, y1: parentState.plane_pos.y,
                         x2: this.globalState.plane_pos.x, y2: this.globalState.plane_pos.y,
                         id: this.id});
        }
        this.children.forEach(function(child) {result = result.concat(child.list(type));});
        return result;
    };

    this.segments = function() {
        let result = [];
        if (this.parent !== null && this.type === 'line') {
            let parentState = this.parent.globalState;
            // state information is in image coordinates, unscale before creating segments
            result.push(new Globemaker.Segment(parentState.sphere_rot,
                                               parentState.plane_pos.div(this.scale),
                                               DMSLib.Point2D.fromPolar(1, parentState.plane_theta),
                                               this.strength,
                                               this.length));
        }
        this.children.forEach(function(child) {result = result.concat(child.segments(type));});
        return result;
    }

}

function Skeleton(scale) {
    // private
    this.idCounter;
    this.scale = scale;
    this.parentNode = new SkeletonNode('none', 0, 0, this.scale);
    this.currentNode = this.parentNode;

    this.nodeStack = [];

    // construction commands
    this.push = function() {
        this.nodeStack.push(this.currentNode);
    };
    this.pop = function() {
        this.currentNode = this.nodeStack.pop();
    };

    this.line = function(length, strength) {
        let newNode = new SkeletonNode('line', length * Math.PI, strength, this.scale);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };

    this.move = function(length) {
        var newNode = new SkeletonNode('move', length * Math.PI, 0, this.scale);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };
    this.moveInPlane = function(length) {
        var newNode = new SkeletonNode('moveInPlane', length * Math.PI, 0, this.scale);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };
    this.rotate = function(theta) {
        var newNode = new SkeletonNode('rotate', theta * Math.PI, 0, this.scale);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };
    this.save = function(label) {
        //TODO
    };

    // init before use
    this.init = function() {
        this.parentNode.calcGlobalState();
        this.segments = this.parentNode.segments();
        this.lastCloserSegment = undefined;
    };

    // access list of drawing info as an array of {x1, y1, x2, y2, id}
    this.list = function(type) {return this.parentNode.list(type); };


    this.relativePositiontoNearestSegmentOnPlane = function(pointOnPlane) {
        let bestRP;
        this.segments.forEach(seg => {
            let rp = new Globemaker.RelativePosition(pointOnPlane, seg);
            if (!bestRP || rp.distance * rp.seg.strength + DMSLib.EPSILON < bestRP.distance * bestRP.seg.strength) {
                bestRP = rp;
            }
        });
        return bestRP;
    }

    this.nearerSegmentOnSphereExists = function(pointOnSphere, criteria) {
        // shortcut - just check our last successful answer first.
        if( this.lastCloserSegment !== undefined &&
            Globemaker.RelativePosition.isNearerOnSphere( pointOnSphere, this.lastCloserSegment, criteria ) ) {
            return true;
        }

        for(let i = 0; i < this.segments.length; i++) {
            let seg = this.segments[i];
            if (Globemaker.RelativePosition.isNearerOnSphere(pointOnSphere, seg, criteria)) {
                this.lastCloserSegment = seg;
                return true;
            }
        }

        return false;
    }

    // returns d3.color object "white" for empty.
    this.colorOfCoordinate = function(x, y, spherePixelFunction) {
        const P = new DMSLib.Point2D( x / this.scale, y / this.scale);

        //given P, find nearest relative position to segment S on plane
        const rpS = this.relativePositiontoNearestSegmentOnPlane(P);

        //determine corresponding point Q on sphere.
        const Q = rpS.pointOnSphere();

        //find if nearer segment on sphere to Q exists.
        if( this.nearerSegmentOnSphereExists( Q, rpS.distance * rpS.seg.strength ) )
            return (spherePixelFunction === undefined)  ?
                d3.rgb(0xff, 0xff, 0xff) : // white
                spherePixelFunction();  // function's blank pixel

        // Rainbow!  return color based on Q
        // let H = Math.floor(Q.theta() * 180 / Math.PI);
        // let L = Math.floor( 10 + Q.phi() * 80 / Math.PI);
        // return 'hsl(' + H + ', 80%, ' + L + '%)';

        return (spherePixelFunction === undefined) ?
            d3.rgb(0, 0, 0xb8) : // dark blue
            spherePixelFunction(Q); // function's pixel
    }

    this.multiplyLengths = function(scaleFactor) {
        this.parentNode.multiplyLengths(scaleFactor);
        this.init();
    }
}
