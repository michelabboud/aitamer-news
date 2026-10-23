import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {decodeImage} from './image-approval.mjs';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==','base64');
function fixture(t){const cwd=mkdtempSync(join(tmpdir(),'image-decoder-'));t.after(()=>rmSync(cwd,{recursive:true}));return{cwd,put:(path,bytes)=>writeFileSync(join(cwd,path),bytes)};}
test('isolated raster decoding accepts real images and rejects malformed and oversized-dimension data', t => {
  const f = fixture(t);
  // Explicit local media integration; routine site checks need no decoder.
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=16x16:d=0.1', '-frames:v', '1', join(f.cwd, 'real.png')], { stdio: ['ignore', 'pipe', 'pipe'] });
  assert.doesNotThrow(() => decodeImage('real.png', f.cwd));
  f.put('broken.png', Buffer.concat([PNG.subarray(0, 24), Buffer.from('bad compressed image')]));
  assert.throws(() => decodeImage('broken.png', f.cwd), /decode failed/);
  f.put('large.gif', Buffer.from('474946383961ffff0100800000000000ffffff2c00000000ffff01000002024401003b', 'hex'));
  assert.throws(() => decodeImage('large.gif', f.cwd), /dimensions|decode/);
});
