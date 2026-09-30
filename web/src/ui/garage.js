// ui/garage.js — 2D Garage projection over canonical UserEquipment.
// Studio is optional configuration depth, not the ownership database.
import { readGarage, groupGarage } from '../engine/garage.js';
import { getPublicProduct } from '../engine/catalog.js';

const legacyId = id => String(id || '').replace(/^product:/, '');

const node = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export async function renderGarageSurface(root) {
  const groups = groupGarage(readGarage());
  root.replaceChildren();

  const hero = node('section','kona-hero-card artifact artifact--hero');
  hero.append(
    node('small','', 'YOUR EQUIPMENT'),
    node('h3','', 'Mine. Dreaming. Try.'),
    node('p','', 'Saved equipment lives here. Studio only configures a product you choose.')
  );
  root.append(hero);

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
}
