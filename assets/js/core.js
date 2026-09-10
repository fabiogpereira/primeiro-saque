/**
 * Primeiro Saque — pure domain logic shared by the landing page and the tests.
 *
 * Everything in this file is deliberately free of DOM access so it can be
 * imported directly by `node --test`. The landing page loads it as an ES
 * module and wires it to the reservation modal; no build step is involved.
 */

/** Weekly price in BRL for 1, 2 and 3 rackets. */
export const PRICES = Object.freeze({ 1: 250, 2: 450, 3: 600 });

/** Each racket beyond the third adds this much to the weekly price. */
export const PER_EXTRA = 200;

/** Rackets currently in the catalogue — the ceiling for a single request. */
export const MAX_RACKETS = 4;

/** Accepted values for the urgency question. */
export const URGENCY_OPTIONS = Object.freeze(['Esta semana', 'Próximas 2 semanas', 'Só avaliando']);

/**
 * A human filling this form realistically needs more than a few seconds.
 * Anything faster is almost certainly automated. See docs/security-privacy.md.
 */
export const MIN_SUBMIT_MS = 2500;

/**
 * Weekly price for `n` rackets.
 *
 * Tiers 1-3 are priced explicitly (each step is cheaper per racket, which is
 * the nudge toward the comparison tier). Beyond three we extrapolate linearly
 * rather than inventing another tier.
 */
export function calcPrice(n) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  const count = Math.floor(n);
  if (count <= 3) return PRICES[count];
  return PRICES[3] + (count - 3) * PER_EXTRA;
}

/** Discount versus buying the same number of rackets as single-racket tests. */
export function savings(n) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  const count = Math.floor(n);
  return Math.max(0, count * PRICES[1] - calcPrice(count));
}

/** Caption shown under the live total in the reservation modal. */
export function priceDetail(n) {
  const count = Number.isFinite(n) ? Math.floor(n) : 0;
  if (count <= 0) return 'Selecione ao menos 1 raquete';
  if (count === 1) return '1 raquete · teste único';
  if (count === 2 || count === 3) {
    return `${count} raquetes · economia de R$ ${savings(count)}`;
  }
  return `${count} raquetes · pacote estendido`;
}

/** Strip everything that is not a digit. */
export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * Progressive Brazilian phone mask, applied as the user types.
 * Produces `(11) 99999-9999` for mobiles and `(11) 9999-9999` for landlines.
 */
export function maskPhone(value) {
  const v = digitsOnly(value).slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5}).*/, '($1) $2');
  if (v.length > 0) return v.replace(/(\d{0,2}).*/, '($1');
  return '';
}

/**
 * Brazilian phone plausibility check.
 *
 * Deliberately loose: 10 or 11 digits, a real area code, and an 11-digit
 * number must start with 9 (mobile). We are measuring interest, not
 * provisioning a phone line — over-strict validation would drop real leads.
 */
export function isValidBrPhone(value) {
  const v = digitsOnly(value);
  if (v.length !== 10 && v.length !== 11) return false;
  const ddd = Number(v.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (v.length === 11 && v[2] !== '9') return false;
  if (/^(\d)\1+$/.test(v)) return false; // 11111111111 and friends
  return true;
}

/**
 * True when a string would be interpreted as a formula by a spreadsheet.
 * The sheet is the system of record, so this input never gets there unescaped.
 */
export function looksLikeFormula(value) {
  const raw = String(value ?? '');
  // Tab and CR are checked against the raw string: trimming would strip the
  // very character that makes the value dangerous. The other prefixes are also
  // checked after trimming, because spreadsheets ignore leading spaces.
  return /^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(raw.trim());
}

/** Escape a value so a spreadsheet treats it as text, never as a formula. */
export function sanitizeForSheet(value) {
  const s = String(value ?? '');
  return looksLikeFormula(s) ? `'${s}` : s;
}

/**
 * Validate a reservation payload.
 *
 * Returns `{ valid, errors }` where `errors` maps a field name to a
 * pt-BR message ready to show in the modal. Field order matters: the modal
 * surfaces the first error only.
 */
export function validateReservation(input = {}) {
  const errors = {};

  const nome = String(input.nome ?? '').trim();
  if (nome.length < 2) {
    errors.nome = 'Informe seu nome completo.';
  } else if (nome.length > 80) {
    errors.nome = 'Nome muito longo.';
  } else if (!/\p{L}/u.test(nome) || looksLikeFormula(nome)) {
    errors.nome = 'Informe um nome válido.';
  }

  if (!isValidBrPhone(input.whatsapp)) {
    errors.whatsapp = 'Informe um WhatsApp válido com DDD.';
  }

  const raquetes = Array.isArray(input.raquetes) ? input.raquetes : [];
  if (raquetes.length === 0) {
    errors.raquetes = 'Selecione ao menos uma raquete para testar.';
  } else if (raquetes.length > MAX_RACKETS) {
    errors.raquetes = 'Selecione no máximo ' + MAX_RACKETS + ' raquetes.';
  }

  if (!URGENCY_OPTIONS.includes(input.urgencia)) {
    errors.urgencia = 'Escolha quando você gostaria de começar.';
  }

  const bairro = String(input.bairro ?? '').trim();
  if (bairro.length < 2) {
    errors.bairro = 'Informe seu bairro em São Paulo.';
  } else if (bairro.length > 60) {
    errors.bairro = 'Bairro muito longo.';
  } else if (looksLikeFormula(bairro)) {
    errors.bairro = 'Informe um bairro válido.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Heuristics that mark a submission as automated. Kept separate from
 * `validateReservation` because a bot gets a fake success screen rather than
 * an error message — telling a bot why it failed only helps it retry.
 */
export function isLikelyBot({ honeypot, elapsedMs } = {}) {
  if (String(honeypot ?? '').trim() !== '') return true;
  if (Number.isFinite(elapsedMs) && elapsedMs < MIN_SUBMIT_MS) return true;
  return false;
}

/** Build the payload posted to the Apps Script endpoint. */
export function buildPayload(input, now = new Date()) {
  const raquetes = Array.isArray(input.raquetes) ? input.raquetes : [];
  return {
    nome: sanitizeForSheet(String(input.nome ?? '').trim()),
    whatsapp: sanitizeForSheet(String(input.whatsapp ?? '').trim()),
    raquetes: sanitizeForSheet(raquetes.join(', ')),
    qtd_raquetes: raquetes.length,
    urgencia: sanitizeForSheet(String(input.urgencia ?? '')),
    bairro: sanitizeForSheet(String(input.bairro ?? '').trim()),
    valor_total: calcPrice(raquetes.length),
    timestamp: now.toISOString(),
  };
}
