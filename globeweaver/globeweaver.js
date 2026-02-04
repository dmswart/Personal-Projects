const PLANE_WIDTH = 700;
const PLANE_HEIGHT = 500;
const PLANE_BUFFER = 50;
const BOUNDARY = {x:PLANE_BUFFER, y:PLANE_BUFFER,
                  w:(PLANE_WIDTH-2*PLANE_BUFFER),
                  h:(PLANE_HEIGHT-2*PLANE_BUFFER)};
const PLANE2SPHERE_SCALE = Math.sqrt( (4 * Math.PI) / (BOUNDARY.w * BOUNDARY.h) );

let gIntersectionList = new Globeweaver.IntersectionList([]);

// ---- globeweaver global variables ----
// let gPlanarPath = [];
// let gSpherePath = [];

/*
function increasePoints() {
    gSpherePath = redistributePoints(gSpherePath, 1.3);
    gPlanarPath = toPlanarPath(gSpherePath);
}
    */

function outputPath() {
    drawPathOnPlane(gPlanarPath);
    drawPathOnSphere(gSpherePath);
    drawIntersectionsOnSphere(gIntersectionList);
    d3.select('#output #skel').property('value', gIntersectionList.getPathString());

    let e = calcEnergy();
    d3.select('#scratchInfo #sphereEnergy').text(e.s.toFixed(2));
    d3.select('#scratchInfo #planeEnergy').text(e.p.toFixed(2));
}

// load button, clicked ask for json file to upload, and then parse it into gIntersectionList
function loadIntersectionsFromFile() {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.onload = event => {
            let json = event.target.result;
            json = JSON.parse(json);
            let newList = [];
            json.forEach(data => {
                let node = new Globeweaver.IntersectionNode(
                    new DMSLib.Rotation(data.orientation._q0, data.orientation._qx, data.orientation._qy, data.orientation._qz),
                    new Arm(0.25, data.arms[0].dirIsPositive, data.arms[0].nextNode, data.arms[0].nextArm),
                    new Arm(0.25, data.arms[1].dirIsPositive, data.arms[1].nextNode, data.arms[1].nextArm)
                );
                newList.push(node);
            });
            gIntersectionList = new Globeweaver.IntersectionList(newList);
            buildPathFromIntersectionNodes();
            outputPath();
        };
        reader.readAsText(file);
    };
    input.click();
}

function initializeThreeNode() {
    const defaultArmLength = 35 * DMSLib.TAU / 360; // ten degrees
    let node1 = new Globeweaver.IntersectionNode(
        new DMSLib.Rotation.fromAngleAxis(0, DMSLib.Point3D.yAxis()).combine(
            DMSLib.Rotation.fromAngleAxis(-0.1*DMSLib.TAU/360, DMSLib.Point3D.zAxis())),
        new Arm(defaultArmLength, true, 0, 1),
        new Arm(defaultArmLength, false, 1, 1)
    );
    let node2 = new Globeweaver.IntersectionNode(
        new DMSLib.Rotation.fromAngleAxis(-DMSLib.TAU / 4, DMSLib.Point3D.yAxis()).combine(
            DMSLib.Rotation.fromAngleAxis(0.1*DMSLib.TAU/360, DMSLib.Point3D.zAxis())),
        new Arm(defaultArmLength, false, 0, 0),
        new Arm(defaultArmLength, false, 2, 1)
    );
    let node3 = new Globeweaver.IntersectionNode(
        new DMSLib.Rotation.fromAngleAxis(-DMSLib.TAU / 2, DMSLib.Point3D.yAxis()).combine(
            DMSLib.Rotation.fromAngleAxis(-0.1*DMSLib.TAU/360, DMSLib.Point3D.zAxis())),
        new Arm(defaultArmLength, true, 1, 0),
        new Arm(defaultArmLength, false, 2, 0)
    );
    return new Globeweaver.IntersectionList([node1, node2, node3]);
}


function initializeOneNode() {
    let node1 = new Globeweaver.IntersectionNode(
        new DMSLib.Rotation.fromAngleAxis(0, DMSLib.Point3D.zAxis()),
        new Arm(DMSLib.TAU / 4, true, 0, 1),
        new Arm(DMSLib.TAU / 4, true, 0, 0)
    );
    return new Globeweaver.IntersectionList([node1]);
}

