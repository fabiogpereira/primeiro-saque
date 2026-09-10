#!/usr/bin/env node
/**
 * Turn a raw lead export into publishable aggregate statistics.
 *
 * Reads a CSV exported from the reservations sheet (which contains names and
 * phone numbers) and writes counts only. Personal data never leaves
 * `data/private/`, and `assertNoPii` fails the run if anything resembling a
 * name or a phone number reaches the output.
 *
 *   npm run aggregate -- --in data/private/reservas.csv --out data/results.json
 *
 * See data/README.md for the full workflow.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseCsvRecords } from './csv.mjs';

const DEFAULT_IN = 'data/private/reservas.csv';
const DEFAULT_OUT = 'data/results.json';

const MINOR_WORDS = ['de', 'do', 'da', 'dos', 'das', 'e'];

/** Lowercase, strip accents, collapse whitespace. */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Display form for a neighbourhood, so "VILA MARIANA" and "vila mariana" merge. */
export function normalizeBairro(value) {
  const base = normalizeText(value);
  if (!base) return 'Nao informado';
  return base
    .split(' ')
    .map((w) => (MINOR_WORDS.includes(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

/** Split the multi-select racket column into individual model names. */
export function splitRackets(value) {
  return String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Stable pseudonymous key for a contact, used only to count repeat
 * submissions. The digest itself is never written to the output.
 */
export function contactKey(record) {
  const phone = String(record.whatsapp ?? '').replace(/\D/g, '');
  const seed = phone || normalizeText(record.nome);
  if (!seed) return null;
  return createHash('sha256').update(seed).digest('hex').slice(0, 16);
}

/** Count occurrences, sorted by count then alphabetically for deterministic output. */
function tally(values) {
  const counts = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

function toNumber(value) {
  const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function median(numbers) {
  if (numbers.length === 0) return 0;
  const s = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function isoDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Build the public aggregate from parsed records.
 *
 * `meta` carries facts that are not derivable from the CSV — currently only
 * paid media spend, which is tracked outside the sheet.
 */
export function aggregate(records, meta = {}) {
  const rows = records.filter((r) => Object.values(r).some((v) => v !== ''));

  const keys = rows.map(contactKey).filter(Boolean);
  const uniqueContacts = new Set(keys).size;

  const dates = rows
    .map((r) => isoDate(r.timestamp))
    .filter(Boolean)
    .sort();

  const counts = rows.map((r) => {
    const declared = toNumber(r.qtd_raquetes);
    return declared > 0 ? declared : splitRackets(r.raquetes).length;
  });

  const values = rows.map((r) => toNumber(r.valor_total)).filter((v) => v > 0);
  const total = values.reduce((a, b) => a + b, 0);

  return {
    generated_at: new Date().toISOString(),
    source_rows: rows.length,

    responses: rows.length,
    unique_contacts: uniqueContacts,
    repeat_submissions: rows.length - uniqueContacts,
    acquisition: meta.acquisition ?? 'organic',
    paid_media_spend: meta.paid_media_spend ?? 0,

    window: {
      first_submission: dates[0] ?? null,
      last_submission: dates[dates.length - 1] ?? null,
    },

    racket_count_distribution: tally(counts.map(String)),
    urgency_distribution: tally(rows.map((r) => r.urgencia || 'Nao informado')),
    racket_preferences: tally(rows.flatMap((r) => splitRackets(r.raquetes))),
    geographic_distribution: tally(rows.map((r) => normalizeBairro(r.bairro))),
    submissions_by_month: tally(dates.map((d) => d.slice(0, 7))),

    // Sum of the prices attached to each request. This is requested value,
    // not revenue: nobody has been charged. See docs/results.md.
    requested_weekly_value_brl: {
      total,
      mean: values.length ? Math.round(total / values.length) : 0,
      median: median(values),
    },
  };
}

/**
 * Fail loudly if the aggregate carries anything personal.
 *
 * Checks the serialized output for phone-shaped digit runs and for any name
 * that appeared in the source. This is the last line of defence before a file
 * gets committed to a public repository.
 */
export function assertNoPii(result, records = []) {
  const serialized = JSON.stringify(result);
  const problems = [];

  if (/\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}/.test(serialized)) {
    problems.push('output contains a phone-shaped value');
  }
  if (/\d{7,}/.test(serialized)) {
    problems.push('output contains a long digit run');
  }

  const haystack = normalizeText(serialized);
  for (const rec of records) {
    const name = normalizeText(rec.nome);
    if (name.length >= 6 && haystack.includes(name)) {
      problems.push('output contains a value matching a name from the source');
      break;
    }
  }

  for (const forbidden of ['nome', 'whatsapp', 'user_agent']) {
    if (Object.prototype.hasOwnProperty.call(result, forbidden)) {
      problems.push('output has a "' + forbidden + '" key');
    }
  }

  if (problems.length) {
    throw new Error('PII check failed:\n  - ' + problems.join('\n  - '));
  }
  return true;
}

function parseArgs(argv) {
  const args = { in: DEFAULT_IN, out: DEFAULT_OUT, paidMediaSpend: 0, stdout: false };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=');
    const next = () => (inline === undefined ? argv[++i] : inline);
    if (flag === '--in') args.in = next();
    else if (flag === '--out') args.out = next();
    else if (flag === '--paid-media-spend') args.paidMediaSpend = Number(next());
    else if (flag === '--stdout') args.stdout = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  let csv;
  try {
    csv = readFileSync(args.in, 'utf8');
  } catch {
    console.error('Could not read ' + args.in);
    console.error('Export the reservations sheet as CSV into data/private/ first.');
    console.error('See data/README.md.');
    process.exit(1);
  }

  const { records } = parseCsvRecords(csv);
  if (records.length === 0) {
    console.error(args.in + ' has no data rows.');
    process.exit(1);
  }

  const result = aggregate(records, { paid_media_spend: args.paidMediaSpend });
  assertNoPii(result, records);

  const json = JSON.stringify(result, null, 2) + '\n';
  if (args.stdout) {
    process.stdout.write(json);
    return;
  }

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, json, 'utf8');

  console.log('Read ' + records.length + ' rows from ' + args.in);
  console.log('Wrote aggregate to ' + args.out);
  console.log('  responses:       ' + result.responses);
  console.log('  unique contacts: ' + result.unique_contacts);
  console.log('  repeat rows:     ' + result.repeat_submissions);
  console.log('PII check passed. Review the file before committing.');
}

if (process.argv[1] && process.argv[1].endsWith('aggregate.mjs')) {
  main();
}
