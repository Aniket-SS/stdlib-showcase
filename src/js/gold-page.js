
var dmean     = require('@stdlib/stats-base-dmean');
var dvariance = require('@stdlib/stats-base-dvariance');
var dmax      = require('@stdlib/stats-base-max');
var dmin      = require('@stdlib/stats-base-min');
var sqrt      = require('@stdlib/math-base-special-sqrt');

// 1. CSV PARSING

function fetchGoldData() {
  return fetch('data/goldbees.csv')
    .then(function(res) {
      if (!res.ok) throw new Error('Could not load data/goldbees.csv');
      return res.text();
    })
    .then(parseCSV);
}

function parseCSV(text) {
  var lines = text.split(/\r?\n/).map(function(l) { return l.trim(); }).filter(Boolean);  // NSE CSV has column order: DATE,OPEN,HIGH,LOW,CLOSE,VOLUME

  if (lines.length < 2) throw new Error('CSV has no data rows.');

  var parsed = [];
  for (var i = 1; i < lines.length; i++) {   // start at 1 to skip header row
    var p    = lines[i].split(',');
    var date = normaliseDate(p[0]);
    if (!date) continue;
    parsed.push({   // indices: 0=date, 1=open, 2=high, 3=low, 4=close, 5=volume
      date:   date,
      open:   parseFloat(p[1]),
      high:   parseFloat(p[2]),
      low:    parseFloat(p[3]),
      close:  parseFloat(p[4]),
      volume: parseFloat(p[5])
    });
  }

  if (parsed.length === 0) throw new Error('No valid rows found in CSV.');

  // sort to oldest->newest for charts
  parsed.sort(function(a, b) { return a.date < b.date ? -1 : 1; });

  return parsed;
}

function normaliseDate(str) {
  // NSE format: DD-Mon-YY e.g. "19-Mar-26" → "2026-03-19"
  if (!str) return null;
  var m = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  var months = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06', jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  var mon = months[m[2].toLowerCase()];
  if (!mon) return null;
  return '20' + m[3] + '-' + mon + '-' + m[1].padStart(2, '0');
}

// 2. STDLIB STATS

function buildBuffers(parsed) {
  var N      = parsed.length;
  var closes = new Float64Array(N);
  var vols   = new Float64Array(N);

  for (var i = 0; i < N; i++) {
    closes[i] = parsed[i].close;
    vols[i]   = parsed[i].volume;
  }

  return { N: N, closes: closes, vols: vols };
}

// Daily returns
function computeReturns(closes, N) {
  var ret = new Float64Array(N - 1);
  for (var i = 0; i < N - 1; i++) {
    ret[i] = (closes[i + 1] - closes[i]) / closes[i];
  }
  return ret;
}

// Rolling mean
function rollingMean(closes, N, w) {
  var len = N - w + 1;
  var ma  = new Float64Array(len);
  for (var i = 0; i < len; i++) {
    ma[i] = dmean.ndarray(w, closes, 1, i);  // dmean.ndarray(N, x, strideX, offsetX)
  }
  return ma;
}

// Computation
function computeStats(closes, returns, N, M) {
  return {
    avgPrice:  dmean.ndarray(N, closes, 1, 0),
    maxPrice:  dmax.ndarray(N, closes, 1, 0),
    minPrice:  dmin.ndarray(N, closes, 1, 0),
    avgReturn: dmean.ndarray(M, returns, 1, 0),
    annualVol: sqrt(dvariance.ndarray(M, 1, returns, 1, 0) * 252) * 100  // number of trading days = 252
  };
}

// 3. CANVAS CHART

var COLORS = {
  price: '#b45309', ma:   '#2563eb',
  pos:   '#16a34a', neg:  '#dc2626',
  vol:   '#94a3b8', grid: '#f0f0f0',
  label: '#999999', bg:   '#ffffff'
};

