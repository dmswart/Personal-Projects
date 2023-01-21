let WIDTH = 1000;
let HEIGHT = WIDTH/2;
let gPlanarPath = [];

const STARTINGPOINTS = 20
const PATHLENGTH = STARTINGPOINTS * 10;
const BOUNDARY = {x:50, y:50, w:750, h:550};

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

    getRandomPlane();
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

function toSpherePath(planarPath, scale = 70) {
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

function boundaryEnergy(pt) {
    const left = BOUNDARY.x;
    const right = BOUNDARY.x + BOUNDARY.w;
    const top = BOUNDARY.y;
    const bottom = BOUNDARY.y + BOUNDARY.h;

    if (pt instanceof DMSLib.Point3D) {
        return 0;
    } else if (pt.x <= left || pt.x >= right || pt.y <= top || pt.y >= bottom) {
        return Number.MAX_SAFE_INTEGER;
    } else {
        return 1/(pt.x - left) + 1/(right - pt.x) + 1/(pt.y - top) + 1/(bottom - pt.y);
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
    function k(p, q, Tp) {
        let pq = p.sub(q).mul(localScale);
        return Math.pow(DMSLib.cross(Tp, pq).R(), 2.0) / Math.pow(pq.R(), 4.5);
    }

    edges.forEach((edge) => {
        let a = edge.a;
        let b = edge.b;
        let T = edge.T;
        if(a.equals(pt) || b.equals(pt)) return;

        E += (k(a, pt, T) + k(b, pt, T));
        E_T += (k(a, pt_T, T) + k(b, pt_T, T));
        E_N += (k(a, pt_N, T) + k(b, pt_N, T));
    });

    // not (E_T - E) because positive change means we'd want to step in opposite direction
    return new DMSLib.Point2D(E-E_T, E-E_N);  
}

// precalculated edges, point pairs: (a, b) and tangent vector T
function buildEdges(path, closed=true) {
    result = [];
    for(let i=0; i<path.length; i++) {
        let a = path[i];
        let b = (i<path.length-1 || closed) ? path[(i+1)%path.length] : path[i-1];
        let T = b.sub(a).normalized();
        let N = (T instanceof DMSLib.Point3D) ?
                DMSLib.Point3D.cross(a, T) : 
                new DMSLib.Point2D(T.y, -T.x);
        result.push({a, b, T, N});
    }
    return result;
}

function doEnergyStep(n, doSphere, doPlane) {
    for(let iter = 0; iter<n; iter++) {
        let spherePath = toSpherePath(gPlanarPath)
        sphereEdges = buildEdges(spherePath);
        planeEdges = buildEdges(gPlanarPath, false);

        let step = [];
        let maxstep = 0;
        for(let i=0; i<gPlanarPath.length; i++) {
            step[i] = new DMSLib.Point2D();
            if(doPlane) step[i] = step[i].add(calcStep(planeEdges, planeEdges[i]));
            if(doSphere) step[i] = step[i].add(calcStep(sphereEdges, sphereEdges[i])); 
            // TODO or do I multiply planar scale above?

            maxstep = Math.max(step[i].R(), maxstep);
        }

        let stepscale = 5 / maxstep;  // max 2 pixels per step
        
        for(let i=0; i<gPlanarPath.length; i++) {
            gPlanarPath[i] = gPlanarPath[i]
                .add(planeEdges[i].T.mul(step[i].x * stepscale))
                .add(planeEdges[i].N.mul(step[i].y * stepscale));
        }
        gPlanarPath = redistributePoints(gPlanarPath, PATHLENGTH, false);
    }
    drawPath(gPlanarPath);
}

function getRandomPlane() {
    let offset = new DMSLib.Point2D(BOUNDARY.x, BOUNDARY.y);
    gPlanarPath = getRandomPts(STARTINGPOINTS, {width:BOUNDARY.w, height:BOUNDARY.h})
        .map(p => p.add(offset));
    doInsertionHeuristic(gPlanarPath, 0, gPlanarPath.length-1);
    while(doTwoOpt(gPlanarPath, 0, gPlanarPath.length-1, false)) {}
    while(doTwoOpt(gPlanarPath, 0, gPlanarPath.length-1, true)) {}
    while(doTwoOpt(gPlanarPath, 0, gPlanarPath.length-1, false)) {}
    gPlanarPath = redistributePoints(gPlanarPath, PATHLENGTH, false);

    drawPath(gPlanarPath);
}
