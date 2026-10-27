// Montagem automática da escala.
// Regras, em ordem de importância:
//  1. Afastados não entram. Quem só serve nas comunidades nunca vai para a Casa de Maria.
//  2. Cada ministro só serve nas igrejas onde já costuma servir (campo "locs").
//  3. Ninguém serve duas vezes no mesmo dia nem passa do máximo de missas por mês.
//  4. Missas da Casa de Maria recebem ao menos um líder.
//  5. Preferência pelo horário que a pessoa já faz (campo "pref"); duplas servem juntas.
//  6. Depois de atingir o mínimo de cada missa, quem ficou com menos de "alvoPorMes" missas
//     é encaixado no seu horário preferido, até o máximo da missa.
import { diaN } from './util.js';

export function criarBase(D) {
  const P = new Map(D.pessoas.map((p) => [p.id, p]));
  const HOR = Object.fromEntries(D.horarios.map((h) => [h.id, h]));
  return { D, P, HOR };
}

export const grupo = (D, loc) => (D.locais[loc] || {}).grupo || loc;
export const nomeLocal = (D, loc) => (D.locais[loc] || {}).nome || loc;
export const ordemMissa = (a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0);

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function calendario(D, ym) {
  const [y, m] = ym.split('-').map(Number);
  const n = new Date(y, m, 0).getDate();
  const out = [];
  for (const mod of D.modelos) {
    if (!mod.ativa) continue;
    let k = 0;
    for (let d = 1; d <= n; d++) {
      if (new Date(y, m - 1, d).getDay() !== mod.dia) continue;
      k++;
      if (mod.regra === 'nth' && k !== mod.n) continue;
      const iso = `${ym}-${String(d).padStart(2, '0')}`;
      out.push(novaMissa({ data: iso, hora: mod.hora, local: mod.local, nome: mod.nome, modelo: mod.id, min: mod.min, max: mod.max, lider: mod.lider ? 1 : 0, cred: mod.cred || 0, pool: [...(mod.pool || [])] }));
    }
  }
  return out.sort(ordemMissa);
}

export function novaMissa(o) {
  return { id: `${o.data}-${o.modelo || 'X' + Date.now().toString(36)}`, obs: '', ps: [], cr: [], pool: [], cred: 0, lider: 0, ...o };
}

