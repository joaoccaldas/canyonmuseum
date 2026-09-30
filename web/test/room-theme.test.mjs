import test from 'node:test';import assert from 'node:assert/strict';
import {ROOM_THEME_KEYS,roomThemeStyle,validateRoomTheme} from '../src/engine/room-theme.js';
test('room themes expose atmosphere only',()=>assert.deepEqual(ROOM_THEME_KEYS,['accent','ambient','surface','lightIntensity','fogDensity']));
test('room cannot inject navigation or button semantics',()=>{const x=validateRoomTheme({accent:'#ff0000',buttonColor:'#0f0',font:'Comic Sans',nav:'pink'});assert.deepEqual(x,{accent:'#ff0000'});});
test('invalid colors fail closed',()=>assert.deepEqual(validateRoomTheme({accent:'url(javascript:x)'}),{}));
test('numeric atmosphere is bounded',()=>assert.deepEqual(validateRoomTheme({lightIntensity:99,fogDensity:1}),{lightIntensity:3,fogDensity:.2}));
test('style adapter only emits room-scoped custom properties',()=>assert.deepEqual(roomThemeStyle({accent:'#123456'}),{'--room-accent':'#123456'}));
