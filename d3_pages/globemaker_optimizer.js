/* takes skeletonNode and returns array of parameters to optimize */
function packSkeletonNode(node) {
    result = [];

    if(node.type === 'line') {
        result.push(node.length);
        result.push(node.strength);
    } else if(node.type === 'move' || node.type === 'moveOnPlane') {
        result.push(node.length);
    } else if(node.type === 'rotate') {
        result.push(node.theta);
    }

    node.children.forEach(c => result = result.concat(packSkeletonNode(c)));

    return result;
}

/* takes skeleton and returns array of parameters to optimize */
function packSkeleton(skeleton) {
    let result = [];
    result.push(skeleton.scale);
    result = result.concat(packSkeletonNode(skeleton.parentNode));
    return result;
}


/* takes parameters and updates relevant parts of the skeleton
 * returns number of parameters used up
 */
function unpackSkeletonNode(parameters, node) {
    idx = 0;

    if(node.type === 'line') {
        node.length = parameters[idx++];
        node.strength = parameters[idx++];
    } else if(node.type === 'move' || node.type === 'moveOnPlane') {
        node.length = parameters[idx++];
    } else if(node.type === 'rotate') {
        node.theta = parameters[idx++];
    }

    node.children.forEach(c => idx += unpackSkeletonNode(parameters.slice(idx), c));

    return idx;
}

function unpackSkeleton(parameters, skeleton) {
    skeleton.scale = parameters[0];

    unpackSkeletonNode(parameters.slice(1), skeleton.parentNode);

    skeleton.init();
}

/* f - cost function - (number[]) => number
 * initialParams - where to start - number[]
 * steps - num of iterations - number
 * returns - optimized parameters - number[]
 */
function minimizeByGradientDescent(f, initialParams, steps) {
    if (steps === undefined) steps = 100;
    const parameters = initialParams.slice();
    let stepScale = initialParams.map(n => 0.1);
    for (let step = 0; step < steps; step++) {
        if (!stepScale.some(s => s > 1e-4)) break;
        console.log( 'f = ' + f(parameters));
        for (let i = 0; i < parameters.length; i++) {
            const parametersCopy = parameters.slice();
            // find which way down
            const fHere = f(parametersCopy);
            parametersCopy[i] = parameters[i] + stepScale[i];
            const fPlus = f(parametersCopy);
            parametersCopy[i] = parameters[i] - stepScale[i];
            const fMinus = f(parametersCopy);
            // move in the down direction
            if (fPlus < fHere) {
                parameters[i] += stepScale[i];
                stepScale[i] *= 1.1;
            } else if (fMinus < fHere) {
                parameters[i] -= stepScale[i];
                stepScale[i] *= 1.1;
            } else {
                stepScale[i] *= 0.5;
            }
        }
    }
    console.log( 'final f = ' + f(parameters));
    console.log('final params = ' + parameters);
    return parameters;
}

function neighborIndices(x, y, width, height) {
    let result = []
    if (x > 0 && y > 0) result.push([x-1, y-1]);
    if (x > 0 && y < height-1) result.push([x-1, y+1]);
    if (x < width-1 && x > 0) result.push([x+1, y-1]);
    if (x < width-1 && x < height-1) result.push([x+1, y+1]);

    return result;
}

function calcDistanceMap(pixelArray, width, height) {
    // find indices of all 'in' (black) pixels
    let activePixelIndices = [];
    for (let y=0; y<height; y++)
        for (let x = 0; x < width; x++)
            if (pixelArray[y * width + x] === 0)
                activePixelIndices.push([x, y]);

    while (activePixelIndices.length > 0) {
        let nextPixels = [];
        activePixelIndices.forEach(ap => {
            let apI = ap[1] * width + ap[0];
            if (pixelArray[apI] < 254) {
                neighborIndices(ap[0], ap[1], width, height).forEach(n => {
                    let nI = n[1] * width + n[0];
                    if(pixelArray[nI] > pixelArray[apI] + 1) {
                        pixelArray[nI] = pixelArray[apI] + 1
                        nextPixels.push(n);
                    }
                });
            }
        });

        // setup next step
        activePixelIndices = nextPixels.slice();  // not sure if slice is necessary
    }
}

