const PLANE_WIDTH = 45*17;
const PLANE_HEIGHT = 45*11;
const PLANE_BUFFER = 50;

// ---- get your global variables here ----
let gSphereSvg = null;
let gPlaneSvg = null;
let gSvgHeight = null;
let gSphereRotation = new DMSLib.Rotation();

let gPlaneScale = 75;

let gDrawingIntersectionsOnSphere = true;
let gDrawingCrossingDiagram = false;

let darkIndigo = '#323369';
let paper = '#f2eee8';

function onSphereSvgClicked() {
    let coordinates= d3.mouse(this);
    var x = coordinates[0] - gSvgHeight/2; // subtract off x,y of top left of image
    var y = coordinates[1] - gSvgHeight/2;

    incrementalRotation = DMSLib.Rotation.fromAngleAxis(DMSLib.TAU/12.0, new DMSLib.Point3D(-y, -x, 0))
    gSphereRotation = incrementalRotation.combine(gSphereRotation);
    drawPathOnSphere(gSpherePath);

    if(typeof gIntersectionList !== 'undefined') {
        drawIntersectionsOnSphere(gIntersectionList);
        drawCrossingDiagram(gIntersectionList);
    }   
}

function initializeSvgs(width, height) {
    gSvgHeight = height;

    gSphereSvg = d3.select('#sphere').append('svg')
        .style('margin', '5px')
        .attr('width', height) // we want a square
        .attr('height', height);
    gSphereSvg.append('image')
        .attr('id', 'sphereImage')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('xlink:href', 'sphere.png')
        .on('click', onSphereSvgClicked);
    gSphereSvg.append('circle')
        .attr('cx', height/2)
        .attr('cy', height/2)
        .attr('r', height/2-0.25)
        .attr('stroke-width', 0.5)
        .attr('stroke', 'black')
        .attr('fill', 'none');

    gPlaneSvg = d3.select('#plane').append('svg')
        .attr('id', 'planarSvg')
        .style('margin', '5px')
        .attr('width', width)
        .attr('height', height);
    gPlaneSvg.append('rect')
        .attr('id', 'canvas')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('stroke-width', 1)
        .attr('stroke', 'black')
        .attr('fill', paper);

}

// returns the object that got drawn if it's ever needed (otherwise null)
drawArrowHeadOnSphere = function(pt3D, radius, color, className, titleText) {
    let obj = null;
    let [x, y, z] = imgXYZFrom3D(pt3D);
    if(z >= -0.01) {
        obj = gSphereSvg.append('circle')
            .classed(className, true)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', radius)
            .attr('fill', color)
            .attr('stroke', darkIndigo)
            .attr('stroke-width', 1.5)
        obj.append('title').text(titleText);
    }
    return obj;
}

function onShowIntersectionPointsChange(checked) {
    gDrawingIntersectionsOnSphere = checked;
    outputPath();
}

function onShowCrossingDiagramChange(isChecked) {
    gDrawingCrossingDiagram = isChecked;
    outputPath();
}

function colorRamp(idx, total, muted = false) {
    let x = idx/total;

    let zeroColorString = '#ed913e';
    let midColorString = '#934E6A';
    let endColorString = '#1a419c';

    let zeroColor = [parseInt(zeroColorString.slice(1, 3), 16),
                     parseInt(zeroColorString.slice(3, 5), 16),
                     parseInt(zeroColorString.slice(5, 7), 16)];
    let midColor  = [parseInt(midColorString.slice(1, 3), 16),
                     parseInt(midColorString.slice(3, 5), 16),
                     parseInt(midColorString.slice(5, 7), 16)];
    let endColor  = [parseInt(endColorString.slice(1, 3), 16),
                    parseInt(endColorString.slice(3, 5), 16),
                    parseInt(endColorString.slice(5, 7), 16)];
                    

    // interpolate rgb values using the value x
    if(x < 0.5) {
        // interpolate between zeroColor and midColor using (x*2)
        r = Math.floor(zeroColor[0] + (midColor[0]-zeroColor[0]) * x*2);
        g = Math.floor(zeroColor[1] + (midColor[1]-zeroColor[1]) * x*2);
        b = Math.floor(zeroColor[2] + (midColor[2]-zeroColor[2]) * x*2);
    } else {
        // interpolate between midColor and endColor using ((x-0.5)*2)
        r = Math.floor(midColor[0] + (endColor[0]-midColor[0]) * ((x-0.5)*2));
        g = Math.floor(midColor[1] + (endColor[1]-midColor[1]) * ((x-0.5)*2));
        b = Math.floor(midColor[2] + (endColor[2]-midColor[2]) * ((x-0.5)*2));
    }

    if(muted) {
        // we want a color a certain percentage closer to our background color of our background paper 
        let percentage = 0.5;
        let paperColor = [parseInt(paper.slice(1, 3), 16),
                         parseInt(paper.slice(3, 5), 16),
                         parseInt(paper.slice(5, 7), 16)]; 
        r = Math.floor((r * (1 - percentage)) + (paperColor[0] * percentage));
        g = Math.floor((g * (1 - percentage)) + (paperColor[1] * percentage));
        b = Math.floor((b * (1 - percentage)) + (paperColor[2] * percentage));
    }
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}


