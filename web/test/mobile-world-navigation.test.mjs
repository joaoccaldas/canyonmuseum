import test from 'node:test';import assert from 'node:assert/strict';
import {avatarProfile,placeholderAvatarSpec} from '../src/world/avatar-profile.js';
import {cameraPreferences,defaultCameraMode,mobileGestureMap} from '../src/world/mobile-camera.js';

test('mobile defaults to stable elevated follow',()=>assert.equal(defaultCameraMode({coarsePointer:true}),'elevated-follow'));
test('desktop retains first person',()=>assert.equal(defaultCameraMode({coarsePointer:false}),'first-person'));
test('mobile gestures prioritize limited orbit plus tap move/select',()=>{
 const g=mobileGestureMap();
 assert.equal(g.drag,'orbit-limited');assert.equal(g.pinch,'zoom');assert.equal(g.tapGround,'move');assert.equal(g.tapObject,'select');assert.equal(g.recenter,'follow-avatar');assert.equal(g.overview,'toggle-overview');
});
test('placeholder is translucent and noninteractive',()=>{const x=placeholderAvatarSpec();assert.ok(x.opacity>0&&x.opacity<1);assert.equal(x.interactive,false);});
test('avatar equipment ids deduplicate for future RaceIdentity integration',()=>assert.deepEqual(avatarProfile({equipmentIds:['a','a','b']}).equipmentIds,['a','b']));
test('camera bounds prevent absurd mobile zoom',()=>{
 const x=cameraPreferences({distance:99,height:-2});
 assert.equal(x.mode,'elevated-follow');assert.equal(x.distance,12);assert.equal(x.height,1.5);assert.ok(x.pitch<=.18&&x.pitch>=-.75);
});
