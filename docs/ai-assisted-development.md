# AI-Assisted Development

This project was built with heavy AI assistance. This document describes how, and — more usefully
— where the assistance was load-bearing and where it was not.

The claim being made is **effective use of AI as an execution multiplier**, not autonomous
development. Everything below was directed, reviewed and accepted by a person, and the failure
modes are documented alongside the wins.

---

## The honest summary

AI wrote most of the code in this repository. A person decided what the code should do, what the
business was, what the prices were, what the copy said, what would be measured, and what any of it
meant afterward.

That split is not incidental. The parts AI handled well are the parts where the goal was already
decided and the work was execution. The parts it handled badly are the parts requiring a position
on something — which framing to lead with, whether a number is good, whether a trade-off is worth
making.

## What AI did

### Implementation

The landing page — 793 lines of markup, a Tailwind design system, the reservation modal, the mobile
drawer, the FAQ, the responsive pass — was largely AI-generated from a written brief specifying
positioning, tone, colours, typography and section order.

The value was not that AI writes markup faster. It is that the loop between _"the catalogue should
come before pricing"_ and seeing it rendered collapsed to minutes. Over a build where copy and
structure were rewritten repeatedly, that compounds into the difference between shipping in a
weekend and shipping in a month.

### Analytics instrumentation

GA4 setup and the `form_submit` event, including the enhanced-ecommerce-style `value` and
`currency` parameters that make the event usable as a conversion import in Google Ads
(commits `f29de35`, `1f31329`).

This is a good example of the category where AI is most reliably useful: well-documented
integration work with an exactly correct answer that is tedious to look up. The parameter names
that make GA4 conversion values import cleanly into Ads are knowable, findable and boring.

### SEO and metadata

Meta tags, canonical, Open Graph and Twitter cards, `LocalBusiness` structured data, `robots.txt`,
`sitemap.xml`, and the inline SVG favicon (commit `4701320`) — a complete, conventional
implementation in one pass.

