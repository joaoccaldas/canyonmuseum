// Retention V1 — daily exhibit + local Garage.
// Deliberately separate from the 3D runtime: no network calls, no accounts, no tracking.
(() => {
  'use strict';
  const KEY = 'speedmax.garage.v1', PASSPORT = 'speedmax.passport.v1', MAX = 9;
  const safeJson = (raw, fallback) => { try { const v = JSON.parse(raw); return v ?? fallback; } catch (_) { return fallback; } };
  const passport = () => {
    const p = safeJson(localStorage.getItem(PASSPORT), {});
    return { stamps: p?.stamps && typeof p.stamps === 'object' ? p.stamps : {}, badges: p?.badges && typeof p.badges === 'object' ? p.badges : {}, best: Math.max(0, +p?.best || 0) };
  };
  const capacity = () => {
    const p = passport(), stamps = Object.keys(p.stamps).length, badges = Object.keys(p.badges).length;
    return Math.min(MAX, 3 + Math.floor(stamps / 12) + Math.min(2, badges) + (p.best >= 7 ? 1 : 0));
  };
  const cleanEntry = x => {
    if (!x || typeof x !== 'object') return null;
    let u; try { u = new URL(String(x.url || ''), location.href); } catch (_) { return null; }
    if (u.origin !== location.origin || !/\/Studio\.html$/i.test(u.pathname)) return null;
    return { id: String(x.id || '').slice(0, 48), productId: String(x.productId || '').slice(0, 80), name: String(x.name || 'Saved build').slice(0, 60), url: u.href, savedAt: Math.max(0, +x.savedAt || 0) };
  };
  const read = () => {
    const a = safeJson(localStorage.getItem(KEY), []);
    return Array.isArray(a) ? a.map(cleanEntry).filter(x => x?.id).slice(0, MAX) : [];
  };
  const write = a => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAX))); return true; } catch (_) { return false; } };
  const daily = items => {
    if (!Array.isArray(items) || !items.length) return null;
    const d = new Date(), day = Math.trunc(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 864e5);
    return items[((day % items.length) + items.length) % items.length];
  };
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)) {
      if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k,'');
      else if (v !== false && v != null) n.setAttribute(k,String(v));
    }
    for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(String(k)));
    return n;
  };
  const shareUrl = async entry => {
    try { if (navigator.share) { await navigator.share({ title: entry.name, text: entry.name + ' · built in the Speedmax Museum Studio', url: entry.url }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(entry.url); } catch (_) {}
  };

  function addDailyMuseum() {
    const museum = window.__museum, pieces = museum?.PIECES || window.__PIECES;
    const p = daily(pieces); if (!p || document.getElementById('retDaily')) return;
    const host = document.getElementById('loadstate') || document.querySelector('#intro .cta'); if (!host) return;
    const btn = el('button', { id:'retDaily', class:'ret-daily', type:'button', onclick:() => {
      try {
        if (!document.body.classList.contains('walking')) museum.enter();
        setTimeout(() => museum.visit(p), 420);
      } catch (_) {}
    }}, el('i', {}, '01'), el('span', {}, el('small', {}, 'Today in the museum'), el('b', {}, p.name || p.years || 'Daily exhibit')));
    host.insertAdjacentElement('afterend', btn);
  }

  function addGarageStudio() {
    const studio = window.__studio; if (!studio || document.getElementById('retGarage')) return;
    const fab = document.querySelector('.fab');
    const openBtn = el('button', { id:'retGarageBtn', type:'button', title:'My Garage', 'aria-label':'Open My Garage' }, '▣');
    fab?.insertBefore(openBtn, fab.lastElementChild || null);

    const modal = el('div', { id:'retGarage', hidden:true, role:'dialog', 'aria-modal':'true', 'aria-label':'My Garage' });
    document.body.append(modal);
    const close = () => { modal.hidden = true; };
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

    const saveCurrent = () => {
      const c = studio.current; if (!c?.product) return;
      const list = read(), cap = capacity();
      if (list.length >= cap) return render();
      const entry = cleanEntry({ id:'g-' + Date.now().toString(36), productId:c.product.id, name:c.product.name, url:location.href, savedAt:Date.now() });
      if (!entry) return;
      write([entry, ...list]); render();
    };
    const remove = id => { write(read().filter(x => x.id !== id)); render(); };

    function render() {
      const list = read(), cap = capacity(), p = passport(), stamps = Object.keys(p.stamps).length;
      const next = cap < MAX ? Math.max(1, (Math.floor(stamps / 12) + 1) * 12 - stamps) : 0;
      modal.replaceChildren(el('div', { class:'ret-garage-sheet' },
        el('div', { class:'ret-garage-head' }, el('div', {}, el('small', {}, 'Local · private · on this device'), el('h2', {}, 'My Garage')), el('button', { class:'ret-close', type:'button', 'aria-label':'Close', onclick:close }, '×')),
        el('div', { class:'ret-garage-progress' }, `${list.length} / ${cap} slots used.`, cap < MAX ? ` Explore the museum to open more space. About ${next} more stamps reaches the next stamp-based slot.` : ' All Garage slots unlocked.'),
        el('div', { class:'ret-garage-actions' }, el('button', { class:'ret-save', type:'button', disabled:list.length >= cap, onclick:saveCurrent }, list.length >= cap ? 'Garage full' : 'Save current build')),
        list.length ? el('div', { class:'ret-list' }, list.map(x => el('div', { class:'ret-build' },
          el('div', {}, el('b', {}, x.name), el('small', {}, new Date(x.savedAt).toLocaleDateString())),
          el('div', { class:'ret-build-actions' },
            el('button', { type:'button', onclick:() => { location.href = x.url; } }, 'Open'),
            el('button', { type:'button', onclick:() => shareUrl(x), 'aria-label':`Share ${x.name}` }, '↗'),
            el('button', { type:'button', onclick:() => remove(x.id), 'aria-label':`Remove ${x.name}` }, '×')
          )))) : el('div', { class:'ret-empty' }, 'Your Garage is empty. Build a bike, save it here, then reopen or share the exact configuration later.')
      ));
    }
    openBtn.addEventListener('click', () => { render(); modal.hidden = false; modal.querySelector('.ret-close')?.focus(); });
  }

  addEventListener('DOMContentLoaded', () => { addDailyMuseum(); addGarageStudio(); }, { once:true });
  if (document.readyState !== 'loading') { addDailyMuseum(); addGarageStudio(); }
})();