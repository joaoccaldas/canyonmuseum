export const LOCALES=Object.freeze(['en','pt-BR']);
const M={
 en:{
  'nav.home':'Home','nav.discover':'Discover','nav.garage':'Garage','nav.plan':'Plan','nav.me':'Me',
  'home.eyebrow':'KONA · RACE WEEK','home.explore':'Discover what matters','home.next':'What matters next','home.start':'Start with Kona',
  'plan.title':'Plan','plan.eyebrow':'KONA · VERIFIED','plan.week':'Race week','plan.places':'Places worth your time',
  'me.title':'Me','me.eyebrow':'KONA · PASSPORT',
  'entry.promise':"Race the version of yourself you haven't met yet.",'entry.start':'Start somewhere.','entry.signin':'Sign in','entry.install':'Install app',
  'entry.intent':'What brought you here?','entry.bike':'What are we riding?','entry.shoe':'And the run?','entry.goal':'What would make this yours?',
  'entry.enter':'Enter KONA','entry.save':'Save across devices','entry.share':'Share my Kona'
 },
 'pt-BR':{
  'nav.home':'Início','nav.discover':'Descobrir','nav.garage':'Garagem','nav.plan':'Plano','nav.me':'Eu',
  'home.eyebrow':'KONA · SEMANA DA PROVA','home.explore':'Descobrir o que importa','home.next':'O que importa agora','home.start':'Comece por Kona',
  'plan.title':'Plano','plan.eyebrow':'KONA · VERIFICADO','plan.week':'Semana da prova','plan.places':'Lugares que valem seu tempo',
  'me.title':'Eu','me.eyebrow':'KONA · PASSAPORTE',
  'entry.promise':'Corra como a versão de você que ainda não conheceu.','entry.start':'Comece de algum lugar.','entry.signin':'Entrar','entry.install':'Instalar app',
  'entry.intent':'O que te trouxe até aqui?','entry.bike':'Qual vai ser a bike?','entry.shoe':'E na corrida?','entry.goal':'O que faria isso ser seu?',
  'entry.enter':'Entrar no KONA','entry.save':'Salvar em outros dispositivos','entry.share':'Compartilhar meu Kona'
 }
};
export function normalizeLocale(v){return String(v||'').toLowerCase().startsWith('pt')?'pt-BR':'en';}
export function resolveLocale({stored='',browser=globalThis.navigator?.language||'en'}={}){return normalizeLocale(stored||browser);}
export function t(key,locale='en'){return M[LOCALES.includes(locale)?locale:'en']?.[key]??M.en[key]??key;}
export function setLocale(locale,{root=globalThis.document?.documentElement,storage=globalThis.localStorage}={}){
 const next=normalizeLocale(locale);try{storage?.setItem('kona.locale.v1',next)}catch(_){}
 root?.setAttribute?.('lang',next);return next;
}
export function currentLocale({storage=globalThis.localStorage,browser=globalThis.navigator?.language||'en'}={}){
 let stored='';try{stored=storage?.getItem?.('kona.locale.v1')||''}catch(_){}return resolveLocale({stored,browser});
}
