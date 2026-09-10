# Data

Two kinds of data live under this directory, and the distinction is the whole point.

| Path | Contains | Committed? |
| --- | --- | --- |
| `data/private/` | Raw CSV exports from the reservations sheet — names, WhatsApp numbers | **Never.** Ignored via `.gitignore` |
| `data/results.json` | Counts and distributions only | Yes, after review |

`data/private/` is listed in [`.gitignore`](../.gitignore). Do not remove that entry, and do not
force-add anything from inside it.

## Refreshing the public results

**1. Export the sheet.**
In the `Primeiro Saque - Reservas` spreadsheet: `File → Download → Comma-separated values (.csv)`.
Save it as `data/private/reservas.csv`. Keep the header row.

**2. Run the aggregation.**

```bash
npm run aggregate
```

Or with explicit paths:

```bash
node scripts/aggregate.mjs --in data/private/reservas.csv --out data/results.json
```

Useful flags:

| Flag | Purpose |
| --- | --- |
| `--in <path>` | Source CSV (default `data/private/reservas.csv`) |
| `--out <path>` | Destination JSON (default `data/results.json`) |
| `--stdout` | Print to stdout instead of writing a file — good for a dry run |
| `--paid-media-spend <n>` | Spend in BRL. Not derivable from the sheet, so it must be passed in. Currently `0` |

**3. Read the diff before committing.**

```bash
git diff data/results.json
```

The script refuses to write anything that looks personal — see `assertNoPii` in
[`scripts/aggregate.mjs`](../scripts/aggregate.mjs) — but that check is a safety net, not a
substitute for looking. Scan the neighbourhood keys in particular: someone may have typed
something identifying into a free-text field.

**4. Commit only `data/results.json`.**

## What the script guarantees

- No name, phone number or user agent reaches the output. The PII guard rejects phone-shaped
  values, long digit runs, any string matching a name in the source, and the forbidden column
  names outright.
- Repeat submissions are detected by hashing the phone number (SHA-256, truncated). The hash is
  used to count unique contacts and is then discarded — it is never written to the file.
- Output ordering is deterministic, so a re-run with unchanged data produces a diff limited to
  `generated_at`.

## What it does not do

- It does not correct spelling. `Alto de Pinheiros` and `Alto de oinheiros` are counted
  separately, because silently merging them would be guessing about someone's intent. Casing and
  accents *are* normalised.
- It does not judge whether a submission is genuine. Every row in the sheet is counted.
- It does not know about traffic. Sessions and funnel rates live in GA4, not here.
