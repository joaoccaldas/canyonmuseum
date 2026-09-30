import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {CAMERA_MODES,clampMobileLook,defaultCameraMode,followCameraPose,mobileGestureMap} from '../src/world/mobile-camera.js';
const landing=fs.readFileSync(new URL('../src/landing.js',import.meta.url),'utf8');

test('touch defaults to elevated follow instead of free first-person',()=>assert.equal(defaultCameraMode({coarsePointer:true}),'elevated-follow'));
test('desktop keeps first-person museum behavior',()=>assert.equal(defaultCameraMode({coarsePointer:false}),'first-person'));
test('mobile drag rotation is bounded to prevent head spinning',()=>{
 const r=clampMobileLook({yaw:0,pitch:-.38,deltaYaw:99,deltaPitch:99});
 assert.ok(r.yaw<=.42);assert.ok(r.pitch<=.08);
 const l=clampMobileLook({yaw:0,pitch:-.38,deltaYaw:-99,deltaPitch:-99});
 assert.ok(l.yaw>=-.42);assert.ok(l.pitch>=-.68);
});
test('elevated follow camera stays behind and above visitor',()=>{
 const p=followCameraPose({x:0,y:0,z:0,yaw:0,mode:'elevated-follow'});
 assert.ok(p.position.y>=4);assert.ok(p.position.z>0);assert.ok(p.lookAt.z<0);
});
test('overview is a valid pseudo-3D elevated mode',()=>{
 assert.ok(CAMERA_MODES.includes('overview'));
 const p=followCameraPose({x:2,y:0,z:3,yaw:0,mode:'overview'});
 assert.ok(p.position.y>=7);assert.ok(p.position.z>3);
});
test('touch gestures prioritize tap move/select and limited orbit',()=>{
 const g=mobileGestureMap();assert.equal(g.tapGround,'move');assert.equal(g.tapObject,'select');assert.equal(g.drag,'orbit-limited');
});
test('production hall consumes the mobile camera policy',()=>{
 assert.match(landing,/from '.\/world\/mobile-camera\.js'/);
 assert.match(landing,/followCameraPose/);assert.match(landing,/clampMobileLook/);
});
