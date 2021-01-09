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
    result.push(1.0); // multiplier for all line distances
    result = result.concat(packSkeletonNode(skeleton.parentNode));
    return result;
}


/* takes parameters and updates relevant parts of the skeleton
 * returns number of parameters used up
 */
function unpackSkeletonNode(parameters, node, lineMultiplier) {
    idx = 0;

    if(node.type === 'line') {
        node.length = parameters[idx++] * lineMultiplier;
        node.strength = parameters[idx++];
    } else if(node.type === 'move' || node.type === 'moveOnPlane') {
        node.length = parameters[idx++] * lineMultiplier;
    } else if(node.type === 'rotate') {
        node.theta = parameters[idx++];
    }

    node.children.forEach(c => idx += unpackSkeletonNode(parameters.slice(idx), c, lineMultiplier));

    return idx;
}

function unpackSkeleton(parameters, skeleton) {
    skeleton.scale = parameters[0];
    let lineMultiplier = parameters[1];

    unpackSkeletonNode(parameters.slice(2), skeleton.parentNode, lineMultiplier);

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