function initializeIntersections() {
    gIntersectionList = initializeThreeNode();
    // gIntersectionList = initializeOneNode();

    buildPathFromIntersectionNodes();
    outputPath();
}

function buildPathFromIntersectionNodes() {
    gSpherePath = gIntersectionList.getSpherePath(20);
    gSpherePath = cleanPath(gSpherePath);
    gSpherePath = redistributePoints(gSpherePath, gIntersectionList.nodes.length / gSpherePath.length * 20);
    gPlanarPath = toPlanarPath(gSpherePath);
}

/*
function toPlanarPath(spherePath, dirRange = DMSLib.HALFTAU) {
    let nominalDir = 0;
    if (gPlanarPath.length > 1) {
        nominalDir = gPlanarPath[1].sub(gPlanarPath[0]).theta();
    } 
    let result = {path: [], scale: 0}
    let o = new DMSLib.Point3D(); // origin

    for(let startdir=nominalDir - dirRange; startdir<nominalDir+dirRange; startdir+=dirRange/30) {
        let planePath = [];
        let pos = new DMSLib.Point2D();
        let dir = startdir;
        if(dir < 0) dir += DMSLib.HALFTAU;
        if(dir > DMSLib.HALFTAU) dir -= DMSLib.HALFTAU;

        for (let i=0; i<spherePath.length; i++) {
            planePath.push(pos); 

            let p = i>0 ? spherePath[i-1] : null;
            let q = spherePath[i]
            let r = i < spherePath.length-1 ? spherePath[i+1] : null;

            let deflectionAngle = (p && q && r) ? -DMSLib.Point3D.sphereDeflection(p, q, r) : 0;
            dir += deflectionAngle;

            let distanceToMove = (q && r) ? DMSLib.Point3D.angle(q,o,r) : 0;
            pos = pos.add(DMSLib.Point2D.fromPolar(distanceToMove, dir));
        }

        // get values of path
        let maxX = Math.max(...planePath.map(p => p.x))
        let minX = Math.min(...planePath.map(p => p.x))
        let maxY = Math.max(...planePath.map(p => p.y))
        let minY = Math.min(...planePath.map(p => p.y))

        let scale = Math.min(BOUNDARY.w / (maxX - minX), BOUNDARY.h / (maxY - minY));
        if(scale > result.scale) {
            result.scale = scale;
            let offset = new DMSLib.Point2D(BOUNDARY.x - minX*result.scale, BOUNDARY.y - minY*result.scale);
            result.path = planePath.map(p => p.mul(result.scale).add(offset));
        }
    }

    return result.path;
}

function toSpherePath(planarPath) {
    let result = [];
    let orientation = new DMSLib.Rotation();

    for(let i=0; i<planarPath.length; i++) {
        result.push(orientation.apply(DMSLib.Point3D.xAxis()));

        let p = i>0 ? planarPath[i-1] : null; 
        let q = planarPath[i];
        let r = i < planarPath.length-1 ? planarPath[i+1] : null;

        let deflectionAngle = (p && q && r) ? -DMSLib.Point2D.deflection(p, q, r) : 0;
        let deflection = DMSLib.Rotation.fromAngleAxis(deflectionAngle, DMSLib.Point3D.xAxis());

        let distanceToMove = (q && r) ? r.sub(q).R() : 0;
        let move = DMSLib.Rotation.fromAngleAxis(distanceToMove, DMSLib.Point3D.zAxis());

        orientation = orientation.combine(deflection).combine(move);
    }

    return result;
}
    */

// remove points that are too close together    
function cleanPath(path) {
    result = [];
    for(let i=0; i<path.length; i++) {
        if(i==0 || path[i].sub(path[i-1]).R() > DMSLib.EPSILON) {
            result.push(path[i]);
        }
    }
    return result;
}

