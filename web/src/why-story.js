const ROUTES = ['home','short','scenic','unfiltered','final'];

const stories = {
  short: {
    index:'01',
    title:'The Short Version',
    estimate:'~ 15 seconds',
    paragraphs:[
      'My favorite person got me back into training.',
      'So, naturally, I made an Excel sheet to track my progress.',
      'One thing led to another.',
      '<strong>Now there\'s an island.</strong>',
      'Here we are.'
    ],
    note:'Small tracking sheet. Big consequences.',
    image:'assets/kona-years/queen-k.jpg'
  },
  scenic: {
    index:'02',
    title:'The Scenic Route',
    estimate:'~ 1 minute',
    intro:'It started with training.',
    path:[
      ['👟','Training','Wanted to get back into it. Start somewhere.'],
      ['▤','Excel','So I made an Excel sheet. Just a simple one… at first.'],
      ['✦','AI','Then I started playing with AI. Because of course.'],
      ['🚲','Bikes','Then there were bikes. Then 3D bikes.'],
      ['⌂','A room','The bikes needed somewhere to live.'],
      ['▥','A museum','If there is a room, apparently it becomes a museum.'],
      ['♒','An island','And apparently… the museum needed a home.']
    ],
    paragraphs:[
      'I didn\'t really have a master plan. I just kept solving the next little puzzle.',
      '<strong>One bike. One room. One road. One problem.</strong>',
      'I didn\'t need the whole picture. I just needed the next piece.',
      'And somewhere along the way, the pieces started fitting together.'
    ],
    note:'Still looking for the box.',
    image:'assets/kona-years/kailua-bay.jpg'
  },
  unfiltered: {
    index:'03',
    title:'The Unfiltered Version',
    estimate:'(honestly, who knows?)',
    paragraphs:[
      'Okay, so…',
      'I\'ve been taking some time for myself. Slowing down a bit. Trying to get some energy back.',
      'My favorite person got me back into training.',
      'Normal response: <strong>start training.</strong>',
      'My response: <strong>Excel.</strong>',
      'Then the Excel sheet got a little more complicated. Then AI. Then bikes. Then 3D bikes. Then a room. Then several rooms. Then apparently an island.',
      '<strong>Side quest. Side quest. Completely unnecessary detail that is now absolutely essential. Side quest.</strong>',
      'And somewhere in all of this, something nice happened.',
      '<strong>I was having fun again.</strong>',
      'I didn\'t need to know the whole map. I just needed the next piece. Fix one bike. One room. One road. Take one step. See what happens. Take another one.',
      'Sometimes the piece fits. Sometimes you spend three hours discovering you\'ve been holding it upside down. Fine. Turn it around. Try again.',
      'I\'ve started a lot of things. I\'ve finished considerably fewer. So this one matters.'
    ],
    sidequest:{
      title:'Completely unrelated side quest:',
      body:[
        'Someone lost a phone during a trip to Sweden. I had the phone. I needed to send it abroad. Simple.',
        'Approximately a week and a half later, I still had the phone.',
        'I finally drove there. Parked. Then sat in the car for another thirty minutes. At the place. With the package.',
        'This is an extraordinarily inefficient logistics network.'
      ],
      number:'329,000',
      numberCaption:'roughly how many seconds came before the useful five',
      countdown:'5 · 4 · 3 · 2 · 1',
      ending:'And I moved. No transformation. No inspirational soundtrack. I just moved.'
    },
    ending:[
      'That is roughly what this project has been teaching me.',
      'Not: <strong>figure everything out.</strong>',
      'More: <strong>take the next step.</strong>',
      'Find the next puzzle piece. Put it somewhere. If it does not fit, try another one. Explore a bit. Get lost. Come back. Keep moving.',
      'Eventually you look down and there is a picture where there used to be a pile of pieces.'
    ],
    note:'We are absolutely not calling it finished-finished.',
    image:'assets/kona-years/queen-k.jpg'
  }
};

