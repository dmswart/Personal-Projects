var uniqueId = 0;

// type:  'line', 'move', 'moveOnPlane', 'rotate', 'arc' or 'none'
// value: amount to move, or rotate
// strength: for line only, how strong the new segment is
// radius (on sphere): for arc only, how far is our turning radius to the left, +ve radius means turning ccw
function SkeletonNode(type, value, strength, radius= null) {
    this.parent = null;
    this.children = [];

    // set local node values
    this.type = type;
    this.value = value;
    this.radius = radius;
    this.strength = strength;
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
        this.globalState.plane_theta = parentState.plane_theta;
        this.globalState.plane_pos = parentState.plane_pos;

        switch(this.type) {
            case 'line':
            case 'move':
            case 'moveOnPlane':
                this.globalState.plane_pos = parentState.plane_pos.add(DMSLib.Point2D.fromPolar(this.value, this.globalState.plane_theta));
                break;
            case 'rotate':
                this.globalState.plane_theta = parentState.plane_theta + this.value;
                break;
            case 'arc':
                calcs = Globemaker.arcValues(this.value, this.radius, parentState.plane_pos, parentState.plane_theta);
                this.globalState.plane_theta = calcs.endPlanarTheta;
                this.globalState.plane_pos = calcs.endPlanarPos;
                break;
        }

        // for sphere value, each line, move, starts locally at z axis and rotates/moves towards x axis
        let local_rotation = new DMSLib.Rotation();
        switch(this.type) {
            case 'line': 
            case 'move':
                local_rotation = DMSLib.Rotation.fromAngleAxis(this.value, DMSLib.Point3D.yAxis());
                break;
            case 'rotate':
                local_rotation = new DMSLib.Rotation.fromAngleAxis(this.value, DMSLib.Point3D.zAxis());
                break;
            case 'arc':
                calcs = Globemaker.arcValues(this.value, this.radius, parentState.plane_pos, parentState.plane_theta);
                local_rotation = new DMSLib.Rotation.fromAngleAxis(calcs.rotateAngleOnSphere, calcs.rotateAxisOnSphere);
                break;
        }
        this.globalState.sphere_rot = parentState.sphere_rot.combine(local_rotation);

        this.children.forEach(function(child) {child.calcGlobalState();});
    };

    // recursive calculation of plane info (x1, y1, x2, y2, id)
    this.list = function(types) {
        let result = [];
        let valid = false;
        let typeList = types.split(',');

        if (this.parent !== null && typeList.includes(this.type)) {
            let parentState = this.parent.globalState;
            let startdir = parentState.plane_theta;
            if (this.type === 'arc' && this.value < 0) startdir += DMSLib.HALFTAU;
            result.push({x1: parentState.plane_pos.x, y1: parentState.plane_pos.y,
                         x2: this.globalState.plane_pos.x, y2: this.globalState.plane_pos.y,
                         startdir, id: this.id});
        }
        this.children.forEach(function(child) {result = result.concat(child.list(types));});
        return result;
    };

    this.segments = function() {
        let result = [];
        if (this.parent !== null && ['line', 'arc'].includes(this.type)) {
            let parentState = this.parent.globalState;
            // state information is in image coordinates,
            result.push(new Globemaker.Segment(parentState.sphere_rot,
                                               parentState.plane_pos,
                                               DMSLib.Point2D.fromPolar(1, parentState.plane_theta),
                                               this.strength,
                                               this.value,
                                               this.radius));
        }
        this.children.forEach(function(child) {result = result.concat(child.segments(type));});
        return result;
    }

}

function Skeleton(scale) {
    // private
    this.idCounter;
    this.scale = scale;
    this.parentNode = new SkeletonNode('none', 0, 0);
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
        let newNode = new SkeletonNode('line', length * Math.PI, strength);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };

    this.move = function(length) {
        var newNode = new SkeletonNode('move', length * Math.PI, 0);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };
    this.moveInPlane = function(length) {
        var newNode = new SkeletonNode('moveInPlane', length * Math.PI, 0);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };
    this.rotate = function(theta) {
        var newNode = new SkeletonNode('rotate', theta * Math.PI, 0);
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    };
    this.arc = function(theta, radius) {
        var newNode = new SkeletonNode('arc', theta * Math.PI, 0, radius * Math.PI)
        this.currentNode.addChild(newNode);
        this.currentNode = newNode;
    }
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
}
