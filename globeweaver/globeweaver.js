const PLANE_WIDTH = 700;
const PLANE_HEIGHT = 500;
const PLANE_BUFFER = 50;
const BOUNDARY = {x:PLANE_BUFFER, y:PLANE_BUFFER,
                  w:(PLANE_WIDTH-2*PLANE_BUFFER),
                  h:(PLANE_HEIGHT-2*PLANE_BUFFER)};
const PLANE2SPHERE_SCALE = Math.sqrt( (4 * Math.PI) / (BOUNDARY.w * BOUNDARY.h) );

let gIntersectionList = new Globeweaver.IntersectionList([]);

// ---- globeweaver global variables ----
let gPlanarPath = [];
let gSpherePath = [];

function increasePoints() {
    gSpherePath = redistributePoints(gSpherePath, 1.3);
    gSpherePath = smoothPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath);
}

function outputPath() {
    drawPathOnPlane(gPlanarPath);
    drawPathOnSphere(gSpherePath);
    d3.select('#output #skel').property('value', gIntersectionList.getPathString());
}

function initializeThreeNode() {
    const defaultArmLength = 35 * DMSLib.TAU / 360; // ten degrees
    let node1 = new Globeweaver.IntersectionNode(
        new DMSLib.Rotation.identity(),
        new Arm(defaultArmLength, true, 0, 1),
        new Arm(defaultArmLength, false, 1, 1)
    );
    let node2 = new Globeweaver.IntersectionNode(
        new DMSLib.Rotation.fromAngleAxis(-DMSLib.TAU / 4, DMSLib.Point3D.yAxis()),
        new Arm(defaultArmLength, false, 0, 0),
        new Arm(defaultArmLength, false, 2, 1)
    );
    let node3 = new Globeweaver.IntersectionNode(
        new DMSLib.Rotation.fromAngleAxis(-DMSLib.TAU / 2, DMSLib.Point3D.yAxis()),
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
    gIntersectionList.calculateProperties();
    gSpherePath = gIntersectionList.getSpherePath(20);
    gSpherePath = redistributePoints(gSpherePath, gIntersectionList.nodes.length / gSpherePath.length * 40);
    gPlanarPath = toPlanarPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath, DMSLib.HALFTAU / 20);
    gPlanarPath = toPlanarPath(gSpherePath, DMSLib.HALFTAU / 400);
    gPlanarPath = toPlanarPath(gSpherePath, DMSLib.HALFTAU / 8000);
}

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

function colorRamp(idx, total) {
    gray = Math.floor(idx/total * 255)
    return 'rgb(255,' + (255-gray) + ',' + gray + ')';
}

// return n equally distributed points along a path 
function redistributePoints(path, n_multiplier = 1) {
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
function getNodeIdx(a, b, intersectionList) {
    for(let i = 0; i<intersectionList.nodes.length; i++) {
        let node = intersectionList.nodes[i];
        let invA = node.orientation.inverse().apply(a);
        let invB = node.orientation.inverse().apply(b);

        if(Math.abs(invA.x) < DMSLib.EPSILON && Math.abs(invB.x) < DMSLib.EPSILON) {
            //east west.
            let lengthA = Math.atan2(invA.y, invA.z);
            let lengthB = Math.atan2(invB.y, invB.z);
            if(node.arms[0].isWithinArmsLength(lengthA) && node.arms[0].isWithinArmsLength(lengthB)) {
                return i
            }
        } else if(Math.abs(invA.y) < DMSLib.EPSILON && Math.abs(invB.y) < DMSLib.EPSILON) {
            // north south
            let lengthA = Math.atan2(invA.x, invA.z);
            let lengthB = Math.atan2(invB.x, invB.z);
            if(node.arms[1].isWithinArmsLength(lengthA) && node.arms[1].isWithinArmsLength(lengthB)) {
                return i
            }
        }
    }

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

function doEnergy(doSphere, doPlane) {
    let n = parseInt(document.getElementById("iterations").value);

    // energy calculations are normalized to initial energy
    let e = calcEnergy();
    let currentEnergy = (doSphere ? e.s : 0) + (doPlane ? e.p : 0); 

    console.log('initial energy = ' + currentEnergy);

    for(let iter = 0; iter<n; iter++) {
        const step = DMSLib.TAU / 360.0 * 1.0; // three degree step

        let randomNode = gIntersectionList.nodes[Math.floor(Math.random() * gIntersectionList.nodes.length)];
        let randomArm = randomNode.arms[Math.floor(Math.random() * 2)];

        let oldOrientation = randomNode.orientation;
        let oldLength = randomArm.length;

        // flip a coin, length, or orientation
        
        if(Math.random() < 0.5) {
            // TWEAK LENGTH
            let delta = (Math.random() * 2.0 - 1.0) * step; // +/- a step
            let newLength = randomArm.length + delta;
            if(newLength < randomArm.maxLength && newLength > randomArm.minLength) {
                randomArm.length = newLength;
            } else {
                continue; // can't do anything, try again
            }
        } else {
            // TWEAK ORIENTATION
            // TODO - am I effectively changing this orientation?
            randomNode.orientation = randomNode.orientation.combine(
                                     DMSLib.Rotation.fromAngleAxis(step, DMSLib.Point3D.random()));
        }

        buildPathFromIntersectionNodes();
        e = calcEnergy();
        let newEnergy = (doSphere ? e.s : 0) + (doPlane ? e.p : 0); 

        if(newEnergy < currentEnergy) {
            currentEnergy = newEnergy;
        } else {
            // Restore
            randomArm.length = oldLength;
            randomNode.orientation = oldOrientation;
            buildPathFromIntersectionNodes();
        }
    }
    console.log('current energy = ' + currentEnergy);
    outputPath();
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

// Function to respond to scratchValue changes
function onScratchValueChange(newValue) {
    let arm = gIntersectionList.nodes[2].arms[1];
    arm.length = (parseInt(newValue)+1) / 502 * (arm.maxLength-arm.minLength) + arm.minLength;
    buildPathFromIntersectionNodes();
    outputPath();

    let e = calcEnergy();
    d3.select('#scratchInfo #sphereEnergy').text(e.s.toFixed(2));
    d3.select('#scratchInfo #planeEnergy').text(e.p.toFixed(2));

    //console.log('' + newValue, ', ' + e.s + ' ,' + e.p);
}

// strategy do plane only - covers sphere and plane: then try to tweak on sphere.
// TODO - calc energy for sphere
//      - start by trying 1/x version of wind get it to work.
//      - calculate T and N movement - using wind - keep it working
//      - run at same time as plane
// TODO - try redistributing lower/higher for plane/sphere