export function criarEscalador(base) {
  const { D, P, HOR } = base;
  const totalPref = (p) => Object.values(p.pref || {}).reduce((a, b) => a + b, 0) || 1;
  const prefGrupo = (p, g) => { let s = 0; for (const k in p.pref) if (HOR[k]?.grupo === g) s += p.pref[k]; return s / totalPref(p); };
  const share = (p, m) => {
    if (m.pool?.length) return m.pool.reduce((s, k) => s + (p.pref[k] || 0), 0) / totalPref(p);
    return 0.5 * prefGrupo(p, grupo(D, m.local));
  };
  const podeServir = (p, m) => {
    if (p.x) return false;
    const g = grupo(D, m.local);
    if (g === 'CM' && p.c) return false;
    return (p.locs || []).includes(g);
  };
  const temLider = (m) => m.ps.some((id) => P.get(id)?.l);

  function novoEstado(esc, exceto) {
    const st = { cnt: {}, dias: {}, cr: {} };
    esc?.missas.forEach((m) => {
      if (m.id === exceto) return;
      m.ps.forEach((id) => { st.cnt[id] = (st.cnt[id] || 0) + 1; (st.dias[id] ||= []).push(m.data); });
      (m.cr || []).forEach((id) => { st.cr[id] = (st.cr[id] || 0) + 1; });
    });
    return st;
  }
  const livre = (p, m, st) => !(st.dias[p.id] || []).includes(m.data) && (st.cnt[p.id] || 0) < D.config.maxPorMes;
  function pontos(p, m, st, jit) {
    let s = (share(p, m) + 0.15 * prefGrupo(p, grupo(D, m.local))) * 100 - (st.cnt[p.id] || 0) * 35 + (jit[p.id] || 0) * 10;
    const a = diaN(m.data);
    (st.dias[p.id] || []).forEach((x) => { if (Math.abs(diaN(x) - a) < 5) s -= 15; });
    return s;
  }
  const adicionar = (p, m, st) => { m.ps.push(p.id); st.cnt[p.id] = (st.cnt[p.id] || 0) + 1; (st.dias[p.id] ||= []).push(m.data); };
  function candidatos(m, st, jit, estrito, soLider) {
    return D.pessoas
      .filter((p) => !m.ps.includes(p.id) && podeServir(p, m) && livre(p, m, st) && (!soLider || p.l) && (!estrito || share(p, m) > 0))
      .map((p) => ({ p, s: pontos(p, m, st, jit) }))
      .sort((a, b) => b.s - a.s);
  }
  function comDupla(p, m, st, lim) {
    adicionar(p, m, st);
    const q = p.p && P.get(p.p);
    if (q && !m.ps.includes(q.id) && m.ps.length < lim && podeServir(q, m) && livre(q, m, st)) adicionar(q, m, st);
  }
  function preencher(m, st, jit, alvo) {
    const lim = Math.max(alvo, m.max);
    if (m.lider && !temLider(m)) {
      let c = candidatos(m, st, jit, true, true);
      if (!c.length) c = candidatos(m, st, jit, false, true);
      if (c.length) comDupla(c[0].p, m, st, lim);
    }
    let guarda = 0;
    while (m.ps.length < alvo && guarda++ < 400) {
      let c = candidatos(m, st, jit, true, false);
      if (!c.length) c = candidatos(m, st, jit, false, false);
      if (!c.length) break;
      comDupla(c[0].p, m, st, lim);
    }
  }
  function credencia(m, st, jit) {
    m.cr = [];
    if (!m.cred) return;
    const lista = m.ps.map((id) => P.get(id)).filter((p) => p && !p.l)
      .sort((a, b) => (st.cr[a.id] || 0) - (st.cr[b.id] || 0) || jit[a.id] - jit[b.id]);
    for (const p of lista) {
      if (m.cr.length >= m.cred) break;
      if (m.cr.includes(p.id)) continue;
      m.cr.push(p.id); st.cr[p.id] = (st.cr[p.id] || 0) + 1;
      if (p.p && m.ps.includes(p.p) && !m.cr.includes(p.p) && m.cr.length < m.cred) { m.cr.push(p.p); st.cr[p.p] = (st.cr[p.p] || 0) + 1; }
    }
  }
  const jitter = (seed) => { const r = rng(seed); const j = {}; D.pessoas.forEach((p) => { j[p.id] = r(); }); return j; };

  function gerarMes(ym, seed = Math.floor(Math.random() * 1e9)) {
    const jit = jitter(seed);
    const missas = calendario(D, ym);
    const st = novoEstado();
    // Comunidades e missas especiais primeiro: têm menos gente disponível.
    const prio = (m) => (grupo(D, m.local) !== 'CM' ? 0 : /^CM_/.test(m.modelo || '') ? 2 : 1);
    [...missas].sort((a, b) => prio(a) - prio(b) || ordemMissa(a, b)).forEach((m) => preencher(m, st, jit, m.min));
    const alvo = D.config.alvoPorMes;
    for (let volta = 0, mexeu = true; mexeu && volta < 12; volta++) {
      mexeu = false;
      D.pessoas.filter((p) => !p.x && (st.cnt[p.id] || 0) < alvo)
        .sort((a, b) => (st.cnt[a.id] || 0) - (st.cnt[b.id] || 0) || jit[a.id] - jit[b.id])
        .forEach((p) => {
          if ((st.cnt[p.id] || 0) >= alvo) return;
          const ops = missas.filter((m) => m.ps.length < m.max && !m.ps.includes(p.id) && podeServir(p, m) && livre(p, m, st) && share(p, m) > 0);
          if (!ops.length) return;
          const nota = (m) => pontos(p, m, st, jit) - (m.ps.length / m.max) * 20;
          ops.sort((a, b) => nota(b) - nota(a));
          comDupla(p, ops[0], st, ops[0].max);
          mexeu = true;
        });
    }
    missas.forEach((m) => credencia(m, st, jit));
    return { missas, geradaEm: new Date().toISOString(), semente: seed };
  }

  /** Completa uma missa até o mínimo, sem mexer nas outras. */
  function completar(esc, m) {
    const st = novoEstado(esc, m.id);
    m.ps.forEach((id) => { (st.dias[id] ||= []).push(m.data); st.cnt[id] = (st.cnt[id] || 0) + 1; });
    const jit = jitter(Date.now() % 100000);
    preencher(m, st, jit, m.min);
    if (m.cred && (m.cr || []).length < m.cred) {
      const manter = (m.cr || []).filter((id) => m.ps.includes(id));
      credencia(m, st, jit);
      m.cr = [...new Set([...manter, ...m.cr])].slice(0, Math.max(m.cred, manter.length));
    }
  }

  function avisos(m) {
    const a = [];
    if (m.ps.length < m.min) a.push({ tipo: 'falta', texto: `Faltam ${m.min - m.ps.length} ministros` });
    if (m.lider && !temLider(m)) a.push({ tipo: 'lider', texto: 'Sem líder escalado' });
    return a;
  }
  function conflitos(esc) {
    const by = {}, out = {};
    esc.missas.forEach((m) => m.ps.forEach((id) => { (by[`${id}|${m.data}`] ||= []).push(m.id); }));
    for (const k in by) if (by[k].length > 1) by[k].forEach((mid) => { (out[mid] ||= []).push(+k.split('|')[0]); });
    return out;
  }
  function contagem(esc) {
    const c = {};
    esc?.missas.forEach((m) => m.ps.forEach((id) => { c[id] = (c[id] || 0) + 1; }));
    return c;
  }
  /** Agrupa os nomes de uma missa em linhas de duas pessoas (duplas juntas): credência, líderes e demais. */
  function linhas(m) {
    const rank = (id) => (m.cr.includes(id) ? 0 : P.get(id)?.l ? 1 : 2);
    const ordem = m.ps.map((id, i) => ({ id, i })).sort((a, b) => rank(a.id) - rank(b.id) || a.i - b.i).map((o) => o.id);
    const vistos = new Set(), pares = [], sozinhos = [];
    for (const id of ordem) {
      if (vistos.has(id)) continue;
      vistos.add(id);
      const p = P.get(id);
      const q = p?.p && m.ps.includes(p.p) && !vistos.has(p.p) ? p.p : null;
      if (q) { vistos.add(q); pares.push([id, q]); } else sozinhos.push(id);
    }
    for (let i = 0; i < sozinhos.length; i += 2) pares.push([sozinhos[i], sozinhos[i + 1] ?? null]);
    return pares;
  }
  function prefPrincipal(p) {
    let best = null, v = 0;
    for (const k in p.pref) if (p.pref[k] > v && HOR[k]) { v = p.pref[k]; best = k; }
    return best ? HOR[best].nome : 'Sem horário preferido';
  }
  /** Explica por que alguém é (ou não) uma boa escolha para a missa. */
  function motivos(p, m, st) {
    const r = [];
    if (!podeServir(p, m)) r.push(p.c && grupo(D, m.local) === 'CM' ? 'Só serve nas comunidades' : 'Normalmente não serve nesta igreja');
    if (share(p, m) > 0) r.push('Costuma servir neste horário');
    const n = st.cnt[p.id] || 0;
    r.push(n ? `${n} missa${n > 1 ? 's' : ''} no mês` : 'Ainda sem missa no mês');
    if ((st.dias[p.id] || []).includes(m.data)) r.push('Já serve em outra missa neste dia');
    if (n >= D.config.maxPorMes) r.push('Já chegou ao limite do mês');
    return r;
  }

  return { share, podeServir, temLider, novoEstado, pontos, gerarMes, completar, avisos, conflitos, contagem, linhas, prefPrincipal, motivos, livre };
}

/** Busca por nome, apelido ou grafias antigas. */
export function buscarPessoas(D, termo, norm) {
  const ts = norm(termo).split(' ').filter(Boolean);
  if (!ts.length) return [];
  return D.pessoas
    .filter((p) => { const hay = norm(`${p.n} ${p.a || ''} ${(p.v || []).join(' ')}`); return ts.every((t) => hay.includes(t)); })
    .sort((a, b) => a.n.localeCompare(b.n, 'pt'));
}