/*
// return n equally distributed points along a path 
function redistributePoints(path, n_multiplier = 1) {
    path = cleanPath(path);
    let n = path.length * n_multiplier
    pathdistance = 0
    lastIdx = path.length-1;
    for (let i=0; i<lastIdx; i++) {
        let a = path[i]
        let b = path[(i+1)%path.length]
        pathdistance += a.sub(b).R();
    }

    distToNextStep = 0;
    idx = 0;
    stepdist = pathdistance / (n-1);
    result = [];
    while (idx < lastIdx - 1e-5) {
        idxI = Math.floor(idx)
        idxF = idx - idxI
        let a = path[idxI]
        let b = path[(idxI+1) % path.length]
        currentPos = a.add(b.sub(a).mul(idxF)) 
        if(a.nodeIdx !== undefined) currentPos.nodeIdx = a.nodeIdx; // preserve node index
        if(b.nodeIdx !== undefined) currentPos.nodeIdx = b.nodeIdx;
        distToNextPoint = b.sub(currentPos).R();

        if(distToNextStep <= 0) {
            // push current location to result
            result.push(currentPos)
            distToNextStep = stepdist
        }
        
        toTravel = Math.min(distToNextStep, distToNextPoint);
        toTravel = Math.max(toTravel, 1e-6);

        // go to next step location
        distToNextStep -= toTravel 
        idx += toTravel / b.sub(a).R();
    }
    result.push(path[path.length-1]);
    return result;
}
    */


// given a path, precalculated tangents and normals at each point (T, N)
// calculate the distance to move that point along the tangent for a constant decrease in energy 
function calcEnergyAtPt(edges, ptData) {
    let pt = ptData.a;
    let E = 0;

    const alpha = 2; // common alpha, beta values are (2, 4.5) and (3, 6)
    const beta = 4.5;
    function k(p, q, Tp, Tq) {
        let pq = p.sub(q);
        if(p instanceof DMSLib.Point2D) pq = pq.mul(PLANE2SPHERE_SCALE); // scale planar distances to sphere distances
        // k(p, q, Tp) = |Tp x (p-q)| ^ alpha) / |p-q|^beta
        return Math.pow(DMSLib.cross(Tp, pq).R(), alpha) / Math.pow(pq.R(), beta); // from Buck and Orloff via Crane et al paper
    }

    edges.forEach((edge) => {
        let a = edge.a;
        let b = edge.b;
        let T = edge.T;
        if(a.equals(pt) || b.equals(pt)) return;
        if(edge.nodeIdx >= 0 && edge.nodeIdx == ptData.nodeIdx) return;

        E += k(a, pt, T, ptData.T) + k(b, pt, T, ptData.T);
    });

    return E;
}

function calcEnergyForEdges(edges) {
    let result = 0;
    for(let i=0; i<edges.length; i++) {
        result += calcEnergyAtPt(edges, edges[i]);
    }
    return result;
}

// return index of node if the two points lie on one of it's arms
// TODO - verify this is working
function getNodeIdx(a, b) {
    if(a.nodeIdx !== undefined) return a.nodeIdx;
    if(b.nodeIdx !== undefined) return b.nodeIdx;
    return -1;
}

// precalculated edges, point pairs: (a, b) and tangent vector T
function buildEdges(path) {
    result = [];
    for(let i=0; i<path.length; i++) {
        let a = path[i];
        let b = (i<path.length-1) ? path[i+1] : path[i-1];
        let T = b.sub(a).normalized();
        let N = (T instanceof DMSLib.Point3D) ?
                DMSLib.Point3D.cross(a, T) : 
                new DMSLib.Point2D(T.y, -T.x);
        let nodeIdx = getNodeIdx(a, b, gIntersectionList);
        result.push({a, b, T, N, nodeIdx});
    }
    return result;
}

function calcEnergy() {
    let sEdges = buildEdges(gSpherePath);
    let pEdges = buildEdges(gPlanarPath);
    let sEnergy = calcEnergyForEdges(sEdges);
    let pEnergy = calcEnergyForEdges(pEdges);
    return {s:sEnergy, p:pEnergy};
}