function drawPathOnPlane(path) {
    gPlaneSvg.selectAll('.planePath').remove();
    for(let i=0; i<path.length; i++) {
        let x = path[i].x * gPlaneScale;
        let y = path[i].y * gPlaneScale;
        let color = colorRamp(i, path.length);

        // draw a line segment on the plane
        if(i < path.length - 1) {
            nextX= path[i+1].x * gPlaneScale;
            nextY= path[i+1].y * gPlaneScale;
            gPlaneSvg.append('line')
                .classed('planePath', true)
                .attr('x1', nextX)
                .attr('y1', nextY)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke-width', 3)
                .attr('stroke', color);
        }

        gPlaneSvg.append('circle')
            .classed('planePath', true)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 3)
            .attr('stroke-width', 1)
            .attr('stroke', color)
            .attr('fill', 'white');
    }
}

function drawPathOnSphere(path) {
    gSphereSvg.selectAll('.spherePath').remove();
    gSphereSvg.selectAll('.intersectionPath').remove();

    let pathString = '';
    for (let i=0; i<path.length; i++) {
        let [x, y, z] = imgXYZFrom3D(path[i]);
        let color = colorRamp(i, path.length, gDrawingIntersectionsOnSphere);

        if(z < -0.01) continue; // skip points on back side of sphere

        // draw a line segment on the sphere if we can
        if(i < path.length - 1) {
            let [nextX, nextY, nextZ] = imgXYZFrom3D(path[i+1]);
            if(nextZ >= -0.01) {
                gSphereSvg.append('line')
                    .classed('spherePath', true)
                    .attr('x1', nextX)
                    .attr('y1', nextY)
                    .attr('x2', x)
                    .attr('y2', y)
                    .attr('stroke-width', 3)
                    .attr('stroke', color);
            }
        }

        gSphereSvg.append('circle')
            .classed('spherePath', true)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 3)
            .attr('stroke-width', 1)
            .attr('stroke', color)
            .attr('fill', 'white');
    }
}

function imgXYZFrom3D(pt3D) {
    pt3D = gSphereRotation.apply(pt3D.normalized());
    x = pt3D.x * gSvgHeight/2 + gSvgHeight/2;
    y = -pt3D.y * gSvgHeight/2 + gSvgHeight/2;
    return [x, y, pt3D.z];
}

addOnClickHandler = function(d3Element, nodeIdx, armIdx) {
    if(!d3Element) return;
    d3Element.on('click', () => {
        d3.select('#scratchNode').property('value', nodeIdx);
        d3.select('#scratchArm').property('value', armIdx);
    });
}

