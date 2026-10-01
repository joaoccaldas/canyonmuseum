// ui/onboarding-questions.js
import { readStorage, writeStorage } from '../engine/storage.js';
import { applyStoredEvent, ensureProgression, LEVELS } from '../engine/progression.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const QUESTIONS=[
  {
    id:'kona-intent',
    kicker:'1 · WHY ARE YOU HERE?',
    title:'What brings you to Kona?',
    note:'No wrong answer. Several questionable ones.',
    answers:[
      ['racing','I’m racing. This seemed sensible once.'],
      ['supporting','I’m supporting someone with expensive hobbies.'],
      ['dreaming','I’m dreaming irresponsibly.'],
      ['curious','I followed a bike here.'],
    ],
  },
  {
    id:'tri-history',
    kicker:'2 · ATHLETIC CREDENTIALS',
    title:'Have you done a triathlon before?',
    note:'We are calibrating the amount of useful nonsense.',
    answers:[
      ['never','No. I do own shoes though.'],
      ['some','A few. I know where the body glide lives.'],
      ['many','Many. My holidays have transition areas.'],
      ['undefined','Define “done”.'],
    ],
  },
  {
    id:'kona-energy',
    kicker:'3 · IMPORTANT SCIENCE',
    title:'Pick your Kona energy.',
    note:'This may affect absolutely everything. Or a wallpaper.',
    answers:[
      ['lava','Lava. Hot, fast, mildly unreasonable.'],
      ['ocean','Ocean. Calm until it very much isn’t.'],
      ['garage','Garage. I came here for the machines.'],
      ['mystery','Mystery. Please do not explain things yet.'],
    ],
  },
];

const load=()=>{try{return JSON.parse(readStorage('entryIntent')||'null')||{schema:1,answers:{}}}catch(_){return{schema:1,answers:{}}};
const save=data=>writeStorage('entryIntent',JSON.stringify(data));

export function renderOnboardingQuestions(host,{onDone,onSkip}={}){
  let index=0;
  const data=load();
  const paint=()=>{
    const q=QUESTIONS[index],answered=Object.keys(data.answers||{}).length;
    const progress=Math.round((answered/QUESTIONS.length)*100);
    const state=ensureProgression();
    const next=LEVELS.find(x=>x.level===Math.min(10,state.level+1));
    host.innerHTML='<section class="onboarding-question" data-onboarding-question>'+
      '<div class="onboarding-progress"><span style="width:'+progress+'%"></span></div>'+
      '<div class="onboarding-question-copy"><p class="eyebrow">'+esc(q.kicker)+'</p><h2>'+esc(q.title)+'</h2><p>'+esc(q.note)+'</p></div>'+
      '<div class="onboarding-answer-grid">'+q.answers.map(([id,label])=>'<button type="button" data-onboarding-answer="'+esc(id)+'">'+esc(label)+'</button>').join('')+'</div>'+
      '<div class="onboarding-reward"><small>YOUR COMPLETELY SERIOUS REWARD METER</small><b>+'+(15)+' XP</b><span>'+(next?'Next: Level '+next.level+' · '+next.name:'You have become suspiciously powerful.')+'</span></div>'+
      '<div class="onboarding-actions"><button type="button" class="btn-text" data-onboarding-skip>Skip the interrogation</button><span>'+(index+1)+' / '+QUESTIONS.length+'</span></div>'+
    '</section>';
    host.querySelectorAll('[data-onboarding-answer]').forEach(btn=>btn.onclick=()=>{
      data.answers[q.id]=btn.dataset.onboardingAnswer;
      data.updated_at=new Date().toISOString();
      save(data);
      applyStoredEvent({type:'ONBOARDING_ANSWER',id:'onboarding:'+q.id,subject:q.id});
      if(index<QUESTIONS.length-1){index+=1;paint();return;}
      data.completed=true;save(data);onDone?.(data);
    });
    host.querySelector('[data-onboarding-skip]').onclick=()=>{data.skipped=true;data.updated_at=new Date().toISOString();save(data);onSkip?.(data);};
  };
  paint();
}
