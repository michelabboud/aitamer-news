# Review record: hero images move to R2 (0.2.45), 2026-09-28

Deep review (data class) by an independent Opus 5.5 reviewer on pinned commits in a detached checkout, cold read first. Raw notes in `2026-09-28-heroes-to-r2/`.

| Round | Target | Verdict | Findings |
|---|---|---|---|
| 1 | `c554515` | CLEAR | N1 the deploy no longer caught an unuploaded hero; N2 the old `/heroes/` path still passed while the file existed; N3 the content licence named the removed folder; N4 ADR 0005 edited in place. Informational: I1 check:times scans only the top level; I2 URL variants not pinned in tests; I3 deleting a legacy post forces deleting its redirect. Verified: only heroImage lines changed (44/44, Mai's five included), all 44 live images byte-identical to git, 22 rule-bypass attempts refused. |
| — | `29309a3`, `ea08f6a` | fixes | N1 check:media in the deploy before any upload and on every pull request; N2 old path refused, public/heroes absence enforced, 13 variants pinned (closes I2); N3 location wording only; N4 ADR 0005 restored plus one Status line. I1, I3 to BACKLOG. |
| 2 | `ea08f6a` | CLEAR | R1 ADR 0020 still said a media outage never fails a deploy; R2 a malformed pubDate crashed check:media; R3 a missing hero blocks every deploy until fixed (runbook). |
| — | this commit | fixes | R1 sentence corrected; R2 handled as a reported problem with a regression test that fails first; R3 recovery steps in `docs/runbooks/deploys.md`. |

**Ruling (coordinator, 2026-09-28):** clear to merge. Follow-up for atn-ops: posts-mcp must upload heroes to R2 and write the exact media URL before opening a pull request (both BACKLOGs).
