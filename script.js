// --- Conversão IEEE 754 32 bits ---

function toIEEE754Bits(value) {
  if (Number.isNaN(value)) return '0' + '1'.repeat(8) + '1' + '0'.repeat(22);
  if (value === Infinity) return '0' + '1'.repeat(8) + '0'.repeat(23);
  if (value === -Infinity) return '1' + '1'.repeat(8) + '0'.repeat(23);

  const sign = (Object.is(value, -0) || value < 0) ? '1' : '0';
  let abs = Math.abs(value);

  if (abs === 0) return sign + '0'.repeat(8) + '0'.repeat(23);

  const bias = 127;
  let exp = Math.floor(Math.log2(abs));

  if (exp > 127) return sign + '1'.repeat(8) + '0'.repeat(23);

  if (exp < -126) {
    const mantissaVal = Math.round(abs * Math.pow(2, 149));
    let mantissa = mantissaVal.toString(2).padStart(23, '0').slice(-23);
    return sign + '0'.repeat(8) + mantissa;
  }

  const normalized = abs / Math.pow(2, exp);
  let fraction = normalized - 1;
  const mantissaUnrounded = fraction * Math.pow(2, 23);

  const mantissaFloor = Math.floor(mantissaUnrounded);
  const remainder = mantissaUnrounded - mantissaFloor;
  let mantissaInt = mantissaFloor;

  if (remainder > 0.5) mantissaInt++;
  else if (remainder === 0.5 && (mantissaFloor & 1) === 1) mantissaInt++;

  if (mantissaInt >= Math.pow(2, 23)) {
    mantissaInt = 0;
    exp++;
    if (exp > 127) return sign + '1'.repeat(8) + '0'.repeat(23);
  }

  const expBits = (exp + bias).toString(2).padStart(8, '0');
  const mantBits = mantissaInt.toString(2).padStart(23, '0');
  return sign + expBits + mantBits;
}

function bitsToNumber(bits) {
  const sign = bits[0] === '1' ? -1 : 1;
  const expBits = parseInt(bits.slice(1, 9), 2);
  const mantBits = bits.slice(9);
  const mantInt = parseInt(mantBits, 2);
  const bias = 127;

  if (expBits === 255) return mantInt === 0 ? sign * Infinity : NaN;
  if (expBits === 0) return mantInt === 0 ? sign * 0 : sign * (mantInt / 2 ** 23) * 2 ** -126;

  const exp = expBits - bias;
  const mant = 1 + mantInt / 2 ** 23;
  return sign * mant * 2 ** exp;
}

function splitBits(bits) {
  return bits[0] + ' ' + bits.slice(1, 9) + ' ' + bits.slice(9);
}

// --- Eventos UI ---

document.getElementById('btn-convert').addEventListener('click', () => {
  const input = document.getElementById('input-value').value.trim();
  const num = Number(input);

  if (input === '' || (isNaN(num) && input.toLowerCase() !== 'nan')) {
    alert('Valor inválido.');
    return;
  }

  const bits = toIEEE754Bits(num);
  document.getElementById('bits-output').textContent = splitBits(bits);

  const expBits = bits.slice(1, 9);
  const mantBits = bits.slice(9);
  const reconstructed = bitsToNumber(bits);

  document.getElementById('explain-output').textContent =
    `sign=${bits[0]}\nexp=${expBits} (${parseInt(expBits, 2)})\n` +
    `mantissa=${mantBits}\nvalor reconstruído = ${reconstructed}`;
});

document.getElementById('btn-bits-to-dec').addEventListener('click', () => {
  const bits = document.getElementById('input-bits').value.trim().replace(/\s+/g, '');
  if (!/^[01]{32}$/.test(bits)) {
    alert('Digite 32 bits (0 e 1).');
    return;
  }

  document.getElementById('dec-output').textContent = bitsToNumber(bits);
});

document.getElementById('btn-op').addEventListener('click', () => {
  const a = Number(document.getElementById('op-a').value.trim());
  const b = Number(document.getElementById('op-b').value.trim());
  const op = document.getElementById('operation').value;

  let result;
  if (op === '+') result = a + b;
  else if (op === '-') result = a - b;
  else if (op === '*') result = a * b;
  else result = a / b;

  document.getElementById('result-double').textContent = result;

  const bits = toIEEE754Bits(result);
  const float32 = bitsToNumber(bits);

  document.getElementById('result-f32').textContent = `bits: ${splitBits(bits)}\nvalor: ${float32}`;
});
