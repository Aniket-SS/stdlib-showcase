const ndarray = require('@stdlib/ndarray/ctor');

function multiply() {
  const A = ndarray(new Float64Array([1,2,3,4]), [2,2]);
  const B = ndarray(new Float64Array([5,6,7,8]), [2,2]);

  const result = new Float64Array(4);

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      let sum = 0;
      for (let k = 0; k < 2; k++) {
        sum += A.get(i,k) * B.get(k,j);
      }
      result[i*2 + j] = sum;
    }
  }

  document.getElementById('result').innerText =
    `Result: [${Array.from(result)}]`;
}