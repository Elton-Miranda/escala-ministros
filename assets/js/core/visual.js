// Pedaços de interface usados nas duas páginas.
import { esc, hora, dt, dd, DIAS } from './util.js';
import { nomeLocal } from './gerador.js';
import { nomeExibicao } from './textos.js';

export function nomeCelula(base, m, id, destaque) {
  if (!id) return '<div class="nm" aria-hidden="true"></div>';
  const p = base.P.get(id);
  if (!p) return '<div class="nm muted">(ministro removido)</div>';
  let tags = '';
  if (m.cr.includes(id)) tags += '<span class="tag cr">Credência</span>';
  if (p.l) tags += '<span class="tag ld">Líder</span>';
  return `<div class="nm${destaque === id ? ' eu' : ''}"><span>${esc(nomeExibicao(p))}</span>${tags}</div>`;
}

/**
 * Cartão de uma missa.
 * opts.badges: html das etiquetas da direita; opts.rodape: html do rodapé; opts.destaque: id da pessoa a destacar.
 */
export function cartaoMissa(base, ger, m, opts = {}) {
  const { D } = base;
  let h = `<article class="mass l-${esc(m.local)}${opts.alerta ? ' alert' : ''}" id="missa-${esc(m.id)}">`;
  h += `<div class="mhead"><div class="mtime tnum">${hora(m.hora)}</div><div class="mtitle"><div class="t">${esc(m.nome || 'Missa')}</div>`;
  h += `<div class="p"><span class="dot"></span>${esc(nomeLocal(D, m.local))}</div></div><div class="badges">${opts.badges || ''}</div></div>`;
  if (m.obs) h += `<div class="mobs">${esc(m.obs)}</div>`;
  if (!m.ps.length) h += '<div class="mobs">Ainda não há ministros escalados.</div>';
  else {
    h += '<div class="names">';
    ger.linhas(m).forEach((par) => par.forEach((id) => { h += nomeCelula(base, m, id, opts.destaque); }));
    h += '</div>';
  }
  if (opts.rodape) h += `<div class="mfoot">${opts.rodape}</div>`;
  return h + '</article>';
}

/** Agrupa missas por dia, com o rótulo grande da data à esquerda. */
export function porDia(missas, render) {
  const dias = {};
  missas.forEach((m) => { (dias[m.data] ||= []).push(m); });
  return Object.keys(dias).sort().map((d) => {
    const x = dt(d);
    return `<section class="day"><div class="daylabel${x.getDay() === 0 ? ' sun' : ''}"><div class="n tnum">${dd(x.getDate())}</div><div class="w">${DIAS[x.getDay()].replace('-feira', '')}</div></div><div class="masses">${dias[d].map(render).join('')}</div></section>`;
  }).join('');
}

export function filtroIgrejas(atual, act = 'filtro') {
  const fs = [['todos', 'Todas'], ['CM', 'Casa de Maria'], ['SE', 'Santo Expedito'], ['NSF', 'N. Sra. de Fátima']];
  return `<div class="chips scroll" role="group" aria-label="Filtrar por igreja">${fs.map(([k, t]) =>
    `<button class="chip ${k !== 'todos' ? 'l-' + k : ''}" data-act="${act}" data-f="${k}" aria-pressed="${atual === k}">${k !== 'todos' ? '<span class="dot"></span>' : ''}${t}</button>`).join('')}</div>`;
}
