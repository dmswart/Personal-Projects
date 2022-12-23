let WIDTH = 1000;
let HEIGHT = WIDTH/2;
let globalPath = [];

let STARTINGPOINTS = 40
let PATHLENGTH = STARTINGPOINTS * 25;

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
        .attr('width', 850)
        .attr('height', 650)
    plane_svg.append('rect')
        .attr('id', 'canvas')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('stroke-width', 1)
        .attr('opacity', '0.4')
        .attr('fill', 'silver');

    globalPath = getRandomPath(STARTINGPOINTS);
    globalPath = redistributePoints(globalPath, PATHLENGTH);
    drawPath(globalPath);
}

function drawPath(path) {
    planar = toPlanarPath(path, 50, 50, 750, 550);
    drawPathOnSphere(path);
    drawPathOnPlane(planar.path);
}

function toPlanarPath(spherePath, x, y, w, h) {
    let planePath = [];

    let pos = new DMSLib.Point2D();
    let dir = 0;
    let o = new DMSLib.Point3D(); // origin

    for (let i=0; i<spherePath.length; i++) {
        planePath.push(pos); 

        let p = i>0 ? spherePath[i-1] : null;
        let q = spherePath[i]
        let r = i < spherePath.length-1 ? spherePath[i+1] : null;

        deflectionAngle = (p && q && r) ? -DMSLib.Point3D.sphereDeflection(p, q, r) : 0;
        dir += deflectionAngle;

        distanceToMove = (q && r) ? DMSLib.Point3D.angle(q,o,r) : 0;
        pos = pos.add(DMSLib.Point2D.fromPolar(distanceToMove, dir));
    }

    // get values of path
    let maxX = Math.max(...planePath.map(p => p.x))
    let minX = Math.min(...planePath.map(p => p.x))
    let maxY = Math.max(...planePath.map(p => p.y))
    let minY = Math.min(...planePath.map(p => p.y))
    
    let scale = Math.min(w / (maxX - minX), h / (maxY - minY));
    let offset = new DMSLib.Point2D(x - minX*scale, y - minY*scale);
    resultPath = planePath.map(p => p.mul(scale).add(offset));
    return {path: resultPath, scale: scale};
}

function toSpherePath(planarPath, scale) {
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
        pathString += (i?'L':'M') + path[i].x + ' ' + path[i].y;

        gray = Math.floor(i/path.length * 255)
        color = 'rgb(255,' + (255-gray) + ',' + gray + ')'
        plane_svg.append('circle')
            .attr('cx', path[i].x)
            .attr('cy', path[i].y)
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

    for (let i=1; i<path.length+1; i++) {
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

function getRandomPath(numPoints = 50) {
    let points = [];
    for (let i = 0; i < numPoints; i++) {
        points.push(DMSLib.Point3D.random(1.0).normalized())
    }
    return points;
}
function getPentagonPath() {
    result = [0, 1, 2, 3, 4]
        .map(n => new DMSLib.Point3D(5, Math.cos(n/5*DMSLib.TAU), Math.sin(n/5*DMSLib.TAU)))
        .map(p => p.normalized());
}

// return n equally distributed points along a path 
function redistributePoints(path, n = 100) {
    pathdistance = 0
    for (let i=0; i<path.length; i++) {
        let a = path[i]
        let b = path[(i+1) % path.length]
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
            result.push(currentPos.normalized())
            distToNextStep = stepdist
        }
        
        toTravel = Math.min(distToNextStep, distToNextPoint);
        toTravel = Math.max(toTravel, 1e-6);

        // go to next step location
        distToNextStep -= toTravel 
        if(b.sub(a).R() <= 0) 
            console.log('hey!')
        idx += toTravel / b.sub(a).R();
    }
    return result;
}

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

    if(bound === 0) 
        console.log('hey!')
    return Math.max((top-bottom) / (2*bound), 0)
}

// wind acts by increasing theta (in spherical coordinates)
const MAXWIND = 5 * Math.PI / 180;
function windBlownTheta(theta, multiplier) {
    let absTheta = Math.abs(theta);
    let sign = Math.sign(theta);
    // effect starts at MAXWIND when theta = 0, then decreases by half every 30 degrees
    deltaTheta = Math.pow(0.2, absTheta/(DMSLib.HALFTAU/6)) * MAXWIND;
    deltaTheta *= multiplier;
    return (absTheta + deltaTheta) * sign;
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
    for(let i=0; i<path.length; i++) {
        let idxs = [-2, -1, 0, 1, 2].map(t => (i + path.length + t) % path.length);
        let pts = idxs.map(idx => path[idx]);
        result[i] = smoothPoint(pts);
    }
    return result;
}

function applyWind(path) {
    let resultPath = path.slice();

    // iterate over each segment
    for(let i=0; i<path.length; i++) {
        let a = path[i];
        let b = path[(i+1) % (path.length)];
        let R = orientSegment(a, b);
        let RInv = R.inverse();
        let zBound = R.apply(a).z; 
        let reorientedPath = path.map(p => R.apply(p));

        // calculate effect it has on the rest of the points
        for (let j=0; j<path.length; j++) {
            if(j == i || j == (i+1) % path.length) continue;

            // calculate multiplier for this point.
            p = new DMSLib.Point3D(reorientedPath[j]);
            let zbefore = reorientedPath[(j+path.length-1) % path.length].z
            let zafter = reorientedPath[(j+1) % path.length].z
            let k = windMultiplier(zbefore, p.z, zBound) + windMultiplier(zafter, p.z, zBound);
            if (k <= 0) continue;

            // calculate the affected point and add to accumulator (wind acts upon spherical coordinates theta)
            let newTheta = windBlownTheta(p.theta(), k);
            p.setTheta(newTheta);
            resultPath[j] = resultPath[j].add(RInv.apply(p));
        }
    }
    return resultPath.map(p => p.normalized());
}

function go() {
    for(let i=0; i<1000; i++) {
        globalPath = applyWind(globalPath); 
        globalPath = redistributePoints(globalPath, PATHLENGTH);
        if(i%10) {
            globalPath = smoothPath(globalPath);
        }
    }
    drawPath(globalPath);
}

function pushSphereToPlane() {
    planar = toPlanarPath(globalPath, 50, 50, 750, 550);
    globalPath = toSpherePath(planar.path, planar.scale);
    drawPath(globalPath);
}