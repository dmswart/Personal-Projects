const SPHERE_WIDTH = 500;
const PLANE_WIDTH = 700;
const PLANE_HEIGHT = 500;
const PLANE_SCALE = 75;
const PLANE_BUFFER = 50;
const BOUNDARY = {x:PLANE_BUFFER/PLANE_SCALE, y:PLANE_BUFFER/PLANE_SCALE,
                  w:(PLANE_WIDTH-2*PLANE_BUFFER)/PLANE_SCALE,
                  h:(PLANE_HEIGHT-2*PLANE_BUFFER)/PLANE_SCALE};


// ---- get your global variables here ----
let gPlanarPath = [];
let gSpherePath = [];

function increasePoints() {
    gSpherePath = redistributePoints(gSpherePath, 1.3);
    gSpherePath = smoothPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath);
}

function outputPath() {
    drawPathOnPlane(gPlanarPath, PLANE_SCALE);
    drawPathOnSphere(gSpherePath);
    d3.select('#output #skel').property('value', turnPathToArcs(gSpherePath) );
}

function toPlanarPath(spherePath) {
    let result = {path: [], scale: 0}
    let o = new DMSLib.Point3D(); // origin

    for(let startdir=0; startdir<DMSLib.QUARTERTAU; startdir+=DMSLib.HALFTAU/90) {
        let planePath = [];
        let pos = new DMSLib.Point2D();
        let dir = startdir;

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

// returns:
//    n (num points arc uses).
//    a, m, and b (points arc goes through)
//    c, axis of arc's rotation (to a's left)
function findLongestArc(path, tolerance) {
    let a = path[0];

    if(path.length < 2)
        return null;
    else if(path.length == 2) {
        let b = path[1];
        let m = a.add(b).mul(0.5);
        let c = DMSLib.Point3D.equidistantFrom3Points(a, m, b)
        return {n: 2, a, m, b, c};
    }

    let best = {n:3, error: 0, midIdx: 1};
    for(let n=4; n<=path.length; n++) {
        let b = path[n-1];

        bestErrorForNumPoints = 10000;
        bestIdxForNumPoints = -1;
        for(i=1; i<n-2; i++) {
            // find c equidistant from a, b, p[i]
            let c = DMSLib.Point3D.equidistantFrom3Points(a, path[i], b);
            let radius = c.sub(a).R();
            //find worst error for this arc
            worstErrorForArc = 0;
            for(j=1; j<n-2; j++) {
                error = Math.abs(path[j].sub(c).R() - radius);
                worstErrorForArc = Math.max(worstErrorForArc, error) 
            }

            if(worstErrorForArc < bestErrorForNumPoints) {
                bestIdxForNumPoints = i;
                bestErrorForNumPoints = worstErrorForArc;
            }
        }
        if(bestErrorForNumPoints < tolerance) {
            best = {n, error: bestErrorForNumPoints, midIdx: bestIdxForNumPoints}
        } else {
            break;
        }
    }

    let n = best.n;
    let m = path[best.midIdx];
    let b = path[n-1];
    let c = DMSLib.Point3D.equidistantFrom3Points(a, m, b);

    return {n, a, m, b, c};
}

function calcArcString(a, m, b, c, previous_c) {
    let result = '';

    if(previous_c !== null) {
        deflection = DMSLib.fixAngle(DMSLib.Point3D.signedSphereAngle(previous_c, arcData.a, arcData.c));
        if(Math.abs(deflection) > 0.0001) 
            result += 'r ' + (deflection/DMSLib.HALFTAU).toFixed(3) + '\n';
    }

    // calculate sweep and radius.
    let sweep = DMSLib.Point3D.signedSphereAngle(a, c, b);
    let am = DMSLib.Point3D.signedSphereAngle(a, c, m);
    if(am/sweep > 1.0 || am/sweep < 0.0 ) {
        // m is not in between a and b. fix it
        sweep += (sweep < 0) ? DMSLib.TAU : -DMSLib.TAU;
    }
    radius = DMSLib.Point3D.angle(a, DMSLib.Point3D.origin(), c);

    result += 'a ' + (sweep / DMSLib.HALFTAU).toFixed(3) + ' ' + (radius / DMSLib.HALFTAU).toFixed(3) + '\n';

    return result;
}

function turnPathToArcs(givenPath) {
    path = givenPath.map(p => p.normalized());

    outputString = '';
    let previous_c = null;
    while(true) {
        arcData = findLongestArc(path, 0.5*DMSLib.TAU/360);
        if(arcData==null) break;

        outputString += calcArcString(arcData.a, arcData.m, arcData.b, arcData.c, previous_c);
        previous_c = arcData.c;

        path = path.slice(arcData.n-1);
    }

    return outputString;
}

// return n equally distributed points along a path 
function redistributePoints(path, n_multiplier = 1) {
    let n = path.length * n_multiplier
    pathdistance = 0
    for (let i=0; i<path.length; i++) {
        let a = path[i]
        let b = path[(i+1)%path.length]
        pathdistance += a.sub(b).R();
    }

    distToNextStep = 0;
    idx = 0;
    stepdist = pathdistance / n;
    result = [];
    while (idx < path.length - 1e-5) {
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
    return result;
}

/******************************************************************************************
*  wind code
******************************************************************************************/

// calculate a rotation that puts segA and segB centered at x axis aligned with z axis (i.e., y = 0)
function orientSegment(a, b) {
    let midpoint = a.add(b);
    let centeringR = DMSLib.Rotation.fromVectorToVector(midpoint, DMSLib.Point3D.xAxis());
    let iA = centeringR.apply(a);  // intermediate A
    let orientingR = DMSLib.Rotation.fromAngleAxis(Math.atan2(iA.y, iA.z), DMSLib.Point3D.xAxis());

    return orientingR.combine(centeringR);
}

// wind acts with exponential decay
// fiven points A = [a_0, ... a_4] calculate smoother value for a_2 assuming all points should be on an arc
function smoothPoint(A) {
    // rotations that orient a_0, a_1.  and a_3, a_4 so their midpoint goes to x axis
    let R1 = orientSegment(A[0], A[1]);
    let R2 = orientSegment(A[3], A[4]);

    // interpolate quaternions of R1 and R2 into Ravg
    if(R1._q0 * R2._q0 + R1._qx * R2._qx + R1._qy * R2._qy + R1._qz * R2._qz < 0) {
        R1._q0 *= -1;
        R1._qx *= -1;
        R1._qy *= -1;
        R1._qz *= -1;
    }
    let q0 = R1._q0 + R2._q0;
    let qx = R1._qx + R2._qx;
    let qy = R1._qy + R2._qy;
    let qz = R1._qz + R2._qz;
    let magnitude = Math.sqrt(q0 * q0 + qx * qx + qy * qy + qz * qz);
    q0 /= magnitude;
    qx /= magnitude;
    qy /= magnitude;
    qz /= magnitude;
    let Ravg = new DMSLib.Rotation(q0, qx, qy, qz);

    // apply inverse to xaxis and avg it with existing value
    let expectedMidpoint = Ravg.inverse().apply(DMSLib.Point3D.xAxis());
    return A[2].add(expectedMidpoint).normalized();
}

function smoothPath(path) {
    result = path.slice();
    if(path[0] instanceof DMSLib.Point3D) {
        for(let i=0; i<path.length; i++) {
            let pts = [-2, -1, 0, 1, 2].map(t => path[(i + t+ path.length) % path.length]);
            result[i] = smoothPoint(pts);
        }
    } else if (path[0] instanceof DMSLib.Point2D) {
        for(let i=1; i<path.length-1; i++) {
            result[i] = result[i]
                .mul(2)
                .add(result[i-1])
                .add(result[i+1])
                .mul(0.25);
        }
    }
    return result;
}

function applySphereWind(path, edges) {
    deltas = [];
    for(let i=0; i<path.length; i++) deltas[i]=new DMSLib.Point3D();

    // iterate over each segment
    for(let i=0; i<path.length-1; i++) {
        let ai = path[i];
        let bi = path[i+1];
        let R = orientSegment(ai, bi);
        let RInv = R.inverse();
        let zBound = R.apply(ai).z / 2; 
        let reorientedPath = path.map(p => R.apply(p));

        // calculate effect it has on the rest of the edges
        for (let j=0; j<path.length-1; j++) {
            if(j == i) continue;
            let aj = new DMSLib.Point3D(reorientedPath[j]);
            let bj = new DMSLib.Point3D(reorientedPath[j+1]);

            // calculate multiplier for this point.
            let k = Math.abs(DMSLib.erf(aj.z/zBound) - DMSLib.erf(bj.z/zBound)) * DMSLib.EPSILON;

            // calculate the affected point and add to accumulator (wind acts upon spherical coordinates theta)
            let theta = aj.theta();
            if (Math.abs(theta) > DMSLib.EPSILON) {
                aj.setTheta(theta + 1/theta*k);
                deltas[j] = deltas[j].add(RInv.apply(aj)).sub(path[j]);
            }
            theta = bj.theta();
            if (Math.abs(theta) > DMSLib.EPSILON) {
                bj.setTheta(theta + 1/theta*k);
                deltas[j+1] = deltas[j+1].add(RInv.apply(bj)).sub(path[j+1]);
            }
        }
    }
    return deltas.map((d,i) => new DMSLib.Point2D(
            DMSLib.Point3D.dot(d.normalized(), edges[i].T),
            DMSLib.Point3D.dot(d.normalized(), edges[i].N))
        )
}
/******************************************************************************************
*  end of wind code
******************************************************************************************/

function boundaryEnergy(pt) {
    const left = BOUNDARY.x;
    const right = BOUNDARY.x + BOUNDARY.w;
    const top = BOUNDARY.y;
    const bottom = BOUNDARY.y + BOUNDARY.h;

    beFn = (x) => 1/(x*PLANE_SCALE);

    if (pt instanceof DMSLib.Point3D) {
        return 0;
    } else if (pt.x <= left || pt.x >= right || pt.y <= top || pt.y >= bottom) {
        return Number.MAX_SAFE_INTEGER;
    } else {
        return beFn(pt.x - left) + 
               beFn(right - pt.x) + 
               beFn(pt.y - top) + 
               beFn(bottom - pt.y);
    }
}

function ignoreEnergy(a, b, totalEdges) {
    a = a/totalEdges; 
    b = b/totalEdges;
    let diff = Math.abs(a-b);
    return (diff > 0.25 && diff < 0.75);
}

// given a path, precalculated tangents and normals at each point (T, N)
// calculate the distance to move that point along the tangent for a constant decrease in energy 
function calcStep(edges, ptData) {
    let pt = ptData.a;
    let pt_T = pt.add(ptData.T.mul(DMSLib.EPSILON));
    let pt_N = pt.add(ptData.N.mul(DMSLib.EPSILON));
    let E = boundaryEnergy(pt);
    let E_T = boundaryEnergy(pt_T);
    let E_N = boundaryEnergy(pt_N);

    let localScale = 1/ptData.a.sub(ptData.b).R();

    // k(p, q, Tp) = |Tp x (p-q)| ^ alpha) / |p-q|^beta
    const alpha = 2; // common alpha, beta values are (2, 4.5) and (3, 6)
    const beta = 4.5;
    function k(p, q, Tp, Tq) {
        let pq = p.sub(q).mul(localScale);
        return Math.pow(DMSLib.cross(Tp, pq).R(), alpha) / Math.pow(pq.R(), beta);
    }

    edges.forEach((edge, i) => {
        let a = edge.a;
        let b = edge.b;
        let T = edge.T;
        if(a.equals(pt) || b.equals(pt)) return;
        if (ignoreEnergy(edge.idx, ptData.idx, edges.length)) return;

        E += k(a, pt, T, ptData.T) + k(b, pt, T, ptData.T);
        E_T += k(a, pt_T, T, ptData.T) + k(b, pt_T, T, ptData.T);
        E_N += k(a, pt_N, T, ptData.T) + k(b, pt_N, T, ptData.T);
    });

    // not (E_T - E) because positive change means we'd want to step in opposite direction
    return new DMSLib.Point2D(E-E_T, E-E_N);  
}

// precalculated edges, point pairs: (a, b) and tangent vector T
function buildEdges(path) {
    result = [];
    for(let i=0; i<path.length; i++) {
        let a = path[i];
        let b = (i<path.length-1) ? path[i+1] : path[0];
        let T = b.sub(a).normalized();
        let N = (T instanceof DMSLib.Point3D) ?
                DMSLib.Point3D.cross(a, T) : 
                new DMSLib.Point2D(T.y, -T.x);
        result.push({a, b, T, N, idx: i});
    }
    return result;
}

function doEnergy(doSphere, doPlane) {
    let n = parseInt(document.getElementById("iterations").value);
    for(let iter = 0; iter<n; iter++) {
        if(doPlane && doSphere) {
            doBothStep();
        } else if(doPlane) {
            doPlaneStep();
        } else if(doSphere) {
            doSphereStep();
        }
    }
    outputPath(gPlanarPath);
}

function doBothStep() {
    sEdges = buildEdges(gSpherePath);
    pEdges = buildEdges(gPlanarPath);
    let pSteps = [];
    for(let i=0; i<gPlanarPath.length; i++) {
        pSteps[i] = calcStep(pEdges, pEdges[i]); 
    }
    let sSteps = applySphereWind(gSpherePath, sEdges);

    let max = sSteps.map(s => s.R()).sort((a, b) => b-a)[0];
    sSteps = sSteps.map(s => s.mul((1/360 * DMSLib.TAU) / max));
    max = pSteps.map(s => s.R()).sort((a, b) => b-a)[0];
    pSteps = pSteps.map(s => s.mul((5/PLANE_SCALE) / max));

    for(let i=0; i<gSpherePath.length; i++) {
        let step = sSteps[i].add(pSteps[i]);
        gSpherePath[i] = gSpherePath[i]
            .add(sEdges[i].T.mul(step.x))
            .add(sEdges[i].N.mul(step.y))
            .normalized();
    }

    gSpherePath = redistributePoints(gSpherePath);
    gSpherePath = smoothPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath);
}

function doSphereStep() {
    edges = buildEdges(gSpherePath);
    let step = [];

    for(let i=0; i<edges.length; i++) {
        step[i] = calcStep(edges, edges[i]); 
    }

    let mags = step.map(s => s.R()).sort((a, b) => b-a);
    let stepscale = (1/360 * DMSLib.TAU) / mags[0];  // max 1 degree per step

    for(let i=0; i<gSpherePath.length; i++) {
        gSpherePath[i] = gSpherePath[i]
            .add(edges[i].T.mul(step[i].x * stepscale))
            .add(edges[i].N.mul(step[i].y * stepscale))
            .normalized();
    }

    gSpherePath = redistributePoints(gSpherePath);
    gSpherePath = smoothPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath);
}

function doPlaneStep() {
    edges = buildEdges(gPlanarPath);

    let step = [];
    for(let i=0; i<gPlanarPath.length; i++) {
        step[i] = calcStep(edges, edges[i]);
    }
    let mags = step.map(s => s.R()).sort((a, b) => b-a);

    let stepscale = (1 / PLANE_SCALE) / mags[0];  // max 5 pixels per step
    
    for(let i=0; i<gPlanarPath.length; i++) {
        gPlanarPath[i] = gPlanarPath[i]
            .add(edges[i].T.mul(step[i].x * stepscale))
            .add(edges[i].N.mul(step[i].y * stepscale));
    }
    gPlanarPath = redistributePoints(gPlanarPath);
    gSpherePath = toSpherePath(gPlanarPath)
}

function getRandomPath() {
    const STARTINGPOINTS = 20;
    gSpherePath = [];
    for(let i=0; i<STARTINGPOINTS; i++) {
        gSpherePath[i] = DMSLib.Point3D.random(1).normalized();
    }
    doInsertionHeuristic(gSpherePath, 0, STARTINGPOINTS-1);
    while(doTwoOpt(gSpherePath, 0, STARTINGPOINTS-1, false)) {}
    while(doTwoOpt(gSpherePath, 0, STARTINGPOINTS-1, true)) {}
    while(doTwoOpt(gSpherePath, 0, STARTINGPOINTS-1, false)) {}

    gSpherePath = redistributePoints(gSpherePath, 10);

    gPlanarPath = toPlanarPath(gSpherePath);
    outputPath();
}

function intersectsOnSphere(a1, a2, b1, b2) {
    let nA = DMSLib.Point3D.cross(a1, a2).normalized();
    let nB = DMSLib.Point3D.cross(b1, b2).normalized();
    let intersectionPoint1 = DMSLib.Point3D.cross(nA, nB).normalized();
    let intersectionPoint2 = intersectionPoint1.mul(-1);
    //check if intersection points are on both segments
    function onSegment(p, s1, s2) {
        let angleS1S2 = DMSLib.Point3D.vectorAngle(s1, s2);
        let angleS1P = DMSLib.Point3D.vectorAngle(s1, p);
        let anglePS2 = DMSLib.Point3D.vectorAngle(p, s2);
        return Math.abs(angleS1P + anglePS2 - angleS1S2) < 1e-5;
    }
    if (onSegment(intersectionPoint1, a1, a2) && onSegment(intersectionPoint1, b1, b2))
        return intersectionPoint1;
    else if ( onSegment(intersectionPoint2, a1, a2) && onSegment(intersectionPoint2, b1, b2))
        return intersectionPoint2;
    else
        return null;
}

function nextIntersection(intersections, idx) {
    let result = {node: 0, arm: 0}
    closestNextIdx = Number.MAX_SAFE_INTEGER;
    for(let i=0; i<intersections.length; i++) {
        if(intersections[i].nsIdx > idx && intersections[i].nsIdx < closestNextIdx) {
            closestNextIdx = intersections[i].nsIdx;
            result.node = i;
            result.arm = 0;
        } else if (intersections[i].ewIdx > idx && intersections[i].ewIdx < closestNextIdx) {
            closestNextIdx = intersections[i].ewIdx;
            result.node = i;
            result.arm = 1;
        }
    }
    if(result.node == Number.MAX_SAFE_INTEGER) {
        result.node = 0;
    }
    return result;
}

// returns rotation that maps z axis to pt (normalized), and two given vectors to (close to) x and y axes
// TODO - this is a duplicate of code in wormsphereviewer.js

function calculateOrientationFromDirs(pt, dirX, dirY) {
    // first rotate z axis to pt
    let axis = (Math.abs(pt.z) > 1-DMSLib.EPSILON) ?
        DMSLib.Point3D.xAxis() : 
        new DMSLib.Point3D(-pt.y, pt.x, 0).normalized();
    let orientZaxisToIntersection = DMSLib.Rotation.fromAngleAxis(Math.acos(pt.z), axis);

    let nativedirX = orientZaxisToIntersection.inverse().apply(dirX);
    let nativedirY = orientZaxisToIntersection.inverse().apply(dirY);

    let correctionAngle = DMSLib.averageAngle([nativedirY.theta()-DMSLib.QUARTERTAU, nativedirX.theta()]);
    return orientZaxisToIntersection.combine(
        DMSLib.Rotation.fromAngleAxis(correctionAngle, DMSLib.Point3D.zAxis()));
}

function scratch() {
    // find intersections
    let intersections = [];
    for(let i=0; i<gSpherePath.length-1; i++) {
        let edgeA_1 = gSpherePath[i];
        let edgeA_2 = gSpherePath[i+1];
        for(let j=i+2; j<gSpherePath.length-1; j++) {
            let edgeB_1 = gSpherePath[j];
            let edgeB_2 = gSpherePath[j+1];
            let intersectionPoint =  intersectsOnSphere(edgeA_1, edgeA_2, edgeB_1, edgeB_2);
            if(intersectionPoint) {
                let ndir = edgeA_2.sub(edgeA_1).normalized();
                let edir = edgeB_2.sub(edgeB_1).normalized();
                let eDirIsPositive = DMSLib.dot(DMSLib.cross(edir, ndir), intersectionPoint) > 0.0;
                if(!eDirIsPositive) {
                    edir = edir.mul(-1);
                }

                let orientation = calculateOrientationFromDirs(intersectionPoint, edir, ndir);
                if(true)
                {
                    let testN = orientation.apply(DMSLib.Point3D.yAxis());
                    let testE = orientation.apply(DMSLib.Point3D.xAxis());
                    let nAngle = DMSLib.Point3D.vectorAngle(testN, ndir);
                    let eAngle = DMSLib.Point3D.vectorAngle(testE, edir);
                    if(nAngle > DMSLib.QUARTERTAU || eAngle > DMSLib.QUARTERTAU) {
                        console.log("orientation error!");
                    }

                }

                let newIntersection = {
                    orientation,
                    nsIdx: i,
                    ewIdx: j,
                    arms: [ {idx: i,
                             length: 5*DMSLib.TAU/360,
                             dirIsPositive: true,
                             nextNode: null,
                             nextArm: null},
                            {idx: j,
                             length: 5*DMSLib.TAU/360,
                             dirIsPositive: eDirIsPositive,
                             nextNode: null,
                             nextArm: null}]
                };
                intersections.push(newIntersection);
            }
        }
    }

    // now fill in 
    currentIntersection = 0;
    currentArm = 0;
    while(true) {
        let pathIdx = intersections[currentIntersection].arms[currentArm].idx;
        let next = nextIntersection(intersections, pathIdx);
        intersections[currentIntersection].arms[currentArm].nextNode = next.node;
        intersections[currentIntersection].arms[currentArm].nextArm = next.arm;

        // 
        currentIntersection = next.node;
        currentArm = next.arm;

        if(currentIntersection == 0 && currentArm == 0) break;
    }
    drawIntersectionsOnSphere(intersections);

    // write intersections as json to downloaded file
    let outputString = JSON.stringify(intersections, null, 2);
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputString));
    element.setAttribute('download', 'intersections.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// strategy do plane only - covers sphere and plane: then try to tweak on sphere.
// TODO - calc energy for sphere
//      - start by trying 1/x version of wind get it to work.
//      - calculate T and N movement - using wind - keep it working
//      - run at same time as plane
// TODO - try redistributing lower/higher for plane/sphere
