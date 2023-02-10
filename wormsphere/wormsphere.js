let WIDTH = 1000;
let HEIGHT = WIDTH/2;

let PLANE_WIDTH = 700;
let PLANE_HEIGHT = 500;
let PLANE_BUFFER = 50;
let gPlanarPath = [];
const PLANE_SCALE = 75;
const BOUNDARY = {x:PLANE_BUFFER/PLANE_SCALE, y:PLANE_BUFFER/PLANE_SCALE,
                  w:(PLANE_WIDTH-2*PLANE_BUFFER)/PLANE_SCALE,
                  h:(PLANE_HEIGHT-2*PLANE_BUFFER)/PLANE_SCALE};

const STARTINGPOINTS = 20;
let PATHLENGTH = STARTINGPOINTS * 10;
let PATHLENGTH_MULTIPLIER = 1;

function increasePoints() {
    PATHLENGTH_MULTIPLIER *= 2;
    PATHLENGTH = STARTINGPOINTS * 10 * PATHLENGTH_MULTIPLIER;
}


function initialize() {
    sphere_svg = d3.select('#sphere').append('svg')
        .style('margin', '5px')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);
    sphere_svg.append('rect')
        .attr('id', 'canvas')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('stroke-width', 1)
        .attr('opacity', '0.4')
        .attr('fill', 'silver');

    plane_svg = d3.select('#plane').append('svg')
        .style('margin', '5px')
        .attr('width', PLANE_WIDTH)
        .attr('height', PLANE_HEIGHT)
    plane_svg.append('rect')
        .attr('id', 'canvas')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('stroke-width', 1)
        .attr('opacity', '0.4')
        .attr('fill', 'silver');

    getRandomPath();
}

function drawPath(planarPath) {
    drawPathOnPlane(planarPath);
    drawPathOnSphere(toSpherePath(planarPath));
}

function toPlanarPath(spherePath) {
    let result = {path: [], scale: 0}
    let o = new DMSLib.Point3D(); // origin

    for(let startdir=0; startdir<DMSLib.HALFTAU; startdir+=DMSLib.HALFTAU/90) {
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

    return result;
}

function toSpherePath(planarPath, scale = 1) {
    let result = [];
    let orientation = new DMSLib.Rotation();
    for(let i=0; i<planarPath.length; i++) {
        result.push(orientation.apply(DMSLib.Point3D.xAxis()));

        let p = i>0 ? planarPath[i-1] : null; 
        let q = planarPath[i];
        let r = i < planarPath.length-1 ? planarPath[i+1] : null;

        let deflectionAngle = (p && q && r) ? -DMSLib.Point2D.deflection(p, q, r) : 0;
        let deflection = DMSLib.Rotation.fromAngleAxis(deflectionAngle, DMSLib.Point3D.xAxis());

        let distanceToMove = (q && r) ? r.sub(q).R() / scale : 0;
        let move = DMSLib.Rotation.fromAngleAxis(distanceToMove, DMSLib.Point3D.zAxis());

        orientation = orientation.combine(deflection).combine(move);
    }

    return result;
}

function drawPathOnPlane(path) {
    plane_svg.selectAll('circle').remove();
    plane_svg.selectAll('path').remove();
    pathString = '';
    for(let i=0; i<path.length; i++) {
        let x = path[i].x * PLANE_SCALE;
        let y = path[i].y * PLANE_SCALE;
        pathString += (i?'L':'M') + x + ' ' + y;

        gray = Math.floor(i/path.length * 255)
        color = 'rgb(255,' + (255-gray) + ',' + gray + ')'
        plane_svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 3)
            .attr('fill', color)
    }
     
    plane_svg.append('path')
        .attr('stroke-width', 1)
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('d', pathString);
}

