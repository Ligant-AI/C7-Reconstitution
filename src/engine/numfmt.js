import * as Dec from './decimal.js';
export function parseEntered(raw) {
    if (raw === null || raw === undefined)
        return null;
    if (typeof raw === 'number') {
        if (!Number.isFinite(raw))
            return { invalid: true, text: String(raw) };
        return { text: String(raw), value: raw, dec: Dec.fromNumberExact(raw) };
    }
    const text = String(raw).trim().replace(/,/g, '').replace(/−/g, '-');
    if (text === '')
        return null;
    const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === '')))
        return { invalid: true, text };
    const base = Dec.fromString(`${m[1]}${m[2] || '0'}${m[3] !== undefined ? `.${m[3]}` : ''}`);
    const dec = m[4] ? Dec.shift(base, Number(m[4])) : base;
    const value = Number(text);
    if (value === Infinity || (value === 0 && Dec.sign(dec) > 0))
        return { text, value, dec, unrepresentable: true };
    if (!Number.isFinite(value))
        return { invalid: true, text };
    return { text, value, dec };
}
export function roundDec(x, n) {
    return Dec.roundSig(Dec.fromNumberExact(x), n);
}
export function roundDecDirected(x, n, dir) {
    if (!(x > 0))
        throw new Error(`roundDecDirected: expects a positive value, got ${x}`);
    const d = Dec.fromNumberExact(x);
    const digits = d.mant.toString();
    if (digits.length <= n)
        return Dec.roundSig(d, n);
    const drop = digits.length - n;
    let kept = BigInt(digits.slice(0, n));
    let exp = d.exp + drop;
    const inexact = /[1-9]/.test(digits.slice(n));
    if (dir === 'up' && inexact) {
        kept += 1n;
        if (kept.toString().length > n) {
            kept /= 10n;
            exp += 1;
        }
    }
    else if (dir !== 'up' && dir !== 'down')
        throw new Error(`roundDecDirected: direction ${dir}`);
    return { neg: false, mant: kept, exp };
}
export function sigDirected(x, n, dir) {
    return Dec.toString(roundDecDirected(x, n, dir));
}
export function signedPctUp(f, n = 3) {
    if (f === 0)
        return '0';
    const mag = roundDecDirected(Math.abs(f), n, f > 0 ? 'up' : 'down');
    const s = Dec.toString(Dec.shift(mag, 2));
    return f > 0 ? `+${s}` : `-${s}`;
}
export function gridDistance(x, n) {
    const d = Dec.fromNumberExact(x);
    const down = roundDecDirected(x, n, 'down');
    const up = roundDecDirected(x, n, 'up');
    const a = Dec.abs(Dec.sub(d, down));
    const b = Dec.abs(Dec.sub(up, d));
    return Dec.toString(Dec.trimZeros(Dec.cmp(a, b) <= 0 ? a : b));
}
export function sig(x, n) {
    return Dec.toString(roundDec(x, n));
}
export function pct(f, n = 3) {
    if (f === 0)
        return '0';
    return Dec.toString(Dec.shift(roundDec(f, n), 2));
}
export function signedPct(f, n = 3) {
    const s = pct(f, n);
    return f > 0 ? `+${s}` : s;
}
export function tieDistance(x, n) {
    const d = Dec.abs(Dec.fromNumberExact(x));
    if (Dec.isZero(d))
        return '0';
    const digits = d.mant.toString();
    const drop = digits.length - n;
    const stepExp = d.exp + drop;
    const truncated = drop > 0 ? { neg: false, mant: BigInt(digits.slice(0, n)), exp: stepExp } : d;
    const tie = Dec.add(truncated, { neg: false, mant: 5n, exp: stepExp - 1 });
    return Dec.toString(Dec.trimZeros(Dec.abs(Dec.sub(d, tie))));
}
export { Dec };
