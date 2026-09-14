# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for this donor-facing React site. Session Replay was already enabled; Error Tracking and Support were enabled, and health, error, and support signal sources were switched on. Findings will begin appearing in the [Self-driving inbox](https://eu.posthog.com/project/274090/inbox) within about 30 minutes as scouts run and recordings arrive.

## AI data processing

Approved by the organization-level gate before this setup began.

## GitHub

GitHub was already connected before this setup. No GitHub Issues responder was enabled because it was not selected.

## Products enabled

| Product | Result | SDK check |
|---|---|---|
| Session Replay | Already enabled | `posthog-js` initialization does not disable recording. |
| Error Tracking | Enabled | `posthog-js` initialization does not disable exception capture. |
| Support (Conversations) | Enabled | Connect an inbound email, inbox, or Slack channel before tickets can arrive. |

## Signal sources

| Signal source | Action |
|---|---|
| `signals_scout` / `cross_source_issue` | On by default; no opt-out row existed. |
| `health_checks` / `health_issue` | Enabled (source config `01a09fbc-b99e-723d-a4a8-c705c9e0a153`). |
| `error_tracking` / `issue_created` | Enabled (source config `01a09fbc-b98b-7af2-8176-d971d4ec7038`). |
| `error_tracking` / `issue_reopened` | Enabled (source config `01a09fbc-b9ad-7521-8568-44a07500882a`). |
| `error_tracking` / `issue_spiking` | Enabled (source config `01a09fbc-ba45-7bf3-8ba6-32885d8612b2`). |
| `conversations` / `ticket` | Enabled (source config `01a09fbc-baae-7ab0-a360-8934dbd4c26e`). |
| Session replay source row | Deliberately not created; Replay Vision scanners are its Self-driving route. |

## Connected tools

No external tool was selected in the connected-tools prompt. There are no warehouse sources configured.

| Tool | Result |
|---|---|
| Sentry | Not used — no responder enabled. |
| GitHub Issues | Not used — GitHub remains connected, but no responder enabled. |
| Linear | Not used — no responder enabled. |
| Jira | Not used — no responder enabled. |
| Zendesk | Not used — no responder enabled. |

## Scout troop

Five scouts are active, each on its default daily cadence. The project has an enforced budget of **100 runs/day**, with **0 used** and **100 remaining** when checked. The early-access banner says to contact `team-self-driving@posthog.com` to request more runs.

| Active scout | What it watches |
|---|---|
| `signals-scout-general` | Cross-product changes and surfaces without a specialist. |
| `signals-scout-product-analytics` | Donor-flow conversion, retention, lifecycle, and path regressions. |
| `signals-scout-web-analytics` | Traffic volume, attribution, landing-page health, bounce, and 404 changes. |
| `signals-scout-sponsorship-cart-handoff` | Sponsorship-cart additions and hand-off to checkout. |
| `signals-scout-donation-checkout-reliability` | Donation journey and payment hand-off reliability. |

The other 24 scouts remain disabled to keep the troop selective. Error Tracking and Session Replay scouts are intentionally disabled because those surfaces are covered by the native error sources and Replay Vision scanners, respectively. Other specialists can be enabled later if the project adopts their surfaces (for example surveys, feature flags, web vitals, logs, experiments, revenue analytics, or data pipelines).

## Custom scouts

Both proposed custom scouts were approved and created. Their scheduler configurations were verified as enabled and emitting at the default daily interval.

| Scout | Surface and discriminator | Why it is separate |
|---|---|---|
| `signals-scout-sponsorship-cart-handoff` | Compares sponsorship-cart additions with checkout starts and distinct-person reach. It flags a sustained widening hand-off gap while additions stay steady, or an entry-volume collapse not explained by site traffic. | The built-in product scout watches derived conversion regressions; this adds domain-specific cart-entry volume and cart-to-donation route coverage. |
| `signals-scout-donation-checkout-reliability` | Compares donation-page reach with payment hand-off errors and visibly stalled journeys. It flags sustained, broad impact while donation interest remains stable. | The built-in web and product scouts only partially cover the Paystack payment and verification path. |

Both scouts ignore isolated abandonments, single-session effects, test traffic, and known short-lived provider incidents. If either becomes noisy, set its scout configuration `emit: false` in PostHog to keep it running in dry-run mode.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes qualifying findings to the inbox. These are the only components in this setup that spend Replay Vision quota. Each finding carries half weight, so corroboration is required before an inbox report is promoted.

No recordings were available when configured, so both scanners are armed and will start working when the first recordings arrive. The server estimated 0 monthly observations and 0 monthly credits at creation; the organization-wide credit quota could not be verified because the authoritative sizing skill was unavailable.

| Scanner | Status | Scope | Sampling | Estimate |
|---|---|---|---|---|
| Donation checkout breakage | Created | Recordings whose current URL includes `/donate`, the donation and sponsorship completion flow. Watches visible payment-provider, popup, processing, verification, and form-submit failures. | 50% | 0 observations / 0 credits monthly at current traffic. |
| Donor journey frustration | Created | Recordings containing `$rageclick` only; intentionally has no URL filter to avoid broadening overlap with the completion-flow monitor. Watches cart, donation-choice, required-field, and payment-action struggle. | 100% | 0 observations / 0 credits monthly at current traffic. |

You can rate observations from the scanner pages to generate configuration recommendations once recordings are available.

## Files modified or created

| File | Change |
|---|---|
| `posthog-self-driving-report.md` | Created this setup record. |

No application source files were modified. The existing `posthog-js` setup already kept autocapture and recording enabled, and the project already had the PostHog SDK installed.

## Follow-ups

- [ ] Connect a Support inbound channel (email, inbox, or Slack) in PostHog so the enabled ticket source can receive support requests.
- [ ] Generate real browser traffic and complete a donor journey so Session Replay starts producing recordings for the scanners.
- [ ] Consider capturing non-PII payment-outcome milestones in the existing analytics contract; the current donation page has cart events, but an explicit verified-payment outcome would make checkout diagnosis more precise.

## What happens next

The scout coordinator picks up fresh configurations within about 30 minutes. Their findings cluster into reports in the [Self-driving inbox](https://eu.posthog.com/project/274090/inbox); immediately actionable reports can begin coding tasks.