// ui/garage.js — 2D Garage projection over canonical UserEquipment.
// Studio is optional configuration depth, not the ownership database.
import { readGarage, groupGarage } from '../engine/garage.js';
import { getPublicProduct } from '../engine/catalog.js';
import { renderRaceBadges } from './race-cards.js';
import { readGameState } from '../engine/game-state.js';

const legacyId = id => String(id || '').replace(/^product:/, '');

const node = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export async function renderGarageSurface(root,{openRaceSelf}={}) {
  const groups = groupGarage(readGarage());
  root.replaceChildren();

  const snapshot=readGameState();
  const identity=snapshot.race_identity||{};
  const relationshipOrder=['owned','dream','try'];
  const heroItem=relationshipOrder.flatMap(k=>groups[k]||[])[0]||null;
  const heroProduct=heroItem?await getPublicProduct(legacyId(heroItem.product_id)):null;
  const setupHero=node('section','garage-setup-hero artifact artifact--hero');
  setupHero.innerHTML=
    '<div class="garage-bike-visual" aria-hidden="true"><svg viewBox="0 0 320 150"><circle cx="78" cy="105" r="35"/><circle cx="242" cy="105" r="35"/><path d="M78 105 126 48h60l56 57M126 48l24 57h-72m72 0 36-57m-36 57h92M177 42h30M111 42h35"/></svg></div>'+
    '<div class="garage-setup-copy"><small>YOUR RACE SETUP</small><h3>'+((heroProduct?.brand?heroProduct.brand+' ':'')+(heroProduct?.label||heroProduct?.name||'Your Garage'))+'</h3>'+
    '<p>'+(identity.goal?.label||'Make the setup yours.')+'</p>'+
    '<div class="garage-setup-actions">'+
      (heroProduct?'<a href="Studio.html?p='+encodeURIComponent(heroProduct.id)+'#setup">Configure bike →</a>':'<a href="Studio.html#setup">Choose a bike →</a>')+
      '<button type="button" data-garage-raceself>Open Race Self →</button>'+
    '</div></div>';
  root.append(setupHero);
  setupHero.querySelector('[data-garage-raceself]')?.addEventListener('click',()=>openRaceSelf?.());

  for (const [relationship, label] of [['owned','Mine'],['dream','Dreaming'],['try','Try']]) {
    const section = node('section','kona-section artifact artifact--label');
    const head = node('div','kona-section-head');
    head.append(node('h3','',label), node('small','',String(groups[relationship].length)));
    section.append(head);

    const list = node('div','kona-list');
    if (!groups[relationship].length) {
      const empty = node('article','');
      const wrap = node('div','');
      wrap.append(node('b','', relationship === 'owned' ? 'Nothing marked as yours yet.' : relationship === 'dream' ? 'Nothing stared at repeatedly yet.' : 'Nothing queued to try yet.'));
      empty.append(wrap);
      list.append(empty);
    } else {
      for (const item of groups[relationship]) {
        const product = await getPublicProduct(legacyId(item.product_id));
        const row = node('article','');
        const mark = node('i','', (product?.type || product?.product_type || 'gear').slice(0,4));
        const wrap = node('div','');
        wrap.append(
          node('b','', [product?.brand, product?.name || product?.label || product?.model].filter(Boolean).join(' ') || legacyId(item.product_id)),
          node('span','', product?.year ? String(product.year) : relationship)
        );
        const configure = node('a','', 'Configure →');
        configure.href = 'Studio.html?p=' + encodeURIComponent(legacyId(item.product_id)) + '#setup';
        row.append(mark, wrap, configure);
        list.append(row);
      }
    }
    section.append(list);
    root.append(section);
  }

  const raceSection=node('section','kona-section artifact artifact--label');
  const raceHead=node('div','kona-section-head'); raceHead.append(node('h3','','Race memories'),node('small','','Profile'));
  const raceHost=node('div','race-badge-strip');
  raceSection.append(raceHead,raceHost); root.append(raceSection);
  await renderRaceBadges(raceHost,{limit:8,empty:false});
}
