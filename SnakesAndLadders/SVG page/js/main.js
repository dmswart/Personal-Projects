const squareSize = 100;

moves = [
  [3, 37], [6, 16], [15, 9], [49, 12], [14, 32],
  [27, 56], [61, 22], [42, 17], [88, 36], [39, 44],
  [58, 45], [75, 47], [94, 64], [97, 65], [69, 87],
  [79, 98], [41, 85], [89, 91]
];

function spaceClass(squareNo) {
  let result = 'space'; // light blue

  moves.forEach(move => {
    if(move[0] === squareNo && move[0] < move[1]) result += ' base';
    if(move[0] === squareNo && move[0] > move[1]) result += ' tail';
    if(move[1] === squareNo && move[0] < move[1]) result += ' top';
    if(move[1] === squareNo && move[0] > move[1]) result += ' head';
  });

  return result;
}

function drawSquares(svg, squareArray) {
  svg.selectAll('rect')
    .data(squareArray)
    .enter()
    .append('rect')
    .attr('height', 100)
    .attr('width', 100)
    .attr('class', (d) => spaceClass(d.squareNo))
    .attr('x', (d) => d.x * squareSize)
    .attr('y', (d) => d.y * squareSize)
}

function drawLabels(svg, squareArray) {
  svg.selectAll('text')
    .data(squareArray)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', (d) => (d.x + 0.5) * squareSize)
    .attr('y', (d) => (d.y + 0.54) * squareSize)
    .text((d) => d.squareNo);
}

function drawBoundaries(svg, squareArray) {
  let grid = new Array(10).fill(0).map(() => new Array(10).fill(0));
  squareArray.forEach((s) => { grid[s.x][s.y] = s.squareNo; });

  let verticals = [];
  let horizontals = [];
  for(let x = 0; x < 10; x++) {
    for(let y = 0; y < 10; y++) {
      if(x < 9 && Math.abs(grid[x][y] - grid[x+1][y]) !== 1) verticals.push({x: x, y: y});
      if(y < 9 && Math.abs(grid[x][y] - grid[x][y+1]) !== 1) horizontals.push({x: x, y: y});
    }
  }

  let pathFn = (x1, y1, x2, y2) => `M${x1 * squareSize} ${y1 * squareSize}L${x2 * squareSize} ${y2 * squareSize}`;

  svg.append('path')
    .attr('class', 'border')
    .attr('d', 'M2 2L998 2L998 998L2 998z');

  let vs = svg.selectAll('path.vertical')
    .data(verticals)
    .enter()
    .append('path')
    .attr('class', 'vertical')
    .attr('d', (d) => pathFn(d.x+1, d.y, d.x+1, d.y+1));

  let hs = svg.selectAll('path.horizontal')
    .data(horizontals)
    .enter()
    .append('path')
    .attr('class', 'horizontal')
    .attr('d', (d) => pathFn(d.x, d.y+1, d.x+1, d.y+1));
}

function drawSnakeOrLadder(svg, from, to) {
  let magnitude = Math.hypot(to.x - from.x, to.y - from.y);
  let u = {x: (to.x - from.x) / magnitude, y: (to.y - from.y) / magnitude};
  let v = {x: u.y, y: -u.x};
  let start = {x: (from.x + 0.5) * squareSize + u.x * 36,
               y: (from.y + 0.5) * squareSize + u.y * 36 };
  let end = {x: (to.x + 0.5) * squareSize - u.x * 36,
             y: (to.y + 0.5) * squareSize - u.y * 36 };


  if (from.squareNo < to.squareNo) {
    // ladder
    for(let i = -10; i <= 10; i+= 10) {
      svg.append('path')
        .attr('class', 'ladder shadow' + (i===0 ? ' rungs' : ''))
        .attr('stroke-dasharray', (i===0 ? '4 10' : null))
        .attr('d', `M${start.x + v.x * i} ${start.y + v.y * i}L${end.x + v.x * i} ${end.y + v.y * i}`);
      svg.append('path')
        .attr('class', 'ladder' + (i===0 ? ' rungs' : ''))
        .attr('stroke-dasharray', (i===0 ? '3 11' : null))
        .attr('d', `M${start.x + v.x * i} ${start.y + v.y * i}L${end.x + v.x * i} ${end.y + v.y * i}`);
    }
  } else {
    // snake
    x_uv = (i, j) => (u.x * i + v.x * j);
    y_uv = (i, j) => (u.y * i + v.y * j);
    let direction = u.x > 0 ? 1 : -1;
    let offset = direction * 15;
    svg.append('path')
      .attr('class', 'snake')
      .attr('d', `M${start.x} ${start.y}` +
                  `C${start.x + x_uv(50, direction * -100) } ${start.y + y_uv(50, direction * -100)}` +
                  ` ${end.x + x_uv(-50, offset-15)} ${end.y + y_uv(-50, offset-15)}` +
                  ` ${end.x + x_uv(20, -10)}  ${end.y + y_uv(20, -10)}` +
                  `L${end.x} ${end.y}` +
                  `L${end.x + x_uv(20, 10)}  ${end.y + y_uv(20, 10)}` +
                  `C${end.x + x_uv(-50, offset+15)} ${end.y + y_uv(-50, offset+15)}` +
                  ` ${start.x + x_uv(60, direction * -90)} ${start.y + y_uv(60, direction * -90)}` +
                  ` ${start.x} ${start.y}`);
    svg.append('circle')
      .attr('class', 'eye')
      .attr('r', 4)
      .attr('cx', end.x + x_uv(0, direction * 10))
      .attr('cy', end.y + y_uv(0, direction * 10));
  }
}

function drawSnakesAndLadders(svg, squareArray) {
  moves.forEach(([from, to]) => {
    let fromSquare = squareArray.find(s => s.squareNo === from);
    let toSquare = squareArray.find(s => s.squareNo === to);

    drawSnakeOrLadder(svg, fromSquare, toSquare);
  });
}

function draw() {
  let squareArray = [];
  const svg = d3.select('svg.board');

  if (true) {
    // normal board
    for (let s = 0; s < 100; s ++) {
      let y = Math.floor(s / 10);
      let x = s - (10 * y);
      if (y % 2 === 1) x = 9 - x;
        squareArray.push({x: x, y: 9 - y, squareNo: s + 1});
    }
  } else if (true) {
    // maximum board
    let array = [[86, 87, 90, 91, 94, 95, 96, 97, 30, 31],
                 [85, 88, 89, 92, 93, 100, 99, 98, 29, 32],
                 [84, 83, 16, 17, 22, 23, 24, 25, 28, 33],
                 [81, 82, 15, 18, 21, 2, 1, 26, 27, 34],
                 [80, 79, 14, 19, 20, 3, 4, 5, 6, 35],
                 [77, 78, 13, 12, 11, 10, 9, 8, 7, 36],
                 [76, 73, 72, 69, 68, 53, 52, 49, 48, 37],
                 [75, 74, 71, 70, 67, 54, 51, 50, 47, 38],
                 [62, 63, 64, 65, 66, 55, 44, 45, 46, 39],
                 [61, 60, 59, 58, 57, 56, 43, 42, 41, 40]];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        squareArray.push({x: x, y: y, squareNo: array[x][y]})
      }
    }
  }

  drawSquares(svg, squareArray);
  drawBoundaries(svg, squareArray);
  drawSnakesAndLadders(svg, squareArray);
  drawLabels(svg, squareArray);
}
