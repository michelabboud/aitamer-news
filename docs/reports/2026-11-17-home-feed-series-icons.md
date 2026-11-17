# Homepage series-icon repair

## What was built

Homepage feed cards now use CSS masks from the same trusted series-icon assets. The first fetched batch previously included inline SVG from a series badge; the strict HTML-only validator rejected the entire batch despite HTTP200. Ordinary listing/post icons remain inline SVG. The validator and CSP stay unchanged.

## Verification evidence

The actual route/PostCard regression failed before the repair with `HomeFeedProtocolError: Active or unsupported content in homepage batch`. Afterward, 26 focused render/protocol/series tests passed with no failures; malicious SVG rejection remains covered. The regression includes a known icon, fallback icon, ordinary card and non-root base URLs. Routine suite: 1,705 passed, 0 failed, 1 skipped (opt-in isolated PDF parser, outside this rendering repair). Strict content checks and 1,968-page production build pass. Desktop1440 and phone390 browser runs both progress12→24→36→48→60→72; all observed masks load, measure20px, inherit normal/hover colors, with no page errors or horizontal overflow. This local static preview does not exercise production CSP headers. No live acceptance yet. An artifact check launched before build post-processing finished saw missing generated CSP headers; retained that failed ordering attempt and reran after build completion. Existing grandfathered reader-text warning is unchanged.

## Assumptions made

Keep the narrow HTML batch protocol rather than allow SVG elements, attributes or namespaces. CSS masks preserve the existing 20px mark, currentColor and hover color. The public repository is authoritative; the older private template does not contain the series feature and is not wholesale refreshed.

## Concerns and observations

The separately reported CSP console error is caused by Cloudflare's rotating injected detection wrapper. Resolve injection at its source using scoped account access; never add unsafe-inline or a single changing hash. Operational capability and live verification are recorded separately.

## Close-out confirmation

Independent review, source checkpoint, required hosted checks, normal merge and deployment verification remain pending. Coordinator owns broad validation; feed implementation used GPT-6.1 Sol at xhigh. Durable raw evidence is retained outside generated build output in the private operations task directory. Temporary preview uses localhost8847 and is stopped at close-out.
