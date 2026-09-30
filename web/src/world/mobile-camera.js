export const CAMERA_MODES=Object.freeze(['elevated-follow','first-person','overview']);

export function defaultCameraMode({coarsePointer=false}={}){
 return coarsePointer?'elevated-follow':'first-person';
}

export function mobileGestureMap(){
 return Object.freeze({
  drag:'orbit-limited',
  pinch:'zoom',
  tapGround:'move',
  tapObject:'select',
  recenter:'follow-avatar',
  overview:'toggle-overview',
 });
}

export function cameraPreferences({mode='elevated-follow',distance=6.5,height=4.2,pitch=-0.38}={}){
 const safeMode=CAMERA_MODES.includes(mode)?mode:'elevated-follow';
 const defaults=safeMode==='overview'
   ? {distance:9,height:7,pitch:-0.62}
   : safeMode==='first-person'
     ? {distance:0,height:1.68,pitch:-0.04}
     : {distance:6.5,height:4.2,pitch:-0.38};
 return {
  mode:safeMode,
  distance:Math.max(0,Math.min(12,Number.isFinite(distance)?distance:defaults.distance)),
  height:Math.max(1.5,Math.min(9,Number.isFinite(height)?height:defaults.height)),
  pitch:Math.max(-0.75,Math.min(0.18,Number.isFinite(pitch)?pitch:defaults.pitch)),
 };
}

export function clampMobileLook({yaw=0,pitch=-0.38,deltaYaw=0,deltaPitch=0}={}){
 return {
  yaw:yaw+Math.max(-0.42,Math.min(0.42,deltaYaw)),
  pitch:Math.max(-0.68,Math.min(0.08,pitch+Math.max(-0.18,Math.min(0.18,deltaPitch))),
 };
}

export function followCameraPose({x=0,y=0,z=0,yaw=0,mode='elevated-follow',distance,height,pitch}={}){
 const pref=cameraPreferences({mode,distance,height,pitch});
 if(pref.mode==='first-person') return {position:{x,y:y+pref.height,z},lookAt:{x:x-Math.sin(yaw)*8,y:y+pref.height+Math.sin(pref.pitch)*8,z:z-Math.cos(yaw)*8},preferences:pref};
 const back=pref.distance;
 const px=x+Math.sin(yaw)*back;
 const pz=z+Math.cos(yaw)*back;
 const py=y+pref.height;
 const lookDistance=pref.mode==='overview'?3.2:2.2;
 return {position:{x:px,y:py,z:pz},lookAt:{x:x-Math.sin(yaw)*lookDistance,y:y+1.1,z:z-Math.cos(yaw)*lookDistance},preferences:pref};
}