function drawPathOnSphere(path) {
    sphere_svg.selectAll('circle').remove();
    sphere_svg.selectAll('path').remove();

    // move to first point
    let p = path[0];
    let theta = ((p.theta() / DMSLib.TAU) + 0.5) * WIDTH;
    let phi = p.phi() / DMSLib.HALFTAU * HEIGHT;
    pathString = 'M' + theta + ' ' + phi;

    for (let i=1; i<path.length; i++) {
        let lastP = p;
        let lastTheta = theta;
        let lastPhi = phi;

        p = path[i % path.length];
        theta = ((p.theta() / DMSLib.TAU) + 0.5) * WIDTH;
        phi = p.phi() / DMSLib.HALFTAU * HEIGHT;

        if (p.theta() < -DMSLib.QUARTERTAU && lastP.theta() > DMSLib.QUARTERTAU) {
            pathString += 'L' + (theta+WIDTH) + ' ' + phi;
            pathString += 'M' + (lastTheta-WIDTH) + ' ' + lastPhi;
            pathString += 'L' + theta + ' ' + phi;
        } else if (p.theta() > DMSLib.QUARTERTAU && lastP.theta() < -DMSLib.QUARTERTAU) {
            pathString += 'L' + (theta-WIDTH) + ' ' + phi;
            pathString += 'M' + (lastTheta+WIDTH) + ' ' + lastPhi;
            pathString += 'L' + theta + ' ' + phi;
        } else {
            pathString += 'L' + theta + ' ' + phi;
        }
        gray = Math.floor(i/path.length * 255)
        color = 'rgb(255,' + (255-gray) + ',' + gray + ')'

        sphere_svg.append('circle')
            .attr('cx', theta)
            .attr('cy', phi)
            .attr('r', 3)
            .attr('fill', color)
    }

    sphere_svg.append('path')
        .attr('stroke-width', 1)
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('d', pathString);
}

