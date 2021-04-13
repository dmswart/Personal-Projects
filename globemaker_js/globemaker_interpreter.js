const size = 720;      // size of image
let svg;               // d3 selection for base svg object
let skel = {scale: 72.0}; // dummy skeleton object, with how many pixels correspond to radian
let target = {};       // target image object
let source = {};       // source image object
let programSkeletons;

function setupPreview() {
    let transformString = 'scale(1, -1) translate(' + size/2 + ',' + (-size / 2) + ')';
    svg = d3.select('#grid').append('svg')
        .attr('width', size)
        .attr('height',size)
    svg.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('stroke-width', 1)
        .attr('opacity', '0.4')
        .attr('fill', 'silver');
    svg.append('g').attr('id', 'grid')
        .attr('transform', transformString)
        .attr('stroke', 'none');
    svg.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('stroke-width', 1)
        .attr('opacity', '0.4')
        .attr('fill', 'silver');
    svg.append('g').attr('id', 'lines')
        .attr('transform', transformString)
        // .attr('stroke', 'blue')
        // .attr('stroke-width', 2)
        .attr('stroke', 'yellow')
        .attr('stroke-width', 6)
        .attr('fill', 'none');
    svg.append('g').attr('id', 'moves')
        .attr('transform', transformString)
        .attr('stroke', 'gray')
        .attr('stroke-width', 1)
        .attr('fill', 'none');
    svg.append('g').attr('id', 'move_on_plane')
        .attr('transform', transformString)
        .attr('stroke', 'gray')
        .attr('stroke-width', 1)
        .attr('fill', 'none');
}

function updateLines(skel) {
    let selection = svg.select('#lines').selectAll('path')
        .data(skel.list('line'), d => d.id);
    selection.enter().append('path')
        .attr('d', d => 'M' + d.x1 + ',' + d.y1 + 'L' + d.x2 + ',' + d.y2);
    selection.exit().remove();
    selection
        .attr('d', d => 'M' + d.x1 + ',' + d.y1 + 'L' + d.x2 + ',' + d.y2);

    selection = svg.select('#lines').selectAll('circle')
        .data(skel.list('line'), d => d.id);
    selection.enter().append('circle')
        .attr('r', 3)
        .attr('cx', d => d.x2)
        .attr('cy', d => d.y2);
    selection.exit().remove();
    selection
        .attr('cx', d => d.x2)
        .attr('cy', d => d.y2);
}

function updateMoves(skel) {
    // moves on plane
    let selection = svg.select('#move_on_plane').selectAll('path')
        .data(skel.list('move_on_plane'), d => d.id);
    selection.enter().append('path')
        .attr('d', d => 'M' + d.x1 + ',' + d.y1 + 'L' + d.x2 + ',' + d.y2)
        .attr('stroke-dasharray', '3,3');
    selection.exit().remove();
    selection
        .attr('d', d => 'M' + d.x1 + ',' + d.y1 + 'L' + d.x2 + ',' + d.y2)

    selection = svg.select('#move_on_plane').selectAll('circle')
        .data(skel.list('move_on_plane'), d => d.id);
    selection.enter().append('circle')
        .attr('r', 1)
        .attr('fill', 'gray')
        .attr('cx', d => d.x2)
        .attr('cy', d => d.y2);
    selection.exit().remove();
    selection
        .attr('cx', d => d.x2)
        .attr('cy', d => d.y2);

    // normal moves
    selection = svg.select('#moves').selectAll('path')
        .data(skel.list('move'), d => d.id);
    selection.enter().append('path')
        .attr('d', d => 'M' + d.x1 + ',' + d.y1 + 'L' + d.x2 + ',' + d.y2);
    selection.exit().remove();
    selection
        .attr('d', d => 'M' + d.x1 + ',' + d.y1 + 'L' + d.x2 + ',' + d.y2);

    selection = svg.select('#moves').selectAll('circle')
        .data(skel.list('move'), d => d.id);
    selection.enter().append('circle')
        .attr('r', 1)
        .attr('fill', 'gray')
        .attr('cx', d => d.x2)
        .attr('cy', d => d.y2);
    selection.exit().remove();
    selection
        .attr('cx', d => d.x2)
        .attr('cy', d => d.y2);
}

