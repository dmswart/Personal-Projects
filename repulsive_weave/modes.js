// Each mode pairs an energy with default GradientFlow options (keys match the option inputs' ids).
// `energy` is an energy object, or a function (curve, S) -> energy called when Run is pressed.
// To add a mode: write an energy in energies.js with total(curve, S) and local(curve, S, i), then add
// an entry here (it appears in the dropdown automatically). A new option also needs an input in
// index.html's Options panel with that id, an entry in app.js's ui object, and handling where it's used.
const MODES = {
  tp: {
    label: 'Tangent-point (wormsphere)', energy: TangentPointEnergy,
    options: { stepFrac: 0.2, maxIters: 2000, smooth: true, stepAvg: 0 },
  },
  oblique: {
    label: 'Oblique crossing (90° crossings OK)', energy: ObliqueCrossingEnergy,
    options: { stepFrac: 1, maxIters: 200, smooth: true, stepAvg: 2 },
  },
  kg: {
    label: 'Geodesic curvature', energy: GeodesicCurvatureEnergy,
    options: { stepFrac: 0.1, maxIters: 5000, smooth: false, stepAvg: 5 },
  },
  grow: {
    label: 'Grow (increase length, preserve angles)', energy: makeGrowthEnergy,
    options: { stepFrac: 0.1, maxIters: 1000, smooth: false, stepAvg: 5 },
  },
};
