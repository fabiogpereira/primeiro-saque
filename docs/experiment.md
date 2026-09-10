# The Experiment

This document describes the experiment as it was actually designed and run — including the parts
that were never formally specified. Where something was decided after launch, or not decided at
all, it says so. Retrofitting a clean experimental design onto a scrappy MVP would defeat the
purpose of writing this down.

**Status:** running since 14 April 2026. Not yet concluded.

---

## Problem

A serious amateur tennis player in Brazil buying a new frame faces a decision worth
**BRL 1,500–2,500** with almost no way to inform it.

The failure mode is specific:

- Shops let you hold a racket. Holding a racket tells you nothing about how it plays.
- Demo programmes exist in the US and Europe. In São Paulo they are rare, informal, and usually
  limited to whatever a single shop happens to stock.
- The variables that matter — string pattern, swing weight, balance, stiffness — are only
  distinguishable over several hours of real play, across different opponents and conditions.
- The cost of being wrong is not just the money. A frame that does not suit you quietly damages
  your game for as long as you keep using it, and reselling a used racket recovers maybe half.

So players decide on brand loyalty, a coach's opinion, or which pro endorses the frame — and then
live with it.

## Hypotheses

The MVP was built to probe four hypotheses. Only the first two were explicit at launch; the other
two were implicit in the design and are stated here retrospectively.

### H1 — Problem hypothesis (explicit at launch)

> Tennis players in São Paulo experience choosing an expensive racket as a real, felt problem —
> not merely a theoretical inefficiency.

