export const MOBILE_WORLD_NAV=Object.freeze({
 defaultCamera:'third-person-elevated',
 optionalCameras:['first-person'],
 gestures:Object.freeze({
  tap:'move-or-select',
  drag:'orbit',
  pinch:'zoom',
 }),
 avatar:Object.freeze({
  v1:'neutral-translucent-humanoid',
  personalized:false,
  source:'explicit-user-choice-only',
 }),
 deterministicFallbacks:Object.freeze(['room-list','map']),
});
