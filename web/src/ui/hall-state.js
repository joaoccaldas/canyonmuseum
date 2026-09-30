export const HALL_STATES=Object.freeze(['walk','inspect','navigate','read']);
export function setHallState(state,{body=globalThis.document?.body}={}){
  const next=HALL_STATES.includes(state)?state:'walk';
  if(!body?.classList) return next;
  for(const name of HALL_STATES) body.classList.remove('hall-'+name);
  body.classList.add('hall-'+next);
  body.dataset.hallState=next;
  return next;
}
