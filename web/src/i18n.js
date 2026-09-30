const DEFAULT_LOCALE='en';
const SUPPORTED=new Set(['en','pt-BR']);

const MESSAGES={
 en:{
  'nav.home':'Home','nav.discover':'Discover','nav.garage':'Garage','nav.plan':'Plan','nav.me':'Me',
  'entry.eyebrow':'KONA','entry.title':'Race the version of yourself.','entry.lede':'What would you race if Kona were tomorrow?',
  'entry.build':'Build my Kona self','entry.continue':'Continue your Kona','entry.install':'Install app',
  'entry.privacy':'No account yet. The 3D world opens only when you choose Discover.',
  'share.kona':'Share my Kona','share.story':'Share my race story','share.collection':'Share collection',
  'action.inspect':'Inspect','action.collect':'Collect','action.continue':'Continue journey',
 },
 'pt-BR':{
  'nav.home':'Início','nav.discover':'Descobrir','nav.garage':'Garagem','nav.plan':'Plano','nav.me':'Eu',
  'entry.eyebrow':'KONA','entry.title':'Corra como a versão de você que quer se tornar.','entry.lede':'Com o que você competiria em Kona se a prova fosse amanhã?',
  'entry.build':'Criar meu eu de Kona','entry.continue':'Continuar meu Kona','entry.install':'Instalar app',
  'entry.privacy':'Sem conta por enquanto. O mundo 3D só abre quando você escolhe Descobrir.',
  'share.kona':'Compartilhar meu Kona','share.story':'Compartilhar minha história','share.collection':'Compartilhar coleção',
  'action.inspect':'Explorar','action.collect':'Colecionar','action.continue':'Continuar jornada',
 }
};

function normalize(value){
 const v=String(value||'').replace('_','-').toLowerCase();
 if(v.startsWith('pt')) return 'pt-BR';
 return 'en';
}
export function resolveLocale({query=new URLSearchParams(location.search),stored='',browser=navigator.language}={}){
 const q=query.get?.('lang');
 return normalize(q||stored||browser||DEFAULT_LOCALE);
}
export function t(key,locale=DEFAULT_LOCALE){
 const loc=SUPPORTED.has(locale)?locale:DEFAULT_LOCALE;
 return MESSAGES[loc]?.[key] ?? MESSAGES.en[key] ?? key;
}
export function applyLocale(root=document,locale=DEFAULT_LOCALE){
 const loc=SUPPORTED.has(locale)?locale:DEFAULT_LOCALE;
 root.documentElement?.setAttribute('lang',loc);
 root.querySelectorAll?.('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n,loc);});
 return loc;
}
export function supportedLocales(){return [...SUPPORTED];}