Also a good illustration of AI's characteristic failure mode. The Open Graph tags reference
`images/og-image.jpg`, **a file that does not exist**. The markup is correct, standards-compliant,
and completely non-functional: every WhatsApp and Instagram share of this page since April has
rendered without a preview. The generated code was right; the generated code was not the job. See
[F6 in the security and privacy review](security-privacy.md#f6--referenced-og-image-does-not-exist).

### Iteration and debugging

Mobile responsiveness, smooth-scroll offsets under the fixed navbar, the progressive Brazilian
phone mask, the live pricing total. Small, well-specified changes where the feedback loop is fast
and correctness is obvious on inspection.

### The September 2026 portfolio pass

The work turning a working MVP into a documented case study — extracting testable logic, writing
the test suite, building the aggregation pipeline, auditing security and privacy, and drafting
these documents — was AI-assisted throughout, in a directed session with a written brief.

Two findings from that pass are worth recording because they show the mode working as intended:

- **A live spreadsheet formula-injection vulnerability** in the original Apps Script, found during
  a systematic review rather than by luck. Real, exploitable, and fixed. See
  [F1](security-privacy.md#f1--spreadsheet-formula-injection-fixed).
- **A bug in AI-written code, caught by AI-written tests, within minutes of both being written.**
  The first `looksLikeFormula` implementation called `.trim()` before checking for dangerous
  prefixes — which stripped the leading tab character that made a tab-prefixed value dangerous in
  the first place. The test asserting `\tcmd` should be flagged failed immediately. Neither the
  code nor the test was reviewed by a human before the failure surfaced; the tests caught it
  because they were written to check the property rather than to confirm the implementation.

## What a person did

Everything the code could not decide.

**The problem.** The insight comes from playing tennis and watching people buy expensive frames
badly. No amount of prompting produces that; it comes from being in the room.

**Positioning.** The decision to lead with financial risk rather than performance or injury
prevention. The rule banning "premium", "elite" and "exclusive" — sophistication carried by
vocabulary and specificity instead of adjectives. The choice of Alcaraz, Sinner and João Fonseca as
reference points, and the judgement that João Fonseca specifically signals Brazilian relevance in a
way the others do not. These are market positions, and they were held against AI suggestions that
drifted toward generic SaaS voice more than once.

**Product boundaries.** No promised contact window. No named contact channel. No artificial
scarcity. _Solicitação_ rather than _reserva_. These decisions all reduce conversion, and each was
made deliberately because the alternative would have created an expectation that could not be
honoured. A model optimising for the stated goal of "more leads" does not propose them.

**Pricing.** BRL 250 / 450 / 600 and the decision to highlight the three-racket tier. Set by
judgement about what feels defensible against a BRL 2,000 purchase.

**What to measure.** Choosing urgency and neighbourhood as the two fields worth their cost in
abandonment — because one proxies purchase intent and the other determines whether the logistics
are feasible at all. That reasoning is business reasoning, not code.

**Rejection.** The Stitch-generated logo was rejected as reading like an amateur club badge. A
person had to decide that "technically fine" was not the standard.

**Interpretation.** What 38 requests mean is a judgement call, and it is deliberately left
unwritten in [results.md](results.md#what-we-learned) until the owner writes it. An AI asked to
interpret this dataset will produce something confident and well-structured, and that confidence
would be unearned.

## Validation

What AI produced was checked, and the record shows it was not always right:

| Mechanism           | What it caught                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Running the site    | Layout, mobile, modal behaviour, mask behaviour                                                                                              |
| Reading the diff    | Copy drifting off-brief; unrequested "improvements"                                                                                          |
| The live experiment | The real test — the page worked and collected 38 real submissions                                                                            |
| Test suite          | The `looksLikeFormula` trim bug, immediately                                                                                                 |
| Systematic review   | The formula-injection vulnerability; the missing OG image; the `user_agent` field with no purpose; a wrong copyright year; dead footer links |
| CI                  | Regressions in pricing and validation logic                                                                                                  |

The middle row matters most. The strongest evidence that the AI-assisted build was sound is not
that the code reads well — it is that a stranger in São Paulo found the page, understood the offer,
and filled in the form, 38 times, without anyone driving traffic to it.

## What did not work

**Generated code that is correct but incomplete.** The OG image is the clearest case: five months of
broken link previews from markup that passes every validator. AI produces the artefact it was asked
for and does not notice the artefact it referenced does not exist.

**Confident output on questions with no correct answer.** Ask for pricing and you get pricing —
plausible, well-reasoned, entirely invented. The BRL 250 / 450 / 600 tiers came from a person, and
`BRIEFING.md` honestly labels them placeholders. Had they been accepted from a model without that
label, the experiment would have tested an arbitrary number while appearing to test a considered
one.

**Drift toward the generic.** Left unconstrained, generated copy migrates toward the mean of all
landing pages — "solução completa", "experiência única", "transforme seu jogo". Holding a distinctive
voice required repeated, explicit correction, and the rules in `BRIEFING.md` exist largely as
guardrails against that pull.

**Volume without judgement.** AI will happily generate a fifth pricing tier, three more sections and
an FAQ nobody asked about. Most of the work of directing it is saying no.

## What made it work

1. **A written brief before generating anything.** `BRIEFING.md` — positioning, tone, the banned
   word list, the design system, explicit do's and don'ts — existed first. Ambiguity is where
   generated output drifts, and the brief removed most of it up front.
2. **Small, reviewable increments.** Four commits, each one legible thing. Not one 800-line
   generated page accepted wholesale.
3. **A person owning every judgement call.** AI proposed; a person decided. Where the brief says
   _"when in doubt about pricing, messaging or structure, ask before implementing"_, that boundary
   was written down deliberately.
4. **Tests on the logic that matters.** Not for coverage — because generated code fails in ways
   that read as correct, and pricing is the one thing on the page where being wrong costs money.
5. **Systematic review after the fact.** Every security finding in this repository came from a
   deliberate audit pass, not from noticing something during the build.

## Reproducing this

The prompt-level material lives in [`BRIEFING.md`](../BRIEFING.md), which is committed. It is worth
reading as an artefact in its own right: it is the actual working document, written for a model,
including the parts that are blunt about what not to do. The quality of the output is mostly
downstream of the quality of that file.