function calcCost(skeleton, targetPixels, width, height, parameters) {
    unpackSkeleton(parameters, skeleton);

    // generate actualPixels with distance map
    let actualPixels = [];
    for(let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            actualPixels.push(skeleton.colorOfCoordinate(x - width / 2, y - height / 2) === 'white' ? 255 : 0);
        }
    }
    calcDistanceMap(actualPixels, width, height);

    let error = 0;
    for(let y = 0; y < height; y++) {
        for(let x=0; x < width; x++) {
            let target = targetPixels[y* width + x];
            let actual = actualPixels[y* width + x];
            if (target === 0 || actual === 0) error += actual + target;
        }
    }
    return error;
}

function optimizeSkeleton(skeleton, targetImage, displaySize) {
    // generate target pixels with distance gradient
    let targetPixels = [];
    for(let y=0; y<targetImage.height; y++) {
        for(let x=0; x<targetImage.width; x++) {
            targetPixels.push(targetImage.pixel(x, y));
        }
    }
    calcDistanceMap(targetPixels, targetImage.width, targetImage.height);

    // our skeleton is scaled to a display size.  our target image has it's own size
    skeleton.scale *= targetImage.width / displaySize;
    let costFunction = p => calcCost(skeleton, targetPixels, target.width, target.height, p);
    let initialParams = packSkeleton(skeleton);

    minimizeByGradientDescent(costFunction, initialParams, 50);
    skeleton.scale *= displaySize / targetImage.width;
}


function getRandomSkeleton(numPoints, scale) {
    /* initialize random points on sphere */
    let points = [];
    for (let i = 0; i < numPoints; i++) {
        points.push({
            pos: DMSLib.Point3D.random(1.0).normalized(),
            neighbors: [],
            subTree: i
        });
    }

    /* create spanning tree */
    while (points.some(p => p.subTree !== points[0].subTree)) {
        // find points I, J with the shortest distance between two points not in the same subtree, and connect them
        let bestDist = 20; // big number
        let [I, J] = [-1, -1];
        for (let i = 0; i < numPoints; i++) {
            let pI = points[i];
            for (let j = i + 1; j < numPoints; j++) {
                let pJ = points[j];
                let dist = DMSLib.Point3D.angle(pI.pos, DMSLib.Point3D.origin(), pJ.pos);
                if(dist < 0)
                    console.log('hey');
                if (pI.subTree != pJ.subTree && dist < bestDist) {
                    bestDist = dist;
                    [I, J] = [i, j];
                }
            }
        }
        points.filter(p => p.subTree === points[J].subTree).forEach(p => p.subTree = points[I].subTree);
        points[J].neighbors.push(I);
        points[I].neighbors.push(J);
    }

    /* descend through tree and build up skeleton*/
    let visited = [0];
    let skel = new Skeleton(scale);
    skel.rotate(points[0].pos.theta() / Math.PI);
    skel.move(points[0].pos.phi() / Math.PI);

    // skel has just arrived at thisPoint (from prevPos)
    let doNode = function(skel, prevPos, thisPoint) {
        visited.push(thisPoint);
        let children = points[thisPoint].neighbors.filter(n => !visited.includes(n));
        children.forEach(c => {
            skel.push();

            let rotAmount = DMSLib.Point3D.sphereDeflection(prevPos, points[thisPoint].pos, points[c].pos);
            let lineAmount = DMSLib.Point3D.angle(points[thisPoint].pos, DMSLib.Point3D.origin(), points[c].pos);
            skel.rotate(rotAmount / Math.PI);
            skel.line(lineAmount / Math.PI, 1.0);

            doNode(skel, points[thisPoint].pos, c);
            skel.pop();
        });
    };

    doNode(skel, DMSLib.Point3D.zAxis(), 0);

    return skel;
}