**How the MVP probes it:** the landing page leads with the money frame ("a new racket costs
BRL 1,500–2,500; get it wrong and you lose a lot of money") rather than a performance or injury
frame. If the money framing is what resonates, the problem is felt as financial risk.

**Status:** supported directionally. People do respond to the framing. But the page only ever
tested _one_ framing, so this is not a comparison — see [Open questions](#open-questions).

### H2 — Solution hypothesis (explicit at launch)

> A one-week, at-home, court-ready trial is a solution players recognise as addressing that
> problem well enough to raise their hand for it.

**How the MVP probes it:** the whole page describes exactly that service, and the only action
available is requesting it.

**Status:** 38 requests in ~5 months with no promotion. See [results.md](results.md).

### H3 — Pricing hypothesis (implicit in the design, never formally stated)

> BRL 250 per racket per week is not so high that it kills interest, and the tiered structure
> (BRL 450 for two, BRL 600 for three) pushes people toward multi-racket comparison.

**How the MVP probes it:** real prices are displayed before the form opens, the three-racket tier
is visually marked "Mais escolhido", and the modal shows a live running total that updates as
rackets are selected. Nobody reaches the form without having seen what it costs.

**Status:** partially observable. We know the price did not prevent 38 people from submitting. We
do **not** know whether any of them would pay it — see
[PDR-002](product-decisions.md#pdr-002--show-real-prices-before-the-form).

> **Honest note:** the prices were set by intuition about what felt defensible against a
> BRL 2,000 purchase, not by a costing exercise. `BRIEFING.md` records them as "placeholders,
> subject to adjustment". They were never adjusted, and no price variant was ever tested.

### H4 — Acquisition hypothesis (never stated at launch)

> Demand can be reached affordably through search intent — someone researching
> "Wilson Blade 98 review" is already in the decision window.

**How the MVP probes it:** the page was built with SEO and Google Ads quality score in mind, and a
Search campaign was drafted. **The campaign was never launched.** All 38 requests arrived
organically. So H4 is currently **untested**, and the organic result is a happy accident rather
than a measured outcome.

## Target user

Not formally defined at launch. Inferred from the copy decisions actually made:

- Plays regularly enough to notice equipment differences — club player, weekly lessons or games
- Lives in São Paulo Capital (stated explicitly on the page so nobody outside gets false hope)
- Is either about to buy or actively researching
- Treats BRL 2,000 as a considered purchase, not an impulse one
- Recognises Alcaraz, Sinner and João Fonseca as reference points

The neighbourhood field was included specifically to test whether this profile clusters
geographically, which would matter enormously for logistics.

## Value proposition

As stated on the page:

- Test on a real court for a full week, not a few minutes in a shop
- Compare up to three models side by side
- Fresh strings on every test, tension of your choice; new overgrip every delivery
- Delivery and pickup included across São Paulo Capital
- No contract, no lock-in

Deliberately **absent**: any promise of contact within a specific timeframe, any named contact
channel, and any claim of scarcity. All three were ruled out as things we could not honour.

## Pricing

| Rackets | Weekly price | Saving vs. single tests |
| ------- | ------------ | ----------------------- |
| 1       | BRL 250      | —                       |
| 2       | BRL 450      | BRL 50                  |
| 3       | BRL 600      | BRL 150                 | _(marked "Mais escolhido")_ |

Implemented in [`assets/js/core.js`](../assets/js/core.js) and covered by
[`tests/pricing.test.js`](../tests/pricing.test.js). Rackets beyond the third extrapolate linearly
at BRL 200 each — reachable in the form, but not advertised.

Payment is explicitly deferred: _"Pagamento apenas após confirmação da reserva."_ This is true —
no payment mechanism exists.

## Fake-door design

The landing page presents Primeiro Saque as an operating service. It is not one. There is no
inventory, no logistics, no payment processing, no account system, and no backend beyond a
spreadsheet.

What happens when someone submits the form:

1. The payload is POSTed to a Google Apps Script Web App.
2. Apps Script appends a row to a Google Sheet.
3. GA4 records a `form_submit` event with the calculated value in BRL.
4. The user sees: _"Recebemos seu interesse. Devido ao alto volume de solicitações, nossa equipe
   está organizando os atendimentos por ordem de chegada — em breve retornaremos com os próximos
   passos."_

That message was written to be **true**. It confirms receipt, it does not promise a channel, it
does not promise a timeframe, and it does not claim the service is being provisioned. The CTA says
_"Confirmar solicitação"_ (confirm request), not _"Confirmar reserva"_ (confirm booking), for the
same reason.

### Where the design is ethically uncomfortable

Stated plainly, because a case study that only lists its good decisions is marketing:

- **People submitted real contact details expecting eventual contact.** "Due to high demand" sets
  an expectation of a queue that does not exist.
- **The page carries three fabricated five-star testimonials** with invented names and
  neighbourhoods. They are social proof for a service that has never served anyone. This is the
  weakest point of the experiment as run, and it is documented as an open issue in
  [security-privacy.md](security-privacy.md#f2--fabricated-testimonials-on-a-live-commercial-page).
- **`LocalBusiness` structured data** describes an operating local business.

A fake door tests whether people will walk toward it. It does not entitle you to leave them
standing there. The [next experiment](results.md#next-experiment) is designed partly to resolve
this: it closes the loop with everyone who raised their hand.

## Data captured

Per submission, into the sheet:

| Field          | Why it was captured                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamp`    | Submission rate over time; detecting bursts from a shared link                                                                                                                   |
| `nome`         | Contact — **and the only field with no analytical purpose**                                                                                                                      |
| `whatsapp`     | Contact, and the only way to detect repeat submissions                                                                                                                           |
| `raquetes`     | Which models pull demand → what inventory would need buying first                                                                                                                |
| `qtd_raquetes` | Single test vs. comparison — the core of H3                                                                                                                                      |
| `urgencia`     | Purchase-window proximity; separates buyers from browsers                                                                                                                        |
| `bairro`       | Geographic clustering → whether same-day logistics is even feasible                                                                                                              |
| `valor_total`  | The price attached to the request                                                                                                                                                |
| `user_agent`   | **No analytical purpose. Should not have been collected.** Removed from new submissions; see [security-privacy.md](security-privacy.md#f5--user_agent-collected-without-purpose) |

In GA4, alongside: sessions, source/medium, and a `form_submit` event carrying value, currency,
racket count, urgency and neighbourhood.

## Success criteria

**None were defined before launch.** No target submission count, no target rate, no decision
threshold, no stop date.

This is the clearest methodological weakness of the experiment, and it is not fixable
retrospectively — any threshold written now would be reverse-engineered from a number already
known. 38 cannot be called a pass or a fail against a bar that never existed.

What it _can_ do is inform criteria for the next experiment, which are defined up front in
[results.md](results.md#next-experiment).

## Risks

Identified at design time:

| Risk                                           | Handling                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Creating expectations that cannot be met       | Neutral success copy; no timeframe, no channel, no scarcity claims                                      |
| Advertising a service that does not exist      | Accepted as inherent to a fake door; mitigated by "solicitação" not "reserva", and by deferring payment |
| Legal exposure under CDC / CONAR               | Partly handled — no superlatives, no unprovable claims. **Not** handled for the fabricated testimonials |
| Lead data sitting in a personal Google account | Not addressed at launch. See [security-privacy.md](security-privacy.md)                                 |

Not identified at design time, found during this review:

| Risk                                                                           | Status                                                                 |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Spreadsheet formula injection through unescaped form input                     | **Fixed** — input is escaped client-side and server-side               |
| `mode: 'no-cors'` hides delivery failures, so submissions can be silently lost | Documented; recorded count is a floor                                  |
| No privacy notice for collected personal data                                  | **Fixed** — notice added at the form, page at `/privacidade/`          |
| Open, unauthenticated endpoint                                                 | Mitigated with a honeypot and timing check; escalation path documented |

## Open questions

Things the experiment as designed **cannot** answer, in rough order of how much they matter:

1. **Would anyone actually pay?** Nobody has been asked for money. This is the whole point of the
   next experiment.
2. **What does one-week-at-a-time utilisation look like?** Determines how many frames per model
   are needed, and therefore the entire capital requirement.
3. **What does a delivery-and-pickup round trip cost in São Paulo?** Two trips per rental against a
   BRL 250 ticket is a thin margin that may be negative.
4. **Damage, loss and non-return rates.** Unpriced. A frame that comes back cracked or does not
   come back at all wipes out several rentals.
5. **Would the money framing beat a performance framing?** Never A/B tested — a single framing was
   chosen from intuition and never challenged.
6. **What does acquisition cost under paid media?** H4 is untested.
7. **Is this a repeat business or a one-shot?** A player who buys a racket may not need another
   trial for years. Nothing in the data speaks to lifetime value.
8. **How many of the 38 are distinct people?** The dataset contains repeat submissions from the
   same contacts. See [results.md](results.md).
