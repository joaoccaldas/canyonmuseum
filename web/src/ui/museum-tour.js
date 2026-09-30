export function createMuseumTour({
  $,coarse,isStarted,enter,pathActive,pieces,champs,wyldBikes,pier,
  visitPiece,visitChamp,visitPier,visitHween,visitWyld,toast,
}) {
  const tour={on:false,i:-1,t:0,paused:false,stops:[]};
  const DWELL=9;
  const haptic=(ms=8)=>{try{if(coarse)navigator.vibrate?.(ms);}catch(_){}};

  const tourStops=()=>{
    const heritage=pieces.filter(p=>p.glb&&!p.flagship),flagships=pieces.filter(p=>p.flagship);
    return[
      {kind:'hween'},
      ...heritage.map(p=>({kind:'piece',p})),
      ...[0,2,4,5].map(i=>champs[i]).filter(Boolean).map(c=>({kind:'champ',c})),
      ...[0,3].map(i=>wyldBikes[i]).filter(Boolean).map(v=>({kind:'wyld',v})),
      ...flagships.map(p=>({kind:'piece',p})),
      ...(pier?[0,4,9,10,11].map(i=>pier.stations[i]).filter(Boolean).map(y=>({kind:'pier',y})).concat([{kind:'pier',y:pier.finale}]):[]),
    ];
  };
  const end=finished=>{
    if(!tour.on)return;
    tour.on=false;document.body.classList.remove('touring');
    toast(finished?'That was the collection. Walk on, or tap any piece to revisit it.':'Tour paused — you have the controls.');
  };
  const go=i=>{
    tour.i=i;tour.t=0;const stop=tour.stops[i];
    if(!stop)return end(true);
    if(stop.kind==='piece')visitPiece(stop.p);
    else if(stop.kind==='champ')visitChamp(stop.c);
    else if(stop.kind==='pier')visitPier(stop.y);
    else if(stop.kind==='hween')visitHween();
    else visitWyld(stop.v);
    $('tourStep').textContent=`${i+1} / ${tour.stops.length}`;
    $('tourBar').style.setProperty('--p',0);
  };
  const start=()=>{
    $('coach').hidden=true;
    if(!isStarted())enter();
    tour.stops=tourStops();tour.on=true;tour.paused=false;document.body.classList.add('touring');
    $('tourPause').textContent='Pause';haptic(12);go(0);
  };
  const tick=dt=>{
    if(!tour.on||tour.paused||pathActive())return;
    if(!$('card').classList.contains('on'))return;
    tour.t+=dt;$('tourBar').style.setProperty('--p',Math.min(1,tour.t/DWELL));
    if(tour.t>=DWELL)go(tour.i+1);
  };

  $('tourBtn')?.addEventListener('click',start);
  $('tourPause')?.addEventListener('click',()=>{tour.paused=!tour.paused;$('tourPause').textContent=tour.paused?'Resume':'Pause';});
  $('tourNext')?.addEventListener('click',()=>go(tour.i+1));
  $('tourStop')?.addEventListener('click',()=>end(false));

  const coachState={k:-1,steps:[]};
  const coach=()=>{
    let seen=false;try{seen=localStorage.getItem('speedmax.coach.v1')==='1';}catch(_){}
    if(seen||!coarse)return false;
    coachState.steps=[['joy','Push the tri-stick to walk'],['look','Drag anywhere to look around'],['tap','Tap a bike to visit it']];
    setTimeout(()=>{if(!tour.on)showCoach(0);},900);
    return true;
  };
  const showCoach=k=>{
    const el=$('coach');coachState.k=k;
    if(k>=coachState.steps.length){el.hidden=true;try{localStorage.setItem('speedmax.coach.v1','1');}catch(_){}return;}
    const[kind,text]=coachState.steps[k];
    el.dataset.kind=kind;el.querySelector('b').textContent=text;el.querySelector('small').textContent=`${k+1} of ${coachState.steps.length}`;el.hidden=false;
  };
  const coachDid=kind=>{
    if(coachState.k<0||$('coach').hidden)return;
    if(coachState.steps[coachState.k]?.[0]===kind){haptic(6);showCoach(coachState.k+1);}
  };
  $('coachOk')?.addEventListener('click',()=>showCoach(coachState.k+1));

  return{tour,tourStart:start,tourEnd:end,tourTick:tick,haptic,coach,coachDid};
}
