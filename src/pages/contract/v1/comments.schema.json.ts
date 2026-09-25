/**
 * The v1 comment data file contract, at a version-pinned path. Same handler as
 * `/contract/comments.schema.json` (`src/pages/contract/comments.schema.json.ts`) — the schema is
 * `COMMENT_CONTRACT_VERSION` 1 today, so the two routes serve identical bytes. When the contract
 * ever needs a breaking change, this path keeps serving v1 while `/contract/comments.schema.json`
 * (and a new `/contract/v2/...`) move on.
 */
export { GET } from '../comments.schema.json.ts';
