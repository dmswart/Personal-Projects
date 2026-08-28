(function () {
  'use strict';

  var VIEW = 500;
  var SOURCE_BOX = { x: 40, y: 40, width: VIEW - 80, height: VIEW - 80 };
  var DEST_CENTER = { x: VIEW / 2, y: VIEW / 2 };
  var DEST_RADIUS = (VIEW - 80) / 2;

  // Downloaded result resolution is independent of on-screen size (CSS scales
  // the canvas down to fit its panel) -- render bigger for a sharper download.
  var RESULT_TARGET = 1500;
  var RESULT_SCALE = RESULT_TARGET / (VIEW - 80);

  // Largest box of the given aspect ratio (width / height) centered inside `outer`.
  function fitBoxToAspect(outer, aspect) {
    var width = outer.width, height = outer.height;
    if (width / height > aspect) width = height * aspect;
    else height = width / aspect;
    return {
      x: outer.x + (outer.width - width) / 2,
      y: outer.y + (outer.height - height) / 2,
      width: width, height: height
    };
  }

  var el = {};
  [
    'sourceShapeType', 'silhouetteControls', 'silhouetteFile', 'silhouetteInvert',
    'gridRows', 'gridCols', 'destShapeType', 'polygonControls', 'polygonSides',
    'buildBtn', 'convThreshold', 'maxIterations', 'goBtn', 'cancelBtn', 'status',
    'mapImageFile', 'mapReverse', 'mapBtn', 'downloadLink', 'sourceSvg', 'destSvg', 'resultCanvas'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  var svgSource = d3.select(el.sourceSvg).attr('viewBox', '0 0 ' + VIEW + ' ' + VIEW);
  var svgDest = d3.select(el.destSvg).attr('viewBox', '0 0 ' + VIEW + ' ' + VIEW);

  var state = {
    mesh: null,
    boundaryShape: null,
    destUpdater: null,
    worker: null,
    silhouetteDataUrl: null,
    meshBox: SOURCE_BOX
  };

  function setStatus(text) { el.status.textContent = text; }

  function showHideControls() {
    el.silhouetteControls.hidden = el.sourceShapeType.value !== 'silhouette';
    el.polygonControls.hidden = el.destShapeType.value !== 'polygon';
  }
  el.sourceShapeType.addEventListener('change', showHideControls);
  el.destShapeType.addEventListener('change', showHideControls);
  showHideControls();

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () { resolve({ img: img, dataUrl: reader.result }); };
        img.onerror = function () { reject(new Error('Could not decode image.')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('Could not read file.')); };
      reader.readAsDataURL(file);
    });
  }

  function buildBoundaryShapeSpec() {
    if (el.destShapeType.value === 'circle') {
      return { type: 'circle', cx: DEST_CENTER.x, cy: DEST_CENTER.y, radius: DEST_RADIUS };
    }
    var sides = Math.max(3, parseInt(el.polygonSides.value, 10) || 6);
    return {
      type: 'polygon', cx: DEST_CENTER.x, cy: DEST_CENTER.y,
      radius: DEST_RADIUS, sides: sides, rotation: -Math.PI / 2
    };
  }

  function resetRunUi() {
    el.goBtn.disabled = false;
    el.cancelBtn.disabled = true;
    el.mapBtn.disabled = true;
    el.downloadLink.hidden = true;
  }

  async function buildMesh() {
    if (state.worker) {
      state.worker.terminate();
      state.worker = null;
    }
    var rows = Math.max(2, parseInt(el.gridRows.value, 10) || 30);
    var cols = Math.max(2, parseInt(el.gridCols.value, 10) || 30);
    var valid;
    state.silhouetteDataUrl = null;

    var meshBox = SOURCE_BOX;
    if (el.sourceShapeType.value === 'silhouette') {
      if (!el.silhouetteFile.files[0]) {
        alert('Please choose a silhouette image first.');
        return;
      }
      var loaded = await loadImage(el.silhouetteFile.files[0]);
      valid = WPN.MeshUtil.sampleSilhouette(loaded.img, rows, cols, el.silhouetteInvert.checked);
      state.silhouetteDataUrl = loaded.dataUrl;
    } else {
      valid = WPN.MeshUtil.allValid(rows, cols);
      // Fit a rectangle of aspect (cols-1):(rows-1) so grid cells are square,
      // instead of always squashing the grid into a square box.
      meshBox = fitBoxToAspect(SOURCE_BOX, (cols - 1) / (rows - 1));
    }

    var mesh = new WPN.Mesh(rows, cols, valid);
    if (mesh.validIndices.length === 0) {
      alert('No valid grid points found. If using a silhouette, try toggling Invert.');
      return;
    }

    var boundaryShape = WPN.Geometry.makeBoundaryShape(buildBoundaryShapeSpec());
    WPN.MeshUtil.computeInitialPlacement(mesh, boundaryShape, meshBox);

    state.mesh = mesh;
    state.boundaryShape = boundaryShape;
    state.meshBox = meshBox;

    WPN.Draw.renderSourcePanel(svgSource, mesh, meshBox, { silhouetteImage: state.silhouetteDataUrl });
    state.destUpdater = WPN.Draw.renderDestPanel(svgDest, mesh, boundaryShape);

    resetRunUi();
    setStatus('Mesh built: ' + mesh.validIndices.length + ' points. Ready to run.');
  }

  el.buildBtn.addEventListener('click', function () {
    buildMesh().catch(function (err) {
      console.error(err);
      alert('Failed to build mesh: ' + err.message);
    });
  });

  function startWorker() {
    if (!state.mesh) return;
    var mesh = state.mesh;

    var worker;
    try {
      worker = new Worker('js/worker.js');
    } catch (err) {
      setStatus('Could not start a Web Worker (' + err.message + '). Serve this folder over http:// (not file://) and try again.');
      return;
    }
    state.worker = worker;

    var options = {
      batchSize: 10000,
      convergenceThreshold: parseFloat(el.convThreshold.value) || 1.0,
      maxIterations: parseInt(el.maxIterations.value, 10) || 2000000
    };

    worker.onmessage = function (e) {
      var msg = e.data;
      if (msg.type === 'progress') {
        mesh.x = new Float64Array(msg.x);
        mesh.y = new Float64Array(msg.y);
        WPN.Draw.updateDestPanel(state.destUpdater, mesh);
        setStatus('Iterating... ' + msg.iterations.toLocaleString() + ' iterations, C=' + msg.C.toFixed(3));
      } else if (msg.type === 'done') {
        mesh.x = new Float64Array(msg.x);
        mesh.y = new Float64Array(msg.y);
        WPN.Draw.updateDestPanel(state.destUpdater, mesh);
        var reasonText = {
          converged: 'Converged', cancelled: 'Cancelled', maxIterations: 'Stopped (max iterations reached)'
        }[msg.reason] || msg.reason;
        setStatus(reasonText + ' after ' + msg.iterations.toLocaleString() + ' iterations, C=' + msg.C.toFixed(3) + '.');
        el.goBtn.disabled = false;
        el.cancelBtn.disabled = true;
        el.mapBtn.disabled = false;
        worker.terminate();
        state.worker = null;
      } else if (msg.type === 'error') {
        setStatus('Error: ' + msg.message);
        el.goBtn.disabled = false;
        el.cancelBtn.disabled = true;
        worker.terminate();
        state.worker = null;
      }
    };
    worker.onerror = function (err) {
      setStatus('Worker error: ' + err.message + '. Serve this folder over http:// (not file://) and try again.');
      el.goBtn.disabled = false;
      el.cancelBtn.disabled = true;
      state.worker = null;
    };

    var validBuf = mesh.valid.slice().buffer;
    var xBuf = mesh.x.slice().buffer;
    var yBuf = mesh.y.slice().buffer;
    var thetaBuf = mesh.theta.slice().buffer;
    var rBuf = mesh.r.slice().buffer;

    worker.postMessage({
      type: 'start', rows: mesh.rows, cols: mesh.cols,
      valid: validBuf, x: xBuf, y: yBuf, theta: thetaBuf, r: rBuf,
      boundaryShape: buildBoundaryShapeSpec(), options: options
    }, [validBuf, xBuf, yBuf, thetaBuf, rBuf]);

    el.goBtn.disabled = true;
    el.cancelBtn.disabled = false;
    el.mapBtn.disabled = true;
    setStatus('Running...');
  }
  el.goBtn.addEventListener('click', startWorker);

  el.cancelBtn.addEventListener('click', function () {
    if (state.worker) {
      state.worker.postMessage({ type: 'cancel' });
      setStatus('Cancelling...');
    }
  });

  el.mapBtn.addEventListener('click', async function () {
    if (!el.mapImageFile.files[0]) {
      alert('Choose an image to map onto the destination shape first.');
      return;
    }
    try {
      var loaded = await loadImage(el.mapImageFile.files[0]);
      var canvas = el.resultCanvas;
      if (el.mapReverse.checked) {
        // Read from an image assumed to fill the destination shape's own
        // bounding square, and draw onto the source grid's shape instead.
        var destBoxSize = 2 * DEST_RADIUS;
        var imgScale = { x: loaded.img.naturalWidth / destBoxSize, y: loaded.img.naturalHeight / destBoxSize };
        var destTopLeft = { x: DEST_CENTER.x - DEST_RADIUS, y: DEST_CENTER.y - DEST_RADIUS };
        canvas.width = Math.round((state.meshBox.width + 20) * RESULT_SCALE);
        canvas.height = Math.round((state.meshBox.height + 20) * RESULT_SCALE);
        var margin = 10 * RESULT_SCALE;
        var outBox = { x: margin, y: margin, width: state.meshBox.width * RESULT_SCALE, height: state.meshBox.height * RESULT_SCALE };
        WPN.ImageMap.warpImageToCanvas(loaded.img, state.mesh, outBox, canvas, imgScale, destTopLeft, true, 1.5 * RESULT_SCALE);
      } else {
        var viewSize = Math.round(2 * DEST_RADIUS) + 20;
        canvas.width = Math.round(viewSize * RESULT_SCALE);
        canvas.height = canvas.width;
        var offset = { x: DEST_CENTER.x - viewSize / 2, y: DEST_CENTER.y - viewSize / 2 };
        var sourceBox = { x: 0, y: 0, width: loaded.img.naturalWidth, height: loaded.img.naturalHeight };
        WPN.ImageMap.warpImageToCanvas(loaded.img, state.mesh, sourceBox, canvas, RESULT_SCALE, offset, false, 1.5 * RESULT_SCALE);
      }
      el.downloadLink.href = canvas.toDataURL('image/png');
      el.downloadLink.hidden = false;
    } catch (err) {
      console.error(err);
      alert('Failed to map image: ' + err.message);
    }
  });
})();
