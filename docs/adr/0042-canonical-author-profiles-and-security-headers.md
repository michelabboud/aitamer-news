# 0042. Canonical author profiles and shared Pages security headers

Status: implemented for review, 2026-10-23. Dev mode: production.

Use /authors/<id>/ as the one canonical author address. Move each featured writer's rich profile, portrait, introduction, beats, website and poem/piece listings there; retain ordinary human/bot profiles. Point navigation, home cards, bylines and structured data at this route. Keep exact slash/non-slash301 redirects for the five historical aliases (mai, aviram, quill, foxy, ari) when those authors are present, even if no longer featured. New featured authors do not claim top-level paths. Remove alias URLs from the sitemap and keep noindex canonical static fallback pages for hosts ignoring Pages redirects.

Build the bounded redirect file from tracked source and present authors, reject collisions/overflow before writing, and change only dist output. Article text, publication dates, author records and permanent specimen identities stay fixed.

Serve X-Frame-Options DENY and disable unused camera, microphone, geolocation, payment and USB capabilities. Keep playback/fullscreen defaults. Add only static.cloudflareinsights.com to script-src and stats.g.doubleclick.net to connect-src. Page CSP remains report-only; preserve search WebAssembly, diagram isolation, preview noindex, caches and generated hashes. Cloudflare zone configuration remains the sole HSTS authority.

Real local Pages testing found that repeating a header-rule pattern discards the earlier block. Keep the handwritten global block last and append generated CSP inside it. Reject duplicate patterns/nonfinal global source blocks rather than silently losing static headers. Unit tests and actual HTTP probes cover the behavior. No dependencies or trust/admission permissions change.
