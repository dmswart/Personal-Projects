const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
// warm ambient = sphere.png's shadow tone; the camera light adds the off-white highlight
scene.add(new THREE.AmbientLight(0xd9d1c5, 1.0));

const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
camera.position.set(0, 0, 3.5);
const sun = new THREE.DirectionalLight(0xffffff, 0.2);
sun.position.set(-1, 1, 1); // upper left, relative to the camera
camera.add(sun);
scene.add(camera);
const controls = new THREE.OrbitControls(camera, renderer.domElement);

const ui = {
  shape: document.getElementById('shape'),
  file: document.getElementById('file'),
  newLoop: document.getElementById('newLoop'),
  info: document.getElementById('info'),
  mode: document.getElementById('mode'),
  stepFrac: document.getElementById('stepFrac'),
  maxIters: document.getElementById('maxIters'),
  smooth: document.getElementById('smooth'),
  stepAvg: document.getElementById('stepAvg'),
  run: document.getElementById('run'),
  status: document.getElementById('status'),
};

let surface = null, topo = null, curve = null, opt = null;
const surfaceObj = new THREE.Mesh(undefined,
  new THREE.MeshPhongMaterial({ color: 0xf8f7f4, specular: 0x000000, shininess: 0, flatShading: true,
    polygonOffset: true, polygonOffsetFactor: 1 }));
const curveObj = new THREE.Group();
const lineMat = new THREE.LineBasicMaterial({ vertexColors: true });
const pointGeom = new THREE.SphereGeometry(0.01, 12, 8);
const pointMat = new THREE.MeshBasicMaterial();
scene.add(surfaceObj, curveObj);

function setSurface(geometries) {
  surface = makeSurface(geometries);
  topo = buildTopology(surface);
  surfaceObj.geometry.dispose();
  surfaceObj.geometry = surface;
  newCurve();
}

function newCurve() {
  stop();
  curve = initialLoop(surface, 100);
  drawCurve();
}

function stop() {
  opt = null;
  ui.run.textContent = 'Run';
}

ui.run.onclick = () => {
  if (opt) return stop();
  if (!curve) return;
  const m = MODES[modeKey];
  opt = new GradientFlow(topo, curve, typeof m.energy === 'function' ? m.energy(curve, topo) : m.energy, readOptions());
  ui.run.textContent = 'Stop';
};

// Options edited in a mode are remembered (for this page session) when switching away and back.
let modeKey = null;
const modeOptions = {};

function readOptions() {
  const o = {};
  for (const k of Object.keys(MODES[modeKey].options)) o[k] = ui[k].type === 'checkbox' ? ui[k].checked : +ui[k].value;
  return o;
}

function applyMode(key) {
  stop();
  if (modeKey) modeOptions[modeKey] = readOptions();
  modeKey = key;
  for (const [k, v] of Object.entries(modeOptions[key] ?? MODES[key].options)) {
    if (ui[k].type === 'checkbox') ui[k].checked = v;
    else ui[k].value = v;
  }
}

for (const [k, m] of Object.entries(MODES)) ui.mode.add(new Option(m.label, k));
ui.mode.onchange = () => applyMode(ui.mode.value);
applyMode(ui.mode.value);

function runFrame() {
  const t0 = performance.now();
  while (!opt.done && performance.now() - t0 < 15) opt.step();
  drawCurve();
  ui.status.textContent = `E = ${opt.E.toPrecision(6)} | iteration ${opt.iters} | ` +
    `max gradient / initial ${opt.gRatio.toExponential(2)} | step x${(opt.maxStep / opt.maxStep0).toPrecision(3)}` +
    (opt.done ? ' | done' : '');
  if (opt.done) stop();
}

function drawCurve() {
  curveObj.children.forEach(c => c.isInstancedMesh ? c.dispose() : c.geometry.dispose());
  curveObj.clear();
  if (!curve) {
    ui.info.textContent = 'No closed plane section found.';
    return;
  }
  const { pts, ts } = surfacePolyline(curve);
  const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
  lineGeom.setAttribute('color', new THREE.Float32BufferAttribute(ts.flatMap(t => colorRamp(t).toArray()), 3));
  const line = new THREE.Line(lineGeom, lineMat);

  const n = curve.pos.length;
  const points = new THREE.InstancedMesh(pointGeom, pointMat, n);
  const m = new THREE.Matrix4();
  curve.pos.forEach((p, i) => {
    points.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z));
    points.setColorAt(i, colorRamp(i / n));
  });
  curveObj.add(line, points);
  ui.info.textContent = `${surface.attributes.position.count} verts, ${surface.index.count / 3} faces | ` +
    `curve: ${n} pts, length ${curveLength(curve).toFixed(3)}`;
}

// Three-color ramp from globeweaver/draw.js colorRamp().
const RAMP = [new THREE.Color('#ed913e'), new THREE.Color('#934E6A'), new THREE.Color('#1a419c')];
function colorRamp(t) {
  return t < 0.5 ? RAMP[0].clone().lerp(RAMP[1], t * 2) : RAMP[1].clone().lerp(RAMP[2], (t - 0.5) * 2);
}

// Each segment drawn as the shortest path along the surface between consecutive points; ts = arc fraction
// for coloring. Ends back at x[0] (not a LineLoop) so the closing segment doesn't blend blue to orange.
function surfacePolyline(curve) {
  const x = curve.pos, n = x.length, pts = [], ts = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const seg = [x[i], ...shortestPath(topo, curve.face[i], x[i], curve.face[j], x[j])];
    seg.forEach((p, k) => { pts.push(p); ts.push((i + k / seg.length) / n); });
  }
  pts.push(x[0]);
  ts.push(1);
  return { pts, ts };
}

function builtIn(name) {
  if (name === 'cube') return new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);
  return new THREE.IcosahedronGeometry(1, 15);
}

ui.shape.onchange = () => setSurface([builtIn(ui.shape.value)]);
document.getElementById('loadObj').onclick = () => ui.file.click();
ui.file.onchange = async () => {
  const file = ui.file.files[0];
  if (!file) return;
  const group = new THREE.OBJLoader().parse(await file.text());
  group.updateMatrixWorld(true);
  const geometries = [];
  group.traverse(o => { if (o.isMesh) geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld)); });
  if (geometries.length) {
    ui.shape.value = 'obj';
    setSurface(geometries);
  }
  ui.file.value = '';
};
ui.newLoop.onclick = newCurve;

// Resample the current curve with 1.26x (or 1/1.26x) as many points; three clicks doubles (1.26^3 = 2).
function scalePoints(factor) {
  if (!curve) return;
  const running = !!opt;
  stop();
  const m = Math.max(4, Math.round(curve.pos.length * factor));
  resampleCurve(topo, curve, m);
  drawCurve();
  if (running) ui.run.click();
}
document.getElementById('more').onclick = () => scalePoints(1.26);
document.getElementById('fewer').onclick = () => scalePoints(1 / 1.26);
document.getElementById('resample').onclick = () => scalePoints(1);

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

setSurface([builtIn('sphere')]);
renderer.setAnimationLoop(() => {
  if (opt) runFrame();
  controls.update();
  renderer.render(scene, camera);
});