PLANE_ENERGY_WEIGHT = 1.0;
function doEnergy(doSphere, doPlane) {
    let n = parseInt(document.getElementById("iterations").value);

    // energy calculations are normalized to initial energy
    let bestE = calcEnergy();
    let currentEnergy = (doSphere ? bestE.s : 0) + (doPlane ? bestE.p * PLANE_ENERGY_WEIGHT : 0); 

    console.log('initial energy = ' + currentEnergy);

    for(let iter = 0; iter<n; iter++) {
        const step = 5.0 * DMSLib.TAU / 360.0; // five degree step

        let randomNode = gIntersectionList.nodes[Math.floor(Math.random() * gIntersectionList.nodes.length)];
        let randomArm = randomNode.arms[Math.floor(Math.random() * 2)];
        let nextArm = gIntersectionList.nodes[randomArm.nextNode].arms[randomArm.nextDir];

        let oldOrientation = randomNode.orientation;
        let oldOutLength = randomArm.outLength;
        let oldInLength = nextArm.inLength;

        // flip a coin, in length, out length, or orientation
        if(Math.random() < 0.98) {
            randomArm.outLength += (Math.random() * 2.0 - 1.0) * step; // +/- a step
            nextArm.inLength = randomArm.outLength;
        } else {
            let delta = (Math.random() * 2.0 - 1.0) * step; // +/- a step
            let newOrientation = randomNode.orientation.combine(DMSLib.Rotation.fromAngleAxis(delta, DMSLib.Point3D.zAxis()));
            randomNode.setOrientation(newOrientation);
        }

        buildPathFromIntersectionNodes();
        let e = calcEnergy();
        let newEnergy = (doSphere ? e.s : 0) + (doPlane ? e.p * PLANE_ENERGY_WEIGHT : 0); 

        if(newEnergy < currentEnergy) {
            bestE = e;
            currentEnergy = newEnergy;
            console.log('best energy = ' + currentEnergy);
        } else {
            // Restore
            randomArm.outLength = oldOutLength;
            nextArm.inLength = oldInLength;
            randomNode.setOrientation(oldOrientation);
            buildPathFromIntersectionNodes();
        }
    }

    outputPath();
}

// orientation moves the z axis to a point P.  We want an orientation that moves z-axis to P+delta
function moveOrientation(node, delta) {
    let pos = node.orientation.apply(DMSLib.Point3D.zAxis());
    let destination = pos.add(delta).normalized();
    // find the rotation that moves pos to destination

    let axis = DMSLib.cross(pos, destination)
    let angle = DMSLib.Point3D.vectorAngle(pos, destination);

    newOrientation = DMSLib.Rotation.fromAngleAxis(angle, axis).combine(node.orientation);
    node.setOrientation(newOrientation);
}

// ***** DEAL WITH POSITIONS
function doIntersectionPositions() {
    // **** DEAL WITH LOCAL POSITIONS 
    gIntersectionList.nodes.forEach((node, nodeIdx) => {
        let fromPos = gIntersectionList.nodes[nodeIdx].orientation.apply(DMSLib.Point3D.zAxis());

        // look for asymmetric distances to neighbors.  move towards or away from neighbors.
        let neighborNodes = [node.arms[0].nextNode,
                             node.arms[0].prevNode,
                             node.arms[1].nextNode,
                             node.arms[1].prevNode];
        neighborNodes = neighborNodes.filter(n => n !== nodeIdx); // take out loops
        let neighborPoss = neighborNodes.map( nIdx => gIntersectionList.nodes[nIdx].orientation.apply(DMSLib.Point3D.zAxis()) );
        let dists = neighborPoss.map( np => DMSLib.Point3D.vectorAngle( fromPos, np ));
        let avgDist = dists.reduce((a, b) => a + b, 0) / dists.length;

        // now calculate move vector
        let deltaVector = DMSLib.Point3D.origin();
        gIntersectionList.nodes.forEach((otherNode, otherNodeIdx) => {
            if(otherNodeIdx == nodeIdx) return;
            let toPos = gIntersectionList.nodes[otherNodeIdx].orientation.apply(DMSLib.Point3D.zAxis());
            let dist = DMSLib.Point3D.vectorAngle(fromPos, toPos);

            if(dist < avgDist) {
                // too close, move away
                deltaVector = deltaVector.add(fromPos.sub(toPos).normalized().mul(avgDist - dist));
            } else if (neighborNodes.includes(otherNodeIdx)) {  
                // too far, move closer
                deltaVector = deltaVector.add(toPos.sub(fromPos).normalized().mul(dist - avgDist));
            }
        });
        
        moveOrientation(node, deltaVector.mul(0.3));
    });
    buildPathFromIntersectionNodes();

    // **** DEAL WITH GLOBAL POSITIONS 
    // calculate average
    let avgPt = DMSLib.Point3D.origin();
    gIntersectionList.nodes.forEach((node, nodeIdx) => {
         avgPt = avgPt.add(node.orientation.apply(DMSLib.Point3D.zAxis()));
    });
    avgPt = avgPt.div(gIntersectionList.nodes.length);

    // apply average
    gIntersectionList.nodes.forEach((node, nodeIdx) => {
        moveOrientation(node, avgPt.mul(-0.3));
    });

    buildPathFromIntersectionNodes();

    // **** DEAL WITH ANGLES 
    doIntersectionAngles();

    buildPathFromIntersectionNodes();
    outputPath();
}

