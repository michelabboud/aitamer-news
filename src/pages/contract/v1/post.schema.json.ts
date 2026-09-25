/**
 * The v1 post contract, at a version-pinned path. Same handler as `/contract/post.schema.json`
 * (`src/pages/contract/post.schema.json.ts`) — the schema is `POST_CONTRACT_VERSION` 1 today, so
 * the two routes serve identical bytes. When the contract ever needs a breaking change, this path
 * keeps serving v1 while `/contract/post.schema.json` (and a new `/contract/v2/...`) move on.
 */
export { GET } from '../post.schema.json.ts';
