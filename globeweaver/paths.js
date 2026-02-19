// ---- get your global variables here ----
let gPlanarPath = [];
let gPlanePathScaleFactor = 0;
let gSpherePath = [];

function increasePoints() {
    gSpherePath = redistributePoints(gSpherePath, 1.3);
    gSpherePath = smoothPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath);
}

function decreasePoints() {
    gSpherePath = redistributePoints(gSpherePath, 0.7);
    gSpherePath = smoothPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath);
}

function toPlanarPath(spherePath, dirRange, nominalDir) {
    if(dirRange === undefined) {
        let dirFromPath = (path) => path[1].sub(path[0]).theta();
        let result = toPlanarPath(gSpherePath, DMSLib.HALFTAU, 0);
        result = toPlanarPath(gSpherePath, DMSLib.HALFTAU / 20, dirFromPath(result));
        result = toPlanarPath(gSpherePath, DMSLib.HALFTAU / 400, dirFromPath(result));
        result = toPlanarPath(gSpherePath, DMSLib.HALFTAU / 8000, dirFromPath(result));
        return result;
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

        let boundary = {w: (PLANE_WIDTH - 2*PLANE_BUFFER) / gPlaneScale,
                        h: (PLANE_HEIGHT - 2*PLANE_BUFFER) / gPlaneScale,
                        x: PLANE_BUFFER / gPlaneScale,
                        y: PLANE_BUFFER / gPlaneScale };

        let scale = Math.min(boundary.w / (maxX - minX), boundary.h / (maxY - minY));
        if(scale > result.scale) {
            result.scale = scale;
            let offset = new DMSLib.Point2D(boundary.x - minX*result.scale, boundary.y - minY*result.scale);
            result.path = planePath.map(p => p.mul(result.scale).add(offset));
        }
    }

    gPlanePathScaleFactor = result.scale;
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

// return n equally distributed points along a path 
function redistributePoints(path, n_multiplier = 1) {
    let n = path.length * n_multiplier
    pathdistance = 0
    let lastIdx = path.length - 1  
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

function getRandomPath(phase = -1) {
    const STARTINGPOINTS = 20;
    if(phase == -1 || phase ==0) {
        gSpherePath = [];
        for(let i=0; i<STARTINGPOINTS; i++) {
            gSpherePath[i] = DMSLib.Point3D.random(1).normalized();
        }
    }
    
    if(phase == -1 || phase == 1) {
        doInsertionHeuristic(gSpherePath, 0, STARTINGPOINTS-1);
        while(doTwoOpt(gSpherePath, 0, STARTINGPOINTS-1, false)) {}
        while(doTwoOpt(gSpherePath, 0, STARTINGPOINTS-1, true)) {}
        while(doTwoOpt(gSpherePath, 0, STARTINGPOINTS-1, false)) {}
    } 
    
    if (phase == -1 || phase == 2) {
        gSpherePath = redistributePoints(gSpherePath, 10);
        gPlanarPath = toPlanarPath(gSpherePath);
    }
}

// given the index, return a point [x, y] on the Hilbert curve of order 4 (256 points)
function getHilbertPoint(index, level) {
    function rot(n, x, y, rx, ry) {
        if (ry == 0) {
            if (rx == 1) {
                x = n - 1 - x;
                y = n - 1 - y;
            }
            // Swap x and y
            [x, y] = [y, x];
        }
        return [x, y];
    }
    if (index == 0) return [0, 0];
    let n = 1 << level; // number of points per side
    let x = 0, y = 0;
    for (let s = 1; s < n; s *= 2) {
        let rx = 1 & (index / 2);
        let ry = 1 & (index ^ rx);
        [x, y] = rot(s, x, y, rx, ry);
        x += s * rx;
        y += s * ry;
        index /= 4;
    }
    return [x, y];
}

function getHilbertPath() {
    gPlanarPath = [];
    level = 5;
    for(let i=0; i<(4 ** level); i++) {
        let [x, y] = getHilbertPoint(i, level);
        gPlanarPath.push(new DMSLib.Point2D(x, y).mul(6.4/(2 ** level)));
    }
    gSpherePath = toSpherePath(gPlanarPath);
    gPlanarPath = toPlanarPath(gSpherePath);
}


// precalculated edges, point pairs: (a, b) and tangent vector T
function buildEdges(path, closed=false) {
    let getNodeIdx = (a, b) => (a.nodeIdx !== undefined) ? a.nodeIdx : ((b.nodeIdx !== undefined) ? b.nodeIdx : -1);
    let result = [];
    for(let i=0; i<path.length; i++) {
        let a = path[i];
        let b = (i<path.length-1 || closed) ? path[(i+1)%path.length] : path[i-1];
        let T = b.sub(a).normalized();
        let N = (T instanceof DMSLib.Point3D) ?
                DMSLib.Point3D.cross(a, T) : 
                new DMSLib.Point2D(T.y, -T.x);
        result.push({a, b, T, N, nodeIdx: getNodeIdx(a, b), idx: i});
    }
    return result;
}