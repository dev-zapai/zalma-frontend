// Money rounding shared with the server (app/core/money.py): decimal half-up
// to the cent, computed on the decimal string so binary floats cannot tip it
// (bug half_cent_rounding_mismatch, 2026-10-28). Math.round(x * 100) / 100
// gives 49.99 for 49.995 because 49.995 is stored as 49.99499...
export function round2(x) {
  const n = Number(x) || 0;
  const sign = n < 0 ? -1 : 1;
  const [int, frac = ''] = Math.abs(n).toFixed(10).split('.');
  const cents = BigInt(int) * 100n + BigInt((frac + '00').slice(0, 2));
  const up = Number((frac + '000').slice(2, 3)) >= 5 ? 1n : 0n;
  return sign * Number(cents + up) / 100;
}
