import test from 'node:test';import assert from 'node:assert/strict';
import {MOBILE_WORLD_NAV as x} from '../src/world/mobile-navigation-contract.js';
test('mobile world defaults to elevated third person',()=>assert.equal(x.defaultCamera,'third-person-elevated'));
test('first person is optional, never required',()=>assert.deepEqual(x.optionalCameras,['first-person']));
test('gestures use familiar phone patterns',()=>assert.deepEqual(x.gestures,{tap:'move-or-select',drag:'orbit',pinch:'zoom'}));
test('v1 avatar is neutral and not personalized',()=>{assert.equal(x.avatar.v1,'neutral-translucent-humanoid');assert.equal(x.avatar.personalized,false);});
test('spatial movement has deterministic fallbacks',()=>assert.deepEqual(x.deterministicFallbacks,['room-list','map']));
