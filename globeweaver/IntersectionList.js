var Globeweaver = Globeweaver || {};

/*
 * IntersectionList
 *   Manages a list of IntersectionNodes, initializing them with randomized rotations and default values.
 */


Globeweaver.IntersectionList = function(nodes) {
    this.nodes = nodes;

    // set calculated properties of each node.
    this.clearCalculatedProperties();
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
            //               .   .
            //              .     .
            //             /       . 
            // currentArm o         o nextArm
            //                       \    
            if(DMSLib.Point3D.dot(intersectionPoint, currentArm.surfaceDirection()) < -DMSLib.EPSILON) {
                // outgoingVector is not pointing towards the intersection, use the antipode of intersection
                intersectionPoint.scale(-1);
            }

            // AngleOut - length = AngleIn - secondLength
            let angleOutToIntersection = DMSLib.Point3D.angle(currentArm.surfacePoint(), DMSLib.Point3D.origin(), intersectionPoint);
            let angleInFromIntersection = DMSLib.Point3D.angle(nextArm.surfacePoint(), DMSLib.Point3D.origin(), intersectionPoint);
            currentArm.secondLength = angleInFromIntersection - angleOutToIntersection + currentArm.length;
            nextArm.incomingLength = currentArm.secondLength;
            if(currentArm.secondLength < 0) {
                currentArm.length -= currentArm.secondLength;
                currentArm.secondLength = 0;
            }
            // set ranges
            currentArm.minLength = Math.max(0, angleOutToIntersection - angleInFromIntersection);
            currentArm.maxLength =  angleOutToIntersection || DMSLib.HALFTAU;


            // now we can get the rotation for the arc.
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
            if(currentArm.length > 0) {
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
            if(arcTurn > 0) {
                for(i=0; i<samplesPerSegment; i++) {
                    let l = arcTurn / samplesPerSegment * i;
                    let pt = DMSLib.Rotation.fromAngleAxis(l, arcAxis).apply(startOfArcPoint);
                    path.push(pt);
                }
            }
    
            // next arm
            if(nextArm.secondLength > 0) {
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