drawIntersectionsOnSphere = function(intersectionList) {
    gSphereSvg.selectAll('.intersectionPath').remove();
    if(!gDrawingIntersectionsOnSphere) return;
    intersectionList.nodes.forEach((node, nodeIdx) => {
        armColors = [darkIndigo, 'white']
        node.arms.forEach((arm, armIdx) => {
            let inPoint, outPoint;
            if(arm.pointAlongArm === undefined) {
                let [x, y, z] = [0, Math.sin(5*DMSLib.TAU/360), Math.cos(5*DMSLib.TAU/360)];
                if(!arm.dirIsPositive) y = -y;
                if(armIdx == 1) [x, y] = [y, x];
                outPoint = node.orientation.apply(new DMSLib.Point3D(x, y, z));
                inPoint = node.orientation.apply(new DMSLib.Point3D(-x, -y, z));
            } else {
                inPoint = arm.inPoint();
                outPoint= arm.outPoint();
            }

            // build path string
            let pathString = 'M';
            for(let x = 0; x < 30; x ++) {
                let ptA = inPoint.add(outPoint.sub(inPoint).mul(x/30)).normalized();
                let [xA, yA, zA] = imgXYZFrom3D(ptA);
                if(zA >= -0.01) {
                    // if last character of pathstring is not 'M'
                    if(pathString[pathString.length - 1] != 'M') pathString += 'L';
                    pathString += xA + ' ' + yA 
                } else {
                    if(pathString[pathString.length - 1] != 'M') pathString += 'M';
                }
            }
            // if pathString ends with M, remove it
            if(pathString[pathString.length - 1] == 'M') {
                pathString = pathString.slice(0, -1);
            }

            gSphereSvg.append('path')
                .classed('intersectionPath', true)
                .attr('stroke-linecap', 'round')
                .attr('stroke-width', 5)
                .attr('stroke', darkIndigo)
                .attr('fill', 'none')
                .attr('d', pathString);

            gSphereSvg.append('path')
                .classed('intersectionPath', true)
                .attr('stroke-linecap', 'round')
                .attr('stroke-width', 2.5)
                .attr('stroke', armColors[armIdx])
                .attr('fill', 'none')
                .attr('d', pathString);

            let obj = drawArrowHeadOnSphere(outPoint, 8, armColors[armIdx], 'intersectionPath', 
                'Node ' + nodeIdx + ' Arm ' + armIdx, true);
            obj = addOnClickHandler(obj, nodeIdx, armIdx);
        });
    });
}

// crossing diagram: alternate showing / not showing the arms as they connect
function drawCrossingDiagram(intersectionList) {
    gSphereSvg.selectAll('.crossingDiagram').remove();
    if(!gDrawingCrossingDiagram) return;

    let currentNodeIdx = 0;
    let currentArmIdx = 0;
    let showArm = false;

    while(true) {
        let currentArm = intersectionList.nodes[currentNodeIdx].arms[currentArmIdx];
        if(showArm) {
            // draw arm on sphere just like for draw intersections on sphere
            let ptA = currentArm.inPoint();
            let ptB = currentArm.surfacePoint();
            let ptC = currentArm.outPoint();
            let [xA, yA, zA] = imgXYZFrom3D(ptA);
            let [xB, yB, zB] = imgXYZFrom3D(ptB);
            let [xC, yC, zC] = imgXYZFrom3D(ptC);
            if(zA >= -0.01 && zB >= -0.01) {
                gSphereSvg.append('line')
                    .classed('crossingDiagram', true)
                    .attr('x1', xA)
                    .attr('y1', yA)
                    .attr('x2', xB)
                    .attr('y2', yB)
                    .attr('stroke-width', 5)
                    .attr('stroke', 'red');
            }
            if(zB >= -0.01 && zC >= -0.01) {
                gSphereSvg.append('line')
                    .classed('crossingDiagram', true)
                    .attr('x1', xB)
                    .attr('y1', yB)
                    .attr('x2', xC)
                    .attr('y2', yC)
                    .attr('stroke-width', 5)
                    .attr('stroke', 'red');
            }

            // draw 'arrowhead' at outpoint 
            if(zC >= -0.01) {
                drawArrowHeadOnSphere(ptC, 8, 'red', 'crossingDiagram', '');
            }

            // draw node idx at intersection (ptB)
            if(zB >= -0.01) {
                // first draw a white translucent dot behind the text to make it more visible
                gSphereSvg.append('circle')
                    .classed('crossingDiagram', true)
                    .attr('cx', xB)
                    .attr('cy', yB)
                    .attr('r', 15)
                    .attr('fill', 'white');
                gSphereSvg.append('text')
                    .classed('crossingDiagram', true)
                    .attr('x', xB)
                    .attr('y', yB)
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'middle')
                    .attr('font-size', 24)
                    .attr('font-family', 'sans-serif')
                    .attr('fill', 'black')
                    .text(currentNodeIdx);
            }
        }

        // get ready for next!
        showArm  = !showArm;
        currentNodeIdx = currentArm.nextNode;
        currentArmIdx = currentArm.nextDir;
        if(currentNodeIdx == 0 && currentArmIdx == 0) break;
    }
}

function savePlaneSvgToFile(filename) {
    //get svg element.
    let svg = document.getElementById("planarSvg");

    //get svg source.
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svg);

    //add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;


    // save the svg via user download
    const element = document.createElement('a');
    element.setAttribute('href', 'data: text/json;charset=utf-8,' + encodeURIComponent(source));
    element.setAttribute('download', filename + '.svg');
    //document.body.appendChild(element); // required for Firefox
    element.click();
    element.remove();
}
