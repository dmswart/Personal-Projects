var Globeweaver = Globeweaver || {};
/*
 * IntersectionNode
 *   stores the geometric information of an intersection node with arms in two cardinal directions.
 */

// a structure called Arm with length, nextNode, and nextIsNS
//   length: the length of the straight portion of the path heading out this arm
//   nextNode: the index of the next intersection heading out this arm 
//   nextDir: 0 for NS, 1 for EW
//   directionIsPositive: true means direction is positive (i.e., north or east)
class Arm {
    constructor(length, directionIsPositive, nextNode, nextDir) {
        this.length = length;
        this.directionIsPositive = directionIsPositive;
        this.nextNode = nextNode;
        this.nextDir = nextDir;

        // placeholders for contextual information
        this._dir = 0;
        this._orientation = DMSLib.Rotation.identity(); // this is the orientation of the intersection.

        this.clearDerivedProperties(); // set derived properties to null.
    }

    clearDerivedProperties() {
        this.arcRotation = null;
        this.secondLength = null; // length of incoming segment from previous arm
        this.incomingLength = null;
        this.minLength = null;  // range for possible length adjustments
        this.maxLength =  null;
    }

    // return orientation that maps z axis to surface point, and x axis to surface direction
    getOrientation() {
        let result = new DMSLib.Rotation(this._orientation);
        if(this._dir == 0) {
            //rotate surfaceDirection (x axis) to north (y axis)
            result = result.combine(DMSLib.Rotation.fromAngleAxis(DMSLib.QUARTERTAU, DMSLib.Point3D.zAxis()));
        } 
        if(!this.directionIsPositive) {
            // rotate 180 degrees around z first
            result = result.combine(DMSLib.Rotation.fromAngleAxis(DMSLib.HALFTAU, DMSLib.Point3D.zAxis()));
        }
        return result;
    }

    isWithinArmsLength(distance) {
        if(!this.directionIsPositive) distance = -distance;
        return distance < this.length && distance > -this.incomingLength;
    }

    surfacePoint() { return this.getOrientation().apply(DMSLib.Point3D.zAxis()); }
    surfaceDirection() { return this.getOrientation().apply(DMSLib.Point3D.xAxis()); }
    turningAxis() { return this.getOrientation().apply(DMSLib.Point3D.yAxis()); }
    
    arcTurn() {
        let result = this.arcRotation.angle();
        // turns >= 360 degrees should be 0
        if(result >= DMSLib.TAU) { result -= DMSLib.TAU; }
        if(result <= -DMSLib.TAU) { result += DMSLib.TAU; }

        return result;
    }
    arcRadius() {
        let startOfArc = this.orientationAlongArm(this.length);
        let startOfArcPoint = startOfArc.apply(DMSLib.Point3D.zAxis());
        return DMSLib.Point3D.angle(
            this.arcRotation.axis(),
            DMSLib.Point3D.origin(),
            startOfArcPoint);
    }

    // orientation of the point after going out from the arm a given distance
    orientationAlongArm(distance) {
        let rotateFromZTowardsX = DMSLib.Rotation.fromAngleAxis(distance, DMSLib.Point3D.yAxis());
        return this.getOrientation().combine(rotateFromZTowardsX);
    }
}

//
// orientation: the orientation of the node, represented as a DMSLib.Rotation
// armNS: is the north south outgoing arm,
// armEW: is the east west outgoing arm
//
Globeweaver.IntersectionNode = function(orientation, armNS, armEW) {
    this.orientation = orientation || new DMSLib.Rotation();
    armNS._orientation = this.orientation;
    armNS._dir = 0;
    armEW._orientation = this.orientation;
    armEW._dir = 1;

    this.arms = [armNS, armEW];
};

Globeweaver.IntersectionNode.prototype = {
    constructor: Globeweaver.IntersectionNode,

    // Example method: Check if the node is symmetric
    isSymmetric: function() {}
};