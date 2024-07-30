// ---- get your global variables here ----
let gSphereSvg = null;
let gPlaneSvg = null;
let gSvgHeight = null;
let gSphereRotation = new DMSLib.Rotation();

function increasePoints() {
    gSpherePath = redistributePoints(gSpherePath, 1.3);
    gSpherePath = smoothPath(gSpherePath);
    gPlanarPath = toPlanarPath(gSpherePath);
}

function onSphereSvgClicked() {
    let coordinates= d3.mouse(this);
    var x = coordinates[0] - gSvgHeight/2; // subtract off x,y of top left of image
    var y = coordinates[1] - gSvgHeight/2;

    incrementalRotation = DMSLib.Rotation.fromAngleAxis(DMSLib.TAU/12.0, new DMSLib.Point3D(y, x, 0))
    gSphereRotation = incrementalRotation.combine(gSphereRotation);
    drawPathOnSphere(gSpherePath);
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
        .attr('opacity', '0.4')
        .attr('fill', 'silver');

    getRandomPath();
}

function colorRamp(idx, total) {
    gray = Math.floor(idx/total * 255)
    return 'rgb(255,' + (255-gray) + ',' + gray + ')';
}

function drawPathOnPlane(path, planeScale) {
    gPlaneSvg.selectAll('circle').remove();
    gPlaneSvg.selectAll('path').remove();
    pathString = '';
    for(let i=0; i<path.length; i++) {
        let x = path[i].x * planeScale;
        let y = path[i].y * planeScale;
        pathString += (i?'L':'M') + x + ' ' + y;

        gPlaneSvg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 3)
            .attr('fill', colorRamp(i, path.length));
    }
     
    gPlaneSvg.append('path')
        .attr('stroke-width', 1)
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('d', pathString);
}

function drawPathOnSphere(path) {
    gSphereSvg.selectAll('circle').remove();
    gSphereSvg.selectAll('path').remove();

    let pathString = '';
    let lastZ = -1; // fake previous point with negative z
    for (let i=0; i<path.length; i++) {
        let [x, y, z] = imgXYZFrom3D(path[i]);

        if(z >= -0.01) {
            pathString += (lastZ >= 0.0) ? 'L' : 'M'; 
            pathString += x + ' ' + y;

            gSphereSvg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 3)
            .attr('fill', colorRamp(i, path.length));
        }

        lastZ = z; // for next time
    }

    gSphereSvg.append('path')
        .attr('stroke-width', 1)
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('d', pathString);
}

function imgXYZFrom3D(pt3D) {
    pt3D = gSphereRotation.apply(pt3D.normalized());
    x = -pt3D.x * gSvgHeight/2 + gSvgHeight/2;
    y = pt3D.y * gSvgHeight/2 + gSvgHeight/2;
    return [x, y, pt3D.z];
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