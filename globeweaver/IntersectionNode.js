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
        this.inLength = length;
        this.outLength = length
        this.directionIsPositive = directionIsPositive;
        this.nextNode = nextNode;
        this.nextDir = nextDir;

        // placeholders for contextual information
        this._dir = 0;
        this._orientation = DMSLib.Rotation.identity(); // this is the orientation of the intersection.
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

    surfacePoint() { return this.getOrientation().apply(DMSLib.Point3D.zAxis()); }
    surfaceDirection() { return this.getOrientation().apply(DMSLib.Point3D.xAxis()); }
    turningAxis() { return this.getOrientation().apply(DMSLib.Point3D.yAxis()); }

    pointAlongArm(x) {
        return this.getOrientation().apply(
            new DMSLib.Point3D(Math.sin(x), 0, Math.cos(x)));
    }

    outPoint() { return this.pointAlongArm(this.outLength); }
    inPoint() { return this.pointAlongArm(-this.inLength); }
}

//
// orientation: the orientation of the node, represented as a DMSLib.Rotation
// armNS: is the north south outgoing arm,
// armEW: is the east west outgoing arm
//
Globeweaver.IntersectionNode = function(orientation, armNS, armEW) {
    armNS._dir = 0;
    armEW._dir = 1;
    this.arms = [armNS, armEW];

    this.setOrientation(orientation);
};


Globeweaver.IntersectionNode.prototype = {
    constructor: Globeweaver.IntersectionNode,

    // Example method: Check if the node is symmetric
    setOrientation: function(orientation) {
        this.orientation = orientation;
        this.arms.forEach( arm => arm._orientation = orientation );
    }
};