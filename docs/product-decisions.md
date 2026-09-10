# Product Decision Records

Short records of the decisions that shaped the MVP: what was decided, why, what it cost, and what
would justify changing it.

Most of these were made in April 2026 during the build. A few were made during the September 2026
review of the repository and are marked as such. Where a decision was made on intuition rather
than analysis, the record says so — the reasoning below is reconstructed, and reconstruction is
generous to itself by nature.

| ID                                                                                   | Decision                                    | Status                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------- |
| [PDR-001](#pdr-001--fake-door-before-buying-inventory)                               | Fake door before buying inventory           | Accepted                          |
| [PDR-002](#pdr-002--show-real-prices-before-the-form)                                | Show real prices before the form            | Accepted                          |
| [PDR-003](#pdr-003--one-week-trials)                                                 | One-week trial period                       | Accepted                          |
| [PDR-004](#pdr-004--google-sheets-and-apps-script-instead-of-a-database)             | Sheets + Apps Script instead of a database  | Accepted                          |
| [PDR-005](#pdr-005--capture-urgency-and-neighbourhood)                               | Capture urgency and neighbourhood           | Accepted                          |
| [PDR-006](#pdr-006--no-payment-collection-in-the-fake-door)                          | No payment collection in the fake door      | Accepted, and the main limitation |
| [PDR-007](#pdr-007--single-html-file-tailwind-from-a-cdn)                            | Single HTML file, Tailwind from a CDN       | Accepted, with one carve-out      |
| [PDR-008](#pdr-008--publish-the-case-study-without-linking-it-from-the-landing-page) | Publish the case study unlinked from the LP | Accepted (Sept 2026)              |

---

## PDR-001 — Fake door before buying inventory

**Context.** A working version of this business needs frames (BRL 1,500–2,500 each, and you need
several per model to cover concurrent rentals), a stringing arrangement, delivery logistics across
São Paulo, payment processing, a deposit or insurance mechanism for damage, and someone to run it.
Realistically BRL 15,000–30,000 and several months before the first customer — all committed
against an untested assumption that anyone wants this at all.

**Decision.** Build a landing page that describes the service as if it were operating, capture
requests, and buy nothing.

**Reasoning.** The riskiest assumption was not _can this be built_ — it obviously can, none of it
is hard — but _does anyone want it_. Spending capital to answer a question that a static page can
approach for the cost of a domain is the wrong order of operations. A fake door also produces a
sharper signal than an interest survey: people are choosing specific models at specific prices,
which is a meaningfully more committed act than agreeing that a thing sounds nice.

**Trade-offs.**

- Measures stated interest, not willingness to pay. This is the fundamental ceiling of the method
  and the reason the [next experiment](results.md#next-experiment) exists.
- Creates an expectation in people who submitted real contact details. Managed through neutral
  success copy — see [PDR-006](#pdr-006--no-payment-collection-in-the-fake-door) — but not
  eliminated.
- Advertising a service that does not operate carries real CDC/CONAR exposure in Brazil.
- Costs credibility if handled badly. Someone who requests a trial and hears nothing is a person
  who now distrusts the brand.

**Revisit when.** Superseded once the pilot starts taking money. The fake door has produced what it
can.

---

## PDR-002 — Show real prices before the form

**Context.** Fake doors often hide pricing to maximise signups, on the theory that more leads is
more signal.

**Decision.** Display the full price table on the page, and show a live running total inside the
modal that updates as rackets are selected. Nobody can submit without having seen the number.

**Reasoning.** A lead who has not seen a price has agreed to nothing. Filtering for people who saw
BRL 250 and proceeded anyway produces far fewer submissions of far higher quality. Since the
purpose is deciding whether to invest real money, an inflated count of price-blind leads is worse
than useless — it is actively misleading, because it would justify a decision the data does not
support.

**Trade-offs.**

- Fewer submissions than a price-hidden variant would have produced.
- Anchors the market at BRL 250 with no test of whether BRL 150 or BRL 400 performs better.
- The prices were set by intuition about what feels defensible against a BRL 2,000 purchase, not
  by costing the service. `BRIEFING.md` calls them placeholders; they were never revised.

**Revisit when.** The pilot produces real logistics and stringing costs. At that point pricing
becomes a margin calculation instead of a guess, and a variant is worth testing.

---

## PDR-003 — One-week trials

**Context.** The trial period had to be long enough to be genuinely informative and short enough to
be economically viable. Candidates: a single session, a weekend, one week, one month.

**Decision.** One week.

**Reasoning.** Racket differences that matter — how a frame behaves when you are tired, against a
different opponent, on a different surface, when your timing is off — do not surface in one
session. A week covers two or three sessions for a typical club player, which is roughly the
minimum for a considered judgement.

It also happens to be the unit that makes the arithmetic legible in both directions: BRL 250 against
a BRL 2,000 purchase reads as about 12% of the risk being bought down, and one frame can turn over
roughly four times a month, which is what makes any inventory model conceivable at all.

**Trade-offs.**

- Caps utilisation at ~4 rentals per frame per month, which sets the whole capital requirement.
- Two logistics trips per rental against a BRL 250 ticket. May be margin-negative — genuinely
  unknown, and the largest open risk in the model.
- A week may be too short for a player who trains twice a week and hits a rainy fortnight.

**Revisit when.** Pilot data shows utilisation and delivery cost. If logistics dominate the ticket,
longer periods with higher prices spread the fixed trip cost over more days.

---

## PDR-004 — Google Sheets and Apps Script instead of a database

**Context.** Submissions had to be stored somewhere. Options ranged from a managed backend
(Supabase, Firebase) through a form service (Typeform, Tally) to a spreadsheet behind a script.

**Decision.** POST to a Google Apps Script Web App that appends a row to a Google Sheet.

**Reasoning.** The dataset was expected to be tens of rows, not thousands, and the primary
consumer was a person looking at it — not an application. A spreadsheet is the correct shape for
that: pivot tables, filters and charts come free, with no schema, no migrations, no hosting, no
credentials, and no monthly bill. Setup took minutes. A form service would have been comparable in
effort but would have taken the checkbox-driven live pricing calculation off the table, and that
calculation is the mechanism testing H3.

The general principle: at 38 rows, the bottleneck is _interpreting_ data, not storing it. Choosing
infrastructure for a scale you have not reached costs you time you should be spending on the
question.

**Trade-offs.**

- Apps Script sends no CORS headers, so the client posts with `mode: 'no-cors'` and cannot see
  whether the write succeeded. Failed submissions are invisible — the count is a floor. This is a
  real data-quality cost, not a cosmetic one.
- No validation at the storage layer beyond what the script does.
- `appendRow` writes user input into a spreadsheet, which was a live formula-injection
  vulnerability until the September 2026 review. See
  [security-privacy.md](security-privacy.md#f1--spreadsheet-formula-injection-fixed).
- Personal data sits in a personal Google Drive with no retention policy.
- Redeploying Apps Script issues a new URL, which must be pasted into the page by hand.

**Revisit when.** Money changes hands. A payment record needs auditability, atomicity and a
retention policy, none of which a spreadsheet provides. The pilot is the natural cut-over point.

---

## PDR-005 — Capture urgency and neighbourhood

**Context.** Every added field costs completions. A fake door needs contact details; everything
beyond that has to earn its place.

**Decision.** Ask two extra questions: when they would like to start, and which São Paulo
neighbourhood they are in.

**Reasoning.** Each answers a question that would otherwise require a separate research effort.

_Urgency_ is the only available proxy for purchase intent. Someone who says "this week" is
plausibly inside a live buying decision; "just browsing" is curiosity. Without it, 38 submissions
are undifferentiated. With it, they split into groups that mean different things — and it supplies
the contact order for the pilot.

_Neighbourhood_ is a direct input to feasibility. Delivery and pickup are included in the price, so
geographic clustering determines whether one route can serve several rentals or whether every
rental is a separate cross-city trip. It is the difference between a workable model and one where
logistics eat the ticket. Asked as free text rather than a dropdown, because a dropdown of São
Paulo neighbourhoods is long enough to be its own source of abandonment.

**Trade-offs.**

- Two more fields, some unmeasured abandonment. No modal-open event exists, so the cost cannot be
  quantified — see [results.md](results.md#reservation-funnel).
- Self-reported urgency has no cost to overstating, so it is a weak behavioural predictor.
- Free-text neighbourhood arrives inconsistently spelled and needs normalisation.
- Neighbourhood plus name plus phone is a more identifying combination than any field alone.

**Revisit when.** If the pilot shows stated urgency does not predict payment, the field is costing
completions for nothing and should be dropped.

---

## PDR-006 — No payment collection in the fake door

**Context.** The strongest form of this test would have taken money — a Pix payment, or a card
pre-authorisation. That converts stated interest into demonstrated willingness to pay, which is
the actual question.

**Decision.** Collect no payment. The page states _"Pagamento apenas após confirmação da reserva"_
and the button says _"Confirmar solicitação"_ rather than _"Confirmar reserva"_.

**Reasoning.** Taking money for a service that cannot be delivered is not an experiment, it is a
consumer-protection problem. Charging with the intent to refund still means holding other
people's money, processing refunds, and defending the decision if someone complains — for a signal
that could be obtained legitimately a few weeks later with real inventory.

The word choices follow from the same reasoning: _solicitação_ (request) is a true description of
what the user is doing, where _reserva_ (booking) would imply something reserved on their behalf.
Nothing is.

**Trade-offs.**

- **This is the reason the experiment cannot answer its own central question.** Everything in
  [results.md](results.md#what-we-still-dont-know) marked "unknown" traces back to this decision.
- Interest measured this way is systematically inflated relative to purchase behaviour. Free to
  raise your hand, free to change your mind.
- Leaves the fake door in an uncomfortable middle position: real enough to create expectations,
  not real enough to test the hypothesis.

**Revisit when.** Immediately, in the pilot — where payment comes first and inventory is bought
against confirmed money.

---

## PDR-007 — Single HTML file, Tailwind from a CDN

**Context.** The page could have been a Next.js app, a Vite build, or one file.

**Decision.** One `index.html`, Tailwind from the CDN, vanilla JS, no build step, deployed as
static files on Vercel.

**Reasoning.** A validation MVP is edited in bursts of copy changes and deployed constantly. No
build step means the deploy pipeline cannot break, the page cannot fail to compile, and a headline
rewrite is a one-line diff visible in `git diff`. There is one page, no shared components, no
routing and no state worth managing — a framework would add a dependency tree and a build to
maintain in exchange for abstractions with nothing to abstract.

The self-imposed constraint was: **nothing in this repository may make a copy change slower.**

**Trade-offs.**

- The Tailwind CDN ships a full runtime compiler to the browser. Measurable page-weight and
  render cost, which affects Core Web Vitals and would affect Google Ads quality score if paid
  media ever runs. Known and accepted; `BRIEFING.md` lists it as deferred.
- Third-party CDN dependency on the critical render path.
- No component reuse — repeated markup for the four racket cards.
- Everything inline means nothing is unit-testable.

**Carve-out (September 2026).** The last point was the one worth paying to fix. Pure domain logic —
pricing, phone masking, validation, payload construction — moved to
[`assets/js/core.js`](../assets/js/core.js), imported by the page as a native ES module. Still no
build step, still no dependencies; the logic that decides what people are charged is now covered by
tests. Markup, styling and the Tailwind CDN were left exactly as they were.

**Revisit when.** Paid media launches (quality score makes the CDN cost real money), or a second
page needs to share components. Neither is true yet. `/case-study/` is a second page but shares no
markup with the landing page.

---

## PDR-008 — Publish the case study without linking it from the landing page

_Decided September 2026, during the portfolio review._

**Context.** Writing this up as a public case study means publishing, in plain language, that
primeirosaque.com.br is a fake door — while the experiment is still running and still collecting
submissions.

**Decision.** Publish the case study at `/case-study/`, link it from the README and from portfolio
contexts, and do **not** link it from the landing page's navigation or footer.

**Reasoning.** A visitor who reads the case study before filling in the form is answering a
different question — "would I support this experiment" rather than "do I want this service". That
biases every subsequent submission, and having already run for five months without a success
threshold, the experiment cannot afford a second methodological problem in its remaining data.

The two audiences are genuinely disjoint. Portfolio visitors arrive from GitHub or a CV; prospective
users arrive from search. Serving each the page it needs costs nothing.

**Trade-offs.**

- The page is public and unlisted, not secret. Anyone can find it; search engines can index it.
  This is separation, not concealment, and it would be wrong to describe it as more than that.
- Slightly awkward to explain: a case study about honest measurement that is deliberately kept out
  of the subject's line of sight. The justification is methodological, and it is recorded here so
  the choice is visible rather than quietly made.
- A visitor who finds both may wonder why one does not mention the other. This record is the
  answer.

**Revisit when.** The experiment stops collecting data. At that point the methodological reason
disappears and the case study can be linked openly from the footer.
