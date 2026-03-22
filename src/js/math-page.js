
var ddot = require('@stdlib/blas-base-ddot');
var sqrt = require('@stdlib/math-base-special-sqrt');

function buildGrid(container, count, cols, Fn) {
  container.innerHTML = '';
  container.style.gridTemplateColumns = 'repeat(' + cols + ', 52px)';
  for (var i = 0; i < count; i++) {
    var input = document.createElement('input');
    input.type      = 'number';
    input.className = 'matrix-cell';
    input.value     = Fn(i);  // fill with values based on position
    container.appendChild(input);
  }
}

function readGrid(container) {
  var inputs = Array.from(container.querySelectorAll('input'));  // convert into a real array
  return new Float64Array(inputs.map(function(el) {
    return parseFloat(el.value) || 0;
  }));
}

function renderResult(container, data, N) {
  container.innerHTML = '';
  container.style.gridTemplateColumns = 'repeat(' + N + ', 52px)';
  data.forEach(function(v) {
    var cell      = document.createElement('input');
    cell.type     = 'number';
    cell.className = 'matrix-cell result';
    cell.value    = parseFloat(v.toFixed(4));
    cell.readOnly = true;
    container.appendChild(cell);
  });
}

// Manual row-major matrix multiply: C = A x B uses ddot per row/col pair
function matMul(A, B, N) {
  var C    = new Float64Array(N * N);
  var rowA = new Float64Array(N);
  var colB = new Float64Array(N);

  for (var r = 0; r < N; r++) {
    for (var k = 0; k < N; k++) 
      rowA[k] = A[r * N + k];
    for (var c = 0; c < N; c++) {
      for (var k = 0; k < N; k++) 
        colB[k] = B[k * N + c];
      C[r * N + c] = ddot(N, rowA, 1, colB, 1);  // dot product of rowA and colB via stdlib ddot
    }
  }
  return C;
}

document.addEventListener('DOMContentLoaded', function() {

  // DOT PRODUCT 
  var dotA      = document.getElementById('dot-a');
  var dotB      = document.getElementById('dot-b');
  var dotBtn    = document.getElementById('dot-btn');
  var dotResult = document.getElementById('dot-result');

  var N_DOT = 4;
  buildGrid(dotA, N_DOT, N_DOT, function(i) { return i + 1; });      // A = [1, 2, 3, 4]
  buildGrid(dotB, N_DOT, N_DOT, function(i) { return N_DOT - i; });  // B = [4, 3, 2, 1]

  dotBtn.addEventListener('click', function() {
    var a      = readGrid(dotA);
    var b      = readGrid(dotB);
    var result = ddot(N_DOT, a, 1, b, 1);  // ddot(N, x, strideX, y, strideY)
    dotResult.innerHTML =
      'A · B = <b style="color:var(--accent)">' + result.toFixed(2) + '</b>';
  });

  // MATRIX MULTIPLY 
  var matSize       = document.getElementById('mat-size');
  var matA          = document.getElementById('mat-a');
  var matB          = document.getElementById('mat-b');
  var matBtn        = document.getElementById('mat-btn');
  var matResult     = document.getElementById('mat-result');
  var matResultWrap = document.getElementById('mat-result-wrap');
  var matNorm       = document.getElementById('mat-norm');

  var N = 3;

  function rebuildMatrices() {
    N = parseInt(matSize.value, 10);

    buildGrid(matA, N * N, N, function(i) {
      return Math.floor(i / N) === (i % N) ? 1 : 0;  // A = Identity matrix
    });
    buildGrid(matB, N * N, N, function(i) {
      return i + 1;  // B = Ascending matrix
    });

    matResultWrap.style.display = 'none';
    matNorm.textContent = '—';
  }

  rebuildMatrices();
  matSize.addEventListener('change', rebuildMatrices);

  matBtn.addEventListener('click', function() {
    var A = readGrid(matA);
    var B = readGrid(matB);

    // C = A x B using stdlib ddot for each row·col inner product
    var C = matMul(A, B, N);
    renderResult(matResult, C, N);
    matResultWrap.style.display = '';  // show result section

    // Frobenius norm = sqrt(sum of squares)
    var sumSq = 0;
    C.forEach(function(v) { sumSq += v * v; });
    var frob = sqrt(sumSq);  // stdlib sqrt

    matNorm.innerHTML =
      'Frobenius norm of ‖C‖<sub>F</sub> = ' +
      '<b style="color:var(--accent)">' + frob.toFixed(2) + '</b>';
  });

});