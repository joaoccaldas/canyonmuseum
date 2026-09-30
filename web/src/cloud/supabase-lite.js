// cloud/supabase-lite.js — tiny dependency-free Supabase beta adapter.
//
// Uses only the public project URL + publishable key. Authorization is enforced by Postgres RLS.
// No service-role/secret key belongs in browser code.
import { readGameState, writeGameState, GAME_STATE_SCHEMA_VERSION } from '../engine/game-state.js';

const URL = 'https://mtvpnoqwjpoqaiocrklq.supabase.co';
const KEY = 'sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u';
const SESSION_KEY = 'kona.supabase.session.v1';

const json = async res => {
  const body = await res.text();
  let data = null; try { data = body ? JSON.parse(body) : null; } catch (_) {}
  if (!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'Request failed');
  return data;
};
const baseHeaders = () => ({ apikey: KEY, 'Content-Type':'application/json' });
const session = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; } };
const saveSession = s => { try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (_) {} };

async function refresh() {
  const s = session();
  if (!s?.refresh_token) return null;
  const data = await json(await fetch(URL + '/auth/v1/token?grant_type=refresh_token', {
    method:'POST', headers:baseHeaders(), body:JSON.stringify({ refresh_token:s.refresh_token })
  }));
  saveSession(data); return data;
}
async function validSession() {
  let s = session();
  if (!s?.access_token) return null;
  const exp = Number(s.expires_at || 0) * 1000;
  if (exp && exp < Date.now() + 60000) s = await refresh().catch(() => null);
  return s;
}
async function authHeaders() {
  const s = await validSession();
  if (!s?.access_token) throw new Error('Sign in first');
  return { ...baseHeaders(), Authorization:'Bearer ' + s.access_token };
}

export function consumeAuthCallback() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (!h.get('access_token')) return false;
  const now = Math.floor(Date.now()/1000);
  saveSession({
    access_token:h.get('access_token'),
    refresh_token:h.get('refresh_token'),
    token_type:h.get('token_type') || 'bearer',
    expires_in:Number(h.get('expires_in') || 3600),
    expires_at:Number(h.get('expires_at') || (now + Number(h.get('expires_in') || 3600))),
  });
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}

export async function sendMagicLink(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new Error('Enter a valid email');
  return json(await fetch(URL + '/auth/v1/otp', {
    method:'POST', headers:baseHeaders(),
    body:JSON.stringify({ email:clean, create_user:true, email_redirect_to:location.origin + location.pathname })
  }));
}

export async function currentUser() {
  const s = await validSession();
  if (!s?.access_token) return null;
  try {
    return await json(await fetch(URL + '/auth/v1/user', {
      headers:{ ...baseHeaders(), Authorization:'Bearer ' + s.access_token }
    }));
  } catch (_) { saveSession(null); return null; }
}

export async function signOut() {
  const s = await validSession();
  if (s?.access_token) {
    await fetch(URL + '/auth/v1/logout', { method:'POST', headers:{ ...baseHeaders(), Authorization:'Bearer ' + s.access_token } }).catch(() => {});
  }
  saveSession(null);
}

export async function backupGameState() {
  const user = await currentUser();
  if (!user?.id) throw new Error('Sign in first');
  const state = readGameState();
  const res = await fetch(URL + '/rest/v1/user_app_state?on_conflict=user_id', {
    method:'POST',
    headers:{ ...(await authHeaders()), Prefer:'resolution=merge-duplicates,return=representation' },
    body:JSON.stringify({ user_id:user.id, schema_version:GAME_STATE_SCHEMA_VERSION, state, updated_at:new Date().toISOString() })
  });
  return json(res);
}

export async function restoreGameState() {
  const user = await currentUser();
  if (!user?.id) throw new Error('Sign in first');
  const rows = await json(await fetch(URL + '/rest/v1/user_app_state?select=schema_version,state,updated_at&user_id=eq.' + encodeURIComponent(user.id), {
    headers:await authHeaders()
  }));
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row?.state) throw new Error('No cloud backup yet');
  if (Number(row.schema_version) !== GAME_STATE_SCHEMA_VERSION) throw new Error('Cloud state uses a newer schema');
  writeGameState(row.state);
  return row;
}

export function cloudAvailable() { return !!URL && !!KEY; }
