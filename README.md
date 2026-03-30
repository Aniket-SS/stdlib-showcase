# stdlib showcase

🔗 **Live demo:** https://aniket-ss.github.io/stdlib-showcase/

An interactive, browser-based showcase of [stdlib-js](https://stdlib.io) is built as part of a GSoC 2026 proposal. The project demonstrates three distinct areas of stdlib - ndarray operations, BLAS-based linear algebra and strided statistical functions applied to real and interactive data. All computation is done exclusively through stdlib packages with no mathematical utility code written from scratch.



## Pages

### Part 01 — NDArray Visualizer : [`ndarray.html`](ndarray.html)

Create stdlib ndarrays of arbitrary shape, inspect their memory layout and interactively slice and transform them.

**What it does:**
- Accepts a user-specified shape (e.g., `3,4` or `2,3,4`) and fill mode (sequential range, random integers or all ones)
- Creates a stdlib ndarray using [`ndarray/array`](https://github.com/stdlib-js/stdlib/tree/develop/lib/node_modules/%40stdlib/ndarray/array) and renders it as a visual grid
- Displays the computed **strides** alongside the data. For 3D+ arrays, renders each depth layer as a separate 2D grid with a layer switcher
- **Slice Explorer:** accepts `start:stop` notation for row and column axes, calls [`ndarray/slice`](https://github.com/stdlib-js/stdlib/tree/develop/lib/node_modules/%40stdlib/ndarray/slice) to produce the subview and highlights the selected cells
- **Element-wise operations panel:** applies x², −x, and |x| transforms in-place using [`ndarray/base/unary`](https://github.com/stdlib-js/stdlib/tree/develop/lib/node_modules/%40stdlib/ndarray/base/unary)

**stdlib packages used:**
- `@stdlib/ndarray/array` — ndarray construction from nested data
- `@stdlib/ndarray/strides` — stride inspection
- `@stdlib/ndarray/slice` — subview slicing
- `@stdlib/ndarray/base/unary` — element-wise transforms

---

### Part 02 — Matrix Operations : [`math.html`](math.html)

Edit matrices directly in the browser and compute dot products and Frobenius norm of matrix multiplication.

**What it does:**
- Renders two editable 4-element vectors and computes their dot product using [`blas/base/ddot`](https://github.com/stdlib-js/stdlib/tree/develop/lib/node_modules/%40stdlib/blas/base/ddot)
- Renders two editable N×N matrices (selectable between 2×2, 3×3, 4×4) and computes their product C = A × B, displaying the full result matrix
- Computes and displays the **Frobenius norm** of the result matrix using [`math/base/special/sqrt`](https://github.com/stdlib-js/stdlib/tree/develop/lib/node_modules/%40stdlib/math/base/special/sqrt) over the sum of squared entries

**stdlib packages used:**
- `@stdlib/blas/base/ddot` — BLAS Level 1 vector dot product
- `@stdlib/math/base/special/sqrt` — square root for norm computation

---

### Part 03 — Gold Price Analysis : [`gold.html`](gold.html)

Real-world financial time series analysis using historical NSE GOLDBEES (Gold ETF) OHLCV data, parsed into a stdlib ndarray and analysed entirely with stdlib statistical functions.

**What it does:**
- Parses a local CSV file of [NSE GOLDBEES](https://www.nseindia.com/get-quote/equity/GOLDBEES/NIPPON-INDIA-ETF-GOLD-BEES) historical OHLCV (Open, High, Low, Close, Volume) data into a stdlib ndarray
- Computes five summary statistics displayed as stat cards:
  - **Average close price** via `stats/base/dmean`
  - **6-month high** via `stats/base/max`
  - **6-month low** via `stats/base/min`
  - **Annualised volatility** via `stats/base/dvariance` + `math/base/special/sqrt`
  - **Average daily return** computed from successive close prices
- Renders three interactive canvas charts:
  - Close price with a **configurable rolling moving average** (5-day, 10-day, or 20-day window, selectable in the UI)
  - Daily returns: `returns[i] = (closes[i+1] - closes[i]) / closes[i]`
  - Trading volume as a bar chart

**stdlib packages used:**
- `@stdlib/stats/base/dmean` — mean of a double-precision strided array
- `@stdlib/stats/base/dvariance` — variance of a double-precision strided array
- `@stdlib/stats/base/max` — maximum value
- `@stdlib/stats/base/min` — minimum value
- `@stdlib/math/base/special/sqrt` — square root for volatility computation



## Project Structure

```
stdlib-showcase/
├── index.html            # Landing page 
├── ndarray.html          # Part 01: NDArray Visualizer
├── math.html             # Part 02: Matrix Operations
├── gold.html             # Part 03: Gold Price Analysis
├── style.css             
├── data/                 # GOLDBEES historical OHLCV CSV
├── src/js/               
│   ├── ndarray-page.js
│   ├── math-page.js
│   └── gold-page.js
├── js/                   # Webpack output bundles
│   ├── ndarray-page.js
│   ├── math-page.js
│   └── gold-page.js
├── webpack.config.js
└── package.json
```



## Running Locally

```bash
# Install dependencies
npm install

# Build bundles
npm run build

# Serve locally
npx serve .
```

Then open http://localhost:3000 in your browser.

To rebuild on file changes during development:

```bash
npm run dev   # runs webpack --watch
```



## Context

This project was built as the [stdlib showcase requirement](https://github.com/stdlib-js/google-summer-of-code/blob/main/README.md#showcase-requirement) for a GSoC 2026 application: [**Integrating stdlib into scijs packages**](https://github.com/stdlib-js/google-summer-of-code/issues/177). The three demos were chosen to directly exercise the parts of stdlib most relevant to that project — ndarray construction and slicing, BLAS operations and strided statistical functions while building something visual and interactive enough to communicate how stdlib works to someone unfamiliar with it.

---

Built with [stdlib-js](https://stdlib.io) · GSoC 2026