function updateGrid(skel, density) {
    const gridData = [];
    for (let i = 0; i < density; i++) {
        for (let j = 0; j < density; j++) {
            let x = (i -(density/2)+ 0.5) * (size/density);
            let y = (j -(density/2)+ 0.5) * (size/density);
            gridData.push({
                x: x,
                y: y,
                color: skel.colorOfCoordinate(x, y, sourceColor).toString(),
                id: i * density + j});
        }
    }
    let selection = svg.select('#grid').selectAll('circle')
        .data(gridData, d => d.id);
    selection.enter().append('circle')
        .attr('r', 0.4 * size/density)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('fill', d => d.color);
    selection.exit().remove();
    selection
        .attr('r', 0.4 * size/density)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('fill', d => d.color);
}

function updateGUI(density = 100) {
    skel.init();
    d3.select('#input').property('value', serializeSkeleton(skel));
    updateLines(skel);
    updateMoves(skel);
    updateGrid(skel, density);
}

function newSkeleton(skeleton_def) {
    skel = new Skeleton(skel.scale);
    if(deserializeSkeleton(skeleton_def, skel)) {
        // input text box successfully parsed: white background
        d3.select('#input').attr('style', 'background-color:white');
        updateGUI();
    } else {
        // input text box unsuccessful: pink background
        d3.select('#input').attr('style', 'background-color:pink');
    }
}

/* Takes a file from file dialog event, a (typically hidden) html element id to store it in and
   an object {x: imgObject} to populate with an image (extends ImageArray) with the following fields
  name : filename
  width : width from ImageArray
  height : height from ImageArray
  data: data from ImageArray
  pixel(x, y) : function to get color of x, y
  fractionIn: number of  pixels */
function loadImage(selectedFile, htmlShowElementId, htmlDataElementId, img) {
    let imgshow = document.getElementById(htmlShowElementId);
    let imgdata = document.getElementById(htmlDataElementId);
    let reader = new FileReader();

    reader.onload = function(ev) {
        imgdata.onload = function() {
            let c = document.createElement('canvas');
            c.width = imgdata.width;
            c.height = imgdata.height;
            c.getContext('2d').drawImage(imgdata, 0, 0);

            // load into target object.  set some convenient properties
            imgData = c.getContext('2d').getImageData(0, 0, c.width, c.height);
            img.obj.data = imgData.data;
            img.obj.width = imgData.width;
            img.obj.height = imgData.height;
            img.obj.name = selectedFile.name;
            img.obj.pixel = function(x, y) {
              x = Math.floor(x);
              y = c.height - 1 - Math.floor(y); // we work in up is positive Y
              return this.data[y*this.width*4 + x*4];
            };
            img.obj.rgb = function(x, y) {
                x = Math.floor(x);
                y = c.height - 1 - Math.floor(y); // we work in up is positive Y
                return d3.rgb(
                    this.data[y * this.width * 4 + x * 4 + 0],
                    this.data[y * this.width * 4 + x * 4 + 1],
                    this.data[y * this.width * 4 + x * 4 + 2]
                );
            }

            let count = 0;
            for(let y = 0; y < img.obj.width; y++) {
                for (let x = 0; x < img.obj.height; x++) {
                    if( img.obj.pixel(x, y) === 0 ) count++;
                }
            }
            img.obj.fractionIn = count / (img.obj.width * img.obj.height);
        };
        imgshow.src = ev.target.result;
        imgdata.src = ev.target.result;
    };
    reader.readAsDataURL(selectedFile);
}

/* Load Target Image */
function onTargetSelected(ev) {
    loadImage(ev.target.files[0], 'targetPicture', 'targetData', {obj: target});
}

