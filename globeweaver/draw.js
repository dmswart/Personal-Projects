// ---- get your global variables here ----
let gSphereSvg = null;
let gPlaneSvg = null;
let gSvgHeight = null;
let gSphereRotation = new DMSLib.Rotation();
let gDrawingIntersectionsOnSphere = true;

let darkIndigo = '#323369';

function onSphereSvgClicked() {
    let coordinates= d3.mouse(this);
    var x = coordinates[0] - gSvgHeight/2; // subtract off x,y of top left of image
    var y = coordinates[1] - gSvgHeight/2;

    incrementalRotation = DMSLib.Rotation.fromAngleAxis(DMSLib.TAU/12.0, new DMSLib.Point3D(-y, -x, 0))
    gSphereRotation = incrementalRotation.combine(gSphereRotation);
    drawPathOnSphere(gSpherePath);

    if(typeof gIntersectionList !== 'undefined') {
        drawIntersectionsOnSphere(gIntersectionList);
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
        .attr('opacity', '0.4')
        .attr('fill', '#f8e0d7');
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

enableIntersectionsOnSphere = function(enable) {
    gDrawingIntersectionsOnSphere = enable;
}

function colorRamp(idx, total, muted = false) {
    let x = Math.floor(idx/total)

    // go from 0 = #ed913e // via 0.5 = #934E6A // to 1 = #38396f if(x < 0.5) {
    let zeroColor = [237, 145, 62];
    let midColor  = [147, 78, 106];
    let endColor  = [56, 57, 97];

    // interpolate rgb values using the value x
    if(x < 0.5) {
        // interpolate between zeroColor and midColor using (x*2)
        r = Math.floor(zeroColor[0] + (midColor[0]-zeroColor[0]) * (idx/(total/2)));
        g = Math.floor(zeroColor[1] + (midColor[1]-zeroColor[1]) * (idx/(total/2)));
        b = Math.floor(zeroColor[2] + (midColor[2]-zeroColor[2]) * (idx/(total/2)));
    } else {
        // interpolate between midColor and endColor using ((x-0.5)*2)
        r = Math.floor(midColor[0] + (endColor[0]-midColor[0]) * ((idx - total/2)/(total/2)));
        g = Math.floor(midColor[1] + (endColor[1]-midColor[1]) * ((idx - total/2)/(total/2)));
        b = Math.floor(midColor[2] + (endColor[2]-midColor[2]) * ((idx - total/2)/(total/2)));
    }

    if(muted) {
        // we want a color a certain percentage closer to our background color of rgb(240, 230, 220)
        let percentage = 0.5;
        r = Math.floor((r * (1 - percentage)) + (240 * percentage));
        g = Math.floor((g * (1 - percentage)) + (230 * percentage));
        b = Math.floor((b * (1 - percentage)) + (220 * percentage));
    }
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}


function drawPathOnPlane(path) {
    // if the variable PLANE_SCALE is defined, use it to scale the points
    if(typeof PLANE_SCALE === 'undefined') {
        PLANE_SCALE = 1.0;
    }

    gPlaneSvg.selectAll('.planePath').remove();
    for(let i=0; i<path.length; i++) {
        let x = path[i].x * PLANE_SCALE;
        let y = path[i].y * PLANE_SCALE;
        let color = colorRamp(i, path.length);

        // draw a line segment on the plane
        if(i < path.length - 1) {
            nextX= path[i+1].x * PLANE_SCALE;
            nextY= path[i+1].y * PLANE_SCALE;
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
        let center = node.orientation.apply(DMSLib.Point3D.zAxis());
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
