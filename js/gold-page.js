const mean = require('@stdlib/stats/base/mean');
const std = require('@stdlib/stats/base/std');

function analyze() {
  const prices = [1900, 1920, 1910, 1935, 1950, 1940];

  const avg = mean(prices);
  const deviation = std(prices);

  document.getElementById('stats').innerText =
    `Mean: ${avg.toFixed(2)} | Std Dev: ${deviation.toFixed(2)}`;
}