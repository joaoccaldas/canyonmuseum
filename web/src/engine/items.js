// engine/items.js — collection projection over canonical personal state.
// No independent persistence: items derive from Progression discoveries + UserEquipment.
const clean = value => String(value || '').replace(/^(?:product|bike|part|find|kona):/, '');

export function itemCollection(snapshot = {}) {
  const rows = [];
  const seen = new Set();
  const push = item => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id); rows.push(item);
  };

  for (const e of Array.isArray(snapshot.user_equipment) ? snapshot.user_equipment : []) {
    push({
      id:'equipment:' + clean(e.product_id),
      entity_id:e.product_id,
      kind:'equipment',
      relationship:e.relationship || 'try',
      label:clean(e.product_id).replace(/[-_]+/g,' '),
      collected:true,
    });
  }

  for (const race of Array.isArray(snapshot.race_history) ? snapshot.race_history : []) {
    push({
      id:'race:' + race.race_id,
      entity_id:race.race_id,
      kind:'race',
      relationship:race.relationship || 'interested',
      label:'Race badge',
      collected:true,
    });
  }

  const discoveries = [...new Set([
    ...(Array.isArray(snapshot.progression_engine?.discoveries) ? snapshot.progression_engine.discoveries : []),
    ...Object.keys(snapshot.progression?.stamps || {}),
    ...(Array.isArray(snapshot.progression?.discoveries) ? snapshot.progression.discoveries.map(id=>'bike:'+id) : []),
  ])];
  for (const id of discoveries) {
    const raw=String(id);
    const kind=raw.startsWith('bike:')?'bike':raw.startsWith('part:')?'part':raw.startsWith('find:')?'find':raw.startsWith('kona:')?'story':'card';
    push({
      id:'discovery:' + raw,
      entity_id:raw,
      kind,
      relationship:'collected',
      label:clean(raw).replace(/[-_]+/g,' '),
      collected:true,
    });
  }

  return rows;
}

export function collectionSummary(snapshot = {}) {
  const items=itemCollection(snapshot);
  const count=kind=>items.filter(x=>x.kind===kind).length;
  return { total:items.length, equipment:count('equipment'), bikes:count('bike'), parts:count('part'), finds:count('find'), stories:count('story'), races:count('race') };
}
