/** Mint a repository-scoped, short-lived write token in a trusted workflow only. */
import { createSign } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export function appJwt(appId, privateKey, now = Date.now()) {
 if (!/^[1-9][0-9]*$/.test(String(appId))) throw new Error('invalid publishing App ID');
 const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
 const seconds = Math.floor(now / 1000);
 const payload = `${encode({alg:'RS256',typ:'JWT'})}.${encode({iat:seconds-60,exp:seconds+300,iss:String(appId)})}`;
 const sign = createSign('RSA-SHA256');sign.update(payload);sign.end();
 return `${payload}.${sign.sign(privateKey).toString('base64url')}`;
}
export async function mint(env, fetcher = fetch) {
 if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REF !== 'refs/heads/main' || !['workflow_dispatch','workflow_run','schedule'].includes(env.GITHUB_EVENT_NAME)) throw new Error('publishing credentials are restricted to trusted main workflows');
 if (!/^[1-9][0-9]*$/.test(env.SPECIMEN_INSTALLATION_ID ?? '') || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.GITHUB_REPOSITORY ?? '')) throw new Error('invalid installation or repository');
 const response = await fetcher(`https://api.github.com/app/installations/${env.SPECIMEN_INSTALLATION_ID}/access_tokens`, {
  method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${appJwt(env.SPECIMEN_APP_ID,env.SPECIMEN_APP_PRIVATE_KEY)}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},
  body:JSON.stringify({repositories:[env.GITHUB_REPOSITORY.split('/')[1]],permissions:{contents:'write',pull_requests:'write'}})
 });
 if (!response.ok) throw new Error(`publishing App token request failed (${response.status})`);
 const data = await response.json();
 if (typeof data.token !== 'string' || data.token.length > 4096 || !/^[\x21-\x7e]+$/.test(data.token)) throw new Error('invalid publishing token characters');
 if (!Number.isFinite(Date.parse(data.expires_at))) throw new Error('invalid publishing token expiry');
 return data.token;
}
export async function revoke(env = process.env, fetcher = fetch) {
 if (!env.SPECIMEN_WRITE_TOKEN) return;
 const response = await fetcher('https://api.github.com/installation/token', { method:'DELETE', redirect:'error', signal:AbortSignal.timeout(30000), headers:{Authorization:`Bearer ${env.SPECIMEN_WRITE_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'} });
 if (!response.ok && response.status !== 401) throw new Error(`publishing token revocation failed (${response.status})`);
 console.log('Run-local publishing App token revoked.');
}
export const maskData = token => token.replace(/%/g, '%25');
export async function main(env = process.env) {
 if (!env.GITHUB_ENV) throw new Error('workflow environment output required');
 const token = await mint(env);
 // GitHub interprets this command as a mask; never invoke credential minting locally.
 console.log(`::add-mask::${maskData(token)}`);
 appendFileSync(env.GITHUB_ENV, `SPECIMEN_WRITE_TOKEN=${token}\n`);
 console.log('Repository-scoped publishing App token installed for this job.');
}
if(process.argv[1]===fileURLToPath(import.meta.url)) (process.argv[2] === 'revoke' ? revoke() : main()).catch(error=>{console.error(`workflow-app-token: ${error.message}`);process.exitCode=1;});
