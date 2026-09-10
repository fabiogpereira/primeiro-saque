/**
 * Minimal RFC 4180 CSV reader.
 *
 * Google Sheets exports quoted fields with embedded commas, newlines and
 * doubled quotes, so a naive `split(',')` corrupts rows. Small enough to keep
 * the repository dependency-free and to test directly.
 */

/** Parse CSV text into an array of string arrays. */
export function parseCsv(text) {
  const src = String(text ?? '').replace(/^\uFEFF/, ''); // strip BOM
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let i = 0;
  let started = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    started = false;
  };

  while (i < src.length) {
    const ch = src[i];

    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"' && field === '') {
      quoted = true;
      started = true;
      i++;
      continue;
    }
    if (ch === ',') {
      endField();
      started = true;
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      endRow();
      i++;
      continue;
    }
    field += ch;
    started = true;
    i++;
  }

  if (started || field !== '' || row.length > 0) endRow();
  return rows;
}

/**
 * Parse CSV into objects keyed by the header row.
 * Headers are lowercased and trimmed so `Timestamp` and `timestamp` both work.
 */
export function parseCsvRecords(text) {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const records = rows.slice(1).map((cells) => {
    const rec = {};
    headers.forEach((h, idx) => {
      rec[h] = (cells[idx] ?? '').trim();
    });
    return rec;
  });
  return { headers, records };
}
