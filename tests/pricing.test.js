import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcPrice, savings, priceDetail, PRICES, PER_EXTRA } from '../assets/js/core.js';

test('published tiers match the prices shown on the landing page', () => {
  assert.equal(calcPrice(1), 250);
  assert.equal(calcPrice(2), 450);
  assert.equal(calcPrice(3), 600);
});

test('each tier is cheaper per racket than the one before it', () => {
  const perRacket = [1, 2, 3].map((n) => calcPrice(n) / n);
  assert.ok(perRacket[1] < perRacket[0], '2 rackets must beat 1');
  assert.ok(perRacket[2] < perRacket[1], '3 rackets must beat 2');
});

test('savings match the copy in the pricing section', () => {
  assert.equal(savings(2), 50);
  assert.equal(savings(3), 150);
  assert.equal(savings(1), 0);
});

test('rackets beyond the third are linear at PER_EXTRA', () => {
  assert.equal(calcPrice(4), PRICES[3] + PER_EXTRA);
  assert.equal(calcPrice(6), PRICES[3] + 3 * PER_EXTRA);
});

test('price is zero or non-negative for empty and invalid selections', () => {
  for (const n of [0, -1, -99, NaN, Infinity, undefined, null, 'three']) {
    assert.equal(calcPrice(n), 0, `calcPrice(${String(n)})`);
  }
});

test('price never decreases as rackets are added', () => {
  for (let n = 1; n <= 10; n++) {
    assert.ok(calcPrice(n) >= calcPrice(n - 1), `monotonic at ${n}`);
  }
});

test('caption reflects the current selection', () => {
  assert.match(priceDetail(0), /Selecione ao menos 1/);
  assert.match(priceDetail(1), /teste único/);
  assert.equal(priceDetail(2), '2 raquetes · economia de R$ 50');
  assert.equal(priceDetail(3), '3 raquetes · economia de R$ 150');
  assert.match(priceDetail(5), /pacote estendido/);
});