function doIntersectionAngles() {
    gIntersectionList.nodes.forEach((node, nodeIdx) => {
        let inverseOrient = node.orientation.inverse();
        let offAngles = [];

        fnOffAngle = (o, expectedAngle) => {
            let pt = inverseOrient.combine(o).apply(DMSLib.Point3D.zAxis());
            if(Math.abs(pt.z) > 1 - DMSLib.EPSILON) return 0;
            return DMSLib.fixAngle(pt.theta() - expectedAngle);
        }

        // north, south destination
        let northNode = gIntersectionList.nodes[node.arms[0].nextNode];
        let southNode = gIntersectionList.nodes[node.arms[0].prevNode];
        if(!node.arms[0].directionIsPositive) [northNode, southNode] = [southNode, northNode];
        offAngles.push(fnOffAngle(northNode.orientation, DMSLib.QUARTERTAU));
        offAngles.push(fnOffAngle(southNode.orientation, -DMSLib.QUARTERTAU));

        // east, west destination
        let eastNode = gIntersectionList.nodes[node.arms[1].nextNode];
        let westNode = gIntersectionList.nodes[node.arms[1].prevNode];
        if(!node.arms[1].directionIsPositive) [eastNode, westNode] = [westNode, eastNode];
        offAngles.push(fnOffAngle(eastNode.orientation, 0));
        offAngles.push(fnOffAngle(westNode.orientation, DMSLib.HALFTAU));

        // new orientation that rotates to the right angle
        offAngles = offAngles.filter(a => Math.abs(a) > DMSLib.EPSILON);
        let avgOffAngleMagnitude = offAngles.map(a => Math.abs(a)).reduce((a, b) => a + b, 0) / offAngles.length;
        let avgOffAngle = offAngles.reduce((a, b) => a + b, 0) / offAngles.length;
        if (avgOffAngleMagnitude > DMSLib.QUARTERTAU) { avgOffAngle += DMSLib.HALFTAU; } // sign that it's in a stuck state
        let newOrientation = node.orientation.combine(
            DMSLib.Rotation.fromAngleAxis(avgOffAngle, DMSLib.Point3D.zAxis()));

        node.setOrientation(newOrientation);
        node.length = 2 * DMSLib.TAU / 360; // two degrees
    });

}

function scratch() {
    // do fun stuff here
    let arm = gIntersectionList.nodes[2].arms[1];
    let data = [];
    for(let i=0; i<100; i++) {
        arm.length = (i+1) / 102 * (arm.maxLength-arm.minLength) + arm.minLength;
        buildPathFromIntersectionNodes();
        data.push(calcEnergy());
    }
    console.table(data);
}

function onShowIntersectionPointsChange(isChecked) {
    enableIntersectionsOnSphere(isChecked);
    drawIntersectionsOnSphere(gIntersectionList);
}

// Function to respond to scratchValue changes
function onScratchValueChange(newValue) {
    let arm = gIntersectionList.nodes[2].arms[1];
    arm.outLength = (parseInt(newValue)+1) / 502 * DMSLib.HALFTAU; 
    let nextArm =  gIntersectionList.nodes[arm.nextNode].arms[arm.nextDir];
    nextArm.inLength = arm.outLength;

    buildPathFromIntersectionNodes();
    outputPath();

    let e = calcEnergy();
    d3.select('#scratchInfo #sphereEnergy').text(e.s.toFixed(2));
    d3.select('#scratchInfo #planeEnergy').text(e.p.toFixed(2));
}

// strategy do plane only - covers sphere and plane: then try to tweak on sphere.
// TODO - calc energy for sphere
//      - start by trying 1/x version of wind get it to work.
//      - calculate T and N movement - using wind - keep it working
//      - run at same time as plane
// TODO - try redistributing lower/higher for plane/sphere
