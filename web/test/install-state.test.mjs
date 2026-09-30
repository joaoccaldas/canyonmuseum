import test from 'node:test';import assert from 'node:assert/strict';
import {installInstructions,installState} from '../src/engine/install-state.js';
test('Android with beforeinstallprompt uses native prompt',()=>assert.deepEqual(installState({android:true,deferred:true}),{kind:'android-prompt',show:true,action:'prompt'}));
test('Android without prompt gets instructions, never an empty sheet',()=>{const s=installState({android:true});assert.equal(s.action,'instructions');assert.match(installInstructions(s.kind),/Install app|Add to Home screen/);});
test('iOS gets Add to Home Screen instructions',()=>{const s=installState({ios:true});assert.equal(s.action,'instructions');assert.match(installInstructions(s.kind),/Add to Home Screen/);});
test('installed app hides install',()=>assert.equal(installState({standalone:true}).show,false));
test('native container hides web install',()=>assert.equal(installState({native:true}).show,false));
test('generic browser prompt is used when available',()=>assert.equal(installState({deferred:true}).action,'prompt'));
test('generic browser without native prompt still exposes install instructions',()=>{
  const s=installState({});
  assert.deepEqual(s,{kind:'browser-instructions',show:true,action:'instructions'});
  assert.match(installInstructions(s.kind),/browser menu|home screen/i);
});

// Release receipt: deterministic install state must remain covered by this suite.