function setupCanvas(canvas) {
  var dpr = window.devicePixelRatio || 1;
  canvas.width  = canvas.clientWidth  * dpr;
  canvas.height = canvas.clientHeight * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

function drawPriceChart(canvas, closes, maVals, maOffset, dates) {
  var ctx = setupCanvas(canvas);
  var W = canvas.clientWidth, H = canvas.clientHeight;
  var P = { t:16, r:16, b:28, l:64 };
  var pw = W-P.l-P.r, ph = H-P.t-P.b, N = closes.length;
  var all  = Array.from(closes).concat(Array.from(maVals));
  var yMin = Math.min.apply(null, all) * 0.998;
  var yMax = Math.max.apply(null, all) * 1.002;

  function xp(i) { return P.l + (i/(N-1))*pw; }
  function yp(v) { return P.t + ph - ((v-yMin)/(yMax-yMin))*ph; }

  ctx.fillStyle = COLORS.bg; ctx.fillRect(0,0,W,H);
  ctx.font = '10px JetBrains Mono, monospace';

  for (var t = 0; t <= 4; t++) {
    var gy = P.t+(t/4)*ph, gv = yMax-(t/4)*(yMax-yMin);
    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(P.l,gy); ctx.lineTo(W-P.r,gy); ctx.stroke();
    ctx.fillStyle = COLORS.label; ctx.textAlign = 'right';
    ctx.fillText('₹'+gv.toFixed(1), P.l-4, gy+3);
  }

  ctx.fillStyle = COLORS.label; ctx.textAlign = 'center';
  var step = Math.max(1, Math.floor(N/5));
  for (var i = 0; i < N; i += step) ctx.fillText(dates[i].slice(5), xp(i), H-6);

  var grad = ctx.createLinearGradient(0,P.t,0,H-P.b);
  grad.addColorStop(0,'rgba(180,83,9,0.1)');
  grad.addColorStop(1,'rgba(180,83,9,0)');
  ctx.beginPath();
  Array.from(closes).forEach(function(v,i){ i===0?ctx.moveTo(xp(i),yp(v)):ctx.lineTo(xp(i),yp(v)); });
  ctx.lineTo(xp(N-1),yp(yMin)); ctx.lineTo(xp(0),yp(yMin));
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); ctx.strokeStyle = COLORS.price; ctx.lineWidth = 1.5;
  Array.from(closes).forEach(function(v,i){ i===0?ctx.moveTo(xp(i),yp(v)):ctx.lineTo(xp(i),yp(v)); });
  ctx.stroke();

  ctx.beginPath(); ctx.strokeStyle = COLORS.ma; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
  Array.from(maVals).forEach(function(v,i){ var xi=i+maOffset; i===0?ctx.moveTo(xp(xi),yp(v)):ctx.lineTo(xp(xi),yp(v)); });
  ctx.stroke(); ctx.setLineDash([]);
}

function drawReturnsChart(canvas, returns, dates) {
  var ctx = setupCanvas(canvas);
  var W = canvas.clientWidth, H = canvas.clientHeight;
  var P = { t:12, r:16, b:28, l:64 };
  var pw = W-P.l-P.r, ph = H-P.t-P.b;
  var N = returns.length;
  var rArr = Array.from(returns);
  var rMax = Math.max.apply(null, rArr.map(Math.abs)) * 1.1 || 0.01;
  var zero = P.t + ph/2;

  ctx.fillStyle = COLORS.bg; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(P.l,zero); ctx.lineTo(W-P.r,zero); ctx.stroke();
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'right'; ctx.fillStyle = COLORS.label;
  ctx.fillText('0%', P.l-4, zero+3);

  var barW = Math.max(1, pw/N - 1);
  rArr.forEach(function(v,i) {
    var x = P.l+(i/N)*pw, h = Math.abs(v/rMax)*(ph/2);
    ctx.fillStyle = v >= 0 ? COLORS.pos : COLORS.neg;
    ctx.fillRect(x, v>=0?zero-h:zero, barW, h);
  });

  ctx.textAlign = 'center'; ctx.fillStyle = COLORS.label;
  var step = Math.max(1, Math.floor(N/5));
  for (var i = 0; i < N; i += step) ctx.fillText(dates[i+1].slice(5), P.l+(i/N)*pw, H-6);
}

