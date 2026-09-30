// ui/race-cards.js — one visual/interaction grammar for canonical Race Cards.
import { searchRaces, getRace } from '../engine/race-catalog.js';
import { readRaceHistory, setRaceRelationship, removeRace } from '../engine/race-history.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const relationLabel=r=>({completed:'Completed',registered:'Registered',interested:'Interested'}[r]||'Interested');
const defaultRelationship=r=>{
  if(r?.date) return new Date(r.date+'T12:00:00') < new Date() ? 'completed':'registered';
  return Number(r?.year||0) < new Date().getFullYear() ? 'completed':'interested';
};
export function raceCardMarkup(r,{relationship=null,interactive=false}={}){
  const relation=relationship||defaultRelationship(r);
  return '<article class="race-card" data-race-id="'+esc(r.id)+'">'+
    '<div class="race-card-top"><small>'+esc(r.brand)+'</small><b>'+esc(r.year)+'</b></div>'+
    '<h4>'+esc(r.name)+'</h4>'+
    '<p>'+esc(r.distance)+' · '+esc(r.date||String(r.year))+'</p>'+
    (interactive?'<div class="race-card-actions">'+
      '<button type="button" data-race-rel="completed">Completed</button>'+
      '<button type="button" data-race-rel="registered">Registered</button>'+
      '<button type="button" data-race-rel="interested">Interested</button>'+
    '</div>':'<span class="race-card-badge">'+esc(relationLabel(relation))+'</span>')+
  '</article>';
}

export async function renderRaceBadges(root,{limit=12,empty=true}={}){
  const history=readRaceHistory();
  const cards=[];
  for(const row of history.slice().reverse().slice(0,limit)){
    const race=await getRace(row.race_id);
    if(race) cards.push(raceCardMarkup(race,{relationship:row.relationship}));
  }
  root.innerHTML=cards.join('')||(empty?'<p class="kona-source-note">No race badges yet.</p>':'');
}

export function renderRacePicker(root,{onChange}={}){
  if(!root) return;
  root.innerHTML=
    '<div class="race-picker">'+
      '<label><span>Search IRONMAN races</span><input type="search" data-race-search autocomplete="off" placeholder="Try Kalmar, Oman, Copenhagen…"></label>'+
      '<div class="race-picker-results" data-race-results></div>'+
      '<div class="race-picker-selected" data-race-selected><div class="kona-section-head"><h3>Your race cards</h3><small>Profile badges</small></div><div data-race-badges></div></div>'+
    '</div>';
  const input=root.querySelector('[data-race-search]');
  const results=root.querySelector('[data-race-results]');
  const badges=root.querySelector('[data-race-badges]');
  let token=0;

  const refreshBadges=()=>renderRaceBadges(badges,{limit:20,empty:true});
  const paint=async q=>{
    const my=++token;
    const races=await searchRaces(q,{limit:8});
    if(my!==token)return;
    results.innerHTML=races.map(r=>raceCardMarkup(r,{interactive:true})).join('')||
      '<p class="kona-source-note">No matching IRONMAN race edition found.</p>';
    results.querySelectorAll('[data-race-id]').forEach(card=>{
      card.querySelectorAll('[data-race-rel]').forEach(btn=>btn.addEventListener('click',async()=>{
        setRaceRelationship(card.dataset.raceId,btn.dataset.raceRel);
        await refreshBadges();
        onChange?.(readRaceHistory());
      }));
    });
  };
  input.addEventListener('input',()=>paint(input.value));
  input.addEventListener('focus',()=>{if(!results.children.length)paint(input.value)});
  badges.addEventListener('click',e=>{
    const card=e.target.closest?.('[data-race-id]');
    if(card&&e.target.matches?.('[data-remove-race]')){removeRace(card.dataset.raceId);refreshBadges();onChange?.(readRaceHistory())}
  });
  paint('');
  refreshBadges();
}
