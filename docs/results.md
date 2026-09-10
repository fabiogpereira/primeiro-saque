# Results

Every number here is either **observed** (measured, reproducible from source data), **inferred**
(a reading of observed data, stated as such), or **unknown** (not measured — left empty rather
than estimated).

Nothing on this page is a projection. Sections marked `UNPOPULATED` are waiting on a real data
export via [`scripts/aggregate.mjs`](../scripts/aggregate.mjs); they are not waiting on a
plausible-sounding guess.

**Period covered:** 14 April 2026 – present. Experiment ongoing.

---

## Headline

| Metric                        | Value             | Confidence                               |
| ----------------------------- | ----------------- | ---------------------------------------- |
| Reservation requests received | **38**            | Observed — row count in the sheet        |
| Paid media spend              | **BRL 0**         | Observed — no campaign was ever launched |
| Acquisition                   | **100% organic**  | Observed — follows from zero spend       |
| Market                        | São Paulo Capital | Observed — enforced by the page copy     |
| Days live                     | ~150              | Observed                                 |
| Paying customers              | **0**             | Observed — no payment mechanism exists   |
| Revenue                       | **BRL 0**         | Observed                                 |

### What "38 reservation requests" means

It means 38 form submissions were written to the reservations sheet. That is all it means.

**It is not 38 customers.** Nobody has been charged, quoted, contacted or served. There is no
inventory and no way to accept money.

**It is probably not 38 people.** The sheet contains repeat submissions — the same contact
appearing more than once, usually with a different racket selection, which reads like someone
returning to reconsider rather than a duplicate click. The aggregation script counts unique
contacts by hashing the phone number; until it runs against the full export, the distinct-person
count is `UNPOPULATED`. **38 is a count of submissions, not of people, and the public number
should always be qualified that way.**

