# Backend Setup — Google Apps Script

Estimated time: **5 minutes**. Cost: **zero**. The data lives in a spreadsheet in your own Google
Drive.

Google menu labels are given in Portuguese, matching the account this was set up on.

> **If you already have this running:** the `doPost` below is a hardened replacement for the
> original. It fixes a live formula-injection vulnerability
> ([F1](docs/security-privacy.md#f1--spreadsheet-formula-injection-fixed)) and adds server-side
> validation. Replace the script and create a **new deployment**.

## 1. Create the spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it `Primeiro Saque - Reservas`.
3. Put these headers in row 1, one per column:

```
timestamp | nome | whatsapp | raquetes | qtd_raquetes | urgencia | bairro | valor_total | user_agent
```

The `user_agent` column is kept for historical rows only. It is
[no longer collected](docs/security-privacy.md#f5--user_agent-collected-without-purpose) and new
rows will leave it blank.

## 2. Paste the script

In the spreadsheet: **Extensões → Apps Script**. Delete the default code and paste this:

```javascript
/**
 * Primeiro Saque — reservation intake.
 *
 * This is the real trust boundary. The landing page runs the same validation,
 * but anyone can POST here directly, so nothing the client says is believed.
 */

var MAX_LENGTHS = { nome: 80, whatsapp: 20, raquetes: 200, urgencia: 40, bairro: 60 };
var VALID_URGENCY = ['Esta semana', 'Próximas 2 semanas', 'Só avaliando'];
var MAX_RACKETS = 4;
var DUPLICATE_WINDOW_MS = 60 * 1000;

/**
 * Neutralise spreadsheet formula injection.
 *
 * Sheets evaluates any cell starting with = + - @, so a submitted name like
 * =IMPORTXML(...) would run with the owner's permissions and could exfiltrate
 * the whole lead list. Prefixing with an apostrophe forces text.
 *
 * The raw string is tested, not a trimmed one: trimming would strip the very
 * leading tab that makes a tab-prefixed value dangerous.
 */
function sanitize(value, maxLength) {
  var s = String(value == null ? '' : value).slice(0, maxLength || 200);
  if (/^[=+\-@\t\r]/.test(s) || /^[=+\-@]/.test(s.trim())) return "'" + s;
  return s;
}

function jsonOut(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Reject a payload that repeats an identical one within the last minute. */
function isDuplicate(fingerprint) {
  var cache = CacheService.getScriptCache();
  var key =
    'fp_' +
    Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fingerprint)
    ).slice(0, 40);
  if (cache.get(key)) return true;
  cache.put(key, '1', Math.ceil(DUPLICATE_WINDOW_MS / 1000));
  return false;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'empty request' });
    }

    var data = JSON.parse(e.postData.contents);

    // Honeypot: a real person never sees this field, so any value means a bot.
    // Answer 200 so the caller learns nothing from being rejected.
    if (String(data.website || '').trim() !== '') {
      return jsonOut({ ok: true });
    }

    var nome = String(data.nome || '').trim();
    var whatsapp = String(data.whatsapp || '').trim();
    var raquetes = String(data.raquetes || '').trim();
    var bairro = String(data.bairro || '').trim();
    var urgencia = String(data.urgencia || '').trim();

    if (nome.length < 2 || bairro.length < 2 || !raquetes) {
      return jsonOut({ ok: false, error: 'missing required fields' });
    }

    var digits = whatsapp.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 11) {
      return jsonOut({ ok: false, error: 'invalid phone' });
    }

    if (VALID_URGENCY.indexOf(urgencia) === -1) {
      return jsonOut({ ok: false, error: 'invalid urgency' });
    }

    var count = Number(data.qtd_raquetes) || raquetes.split(',').length;
    if (count < 1 || count > MAX_RACKETS) {
      return jsonOut({ ok: false, error: 'invalid racket count' });
    }

    if (isDuplicate(nome + '|' + digits + '|' + raquetes)) {
      return jsonOut({ ok: true, duplicate: true });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      sanitize(nome, MAX_LENGTHS.nome),
      sanitize(whatsapp, MAX_LENGTHS.whatsapp),
      sanitize(raquetes, MAX_LENGTHS.raquetes),
      count,
      sanitize(urgencia, MAX_LENGTHS.urgencia),
      sanitize(bairro, MAX_LENGTHS.bairro),
      Number(data.valor_total) || 0,
      '', // user_agent: no longer collected
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

/** Nothing is served over GET. */
function doGet() {
  return jsonOut({ ok: true, service: 'primeiro-saque-intake' });
}
```

Save (Ctrl+S) and name the project `Primeiro Saque`.

## 3. Deploy as a Web App

1. **Implantar → Nova implantação**.
2. Click the gear next to "Selecionar tipo" → **App da Web**.
3. Fill in:
   - Description: `Reservas LP`
   - Execute as: **Eu** (your account)
   - Who has access: **Qualquer pessoa**
4. **Implantar**.
5. Authorise. The "app não verificado" warning is expected — it is your own script.
   Click _Avançado → Acessar projeto não seguro_.
6. Copy the **Web App URL** (it ends in `/exec`).

> "Qualquer pessoa" is required: the request comes from a visitor's browser with no Google session.
> The endpoint is public by design — see
> [F4](docs/security-privacy.md#f4--open-unauthenticated-write-endpoint) for how it is defended.

## 4. Connect it to the page

In [index.html](index.html), inside the module script near the end of the file:

```javascript
const ENDPOINT = 'https://script.google.com/macros/s/.../exec';
```

Paste your URL between the quotes.

## 5. Test it

1. Serve the site: `npm run serve`, then open <http://localhost:8000>.
2. Click any "Reservar meu teste" / "Quero testar".
3. Fill in the form and submit — take more than 2.5 seconds, or the
   [timing check](docs/security-privacy.md#endpoint-hardening) will treat you as a bot and silently
   discard it.
4. Check the spreadsheet. The row should appear within seconds.

Worth testing the hardening too: submit `=1+1` as the name. It should be rejected in the browser,
and if forced through, land in the sheet as text prefixed with an apostrophe rather than as a
formula.

## Notes

- **Editing the script requires a new deployment.** Saving is not enough, and each new deployment
  gets a new URL that must be pasted into `index.html`. This is a silent failure mode: the old
  deployment simply stops receiving with no visible error.
- **With `ENDPOINT` empty**, the form runs in simulated mode — logs to the console and shows the
  success screen. Useful for local development.
- **The page cannot see whether the write succeeded.** Apps Script sends no CORS headers, so the
  request goes out with `mode: 'no-cors'` and the response is opaque. Submissions can fail
  silently, which is why the recorded count is treated as a floor. See
  [architecture.md](docs/architecture.md#known-limitations).
- **To analyse the data**, do not read the sheet by hand — export it and run
  `npm run aggregate`, which produces counts with no personal data. See [data/README.md](data/README.md).
