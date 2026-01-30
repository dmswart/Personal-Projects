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
    
    _doesTurnNeedAdjustment() {
        let p = this.orientationAlongArm(this.length).apply(DMSLib.Point3D.zAxis());
        let p_straight = this.orientationAlongArm(this.length+DMSLib.EPSILON).apply(DMSLib.Point3D.zAxis());
        let straightdir = p_straight.sub(p).normalized();

        // check if p and arcRoation.axis are aligned
        if( Math.abs(DMSLib.dot(p, this.arcRotation.axis())) > 1.0 - DMSLib.EPSILON ) { return false; }
        let p_arced = DMSLib.Rotation.fromAngleAxis(1 * DMSLib.TAU/360, this.arcRotation.axis()).apply(p);
        let arceddir = p_arced.sub(p).normalized();

        if(arceddir === undefined || straightdir === undefined) {
            console.warn("Undefined direction in _doesTurnNeedAdjustment");
        }

        return DMSLib.dot(arceddir, straightdir) < 0;
    }
    
    arcTurn() {
        return this.arcRotation.angle();
    }

    arcRadius() {
        let startOfArc = this.orientationAlongArm(this.length);
        let startOfArcPoint = startOfArc.apply(DMSLib.Point3D.zAxis());
        return DMSLib.Point3D.vectorAngle( this.arcRotation.axis(), startOfArcPoint);
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