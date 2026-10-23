/** Validate once per build module lifetime, never once per rendered card. */
import catalog from '../data/prepared-heroes.json' with { type: 'json' };
import { validatePreparedCatalog } from './prepared-heroes.ts';
export default validatePreparedCatalog(catalog);