**It is a floor, not a total.** The form posts with `mode: 'no-cors'`, so the browser cannot read
the response. A submission that failed server-side still shows the user a success screen and still
fires the GA4 event. Any such failures are invisible and uncounted. See
[architecture.md](architecture.md#known-limitations).

**It carries an unmeasured selection effect.** The page shows three fabricated five-star
testimonials. Some unknown share of these 38 submissions was influenced by social proof for a
service that has never served anyone. That contamination cannot be removed retrospectively.

## Traffic

`UNPOPULATED` — lives in GA4 (property `G-V66JXP8H5L`), not in this repository.

| Metric                   | Value | Confidence                |
| ------------------------ | ----- | ------------------------- |
| Sessions                 |       | Unknown — export from GA4 |
| Unique users             |       | Unknown — export from GA4 |
| Top source / medium      |       | Unknown — export from GA4 |
| Bounce / engagement rate |       | Unknown — export from GA4 |

> **Caveat before anyone fills this in:** GA4 was installed on 12 April and the first submission
> arrived on 14 April, so tracking predates traffic — good. But sessions are subject to consent
> banners, ad blockers and cross-device fragmentation, and a share of Brazilian mobile traffic is
> under-counted. Treat GA4 sessions as a lower bound too.

## Reservation funnel

`UNPOPULATED` — and **not currently measurable end to end.**

| Step                     | Instrumented?            |
| ------------------------ | ------------------------ |
| Page view                | Yes — GA4 automatic      |
| Scrolled to pricing      | No                       |
| Opened reservation modal | **No — this is the gap** |
| Submitted the form       | Yes — `form_submit`      |

Without a modal-open event there is no way to separate _"people who never considered it"_ from
_"people who considered it and backed out at the price or the form"_. Those two are entirely
different product problems and the current instrumentation cannot tell them apart.

Submissions ÷ sessions can be computed once traffic is exported, but it is a blunt figure that
conflates both drop-offs. **Recommendation:** add a `reserve_modal_open` event before running any
further traffic. It is a two-line change and it is the single highest-value instrumentation fix
available.

## Racket preferences

`UNPOPULATED` — run `npm run aggregate`, then fill from `racket_preferences` in
`data/results.json`.

| Model                     | Requests | Share |
| ------------------------- | -------- | ----- |
| Babolat Pure Aero 98 Gen9 |          |       |
| Wilson Blade 98 V9        |          |       |
| Head Speed MP 2026        |          |       |
| Yonex VCORE 98 8th Gen    |          |       |

**Why this matters:** it is the closest thing to a purchase-order signal in the dataset. The first
frames bought would be the most-requested ones, and concentration versus spread changes the
capital requirement substantially.

**Confounder to declare when reporting this:** the catalogue only offers four models, and each is
presented with a pro-player association of differing strength. Preference here reflects _"which of
these four, framed this way, appeals most"_ — not free-market demand across all rackets sold in
Brazil.

## Number of rackets per request

`UNPOPULATED` — fill from `racket_count_distribution`.

| Rackets     | Requests | Share |
| ----------- | -------- | ----- |
| 1 (BRL 250) |          |       |
| 2 (BRL 450) |          |       |
| 3 (BRL 600) |          |       |
| 4+          |          |       |

**Why this matters:** this is the direct read on H3. If most requests are single-racket, the
comparison framing is not landing and the average ticket is BRL 250, not BRL 450+. If multi-racket
dominates, the unit economics look materially different — though so does the inventory needed to
fulfil a single request.

**Confounder:** the three-racket tier is visually marked "Mais escolhido" and the per-racket price
falls at each tier. The distribution measures response to a deliberately weighted choice
architecture, not unprompted preference.

## Urgency

`UNPOPULATED` — fill from `urgency_distribution`.

| Response           | Requests | Share |
| ------------------ | -------- | ----- |
| Esta semana        |          |       |
| Próximas 2 semanas |          |       |
| Só avaliando       |          |       |

**Why this matters:** the closest available proxy for purchase intent. "Esta semana" suggests
someone inside a live buying decision; "Só avaliando" suggests curiosity. The ratio is the best
signal in the dataset about how much of the 38 represents real commercial intent.

**Confounder:** self-reported urgency with no cost to overstating it. Stated urgency is a weak
predictor of behaviour, and the option labels themselves anchor the answer.

## Geographic distribution

`UNPOPULATED` — fill from `geographic_distribution`.

**Why this matters:** delivery and pickup are included in the price, so two trips per rental come
straight out of a BRL 250 ticket. If requests cluster in a handful of adjacent neighbourhoods, a
single route can serve several rentals and the model may work. If they are scattered across São
Paulo, the logistics cost per rental could approach or exceed the price.

**Handling notes:** free-text field. The aggregation script normalises casing and accents, so
`PINHEIROS` and `Pinheiros` merge — but it deliberately does not correct spelling, so typos stay
separate rather than being silently reassigned. Neighbourhood is published as a count only; check
the keys before committing in case someone typed something identifying.

## Potential ticket

`UNPOPULATED` — fill from `requested_weekly_value_brl`.

| Metric                         | Value |
| ------------------------------ | ----- |
| Sum of requested weekly values |       |
| Mean per request               |       |
| Median per request             |       |

> **This is not revenue, pipeline, or forecast.** It is the arithmetic sum of prices attached to
> requests from people who were never asked to pay and never will be under this experiment. It is
> useful for one thing only: sizing what a _pilot_ would need to handle. Presenting it as anything
> resembling money earned would be dishonest, and the field is named `requested_weekly_value_brl`
> rather than anything shorter for exactly that reason.

## What we learned

> **Human interpretation required.** These are the questions the data can speak to. The
> conclusions are the owner's to draw and write, after the aggregation has been run — not the
> repository's to assert.

- **On H1 (problem).** Did the money framing draw people in, or would anything have? The page only
  ever ran one framing, so what can honestly be claimed here is narrower than it first appears.
  → _[to be written]_
- **On H2 (solution).** 38 unprompted requests over five months with zero promotion is a real
  signal. What is the honest characterisation of its size — is this a trickle that happens to be
  non-zero, or a rate that justifies the next investment? Against what comparison?
  → _[to be written]_
- **On H3 (pricing).** What does the racket-count distribution actually say about the tier
  structure, given that the structure was deliberately weighted?
  → _[to be written]_
- **On H4 (acquisition).** Untested. The only defensible statement is that organic search produced
  a non-zero flow at zero cost.
  → _[to be written]_
- **On the method itself.** The largest lesson may be procedural rather than commercial: the
  experiment ran for five months without a success threshold, which means the result cannot be
  scored. What follows from that for the next one?
  → _[to be written]_

## What we still don't know

The gap between what has been demonstrated and what a business would need:

| Unknown                                            | Why it is decisive                                                   | How it would be measured              |
| -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| **Actual willingness to pay**                      | The entire hypothesis. Interest is free; payment is not              | Ask for money. See below              |
| **Request → payment conversion**                   | Turns 38 into a rate that means something                            | The pilot                             |
| **CAC under paid media**                           | Determines whether this scales past organic trickle                  | A small paid test after the pilot     |
| **Logistics cost per rental**                      | Two trips against BRL 250 may be margin-negative                     | Actually do the deliveries            |
| **Inventory utilisation**                          | Weeks-per-frame-per-month sets the capital requirement               | Track occupancy during the pilot      |
| **Damage / loss / non-return rate**                | Unpriced tail risk that can wipe out many rentals                    | Pilot, plus a deposit mechanism       |
| **Repeat demand**                                  | Someone who buys a racket may not return for years                   | Cannot be known for at least a season |
| **Trial → purchase conversion**                    | Opens a retail or affiliate margin beyond the rental fee             | Follow up with pilot participants     |
| **Distinct people among the 38**                   | Repeat submitters inflate the headline                               | `npm run aggregate`                   |
| **Whether the fake door itself inflated interest** | Fabricated testimonials contaminated the sample by an unknown amount | Not recoverable                       |

## Next experiment

The fake door has taken this as far as it can. Every remaining question needs someone to be asked
for money.

### Design: a paid, closed-loop pilot

**Hypothesis:** at least a meaningful minority of people who requested a trial will pay BRL 250
up front for a real one.

**Method.** Contact the existing respondents — starting with those who selected "Esta semana",
since they claimed the tightest purchase window — and be straightforward: the service was in
preparation, it is now running a limited first round, here is how to book, payment up front by
Pix. Buy nothing before the money arrives.

**Scale.** Small deliberately. Two to four frames from the most-requested models, serving one
neighbourhood cluster, over four to six weeks. Total inventory outlay in the low thousands of BRL,
recoverable by resale.

**Success criteria — written before the data, this time.** The specific thresholds are the owner's
to set and must be committed to this file _before_ the first call is made. At minimum the pilot
must state up front, in advance: the payment-conversion rate that counts as a pass, the maximum
acceptable delivery cost per rental, and the date at which the pilot stops either way.

**Instrumentation to add first:**

1. `reserve_modal_open` in GA4 — closes the funnel gap above.
2. Resolve the fabricated testimonials before any further data is collected, so the next sample is
   not contaminated the same way.
3. Log outreach outcomes — contacted, reached, converted, declined, and the reason declined. The
   _reasons_ will be worth more than the rate.

**What would make this a stop signal.** If people who requested a free-to-request trial decline at
BRL 250 in volume, the honest reading is that the fake door measured curiosity rather than demand
— and that is a genuinely useful finding, arrived at for the price of a few rackets instead of a
business.
