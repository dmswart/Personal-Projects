var Globeweaver = Globeweaver || {};

/*
 * IntersectionList
 *   Manages a list of IntersectionNodes, initializing them with randomized rotations and default values.
 */


Globeweaver.IntersectionList = function(nodes) {
    this.nodes = nodes;

    // set calculated properties of each node.
    this.clearCalculatedProperties();
    this.setPrevNodes();
    this.calculateProperties();
};

Globeweaver.IntersectionList.prototype = {
    constructor: Globeweaver.IntersectionList,

    // Example method: Get the total number of nodes
    totalNodes: function() {
        return this.nodes.length;
    },

    clearCalculatedProperties: function() {
        this.nodes.forEach(node => {
            node.arms.forEach(arm => {
                arm.clearDerivedProperties();
            });
        });
    },

    setPrevNodes: function() {
        this.nodes.forEach( (node, nodeIdx) => {
            // arm 0
            let nextNode = this.nodes[node.arms[0].nextNode];
            let nextArm = nextNode.arms[node.arms[0].nextDir];
            nextArm.prevNode = nodeIdx;
            nextArm.prevDir = 0;

            // arm 1
            nextNode = this.nodes[node.arms[1].nextNode];
            nextArm = nextNode.arms[node.arms[1].nextDir];
            nextArm.prevNode = nodeIdx;
            nextArm.prevDir = 1;
        });
    },

    calculateProperties: function() {
        if (this.nodes.length == 0) return;

        // start at node 0 going north,
        let currentArm = this.nodes[0].arms[0];

        // traverse until we loop back to start
        while(true) {
            let nextArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];

            // calculate intersection of great circles 
            let intersectionPoint;
            let bArcsAreParallel = false;
            if(DMSLib.Point3D.dot(currentArm.turningAxis(), nextArm.turningAxis()) >= 1-DMSLib.EPSILON) {
                // great circles are (nearly) parallel, so chose midpoint between surfacepoints.
                intersectionPoint = currentArm.surfacePoint().add(nextArm.surfacePoint()).normalized();
                bArcsAreParallel = true;
            } else if(DMSLib.Point3D.dot(currentArm.turningAxis(), nextArm.turningAxis()) >= 1-DMSLib.EPSILON) {
                // NOT implemented
                console.log("Opposing, parallel arcs detected!");
                intersectionPoint = currentArm.surfacePoint().add(nextArm.surfacePoint()).normalized();
                bArcsAreParallel = true;
            } else {
                intersectionPoint = DMSLib.Point3D.cross(currentArm.turningAxis(), nextArm.turningAxis()); 
            }
            
            // we want outgoing direction to point towards the intersection,
            // and incoming direction to point away from it           
            //
            //                 x  intersection
            //                . .
            // angleOut->    .   .    <-angleIntoNext
            //              .     .
            //             /       . 
            // currentArm o         o nextArm
            //                       \    
            if(DMSLib.Point3D.vectorAngle(intersectionPoint, currentArm.surfacePoint()) < DMSLib.EPSILON ||   // the surface point *is* the intersection 
               DMSLib.Point3D.dot(intersectionPoint, currentArm.surfaceDirection()) < -DMSLib.EPSILON) {       // outgoingVector is not pointing towards the intersection, use the antipode of intersection
                intersectionPoint.scale(-1);
            }

            // need the straight parts (length, secondLength) for our arc such that: AngleOut - length = AngleIn - secondLength
            let angleOut = DMSLib.Point3D.vectorAngle(currentArm.surfacePoint(), intersectionPoint);
            let angleIntoNext = DMSLib.Point3D.vectorAngle(nextArm.surfacePoint(), intersectionPoint);

            let distFromIntersection = angleOut - currentArm.length;
            distFromIntersection = Math.max(0, distFromIntersection);
            distFromIntersection = Math.min(angleIntoNext, distFromIntersection);

            currentArm.length = angleOut - distFromIntersection;
            currentArm.secondLength = angleIntoNext - distFromIntersection;
            nextArm.incomingLength = currentArm.secondLength;

            // set ranges to inform our tweaking algorithms.
            currentArm.minLength = Math.max(0, angleOut - angleIntoNext);
            currentArm.maxLength =  angleOut || DMSLib.HALFTAU;


            // now we can get the rotation for the arc...
            let startOfArc = currentArm.orientationAlongArm(currentArm.length);
            let endOfArc = nextArm.orientationAlongArm(-currentArm.secondLength);
            if(bArcsAreParallel) {
                currentArm.arcRotation = DMSLib.Rotation.fromAngleAxis(
                    DMSLib.Point3D.angle(startOfArc.apply(DMSLib.Point3D.zAxis()),
                                         DMSLib.Point3D.origin(),
                                         endOfArc.apply(DMSLib.Point3D.zAxis())),
                    currentArm.turningAxis());
            } else {
                currentArm.arcRotation = endOfArc.combine(startOfArc.inverse());
            }

            // ... and deal with negating axis and angle 
            if(currentArm._doesTurnNeedAdjustment())
            {
                currentArm.arcRotation = currentArm.arcRotation.double_negative();
            }

            // next!
            currentArm = nextArm;
            if(currentArm == this.nodes[0].arms[0]) break;
        }

    },

    getPathString: function() {
        let result = '';
        // start at node 0 going north,
        let currentArm = this.nodes[0].arms[0];
        while(true) {
            // make sure to format numbers to four decimal places
        
            result += 'l ' + (currentArm.length / DMSLib.HALFTAU).toFixed(4) + '\n' +
                      'a ' + (currentArm.arcTurn() / DMSLib.HALFTAU).toFixed(4) + ' ' +
                             (currentArm.arcRadius() / DMSLib.HALFTAU).toFixed(4) + '\n' +
                      'l ' + (currentArm.secondLength / DMSLib.HALFTAU).toFixed(4) + '\n';
            // next! 
            currentArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];
            if(currentArm == this.nodes[0].arms[0]) break;
        }

        // remove trailing zeros and decimal points
        result = result.replace(/00*\n/g, '\n');
        result = result.replace(/00* /g, ' ');
        result = result.replace(/\.\n/g, '\n');
        result = result.replace(/\. /g, ' ');
        return result;
    },

    // handy function to get a list of points on the sphere
    getSpherePath: function(samplesPerSegment = 20) {
        let path = [];
        // start at node 0 going north,
        let currentArm = this.nodes[0].arms[0];
        let nextArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];
        while(true) {
            // outgoing arm
            if(currentArm.length > DMSLib.EPSILON) {
                for(i=0; i<samplesPerSegment; i++) {
                    let l = currentArm.length/samplesPerSegment * i;
                    let pt = currentArm.orientationAlongArm(l).apply(DMSLib.Point3D.zAxis());
                    path.push(pt);
                }
            }
    
            // arc to next arm
            let startOfArcPoint = currentArm.orientationAlongArm(currentArm.length).apply(DMSLib.Point3D.zAxis());
            let arcAxis = currentArm.arcRotation.axis();
            let arcTurn = currentArm.arcTurn();
            if(Math.abs(arcTurn) > DMSLib.EPSILON) {
                for(i=0; i<samplesPerSegment; i++) {
                    let l = arcTurn / samplesPerSegment * i;
                    let pt = DMSLib.Rotation.fromAngleAxis(l, arcAxis).apply(startOfArcPoint);
                    path.push(pt);
                }
            }
    
            // next arm
            if(currentArm.secondLength > DMSLib.EPSILON) {
                for(i=0; i<samplesPerSegment; i++) {
                    let l = currentArm.secondLength/samplesPerSegment * (i - samplesPerSegment);
                    let pt = nextArm.orientationAlongArm(l).apply(DMSLib.Point3D.zAxis());
                    path.push(pt);
                }
            }
    
            // next!
            currentArm = nextArm;
            nextArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];
            if(currentArm == this.nodes[0].arms[0]) break;
        }

        path.forEach(pt => pt.normalize());

        return path;

    },
};
