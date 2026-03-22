
var ndarray  = require('@stdlib/ndarray-array');
var slice    = require('@stdlib/ndarray-slice');
var numel    = require('@stdlib/ndarray-base-numel');
var getShape = require('@stdlib/ndarray-shape');
var strides  = require('@stdlib/ndarray-strides');
var dtype    = require('@stdlib/ndarray-dtype');
var toArray  = require('@stdlib/ndarray-to-array');
var Slice    = require('@stdlib/slice-ctor');
var MultiSlice = require('@stdlib/slice-multi');

var nd_array      = null;
var original_data = null;
var current_layer = 0; // for 3D arrays

function makeFlatData(size, fillMode) {
  var arr = new Float64Array(size);
  if (fillMode === 'range') {
    for (var i = 0; i < size; i++) 
      arr[i] = i;
  } else if (fillMode === 'ones') {
    arr.fill(1);
  } else if (fillMode === 'random') {
    for (i = 0; i < size; i++) 
      arr[i] = Math.floor(Math.random() * 21) - 10;  // random values from -10 to 10
  }
  return arr;
}

function parseShape(str) {
  return str.split(',')  // "3, 4" -> ["3", "4"] -> [3, 4]
  .map(function(s) { return parseInt(s.trim(), 10); })
  .filter(function(n) { return n > 0 && !isNaN(n); });
}

function get2DView(nd, layer) {
  var sh = getShape(nd);
  if (sh.length === 2) return nd;
  if (sh.length === 3) return slice(nd, layer, null, null);
  return nd;
}

function renderGrid(wrap, nd2d, highlightSet) {
  wrap.innerHTML = '';
  var sh   = getShape(nd2d);  // e.g. [3, 4]
  var rows = sh[0];  // 3
  var cols = sh[1];  // 4

  var grid = document.createElement('div');
  grid.className = 'nd-grid';
  grid.style.gridTemplateColumns = 'repeat(' + cols + ', 44px)';

  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var val  = nd2d.get(r, c);  // read value at row r, col c from ndarray
      var cell = document.createElement('div');

      cell.className = highlightSet && highlightSet.has(r + ',' + c) ? 'nd-cell sliced' : 'nd-cell active';  // yellow or blue colour cell
      cell.textContent = val;
      grid.appendChild(cell);
    }
  }
  wrap.appendChild(grid);
}