function esc(s=''){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function routeFromUrl(){
  const r=new URL(location.href).searchParams.get('story') || 'home';
  return ROUTES.includes(r)?r:'home';
}
function href(route){return route==='home'?'why.html':`why.html?story=${route}`}
function go(route){
  history.pushState({route},'',href(route));
  render(route);
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function wire(){
  document.querySelectorAll('[data-route]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.route)}));
}
function nav(prev,next,progress){
  return `<nav class="why-story-nav" aria-label="Story navigation">
    <a href="${href(prev)}" data-route="${prev}">← Back</a>
    <div class="why-progress why-progress--${progress}" aria-hidden="true"><span></span></div>
    <a class="why-next" href="${href(next)}" data-route="${next}">Next <span aria-hidden="true">→</span></a>
  </nav>`;
}
function wordmarkHero(){
  return `<section class="why-hero">
    <div class="why-hero-copy">
      <span class="why-hero-note why-hand">well…<br>how long<br>do you have?</span>
      <h1>Why<br>This Exists?</h1>
      <p>Training, technology, adventures, random ideas and a lot of curiosity. Some stories just take the scenic route.</p>
    </div>
    <div class="why-hero-media artifact artifact--photo">
      <img src="assets/kona-years/queen-k.jpg" alt="A highway landscape in Kona">
      <span class="why-photo-note why-hand">Same ocean.<br>New route.</span>
      <span class="why-photo-list">People<br>Places<br>Progress<br>Belonging</span>
    </div>
  </section>`;
}
function choice(route,index,title,estimate,icon,body,foot){
  return `<a class="why-choice" href="${href(route)}" data-route="${route}">
    <div class="why-choice-top"><span class="why-index">${index}</span><div><h2>${title}</h2><span class="why-estimate">${estimate}</span></div></div>
    <span class="why-choice-icon" aria-hidden="true">${icon}</span>
    ${body.map(p=>`<p>${p}</p>`).join('')}
    <div class="why-choice-foot"><small>${foot}</small><span class="why-circle-arrow" aria-hidden="true">→</span></div>
  </a>`;
}
function home(){
  return `<div class="why-shell">
    ${wordmarkHero()}
    <section class="why-choices" aria-label="Choose a version of the story">
      ${choice('short','01','The Short Version','~ 15 seconds','▤',
        ['My favorite person got me back into training. So, naturally, I made an Excel sheet to track my progress.','One thing led to another. Now there\'s an island. Here we are.'],
        'Sometimes simple is enough.')}
      ${choice('scenic','02','The Scenic Route','~ 1 minute','🧩',
        ['It started with training. Then an Excel sheet. Then AI. Then bikes. Then 3D bikes. Then a room. Then, well… an island.','I just kept taking the next puzzle piece.'],
        'Curiosity leads the way.')}
      ${choice('unfiltered','03','The Unfiltered Version','honestly, who knows?','ϟ',
        ['Okay, so… there were a few side quests.','I don\'t need to know the whole map. I just take the next step, solve the next puzzle, and see what happens.'],
        'Same brain. Bigger adventure.')}
    </section>
    <section class="why-sticker-row" aria-label="KONA visual world">
      <figure><img src="assets/kona-years/kailua-bay.jpg" alt=""><figcaption>More curious.</figcaption></figure>
      <figure><img src="assets/kona-years/queen-k.jpg" alt=""><figcaption>Keep moving.</figcaption></figure>
      <figure><img src="assets/kona-years/y2018.jpg" alt=""><figcaption>Different pieces.</figcaption></figure>
      <figure><img src="assets/kona-years/cfr-2019.jpg" alt=""><figcaption>Collect the story.</figcaption></figure>
    </section>
  </div>`;
}
function storyHead(s){return `<header class="why-story-head"><span class="why-index">${s.index}</span><div><h1>${s.title}</h1><span class="why-estimate">${s.estimate}</span></div></header>`}
function short(){
  const s=stories.short;
  return `<article class="why-shell why-story">
    ${storyHead(s)}
    <div class="why-story-grid">
      <div class="why-story-copy">${s.paragraphs.map((p,i)=>`<p class="${i===0?'why-big':''}">${p}</p>`).join('')}</div>
      <aside class="why-story-aside">
        <figure class="why-photo-card"><img src="${s.image}" alt="Kona road landscape"><figcaption>${s.note}</figcaption></figure>
        <div class="why-note">Simple can be a beautiful start.</div>
      </aside>
    </div>
    ${nav('home','scenic',33)}
  </article>`;
}
function scenic(){
  const s=stories.scenic;
  return `<article class="why-shell why-story">
    ${storyHead(s)}
    <div class="why-story-grid">
      <div class="why-story-copy">
        <p class="why-big"><strong>${s.intro}</strong></p>
        <div class="why-path">
          ${s.path.map(([icon,title,text])=>`<div class="why-path-item"><span class="why-path-icon" aria-hidden="true">${icon}</span><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`).join('')}
        </div>
        ${s.paragraphs.map(p=>`<p>${p}</p>`).join('')}
      </div>
      <aside class="why-story-aside">
        <figure class="why-photo-card"><img src="${s.image}" alt="Kailua Bay"><figcaption>One bike.<br>One room.<br>One road.</figcaption></figure>
        <div class="why-note">${s.note}</div>
      </aside>
    </div>
    ${nav('short','unfiltered',66)}
  </article>`;
}
function unfiltered(){
  const s=stories.unfiltered;
  return `<article class="why-shell why-story why-adhd">
    ${storyHead(s)}
    <div class="why-story-grid">
      <div class="why-story-copy">
        ${s.paragraphs.map((p,i)=>`<p class="${i===0?'why-big why-hand':''}">${p}</p>`).join('')}
        <section class="why-sidequest" aria-label="Side quest">
          <div class="why-sidequest-label">${s.sidequest.title}</div>
          ${s.sidequest.body.map(p=>`<p class="why-ui-copy">${p}</p>`).join('')}
          <div class="why-number">${s.sidequest.number}</div>
          <p class="why-ui-copy why-muted">${s.sidequest.numberCaption}</p>
          <div class="why-countdown">${s.sidequest.countdown}</div>
          <p>${s.sidequest.ending}</p>
        </section>
        ${s.ending.map(p=>`<p>${p}</p>`).join('')}
        <h2 class="why-finished"><span>Finished enough to let you in.</span></h2>
        <span class="why-hand why-self-check">${s.note}</span>
      </div>
      <aside class="why-story-aside">
        <figure class="why-photo-card"><img src="${s.image}" alt="Kona landscape"><figcaption>One piece. Then the next.</figcaption></figure>
        <div class="why-note">Things escalated.</div>
      </aside>
    </div>
    ${nav('scenic','final',100)}
  </article>`;
}
function final(){
  return `<section class="why-final">
    <div class="why-final-inner">
      <div class="why-hand">Anyway… enough about the route.</div>
      <h1>Welcome<br>to KONA.</h1>
      <p>Explore · discover · build · keep moving</p>
      <a class="btn-primary" href="./">Explore KONA <span aria-hidden="true">→</span></a>
    </div>
  </section>`;
}
function render(route=routeFromUrl()){
  const app=document.getElementById('whyApp');
  app.innerHTML=route==='home'?home():route==='short'?short():route==='scenic'?scenic():route==='unfiltered'?unfiltered():final();
  document.title=route==='home'?'Why KONA exists':route==='final'?'Welcome to KONA':`${stories[route]?.title || 'Why'} · KONA`;
  wire();
  const h1=app.querySelector('h1');
  if(h1){h1.setAttribute('tabindex','-1');requestAnimationFrame(()=>h1.focus({preventScroll:true}))}
}
addEventListener('popstate',()=>render(routeFromUrl()));
render();