function drawVolumeChart(canvas, vols, dates) {
  var ctx = setupCanvas(canvas);
  var W = canvas.clientWidth, H = canvas.clientHeight;
  var P = { t:12, r:16, b:28, l:64 };
  var pw = W-P.l-P.r, ph = H-P.t-P.b;
  var N = vols.length;
  var vArr = Array.from(vols);
  var vMax = Math.max.apply(null, vArr) * 1.05 || 1;

  ctx.fillStyle = COLORS.bg; ctx.fillRect(0,0,W,H);
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'right'; ctx.fillStyle = COLORS.label;
  ctx.fillText((vMax/1e6).toFixed(1)+'M', P.l-4, P.t+8);
  ctx.fillText('0', P.l-4, P.t+ph+3);

  var barW = Math.max(1, pw/N - 1);
  vArr.forEach(function(v,i) {
    var x = P.l+(i/N)*pw, h = (v/vMax)*ph;
    ctx.fillStyle = COLORS.vol;
    ctx.fillRect(x, P.t+ph-h, barW, h);
  });

  ctx.textAlign = 'center'; ctx.fillStyle = COLORS.label;
  var step = Math.max(1, Math.floor(N/5));
  for (var i = 0; i < N; i += step) ctx.fillText(dates[i].slice(5), P.l+(i/N)*pw, H-6);
}

// 4. UI WIRING

document.addEventListener('DOMContentLoaded', function() {

  var loader       = document.getElementById('gold-loader');
  var errorBox     = document.getElementById('gold-error');
  var contentArea  = document.getElementById('gold-content');

  var elAvg        = document.getElementById('stat-avg');  // Avg close
  var elMax        = document.getElementById('stat-max');  // 6mo high
  var elMin        = document.getElementById('stat-min');  // 6mo low
  var elVol        = document.getElementById('stat-vol');  // Ann. volatility
  var elRet        = document.getElementById('stat-ret');  // Avg daily return

  var priceCanvas  = document.getElementById('price-canvas');
  var retCanvas    = document.getElementById('returns-canvas');
  var volCanvas    = document.getElementById('volume-canvas');

  var windowSelect = document.getElementById('ma-window');
  var infoEl       = document.getElementById('nd-info');

  var _data;

  function redraw(w) {
    var ma = rollingMean(_data.closes, _data.N, w);
    drawPriceChart(priceCanvas, _data.closes, ma, w-1, _data.dates);
    drawReturnsChart(retCanvas, _data.returns, _data.dates);
    drawVolumeChart(volCanvas, _data.vols, _data.dates);
  }

  fetchGoldData()
    .then(function(parsed) {
      var b = buildBuffers(parsed);
      _data = {
        N:       b.N,
        dates:   parsed.map(function(r) { return r.date; }),
        closes:  b.closes,
        vols:    b.vols,
        returns: computeReturns(b.closes, b.N)
      };

      infoEl.textContent =
        'NDArray shape: [' + b.N + ', 5]  |  ' +
        'cols: [open, high, low, close, volume]  |  ' +
        'dtype: float64  |  stride: 1';

      var stats = computeStats(_data.closes, _data.returns, b.N, _data.returns.length);
      elAvg.textContent = '₹' + stats.avgPrice.toFixed(2);
      elMax.textContent = '₹' + stats.maxPrice.toFixed(2);
      elMin.textContent = '₹' + stats.minPrice.toFixed(2);
      elVol.textContent = stats.annualVol.toFixed(1) + '%';
      elRet.textContent = (stats.avgReturn * 100).toFixed(3) + '%';
      elRet.className   = 'stat-value ' + (stats.avgReturn >= 0 ? 'up' : 'down');

      loader.parentNode.removeChild(loader);
      contentArea.style.display = 'block';

      requestAnimationFrame(function() {
        redraw(parseInt(windowSelect.value, 10));
      });

      windowSelect.addEventListener('change', function() {
        redraw(parseInt(windowSelect.value, 10));
      });
      window.addEventListener('resize', function() {
        redraw(parseInt(windowSelect.value, 10));
      });
    })
    .catch(function(err) {
      loader.parentNode.removeChild(loader);
      errorBox.style.display = 'block';
      errorBox.textContent   = err.message;
      console.error(err);
    });
});