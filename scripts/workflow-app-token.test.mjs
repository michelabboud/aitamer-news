import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { appJwt, mint, revoke, maskData } from './workflow-app-token.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const env={GITHUB_ACTIONS:'true',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:'owner/news',SPECIMEN_APP_ID:'1',SPECIMEN_INSTALLATION_ID:'2',SPECIMEN_APP_PRIVATE_KEY:privateKey};
test('App JWT binds identity and short expiry with real RSA signature',()=>{
 const [h,p,s]=appJwt('1',privateKey,1000000).split('.');const claim=JSON.parse(Buffer.from(p,'base64url'));
 assert.deepEqual(claim,{iat:940,exp:1300,iss:'1'});const v=createVerify('RSA-SHA256');v.update(`${h}.${p}`);v.end();assert.ok(v.verify(publicKey,Buffer.from(s,'base64url')));
});
test('mint asks only one repository for contents and pull request writes',async()=>{
 const token=await mint(env,async(url,options)=>{assert.ok(url.endsWith('/installations/2/access_tokens'));assert.deepEqual(JSON.parse(options.body),{repositories:['news'],permissions:{contents:'write',pull_requests:'write'}});return {ok:true,json:async()=>({token:'ghs_fixture',expires_at:'2026-10-05T10:00:00Z'})};});assert.equal(token,'ghs_fixture');
});
test('mint rejects local, PR and non-main execution before fetching',async()=>{
 for(const patch of [{GITHUB_ACTIONS:'false'},{GITHUB_REF:'refs/heads/grok/x'},{GITHUB_EVENT_NAME:'pull_request'},{SPECIMEN_INSTALLATION_ID:'../../x'}])await assert.rejects(mint({...env,...patch},()=>{throw new Error('must not fetch');}),/restricted|invalid/);
});
test('mint fails closed on denied or malformed token responses',async()=>{
 await assert.rejects(mint(env,async()=>({ok:false,status:403})),/403/);
 await assert.rejects(mint(env,async()=>({ok:true,json:async()=>({token:'fixture\ninjected',expires_at:'invalid'})})),/invalid/);
});

test('cleanup revokes the installation token and surfaces denial',async()=>{
 let called=false;await revoke({},()=>{called=true;});assert.equal(called,false);
 await revoke({SPECIMEN_WRITE_TOKEN:'fixture'},async(url,options)=>{assert.equal(url,'https://api.github.com/installation/token');assert.equal(options.method,'DELETE');assert.equal(options.headers.Authorization,'Bearer fixture');return {ok:true,status:204};});
 await assert.rejects(revoke({SPECIMEN_WRITE_TOKEN:'fixture'},async()=>({ok:false,status:403})),/403/);
});

test('mint accepts opaque printable token punctuation but rejects environment injection',async()=>{
 for (const token of ['ghs_fixture-with.punctuation+/=', 'ghs_fixture']) assert.equal(await mint(env,async()=>({ok:true,json:async()=>({token,expires_at:'2026-10-05T10:00:00Z'})})),token);
 for (const token of ['', 'x\ny', 'x\ry', 'x y', 'x\ty', 'x'.repeat(4097)]) await assert.rejects(mint(env,async()=>({ok:true,json:async()=>({token,expires_at:'2026-10-05T10:00:00Z'})})),/characters/);
});

test('mask command preserves opaque percent sequences without decoding newlines',()=>{
 assert.equal(maskData('ghs_%0A%25'), 'ghs_%250A%2525');
});
