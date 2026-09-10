import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskPhone,
  isValidBrPhone,
  validateReservation,
  looksLikeFormula,
  sanitizeForSheet,
  isLikelyBot,
  buildPayload,
  MIN_SUBMIT_MS,
} from '../assets/js/core.js';

const valid = {
  nome: 'Fabio Pereira',
  whatsapp: '(11) 99999-9999',
  raquetes: ['Wilson Blade 98 18x20 V9'],
  urgencia: 'Esta semana',
  bairro: 'Pinheiros',
};

test('phone mask formats progressively as the user types', () => {
  assert.equal(maskPhone(''), '');
  assert.equal(maskPhone('1'), '(1');
  assert.equal(maskPhone('11'), '(11');
  assert.equal(maskPhone('1199'), '(11) 99');
  assert.equal(maskPhone('1199999'), '(11) 9999-9');
  assert.equal(maskPhone('11999999999'), '(11) 99999-9999');
});

test('phone mask ignores non-digits and extra digits', () => {
  assert.equal(maskPhone('(11) 99999-9999'), '(11) 99999-9999');
  assert.equal(maskPhone('11999999999999'), '(11) 99999-9999');
  assert.equal(maskPhone('abc'), '');
});

test('accepts plausible Brazilian numbers', () => {
  assert.ok(isValidBrPhone('(11) 99999-8888'));
  assert.ok(isValidBrPhone('11999998888'));
  assert.ok(isValidBrPhone('(19) 3234-5678'), 'landline');
});

test('rejects implausible numbers', () => {
  assert.equal(isValidBrPhone('123'), false, 'too short');
  assert.equal(isValidBrPhone('(01) 99999-8888'), false, 'invalid area code');
  assert.equal(isValidBrPhone('11899998888'), false, '11 digits not starting with 9');
  assert.equal(isValidBrPhone('11111111111'), false, 'repeated digits');
  assert.equal(isValidBrPhone(''), false);
});

test('a complete reservation passes', () => {
  assert.deepEqual(validateReservation(valid), { valid: true, errors: {} });
});

test('each required field is enforced', () => {
  const cases = {
    nome: { ...valid, nome: ' ' },
    whatsapp: { ...valid, whatsapp: '119' },
    raquetes: { ...valid, raquetes: [] },
    urgencia: { ...valid, urgencia: 'Amanhã de manhã' },
    bairro: { ...valid, bairro: '' },
  };
  for (const [field, input] of Object.entries(cases)) {
    const { valid: ok, errors } = validateReservation(input);
    assert.equal(ok, false, `${field} should fail`);
    assert.ok(errors[field], `${field} should carry a message`);
  }
});

test('rejects more rackets than the catalogue holds', () => {
  const { valid: ok } = validateReservation({ ...valid, raquetes: ['a', 'b', 'c', 'd', 'e'] });
  assert.equal(ok, false);
});

test('rejects absurdly long free-text fields', () => {
  assert.equal(validateReservation({ ...valid, nome: 'a'.repeat(200) }).valid, false);
  assert.equal(validateReservation({ ...valid, bairro: 'a'.repeat(200) }).valid, false);
});

test('handles a missing payload without throwing', () => {
  assert.equal(validateReservation().valid, false);
  assert.equal(validateReservation({}).valid, false);
});

test('detects spreadsheet formula injection', () => {
  for (const s of ['=IMPORTXML(A1,"//a")', '+1+1', '-2', '@SUM(A1)', '\tcmd']) {
    assert.ok(looksLikeFormula(s), `${s} should be flagged`);
  }
  for (const s of ['Fabio', 'Vila Mariana', 'R$ 250', '']) {
    assert.equal(looksLikeFormula(s), false, `${s} should be fine`);
  }
});

test('formula-like input is rejected in the form and escaped in the payload', () => {
  assert.equal(validateReservation({ ...valid, nome: '=IMPORTXML(A1,"//a")' }).valid, false);
  assert.equal(sanitizeForSheet('=IMPORTXML(A1,"//a")'), '\'=IMPORTXML(A1,"//a")');
  assert.equal(sanitizeForSheet('Fabio'), 'Fabio');
});

test('bot heuristics catch honeypots and instant submissions', () => {
  assert.ok(isLikelyBot({ honeypot: 'http://spam.example', elapsedMs: 60_000 }));
  assert.ok(isLikelyBot({ honeypot: '', elapsedMs: 10 }));
  assert.equal(isLikelyBot({ honeypot: '', elapsedMs: MIN_SUBMIT_MS + 1 }), false);
  assert.equal(isLikelyBot({}), false, 'missing timing must not block a real person');
});

test('payload carries only what the experiment needs', () => {
  const payload = buildPayload(valid, new Date('2026-04-14T00:08:49.263Z'));
  assert.deepEqual(Object.keys(payload).sort(), [
    'bairro',
    'nome',
    'qtd_raquetes',
    'raquetes',
    'timestamp',
    'urgencia',
    'valor_total',
    'whatsapp',
  ]);
  assert.equal(payload.valor_total, 250);
  assert.equal(payload.qtd_raquetes, 1);
  assert.equal(payload.timestamp, '2026-04-14T00:08:49.263Z');
  assert.ok(!('user_agent' in payload), 'user agent is no longer collected');
});
