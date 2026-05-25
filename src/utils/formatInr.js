/** Format INR for auction UI; avoids broken display for absurd values. */

export function formatInr(amount, { max = null } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (max != null && n > max) {
    return `>${formatInr(max)}`;
  }
  if (n >= 1e12) return 'Invalid amount';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function clampBidInput(value, min, max) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return { valid: false, value: null };
  if (n < min) return { valid: false, value: n, error: `Minimum bid is ${formatInr(min)}` };
  if (n > max) return { valid: false, value: n, error: `Maximum bid is ${formatInr(max)}` };
  return { valid: true, value: n };
}
