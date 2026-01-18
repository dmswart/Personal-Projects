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
        currentArm.directionIsPositive = true;

        // traverse until we loop back to start
        while(true) {
            let nextArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];
            let nextArmIsLast = (nextArm.directionIsPositive !== null);
            if( !nextArmIsLast ) nextArm.directionIsPositive = true; // until we learn otherwise.

            // calculate intersection of great circles 
            intersectionPoint = DMSLib.Point3D.cross(currentArm.turningAxis(), nextArm.turningAxis()); 
            
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
                intersectionPoint = DMSLib.Point3D.multiplyScalar(intersectionPoint, -1);
            }
            if(!nextArmIsLast && DMSLib.Point3D.dot(intersectionPoint, nextArm.surfaceDirection()) < -DMSLib.EPSILON) {
                // we want the incomingVector pointing away
                nextArm.directionIsPositive = false;
            }

            // AngleOut - length = AngleIn - secondLength
            let angleOutToIntersection = DMSLib.Point3D.angle(currentArm.surfacePoint(), DMSLib.Point3D.origin(), intersectionPoint);
            let angleInFromIntersection = DMSLib.Point3D.angle(nextArm.surfacePoint(), DMSLib.Point3D.origin(), intersectionPoint);
            currentArm.secondLength = angleInFromIntersection - angleOutToIntersection + currentArm.length;
            if(currentArm.secondLength < 0) {
                currentArm.length -= currentArm.secondLength;
                currentArm.secondLength = 0;
            }

            // now we can get the rotation for the arc.
            startOfArc = currentArm.orientationAlongArm(currentArm.length);
            endOfArc = nextArm.orientationAlongArm(-currentArm.secondLength);
            let arcRotation = endOfArc.combine(startOfArc.inverse());
            currentArm.arcTurn = arcRotation.angle();

            let rotationCenter = arcRotation.axis();
            let startOfArcPoint = startOfArc.apply(DMSLib.Point3D.zAxis());
            let endOfArcPoint = endOfArc.apply(DMSLib.Point3D.zAxis());
            currentArm.arcRadius = DMSLib.Point3D.angle(rotationCenter, DMSLib.Point3D.origin(), startOfArcPoint);

            // figure out the sign of the radius. (since Point3D.angle is always positive)
            // let dotProduct = DMSLib.Point3D.dot( rotationCenter, startOfArcPoint); 
            // if(dotProduct < 0) {
                // currentArm.arcRadius = -currentArm.arcRadius;
            // }

            // next!
            currentArm = nextArm;
            if(currentArm == this.nodes[0].arms[0]) break;
        }

    },

    getPathString: function() {
        let pathString = '';
        // start at node 0 going north,
        let currentArm = this.nodes[0].arms[0];
        while(true) {
            pathString += 'l ' + currentArm.length/DMSLib.HALFTAU +
                          ' a ' + currentArm.arcTurn/DMSLib.HALFTAU + ' ' + currentArm.arcRadius/DMSLib.HALFTAU +
                          ' l ' + currentArm.secondLength/DMSLib.HALFTAU + ' ';
            // next! 
            currentArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];
            if(currentArm == this.nodes[0].arms[0]) break;
        }
        return pathString;
    },
};