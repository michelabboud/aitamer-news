# 0053: Pinned labels share the homepage card decision

## Status
Accepted for the combined PR404/405/407 correction, 2026-11-03. Supplements ADR0051 without changing its historical text. Source acceptance and live deployment remain separate gates.

## Context
The submitted pin badge identifies posts actually displayed in the homepage pin card. Independently selecting pinned posts in cards or story pages could disagree about expiry, the lead or the two-slot limit.

## Decision
Use the single `resolvePinCard` result through `loadHomepagePins`. Render the decorative pin and visible Pinned text on those story pages and listing cards. Homepage feed cards stay unlabelled because displayed pins are excluded from that feed. Include page-local pin membership in cached page keys. Resolve expiry with the existing build clock and Asia/Jerusalem bare-date rule.

## Alternatives rejected
- Independently selecting pins per component could disagree about the lead, slots or expiry.
- Marking every configured pin would label expired, proposed or overflow pins that readers cannot see in the card.

## Consequences
Pin labels describe build-time membership on a static site. Ordinary builds apply expiration; this adds no runtime scheduler. Existing pin data and App permissions remain unchanged. Series labels are independent metadata and must survive rendering alongside pin labels.
