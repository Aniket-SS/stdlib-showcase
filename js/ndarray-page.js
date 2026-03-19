const ndarray = require('@stdlib/ndarray/ctor');

function createArray() {
  const shapeInput = document.getElementById('shape').value;
  const shape = shapeInput.split(',').map(Number);

  const size = shape.reduce((a, b) => a * b, 1);
  const buffer = new Float64Array(size).map((_, i) => i);

  const arr = ndarray(buffer, shape);

  document.getElementById('info').innerText =
    `Shape: ${arr.shape} | Strides: ${arr.strides} | Length: ${arr.length}`;

  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  shape.forEach(s => grid.style.gridTemplateColumns = `repeat(${shape[1] || 1}, 50px)`);

  for (let i = 0; i < arr.length; i++) {
    const div = document.createElement('div');
    div.className = 'cell';
    div.innerText = buffer[i];
    grid.appendChild(div);
  }
}