/* Load Source Image */
function onSourceSelected(ev) {
    loadImage(ev.target.files[0], 'sourcePicture', 'sourceData', {obj: source});
}

/* spherical color if we have a source image*/
function sourceColor(Q) {
    if(source.rgb === undefined) {
        // no source, return blue figure on white background
        return (Q === undefined) ? d3.rgb(0xff, 0xff, 0xff) : d3.rgb(0, 0, 0xb8);
    } else if (Q === undefined) {
        // with source, return grey background
        return d3.rgb(0x80, 0x80, 0x80);
    } else {
        // return color from source image
        let x = (1.0 - Q.theta() / DMSLib.TAU) * source.width;
        let y = Q.phi() / DMSLib.HALFTAU * source.height;
        return source.rgb(x, y);
    }
}


/* Save Result Image */
function saveImage(resolution) {
    // first get ppm image into string
    let content = 'P3 ' + resolution + ' ' + resolution + ' 255\n';

    for(let y = 0; y<resolution; y++) {
        for(let x = 0; x < resolution; x++) {
            let c = skel.colorOfCoordinate( (x -(resolution/2)+ 0.5) * (size/resolution),
                                            (-y +(resolution/2)+ 0.5) * (size/resolution),
                                            sourceColor);
            content += c.r + ' ';
            content += c.g + ' ';
            content += c.b + ' ';
        }
        content += '\n';
    }

    // get filename.
    const filename = (target && target.name) ? target.name.slice(0, -4) + '.pbm' : 'ouput.ppm';

    // save the file via user download
    const element = document.createElement('a');
    element.setAttribute('href', 'data: text/json;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    document.body.appendChild(element); // required for Firefox
    element.click();
    element.remove();
}

function optimizeToTarget() {
    optimizeSkeleton(skel, target, size);
    updateGUI();
}

function scaleFromTarget() {
    let resultSquared = 5184;  // 72 * 72
    if (target && target.fractionIn) {
        const fractionInForScale72 = 0.20;
        resultSquared *= target.fractionIn / fractionInForScale72;
    }
    return Math.sqrt(resultSquared);
}

function randomize() {
    // get fraction of pixels *in* in target
    skel = getRandomSkeleton(10, scaleFromTarget());
    updateGUI();
}


function TheProgram() {
    let candidates = [];

    // A) take top 10 of 100 random tests
    for(let i = 0; i<1000; i++) {
        console.log('A ' + i);
        let skel = getRandomSkeleton(8, scaleFromTarget());
        let cost = calcQuickCost(skel, target, size);
        candidates.push({skeleton: skel, cost: cost});
        if (candidates.length > 20) {
            let maxCost = Math.max(...candidates.map(c => c.cost));
            candidates = candidates.filter(c => c.cost < maxCost);
        }
    }

    // B) take top 5 after optimize at 50x50
    candidates.forEach((candidate, i) => {
        console.log('B ' + i);
        candidate.cost = optimizeSkeleton(candidate.skeleton, target, size, 2, 50);
    });
    candidates = candidates.sort((a, b) => a.cost - b.cost).slice(0, 5);

    // C) take best after optimize at 100x100
    candidates.forEach((candidate, i) => {
        console.log('C ' + i);
        candidate.cost = optimizeSkeleton(candidate.skeleton, target, size, 1, 50);
    });

    // final: sort and save the winners
    programSkeletons = candidates.sort((a, b) => a.cost - b.cost).map(c => c.skeleton);
    skel = programSkeletons[0];

    updateGUI();
}

function nextTheProgram() {
    if(programSkeletons) {
        programSkeletons = programSkeletons.slice(1).concat(programSkeletons[0])
        skel = programSkeletons[0];
        updateGUI();
    }
}

function scaleUp() {
    skel.multiplyLengths(1.05);
    updateGUI();
}

function scaleDown() {
    skel.multiplyLengths(1 / 1.05);
    updateGUI();
}

