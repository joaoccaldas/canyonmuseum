export const LOCALES=Object.freeze(['en','pt-BR']);
const M={
  en:{
    'nav.home':'Home','nav.discover':'Discover','nav.garage':'Garage','nav.plan':'Plan','nav.me':'Me',
    'home.eyebrow':'KONA · RACE WEEK','home.explore':'Discover what matters','home.next':'What matters next','home.start':'Start with Kona',
    'home.await':'A braver you lives here.','home.raceday':'You showed up. That changes things.','home.days':'days. Make them count.','home.human':'Same ocean. New you.',
    'discover.eyebrow':'KONA · DISCOVER','discover.title':'Good things happen in motion.','discover.body':'Places, people, machines and stories. Enter the 3D world only when you want to.',
    'discover.human':'Same weird dreams. New places.','discover.enter':'Enter the 3D world','discover.places':'Kona right now','discover.rooms':'Museum rooms',
    'plan.title':'Plan','plan.eyebrow':'KONA · VERIFIED','plan.week':'Race week','plan.places':'Places worth your time',
    'me.title':'Me','me.eyebrow':'KONA · PASSPORT',
    'garage.title':'Garage','garage.eyebrow':'KONA · YOUR EQUIPMENT'
  },
  'pt-BR':{
    'nav.home':'Início','nav.discover':'Descobrir','nav.garage':'Garagem','nav.plan':'Plano','nav.me':'Eu',
    'home.eyebrow':'KONA · SEMANA DA PROVA','home.explore':'Descobrir o que importa','home.next':'O que importa agora','home.start':'Comece por Kona',
    'home.await':'Uma versão mais corajosa de você mora aqui.','home.raceday':'Você apareceu. Isso muda tudo.','home.days':'dias. Faça valer.','home.human':'Mesmo oceano. Um novo você.',
    'discover.eyebrow':'KONA · DESCOBRIR','discover.title':'Coisas boas acontecem em movimento.','discover.body':'Lugares, pessoas, máquinas e histórias. Entre no mundo 3D só quando quiser.',
    'discover.human':'Mesmos sonhos estranhos. Novos lugares.','discover.enter':'Entrar no mundo 3D','discover.places':'Kona agora','discover.rooms':'Salas do museu',
    'plan.title':'Plano','plan.eyebrow':'KONA · VERIFICADO','plan.week':'Semana da prova','plan.places':'Lugares que valem seu tempo',
    'me.title':'Eu','me.eyebrow':'KONA · PASSAPORTE',
    'garage.title':'Garagem','garage.eyebrow':'KONA · SEU EQUIPAMENTO'
  }
};
export function normalizeLocale(v){return String(v||'').toLowerCase().startsWith('pt')?'pt-BR':'en';}
export function resolveLocale({stored='',browser=globalThis.navigator?.language||'en'}={}){return normalizeLocale(stored||browser);}
export function t(key,locale='en'){return M[LOCALES.includes(locale)?locale:'en']?.[key]??M.en[key]??key;}
export function setLocale(locale,{root=globalThis.document?.documentElement,storage=globalThis.localStorage}={}){
  const next=normalizeLocale(locale); try{storage?.setItem('kona.locale.v1',next)}catch(_){}
  root?.setAttribute?.('lang',next); return next;
}
export function currentLocale({storage=globalThis.localStorage,browser=globalThis.navigator?.language||'en'}={}){
  let stored=''; try{stored=storage?.getItem?.('kona.locale.v1')||''}catch(_){}
  return resolveLocale({stored,browser});
}
