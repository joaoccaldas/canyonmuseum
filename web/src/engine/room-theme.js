const HEX=/^#[0-9a-f]{6}$/i;
export const ROOM_THEME_KEYS=Object.freeze(['accent','ambient','surface','lightIntensity','fogDensity']);
export function validateRoomTheme(theme={}){
 const out={};
 if(theme.accent&&HEX.test(theme.accent)) out.accent=theme.accent;
 if(theme.ambient&&HEX.test(theme.ambient)) out.ambient=theme.ambient;
 if(theme.surface&&HEX.test(theme.surface)) out.surface=theme.surface;
 if(Number.isFinite(theme.lightIntensity)) out.lightIntensity=Math.max(0,Math.min(3,theme.lightIntensity));
 if(Number.isFinite(theme.fogDensity)) out.fogDensity=Math.max(0,Math.min(.2,theme.fogDensity));
 return out;
}
export function roomThemeStyle(theme={}){
 const t=validateRoomTheme(theme);
 return {
  ...(t.accent?{'--room-accent':t.accent}:{}),
  ...(t.ambient?{'--room-ambient':t.ambient}:{}),
  ...(t.surface?{'--room-surface':t.surface}:{}),
 };
}
