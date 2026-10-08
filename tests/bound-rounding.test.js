// The rule for rounding a displayed bound, as signed: an upper ("at most")
// bound is rounded up and a lower ("at least") bound is rounded down, on the
// exact binary value (src/engine/numfmt.js roundDecDirected; determine.js uses
// 'up' for an at-most concentration and 'down' for an at-least final volume).
// Pins that the displayed figure is itself a bound: never below an upper bound,
// never above a lower bound, and unchanged when already on the grid.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sigDirected, roundDecDirected, signedPctUp, Dec } from '../src/engine/numfmt.js';

const exact = (x) => Dec.fromNumberExact(x);

test('an upper bound is rounded up (C7-FX-06: 79.9680128... at 6 sf)', () => {
  assert.equal(sigDirected(79.9680128, 6, 'up'), '79.9681');
});

test('a lower bound is rounded down, even past a half step', () => {
  assert.equal(sigDirected(1.2499, 3, 'down'), '1.24');
  assert.equal(sigDirected(1.2399999, 3, 'down'), '1.23');
  assert.equal(sigDirected(1.2401, 3, 'up'), '1.25');
});

test('a value on the grid is returned unchanged in either direction', () => {
  assert.equal(sigDirected(1.25, 3, 'up'), '1.25');
  assert.equal(sigDirected(1.25, 3, 'down'), '1.25');
});

test('rounding up carries through nines', () => {
  assert.equal(sigDirected(9.9951, 3, 'up'), '10.0');
});

test('the displayed bound never lies on the wrong side of the exact value', () => {
  const xs = [0.0584123, 0.941600, 79.9680128, 1.2499999999999998, 3.3333333, 123456.789, 7.0000001e-5];
  for (const x of xs) for (const n of [3, 6]) {
    const up = roundDecDirected(x, n, 'up'); const down = roundDecDirected(x, n, 'down');
    assert.ok(Dec.cmp(up, exact(x)) >= 0, `up(${x}, ${n}) below the value`);
    assert.ok(Dec.cmp(down, exact(x)) <= 0, `down(${x}, ${n}) above the value`);
  }
});

test('a signed upper-bound percentage rounds toward +infinity', () => {
  assert.equal(signedPctUp(0.0123451), '+1.24');
  assert.equal(signedPctUp(-0.0123451), '-1.23');
});

test('no other direction is accepted', () => {
  assert.throws(() => roundDecDirected(1.2345, 3, 'nearest'));
});
