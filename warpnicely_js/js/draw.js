// draw.js
// D3-based rendering for the source and destination SVG panels. Runs only
// on the main thread (uses d3 + the DOM).
(function () {
  'use strict';
  var WPN = window.WPN = window.WPN || {};

  var gridToBox = WPN.MeshUtil.gridToBox;

  // Debug aid: color boundary vertices by hue in traced-order (t in [0,1))
  // so a smooth color-wheel progression around the shape is easy to spot,
  // and any fold/discontinuity in the boundary order shows up as an abrupt
  // hue jump. Interior points keep a fixed color.
  function boundaryPointColor(constrained, t, interiorColor) {
    if (!constrained) return interiorColor || '#264653';
    if (t < 0) return '#d1495b'; // not yet placed
    return d3.hsl(t * 360, 0.85, 0.5).toString();
  }

  function boundaryShapePathData(shape) {
    if (shape instanceof WPN.Geometry.Circle) {
      var r = shape.radius;
      return 'M ' + (shape.cx - r) + ' ' + shape.cy +
        ' a ' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0' +
        ' a ' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0 Z';
    }
    // regular polygon
    var pts = shape.vertices.map(function (p) { return p.x + ',' + p.y; }).join(' L ');
    return 'M ' + pts + ' Z';
  }

  function renderSourcePanel(svg, mesh, box, opts) {
    svg.selectAll('*').remove();
    opts = opts || {};

    if (opts.silhouetteImage) {
      svg.append('image')
        .attr('href', opts.silhouetteImage)
        .attr('x', box.x).attr('y', box.y)
        .attr('width', box.width).attr('height', box.height)
        .attr('opacity', 0.25)
        .attr('preserveAspectRatio', 'none');
    }

    svg.append('rect')
      .attr('x', box.x).attr('y', box.y)
      .attr('width', box.width).attr('height', box.height)
      .attr('fill', 'none').attr('stroke', '#ccc');

    var lineData = mesh.edges.map(function (edge) {
      var rc0 = mesh.rowCol(edge[0]), rc1 = mesh.rowCol(edge[1]);
      var p0 = gridToBox(mesh, rc0.r, rc0.c, box), p1 = gridToBox(mesh, rc1.r, rc1.c, box);
      return { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y };
    });

    svg.append('g').attr('class', 'edges')
      .selectAll('line').data(lineData).enter().append('line')
      .attr('x1', function (d) { return d.x1; }).attr('y1', function (d) { return d.y1; })
      .attr('x2', function (d) { return d.x2; }).attr('y2', function (d) { return d.y2; })
      .attr('stroke', '#8899aa').attr('stroke-width', 0.75);

    var pointData = mesh.validIndices.map(function (i) {
      var rc = mesh.rowCol(i);
      var p = gridToBox(mesh, rc.r, rc.c, box);
      return { x: p.x, y: p.y, constrained: mesh.constrained[i], t: mesh.boundaryT[i] };
    });

    svg.append('g').attr('class', 'points')
      .selectAll('circle').data(pointData).enter().append('circle')
      .attr('cx', function (d) { return d.x; }).attr('cy', function (d) { return d.y; })
      .attr('r', function (d) { return d.constrained ? 2.5 : 1.5; })
      .attr('fill', function (d) { return boundaryPointColor(d.constrained, d.t); });
  }

  function renderDestPanel(svg, mesh, boundaryShape) {
    svg.selectAll('*').remove();

    svg.append('path')
      .attr('class', 'boundary-shape')
      .attr('d', boundaryShapePathData(boundaryShape))
      .attr('fill', 'none').attr('stroke', '#999').attr('stroke-dasharray', '4,3');

    var edgeSel = svg.append('g').attr('class', 'edges')
      .selectAll('line').data(mesh.edges).enter().append('line')
      .attr('stroke', '#8899aa').attr('stroke-width', 0.75);

    var pointSel = svg.append('g').attr('class', 'points')
      .selectAll('circle').data(mesh.validIndices).enter().append('circle')
      .attr('r', function (i) { return mesh.constrained[i] ? 2.5 : 1.5; })
      .attr('fill', function (i) { return boundaryPointColor(mesh.constrained[i], mesh.boundaryT[i], '#2a9d8f'); });

    var updater = { edgeSel: edgeSel, pointSel: pointSel };
    updateDestPanel(updater, mesh);
    return updater;
  }

  function updateDestPanel(updater, mesh) {
    updater.edgeSel
      .attr('x1', function (d) { return mesh.x[d[0]]; })
      .attr('y1', function (d) { return mesh.y[d[0]]; })
      .attr('x2', function (d) { return mesh.x[d[1]]; })
      .attr('y2', function (d) { return mesh.y[d[1]]; });
    updater.pointSel
      .attr('cx', function (i) { return mesh.x[i]; })
      .attr('cy', function (i) { return mesh.y[i]; });
  }

  WPN.Draw = {
    gridToBox: gridToBox,
    renderSourcePanel: renderSourcePanel,
    renderDestPanel: renderDestPanel,
    updateDestPanel: updateDestPanel
  };
})();
