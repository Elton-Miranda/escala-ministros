// Estado do painel. Tudo que o coordenador muda fica primeiro como "rascunho" neste navegador
// e só chega aos ministros quando ele toca em "Publicar".
import { lsGet, lsSet, lsJSON, mesInicial, hojeISO } from '../core/util.js';
import { criarBase, criarEscalador } from '../core/gerador.js';

const CHAVE_RASCUNHO = 'coord-rascunho';
const CHAVE_CONTATOS = 'coord-contatos';

export const S = {
  D: null, base: null, ger: null,
  publicadoEm: null,      // atualizadoEm da versão publicada quando o painel abriu
  sujo: false,            // há mudanças ainda não publicadas
  conflitoRascunho: null, // rascunho antigo encontrado que não bate com a versão publicada
  view: 'painel', ym: null, filtro: 'todos',
  busca: '', filtroP: 'ativos',
  missaAberta: null, pessoaAberta: null,
  addBusca: '', addTodos: false,
  lemData: hojeISO(1),
  modal: null, confirmar: null,
  contatos: lsJSON(CHAVE_CONTATOS, {}),
};

let renderFn = () => {};
export const aoRenderizar = (fn) => { renderFn = fn; };
export const render = () => renderFn();

export function reindexar() { S.base = criarBase(S.D); S.ger = criarEscalador(S.base); }

export function iniciarEstado(publicado) {
  S.D = publicado;
  S.publicadoEm = publicado.atualizadoEm || '';
  const r = lsJSON(CHAVE_RASCUNHO, null);
  if (r?.dados) {
    if (r.base === S.publicadoEm) { S.D = r.dados; S.sujo = true; }
    else S.conflitoRascunho = r;
  }
  reindexar();
  S.ym = mesInicial(S.D.escalas);
}

/** Chame depois de qualquer alteração nos dados. */
export function mudou({ semRender } = {}) {
  S.D.atualizadoEm = new Date().toISOString();
  S.sujo = true;
  reindexar();
  lsSet(CHAVE_RASCUNHO, JSON.stringify({ base: S.publicadoEm, dados: S.D }));
  if (!semRender) render();
}

export function usarRascunhoAntigo() {
  S.D = S.conflitoRascunho.dados; S.conflitoRascunho = null; S.sujo = true; reindexar();
  lsSet(CHAVE_RASCUNHO, JSON.stringify({ base: S.publicadoEm, dados: S.D }));
}
export function descartarRascunho(publicado) {
  lsSet(CHAVE_RASCUNHO, null);
  S.conflitoRascunho = null; S.sujo = false;
  if (publicado) { S.D = publicado; reindexar(); }
}
export function marcarPublicado() {
  S.publicadoEm = S.D.atualizadoEm; S.sujo = false; lsSet(CHAVE_RASCUNHO, null);
}

/* Telefones: ficam só neste navegador, nunca no arquivo público. */
export const telefoneDe = (id) => S.contatos[id] || '';
export function definirTelefone(id, tel) {
  if (tel) S.contatos[id] = tel; else delete S.contatos[id];
  lsSet(CHAVE_CONTATOS, JSON.stringify(S.contatos));
}
export function substituirContatos(c) { S.contatos = c || {}; lsSet(CHAVE_CONTATOS, JSON.stringify(S.contatos)); }

export const escalaAtual = () => S.D.escalas[S.ym];
export function acharMissa(id) {
  for (const ym in S.D.escalas) { const m = S.D.escalas[ym].missas.find((x) => x.id === id); if (m) return { m, ym }; }
  return {};
}
export const linkPublico = () => S.D.config.link || (location.hostname.endsWith('.github.io') ? location.href.replace(/coordenador\.html.*$/, '') : '');
export { lsGet };