// return n equally distributed points along a path 
function redistributePoints(path, n, closed=true) {
    pathdistance = 0
    lastIdx = closed ? path.length : (path.length-1);
    for (let i=0; i<lastIdx; i++) {
        let a = path[i]
        let b = path[(i+1)%path.length]
        pathdistance += a.sub(b).R();
    }

    distToNextStep = 0;
    idx = 0;
    stepdist = pathdistance / n;
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
    if (!closed) result.push(path[path.length-1]);
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

// given z values of two points, what percentage of the range -bound..bound does it take up?
function windMultiplier(az, bz, bound) {
    bound = Math.abs(bound)

    // we have to calculate overlap
    let top = Math.min(bound, Math.max(az, bz))
    let bottom = Math.max(-bound, Math.min(az, bz))

    return Math.max((top-bottom) / (2*bound), 0)
}

// wind acts with exponential decay
function windBlownValue(value, halfstrength, maxeffect) {
    let absValue = Math.abs(value);
    let sign = Math.sign(value);
    let base = Math.pow(0.5, 1/halfstrength)
    delta = Math.pow(base, absValue) * maxeffect;
    // delta = Math.min(1/absValue/328, maxeffect);  // 1/x
    return (absValue + delta) * sign;
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
        for(let i=2; i<path.length-2; i++) {
            let idxs = [-2, -1, 0, 1, 2].map(t => (i + path.length + t) % path.length);
            let pts = idxs.map(idx => path[idx]);
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

function applySphereWind(path) {
    let resultPath = path.slice();

    // iterate over each segment
    for(let i=0; i<path.length-1; i++) {
        let ai = path[i];
        let bi = path[i+1];
        let R = orientSegment(ai, bi);
        let RInv = R.inverse();
        let zBound = R.apply(ai).z; 
        let reorientedPath = path.map(p => R.apply(p));

        // calculate effect it has on the rest of the edges
        for (let j=0; j<path.length-1; j++) {
            if(j == i || j == i+1) continue;
            let aj = reorientedPath[j];
            let bj = reorientedPath[j+1];

            // calculate multiplier for this point.
            let k = windMultiplier(aj.z, bj.z, zBound);
            if (k <= 0) continue;

            // calculate the affected point and add to accumulator (wind acts upon spherical coordinates theta)
            const MAXWIND = 1 * Math.PI / 180;
            const HALFSTRENGTH = 13 * Math.PI / 180;
            aj.setTheta(windBlownValue(aj.theta(), HALFSTRENGTH, k * MAXWIND));
            resultPath[j] = resultPath[j].add(RInv.apply(aj));
            bj.setTheta(windBlownValue(bj.theta(), HALFSTRENGTH, k * MAXWIND));
            resultPath[j+1] = resultPath[j+1].add(RInv.apply(bj));
        }
    }
    return resultPath.map(p => p.normalized());
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

    edges.forEach((edge) => {
        let a = edge.a;
        let b = edge.b;
        let T = edge.T;
        if(a.equals(pt) || b.equals(pt)) return;

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
        let b = (i<path.length-1) ? path[i+1] : path[i-1];
        let T = b.sub(a).normalized();
        let N = (T instanceof DMSLib.Point3D) ?
                DMSLib.Point3D.cross(a, T) : 
                new DMSLib.Point2D(T.y, -T.x);
        result.push({a, b, T, N});
    }
    return result;
}

function doEnergy(doSphere, doPlane) {
    let n = parseInt(document.getElementById("iterations").value);
    for(let iter = 0; iter<n; iter++) {
        if(doPlane) {
            doPlaneStep();
        }
        if(doSphere) {
            doSphereStep('wind');
        }
    }
    gPlanarPath = smoothPath(gPlanarPath);
    drawPath(gPlanarPath);
}

function doSphereStep(type = 'wind') {
    result = 0
    let spherePath = toSpherePath(gPlanarPath)

    if(type === 'wind') {
        spherePath = applySphereWind(spherePath);
    } else if (type === 'energy') {
        edges = buildEdges(spherePath);

        let step = [];
        for(let i=0; i<gPlanarPath.length; i++) {
            step[i] = calcStep(edges, edges[i]); 
        }
        let mags = step.map(s => s.R()).sort((a, b) => b-a);

        let stepscale = (5 * DMSLib.TAU/360) / mags[0];  // max 1 degree per step
    
        for(let i=0; i<spherePath.length; i++) {
            spherePath[i] = spherePath[i]
                .add(edges[i].T.mul(step[i].x * stepscale))
                .add(edges[i].N.mul(step[i].y * stepscale))
                .normalized();
        }
    }

    spherePath = redistributePoints(spherePath, PATHLENGTH, false);
    gPlanarPath = toPlanarPath(spherePath).path;
}

function doPlaneStep() {
    edges = buildEdges(gPlanarPath);

    let step = [];
    for(let i=0; i<gPlanarPath.length; i++) {
        step[i] = calcStep(edges, edges[i]);
    }
    let mags = step.map(s => s.R()).sort((a, b) => b-a);

    let stepscale = 5 / (PLANE_SCALE * mags[0]);  // max 5 pixels per step
    
    for(let i=0; i<gPlanarPath.length; i++) {
        gPlanarPath[i] = gPlanarPath[i]
            .add(edges[i].T.mul(step[i].x * stepscale))
            .add(edges[i].N.mul(step[i].y * stepscale));
    }
    gPlanarPath = redistributePoints(gPlanarPath, PATHLENGTH, false);
}

function getRandomPath() {
    let spherePath = [];
    for(let i=0; i<STARTINGPOINTS; i++) {
        spherePath[i] = DMSLib.Point3D.random(1).normalized();
    }
    doInsertionHeuristic(spherePath, 0, spherePath.length-1);
    while(doTwoOpt(spherePath, 0, spherePath.length-1, false)) {}
    while(doTwoOpt(spherePath, 0, spherePath.length-1, true)) {}
    while(doTwoOpt(spherePath, 0, spherePath.length-1, false)) {}

    spherePath = redistributePoints(spherePath, PATHLENGTH, false);
    gPlanarPath = toPlanarPath(spherePath).path;

    drawPath(gPlanarPath);
}

// strategy do plane only - covers sphere and plane: then try to tweak on sphere.
// TODO - calc energy for sphere
//      - start by trying 1/x version of wind get it to work.
//      - calculate T and N movement - using wind - keep it working
//      - run at same time as plane
// TODO - try redistributing lower/higher for plane/sphere
