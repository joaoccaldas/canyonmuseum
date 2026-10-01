// engine/avatar.js — canonical customizable voxel avatar contract.
// The personal figure is deliberately block-built: lightweight, readable on phones and easy to skin.
// Renderer and UI both consume this one shape; equipment remains separate canonical UserEquipment.
export const AVATAR_MODEL='voxel';
export const AVATAR_OPTIONS=Object.freeze({
  skin:['sand','bronze','umber','deep'],
  hair:['none','short','crop','cap'],
  top:['kona-black','lava','ocean','hibiscus','lime'],
  bottoms:['black','navy','graphite'],
  shoes:['white','lava','ocean','lime'],
  accessory:['none','visor','headband'],
});
export const AVATAR_COLORS=Object.freeze({
  skin:{sand:'#d6aa86',bronze:'#b77d58',umber:'#80543d',deep:'#4e342b'},
  hair:{none:'transparent',short:'#211c1a',crop:'#342922',cap:'#0f1519'},
  top:{'kona-black':'#11181c',lava:'#e8471c',ocean:'#138a8f',hibiscus:'#c53b72',lime:'#719444'},
  bottoms:{black:'#101417',navy:'#172938',graphite:'#3a4247'},
  shoes:{white:'#ecebe6',lava:'#e8471c',ocean:'#138a8f',lime:'#719444'},
  accessory:{none:'transparent',visor:'#11181c',headband:'#f0eee8'},
});
export const defaultAvatarStyle=()=>({v:2,model:AVATAR_MODEL,skin:'bronze',hair:'short',top:'kona-black',bottoms:'black',shoes:'white',accessory:'none',accent:'#e8471c'});
export function normaliseAvatarStyle(v){
  const d=defaultAvatarStyle(),o=v&&typeof v==='object'?v:{};
  const pick=(k,val)=>AVATAR_OPTIONS[k]?.includes(val)?val:d[k];
  return {v:2,model:AVATAR_MODEL,skin:pick('skin',o.skin),hair:pick('hair',o.hair),top:pick('top',o.top),bottoms:pick('bottoms',o.bottoms),shoes:pick('shoes',o.shoes),accessory:pick('accessory',o.accessory),accent:/^#[0-9a-f]{6}$/i.test(o.accent||'')?o.accent:d.accent};
}
