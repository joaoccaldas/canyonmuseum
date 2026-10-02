#!/usr/bin/env node
import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(new URL('../'+p, import.meta.url), 'utf8'));
const roomsDoc = read('world/konam/rooms-v1.json');
const collectionDoc = read('collections/kona-141-v1.json');
const questsDoc = read('quests/founding-v1.json');
const progressionDoc = read('world/konam/progression-v1.json');

const fail = m => { console.error('Kona.m world validation failed:', m); process.exitCode = 1; };
const unique = xs => new Set(xs).size === xs.length;

const rooms = roomsDoc.rooms || [];
const items = collectionDoc.items || [];
const quests = questsDoc.quests || [];

if (rooms.length !== 28) fail(`expected 28 rooms, got ${rooms.length}`);
const founding = rooms.filter(r => r.group === 'foundation');
const progressive = rooms.filter(r => r.group === 'progressive');
if (founding.length !== 14) fail(`expected 14 founding rooms, got ${founding.length}`);
if (progressive.length !== 14) fail(`expected 14 progressive rooms, got ${progressive.length}`);
if (!founding.every(r => r.launch_visible === true)) fail('all founding rooms must be launch-visible');
if (!progressive.every(r => r.launch_visible === false)) fail('progressive rooms must not be launch-visible by default');
if (!unique(rooms.map(r => r.id))) fail('room ids must be unique');
if (!unique(rooms.map(r => r.slug))) fail('room slugs must be unique');

if (items.length !== 141) fail(`expected 141 founding collectibles, got ${items.length}`);
if (!unique(items.map(i => i.id))) fail('collectible ids must be unique');
if (!unique(items.map(i => i.number))) fail('collectible numbers must be unique');

for (const r of founding) {
  const count = items.filter(i => i.room_id === r.id).length;
  if (count !== 10) fail(`${r.id} must own exactly 10 founding collectibles; got ${count}`);
}
const global = items.filter(i => i.room_id == null);
if (global.length !== 1 || global[0].id !== 'k141-141') fail('The Point Six must be the single roomless founding collectible');
if (global[0].tradable || global[0].purchasable) fail('The Point Six must never be tradable or purchasable');
if (items.some(i => i.purchasable)) fail('no Founding 141 item may be purchasable');

const roomIds = new Set(rooms.map(r => r.id));
for (const i of items) if (i.room_id && !roomIds.has(i.room_id)) fail(`unknown room ${i.room_id} on ${i.id}`);

const itemIds = new Set(items.map(i => i.id));
for (const q of quests) {
  for (const id of q.reward_item_ids || []) if (!itemIds.has(id)) fail(`quest ${q.id} rewards unknown item ${id}`);
}
if (!unique(quests.map(q => q.id))) fail('quest ids must be unique');
const foundingQuestRooms = new Set(quests.filter(q => q.room_id).map(q => q.room_id));
for (const r of founding) if (!foundingQuestRooms.has(r.id)) fail(`founding room ${r.id} lacks a founding quest`);

const anchors = collectionDoc.collection?.anchor_item_ids || [];
if (anchors.length !== 14 || !unique(anchors)) fail('expected 14 unique anchor items');
for (const id of anchors) if (!itemIds.has(id)) fail(`anchor item ${id} does not exist`);
if (anchors.includes('k141-141')) fail('The Point Six cannot be an anchor for itself');

const progIds = new Set((progressionDoc.progressive || []).map(x => x.room_id));
for (const r of progressive) if (!progIds.has(r.id)) fail(`progressive room ${r.id} lacks an unlock rule`);

if (!process.exitCode) {
  console.log(JSON.stringify({
    ok:true,
    rooms:rooms.length,
    founding_rooms:founding.length,
    progressive_rooms:progressive.length,
    collectibles:items.length,
    room_collectibles:items.filter(i=>i.room_id).length,
    global_collectibles:global.length,
    quests:quests.length,
    anchors:anchors.length
  }, null, 2));
}
