var Globeweaver = Globeweaver || {};

/*
 * IntersectionList
 *   Manages a list of IntersectionNodes, initializing them with randomized rotations and default values.
 */


Globeweaver.IntersectionList = function(nodes) {
    this.nodes = nodes;

    // set calculated properties of each node.
    this.setPrevNodes();
};

Globeweaver.IntersectionList.prototype = {
    constructor: Globeweaver.IntersectionList,

    // Example method: Get the total number of nodes
    totalNodes: function() {
        return this.nodes.length;
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

    // handy function to get a list of points on the sphere
    getSpherePath: function(samplesPerSegment = 20) {
        let path = [];
        // start at node 0 going north,
        let currentNodeIdx = 0;
        let currentArm = this.nodes[currentNodeIdx].arms[0];
        let nextArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];
        while(true) {
            let pointA = currentArm.surfacePoint();
            let pointB = currentArm.outPoint();
            let pointC = nextArm.inPoint();
            let pointD = nextArm.surfacePoint();

            // do spline from A to D via B and C
            let samplesPerSegment = 30;
            for(let i=0; i<=samplesPerSegment; i++) {
                let interp = (pt1, pt2, t) => pt1.mul(1 - t).add(pt2.mul(t));
                let t = i / samplesPerSegment;
                let ab = interp(pointA, pointB, t);
                let bc = interp(pointB, pointC, t);
                let cd = interp(pointC, pointD, t);
                let abbc = interp(ab, bc, t);
                let bccd = interp(bc, cd, t);
                let pt = interp(abbc, bccd, t);
                if(i<samplesPerSegment/3) {
                    pt.nodeIdx = currentNodeIdx;
                    pt.armIdx = currentArm._dir;
                }
                //if(i>2*samplesPerSegment/3) {
                    //pt.nodeIdx = currentArm.nextNode;
                    //pt.armIdx = currentArm._dir;
                //}
                path.push(pt);
            }

            // next!
            currentNodeIdx = currentArm.nextNode;
            currentArm = nextArm;
            nextArm = this.nodes[currentArm.nextNode].arms[currentArm.nextDir];
            if(currentArm == this.nodes[0].arms[0]) break;
        }

        path.forEach(pt => pt.normalize());

        return path;
    },
};