document.addEventListener('DOMContentLoaded', function() {

  var shapeInput   = document.getElementById('nd-shape');
  var fillSelect   = document.getElementById('nd-fill');
  var createBtn    = document.getElementById('nd-create-btn');
  var infoBox      = document.getElementById('nd-info');
  var vizSection   = document.getElementById('nd-viz-section');
  var sliceSection = document.getElementById('nd-slice-section');
  var opsSection   = document.getElementById('nd-ops-section');
  var gridWrap     = document.getElementById('nd-grid-wrap');
  var layerCtrl    = document.getElementById('nd-layer-ctrl');
  var sliceRowIn   = document.getElementById('nd-slice-row');
  var sliceColIn   = document.getElementById('nd-slice-col');
  var sliceBtn     = document.getElementById('nd-slice-btn');
  var sliceOut     = document.getElementById('nd-slice-out');

  createBtn.addEventListener('click', function() {
    var rawShape = parseShape(shapeInput.value);
    if (rawShape.length < 2) {
      infoBox.textContent = 'Enter a valid shape like 3,4 or 2,3,4';
      return;
    }

    var size  = rawShape.reduce(function(a, b) { return a * b; }, 1);  // [3, 4] → 3 * 4 = 12 — total number of elements needed
    var buf   = makeFlatData(size, fillSelect.value);  
    original_data = buf.slice();
    nd_array      = ndarray(buf, { shape: rawShape, dtype: 'float64' });

    var st = strides(nd_array);
    var dt = dtype(nd_array);

    infoBox.innerHTML =
      'shape: <b>[' + getShape(nd_array).join(', ') + ']</b> &nbsp;|&nbsp;' +
      'strides: <b>[' + st.join(', ') + ']</b> &nbsp;|&nbsp;' +
      'dtype: <b>' + dt + '</b> &nbsp;|&nbsp;' +
      'numel: <b>' + numel(getShape(nd_array)) + '</b>';

    // Layer switcher only for 3D arrays
    layerCtrl.innerHTML = '';
    current_layer = 0;

    if (rawShape.length === 3) {
      layerCtrl.style.display = 'flex';  // layer button row for 3D only
      for (var l = 0; l < rawShape[0]; l++) {
        (function(layerIdx) {  // Immediately Invoked Function Expression (IIFE)
          var b = document.createElement('button');
          b.textContent = 'Layer ' + layerIdx;
          if (layerIdx === 0) b.style.fontWeight = 'bold';

          b.addEventListener('click', function() {
            Array.from(layerCtrl.querySelectorAll('button')).forEach(function(x) {
              x.style.fontWeight = 'normal';
            });
            b.style.fontWeight = 'bold';
            current_layer = layerIdx;
            renderGrid(gridWrap, get2DView(nd_array, layerIdx), null);
          });

          layerCtrl.appendChild(b);
        })(l);
      }
    } else {
      layerCtrl.style.display = 'none';  // no layers for 2D arrays
    }

    renderGrid(gridWrap, get2DView(nd_array, 0), null);
    vizSection.style.display   = '';
    sliceSection.style.display = '';
    opsSection.style.display   = '';
    sliceOut.textContent = '';

    // re-enable square button for fresh array
    squareBtn.disabled = false;
    squareBtn.style.opacity = '1';
    squareBtn.style.cursor = 'pointer';
  });

  sliceBtn.addEventListener('click', function() {
    if (!nd_array) return;
    var nd2d = get2DView(nd_array, current_layer);
    var sh   = getShape(nd2d);

    function parseRange(str, max) {
      if (!str || !str.trim()) return [0, max];  // for blank input take full range
      var parts = str.split(':').map(function(s) { return parseInt(s.trim(), 10); });  // "0:2" → ["0","2"] → [0, 2] and "1:3" → ["1","3"] → [1, 3]
      return [isNaN(parts[0]) ? 0 : parts[0], isNaN(parts[1]) ? max : parts[1]];
    }

    var rowRange = parseRange(sliceRowIn.value, sh[0]);
    var colRange = parseRange(sliceColIn.value, sh[1]);
    var r0 = rowRange[0], r1 = rowRange[1];  // r0=0, r1=2
    var c0 = colRange[0], c1 = colRange[1];  // c0=1, c1=3

    var highlighted = new Set();  // Set containing sliced cell values 
    for (var r = r0; r < r1; r++) {
      for (var c = c0; c < c1; c++) {
        highlighted.add(r + ',' + c);
      }
    }
    renderGrid(gridWrap, nd2d, highlighted);  // yellow colour of sliced cells


    // stdlib slice API:
    var ms       = new MultiSlice(new Slice(r0, r1), new Slice(c0, c1));  // e.g. rows 0:2, cols 1:3 → MultiSlice(Slice(0,2), Slice(1,3))
    var sliced   = slice(nd2d, ms);
    var slicedSh = getShape(sliced);
    var asArr    = toArray(sliced);
    sliceOut.innerHTML =
      'shape: [' + slicedSh.join(', ') + ']<br>' +
      'values: ' + JSON.stringify(asArr);
  });

  // slice reset button
  var resetBtn = document.getElementById('nd-reset-btn');
  resetBtn.addEventListener('click', function() {
    if (!nd_array || !original_data) return;
    nd_array.data.set(original_data);
    renderGrid(gridWrap, get2DView(nd_array, current_layer), null);
    sliceOut.textContent = '';
  });

  // element-wise operations
  function applyOp(fn) {
    if (!nd_array) return;
    var buf = nd_array.data;
    for (var i = 0; i < buf.length; i++) 
      buf[i] = fn(buf[i]);
    renderGrid(gridWrap, get2DView(nd_array, current_layer), null);
  }

  // square button
  var squareBtn = document.getElementById('op-square');
  squareBtn.addEventListener('click', function() {
    applyOp(function(v) { return v * v; });
    squareBtn.disabled = true;
    squareBtn.style.opacity = '0.4';
    squareBtn.style.cursor = 'not-allowed';
  });

  // negate button
  document.getElementById('op-negate').addEventListener('click', function() {
    applyOp(function(v) { return -v; });
  });

  // absolute button
  document.getElementById('op-abs').addEventListener('click', function() {
    applyOp(function(v) { return Math.abs(v); });
  });

  // reset button
  document.getElementById('op-reset').addEventListener('click', function() {
    if (!nd_array || !original_data) return;
    nd_array.data.set(original_data);
    renderGrid(gridWrap, get2DView(nd_array, current_layer), null);

    // re-enable square button on reset
    squareBtn.disabled = false;
    squareBtn.style.opacity = '1';
    squareBtn.style.cursor = 'pointer';
  });
});