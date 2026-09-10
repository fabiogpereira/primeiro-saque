import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, parseCsvRecords } from '../scripts/csv.mjs';
import {
  aggregate,
  assertNoPii,
  contactKey,
  normalizeBairro,
  normalizeText,
  splitRackets,
} from '../scripts/aggregate.mjs';

// Synthetic fixtures. No real lead data is ever committed to this repository.
const HEADER = 'timestamp,nome,whatsapp,raquetes,qtd_raquetes,urgencia,bairro,valor_total';
const CSV = [
  HEADER,
  '2026-04-14T00:08:49.263Z,Ana Souza,(11) 90000-0001,Yonex VCORE 98 8th Gen,1,Esta semana,Pinheiros,250',
  '2026-05-02T10:00:00.000Z,Bruno Lima,(11) 90000-0002,"Wilson Blade 98 18x20 V9, Head Speed MP 2026",2,Proximas 2 semanas,Vila Mariana,450',
  '2026-05-11T10:00:00.000Z,Ana Souza,(11) 90000-0001,Head Speed MP 2026,1,So avaliando,PINHEIROS,250',
  '2026-06-01T10:00:00.000Z,Carla Dias,(11) 90000-0003,Yonex VCORE 98 8th Gen,1,Esta semana,vila mariana,250',
].join('\n');

const records = parseCsvRecords(CSV).records;

test('CSV parser handles quoted fields with embedded commas', () => {
  const rows = parseCsv('a,b\n1,"x, y"\n');
  assert.deepEqual(rows, [
    ['a', 'b'],
    ['1', 'x, y'],
  ]);
});

test('CSV parser handles doubled quotes and embedded newlines', () => {
  const rows = parseCsv('a\n"he said ""hi""\nagain"\n');
  assert.deepEqual(rows, [['a'], ['he said "hi"\nagain']]);
});

test('CSV parser strips a BOM and tolerates CRLF', () => {
  const rows = parseCsv('﻿a,b\r\n1,2\r\n');
  assert.deepEqual(rows, [
    ['a', 'b'],
    ['1', '2'],
  ]);
});

test('CSV parser returns nothing for empty input', () => {
  assert.deepEqual(parseCsvRecords(''), { headers: [], records: [] });
  assert.deepEqual(parseCsvRecords(HEADER).records, []);
});

test('records are keyed by lowercased headers', () => {
  assert.equal(records.length, 4);
  assert.equal(records[0].bairro, 'Pinheiros');
  assert.equal(records[1].raquetes, 'Wilson Blade 98 18x20 V9, Head Speed MP 2026');
});

test('neighbourhood casing and accents are merged', () => {
  assert.equal(normalizeBairro('PINHEIROS'), 'Pinheiros');
  assert.equal(normalizeBairro('vila  mariana'), 'Vila Mariana');
  assert.equal(normalizeBairro('Alto de Pinheiros'), 'Alto de Pinheiros');
  assert.equal(normalizeBairro('  '), 'Nao informado');
  assert.equal(normalizeText('Aclimação'), 'aclimacao');
});

test('multi-select rackets split into individual models', () => {
  assert.deepEqual(splitRackets('A, B ,C'), ['A', 'B', 'C']);
  assert.deepEqual(splitRackets(''), []);
});

test('repeat submissions from the same phone collapse to one contact', () => {
  const result = aggregate(records);
  assert.equal(result.responses, 4, 'every row is counted as a submission');
  assert.equal(result.unique_contacts, 3, 'Ana submitted twice');
  assert.equal(result.repeat_submissions, 1);
});

test('contact key is stable, phone-based and not reversible to the phone', () => {
  const a = contactKey({ whatsapp: '(11) 90000-0001', nome: 'Ana Souza' });
  const b = contactKey({ whatsapp: '11900000001', nome: 'Different Name' });
  assert.equal(a, b, 'formatting must not change the key');
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.ok(!a.includes('90000'), 'digest must not embed the number');
  assert.equal(contactKey({}), null);
});

test('distributions count what the experiment was designed to measure', () => {
  const r = aggregate(records);
  assert.deepEqual(r.racket_count_distribution, { 1: 3, 2: 1 });
  assert.deepEqual(r.urgency_distribution, {
    'Esta semana': 2,
    'Proximas 2 semanas': 1,
    'So avaliando': 1,
  });
  assert.equal(r.racket_preferences['Head Speed MP 2026'], 2);
  assert.equal(r.racket_preferences['Yonex VCORE 98 8th Gen'], 2);
  assert.deepEqual(r.geographic_distribution, { Pinheiros: 2, 'Vila Mariana': 2 });
  assert.deepEqual(r.submissions_by_month, {
    '2026-05': 2,
    '2026-04': 1,
    '2026-06': 1,
  });
});

test('requested value is summed but never called revenue', () => {
  const r = aggregate(records);
  assert.equal(r.requested_weekly_value_brl.total, 1200);
  assert.equal(r.requested_weekly_value_brl.mean, 300);
  assert.equal(r.requested_weekly_value_brl.median, 250);
  assert.ok(!('revenue' in r));
});

test('the submission window comes from the data', () => {
  const r = aggregate(records);
  assert.equal(r.window.first_submission, '2026-04-14');
  assert.equal(r.window.last_submission, '2026-06-01');
});

test('paid media spend defaults to zero and is not inferred from the sheet', () => {
  assert.equal(aggregate(records).paid_media_spend, 0);
  assert.equal(aggregate(records, { paid_media_spend: 500 }).paid_media_spend, 500);
});

test('empty input produces an honest empty aggregate rather than throwing', () => {
  const r = aggregate([]);
  assert.equal(r.responses, 0);
  assert.equal(r.unique_contacts, 0);
  assert.equal(r.window.first_submission, null);
  assert.deepEqual(r.racket_preferences, {});
});

test('the real aggregate passes the PII check', () => {
  assert.equal(assertNoPii(aggregate(records), records), true);
});

test('PII check rejects a leaked name', () => {
  const leaked = { ...aggregate(records), geographic_distribution: { 'Ana Souza': 1 } };
  assert.throws(() => assertNoPii(leaked, records), /matching a name/);
});

test('PII check rejects a leaked phone number', () => {
  const leaked = { ...aggregate(records), notes: '(11) 90000-0001' };
  assert.throws(() => assertNoPii(leaked, records), /phone-shaped|long digit run/);
});

test('PII check rejects forbidden columns even if empty', () => {
  assert.throws(() => assertNoPii({ ...aggregate(records), whatsapp: '' }, records), /whatsapp/);
  assert.throws(
    () => assertNoPii({ ...aggregate(records), user_agent: '' }, records),
    /user_agent/
  );
});

test('output is deterministic apart from the generation timestamp', () => {
  const a = aggregate(records);
  const b = aggregate(records);
  delete a.generated_at;
  delete b.generated_at;
  assert.deepEqual(a, b);
});
