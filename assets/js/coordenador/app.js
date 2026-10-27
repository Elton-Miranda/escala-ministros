// Painel do coordenador: estrutura da página, navegação e publicação.
import { esc, ICON, toast, nomeMes, addMes } from '../core/util.js';
import { carregarDados } from '../core/dados.js';
import { S, aoRenderizar, render, iniciarEstado, usarRascunhoAntigo, descartarRascunho, marcarPublicado } from './estado.js';
import { configGithub, githubPronto, lerRemoto, publicar } from './github.js';
import * as painel from './painel.js';
import * as escala from './escala.js';
import * as ministros from './ministros.js';
import * as lembretes from './lembretes.js';
import * as ajustes from './ajustes.js';

const raiz = document.getElementById('raiz');
const VIEWS = {
  painel: { titulo: 'Visão geral', icone: ICON.painel, curto: 'Início', render: painel.vPainel, mes: true },
  escala: { titulo: 'Escala do mês', icone: ICON.calendario, curto: 'Escala', render: escala.vEscala, mes: true },
  ministros: { titulo: 'Ministros', icone: ICON.pessoas, curto: 'Ministros', render: ministros.vMinistros, mes: false },
  lembretes: { titulo: 'Lembretes', icone: ICON.sino, curto: 'Lembretes', render: lembretes.vLembretes, mes: false },
  ajustes: { titulo: 'Ajustes', icone: ICON.engrenagem, curto: 'Ajustes', render: ajustes.vAjustes, mes: false },
};
let publicado = null;     // cópia da versão publicada quando o painel abriu
let publicando = false;

async function iniciar() {
  try { publicado = await carregarDados(); }
  catch (e) {
    raiz.innerHTML = `<div class="wrap"><div class="empty" style="margin-top:40px"><img src="assets/img/pomba.svg" alt=""><p><b>Não foi possível abrir os dados da escala.</b></p>
      <p>${esc(e.message)}</p><p class="muted">Se você abriu o arquivo direto do computador (dando dois cliques), use o atalho <b>abrir-local</b> da pasta ou o endereço do GitHub Pages. Os navegadores bloqueiam a leitura de arquivos abertos assim.</p></div></div>`;
    return;
  }
  iniciarEstado(JSON.parse(JSON.stringify(publicado)));
  const h = location.hash.slice(1);
  if (VIEWS[h]) S.view = h;
  aoRenderizar(desenhar);
  desenhar();
}

/* ---------- desenho da página ---------- */
function desenhar() {
  const v = VIEWS[S.view];
  const foco = document.activeElement?.id;
  let sel = null; try { sel = foco ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null; } catch { /* sem seleção */ }
  const rolagem = window.scrollY;

  const menu = Object.entries(VIEWS).map(([k, x]) => `<button data-act="ir" data-v="${k}" aria-current="${S.view === k ? 'page' : 'false'}">${x.icone}<span>${x.titulo}</span>${k === 'escala' && contarAvisos() ? `<span class="cont">${contarAvisos()}</span>` : ''}</button>`).join('');
  const menuM = Object.entries(VIEWS).map(([k, x]) => `<button data-act="ir" data-v="${k}" aria-current="${S.view === k ? 'page' : 'false'}">${x.icone}${x.curto}</button>`).join('');

  let h = `<div class="layout"><aside class="lateral"><div class="marca"><img src="assets/img/logo.svg" alt=""><div><b>Escala dos Ministros</b><span>Painel do coordenador</span></div></div>
    <nav class="menu" aria-label="Seções do painel">${menu}</nav>
    <div class="arte"><img src="assets/img/vitral.svg" alt=""></div>
    <a class="ver-site" href="index.html" target="_blank" rel="noopener">Abrir o site dos ministros ↗</a></aside>
    <div class="principal"><header class="barra"><div class="wrap"><img class="logo-m" src="assets/img/logo.svg" alt="">
      <h1>${esc(v.titulo)}</h1>
      ${v.mes ? `<div class="mesnav"><button class="iconbtn" data-act="mes" data-k="-1" aria-label="Mês anterior">${ICON.esq}</button><b class="tnum">${esc(nomeMes(S.ym).replace(/^./, (c) => c.toUpperCase()))}</b><button class="iconbtn" data-act="mes" data-k="1" aria-label="Próximo mês">${ICON.dir}</button></div>` : ''}
      ${statusPublicacao()}
    </div></header>
    <main class="wrap conteudo">${avisoRascunho()}${v.render()}</main></div></div>
    <nav class="navm" aria-label="Seções do painel">${menuM}</nav>`;
  if (S.missaAberta) h += escala.vEditorMissa();
  if (S.pessoaAberta != null) h += ministros.vFicha();
  if (S.modal) h += `<div class="modal" role="dialog" aria-modal="true"><div class="scrim" data-act="fecharModal"></div><div class="caixa">${conteudoModal()}</div></div>`;
  raiz.innerHTML = h;

  if (foco) { const el = document.getElementById(foco); if (el) { el.focus({ preventScroll: true }); try { if (sel?.[0] != null) el.setSelectionRange(sel[0], sel[1]); } catch { /* campo sem seleção */ } } }
  window.scrollTo(0, rolagem);
}

function contarAvisos() {
  const e = S.D.escalas[S.ym]; if (!e) return 0;
  const conf = S.ger.conflitos(e);
  return e.missas.filter((m) => S.ger.avisos(m).length || conf[m.id]).length;
}

function statusPublicacao() {
  if (publicando) return `<div class="status-pub"><span class="estado"><b>Publicando…</b>Aguarde alguns segundos</span><button class="btn primary" disabled>${ICON.nuvem}Publicando…</button></div>`;
  if (!S.sujo) return `<div class="status-pub"><span class="estado"><b>Tudo publicado</b>Os ministros veem a mesma escala</span><span class="badge ok">${ICON.ok}Publicado</span></div>`;
  return `<div class="status-pub"><span class="estado"><b>Mudanças não publicadas</b>Só você está vendo</span><button class="btn primary" data-act="publicar">${ICON.nuvem}Publicar</button></div>`;
}

function avisoRascunho() {
  if (!S.conflitoRascunho) return '';
  return `<div class="help gold">${ICON.alerta}<div class="stack" style="gap:10px"><span><b>Você tinha mudanças não publicadas</b>, mas a escala do site foi atualizada depois disso (talvez por outro computador). Qual versão você quer usar?</span>
    <div class="row"><button class="btn small primary" data-act="usarPublicada">Usar a versão do site</button><button class="btn small" data-act="usarRascunho">Continuar minhas mudanças</button></div></div></div>`;
}

function conteudoModal() {
  if (S.modal === 'montar') return escala.modalMontar();
  if (S.modal === 'novaMissa') return escala.modalNovaMissa();
  if (S.modal === 'publicar') return modalPublicar();
  if (S.modal === 'semGithub') return `<h2>Antes de publicar</h2>
    <p>Para o botão Publicar atualizar o site, o painel precisa estar conectado ao GitHub. Isso é feito <b>uma vez só</b>, e o passo a passo está em Ajustes.</p>
    <div class="help">${ICON.info}<span>Suas mudanças continuam guardadas neste navegador enquanto isso. Nada se perde.</span></div>
    <div class="row"><button class="btn primary" data-act="ir" data-v="ajustes" data-sec="publicacao">Ver o passo a passo</button><button class="btn" data-act="baixarDadosModal">${ICON.baixar}Publicar à mão (baixar arquivo)</button><button class="btn ghost" data-act="fecharModal">Agora não</button></div>`;
  if (S.modal === 'conflito') return `<h2>A escala do site mudou</h2><p>Alguém publicou uma versão diferente depois que você abriu o painel. Se continuar, a versão do site será substituída pela sua.</p>
    <div class="row"><button class="btn primary" data-act="publicarForcado">Publicar a minha mesmo assim</button><button class="btn" data-act="fecharModal">Cancelar</button></div>`;
  return '';
}

function modalPublicar() {
  return `<h2>Publicar para os ministros?</h2>
    <p>Ao confirmar:</p>
    <div class="etapas"><div class="etapa"><div>A escala é gravada no GitHub, no arquivo <code>data/dados.json</code>.</div></div>
    <div class="etapa"><div>Em <b>1 a 2 minutos</b> o site atualiza e todos os ministros passam a ver a versão nova.</div></div></div>
    <p class="muted">Os telefones dos ministros não são publicados.</p>
    <div class="row"><button class="btn primary" data-act="publicarOk">${ICON.nuvem}Publicar agora</button><button class="btn" data-act="fecharModal">Ainda não</button></div>`;
}

async function fazerPublicacao(forcar) {
  const c = configGithub();
  S.modal = null; publicando = true; desenhar();
  try {
    const remoto = await lerRemoto(c);
    if (!forcar && remoto.dados && remoto.dados.atualizadoEm !== S.publicadoEm) {
      publicando = false; S.modal = 'conflito'; desenhar(); return;
    }
    await publicar(c, S.D, remoto.sha);
    publicado = JSON.parse(JSON.stringify(S.D));
    marcarPublicado();
    publicando = false; desenhar();
    toast('Publicado! Em 1 a 2 minutos os ministros verão a escala nova.');
  } catch (e) {
    publicando = false; desenhar();
    toast(e.message || 'Não foi possível publicar. Verifique a internet e tente de novo.');
  }
}

/* ---------- eventos ---------- */
const acoesApp = {
  ir: (b) => {
    S.view = b.dataset.v; if (b.dataset.sec) S.secao = b.dataset.sec;
    S.modal = null; S.missaAberta = null; S.pessoaAberta = null;
    history.replaceState(null, '', '#' + S.view); desenhar(); window.scrollTo(0, 0);
  },
  mes: (b) => { S.ym = addMes(S.ym, +b.dataset.k); desenhar(); },
  fecharModal: () => { S.modal = null; desenhar(); },
  cancelarConf: () => { S.confirmar = null; desenhar(); },
  publicar: () => { S.modal = githubPronto() ? 'publicar' : 'semGithub'; desenhar(); },
  publicarOk: () => fazerPublicacao(false),
  publicarForcado: () => fazerPublicacao(true),
  baixarDadosModal: () => { ajustes.acoes.baixarDados(); S.modal = null; S.view = 'ajustes'; S.secao = 'backup'; desenhar(); toast('Arquivo baixado. Coloque-o na pasta data do projeto e faça o commit.'); },
  usarPublicada: () => { descartarRascunho(JSON.parse(JSON.stringify(publicado))); desenhar(); toast('Usando a versão do site.'); },
  usarRascunho: () => { usarRascunhoAntigo(); desenhar(); toast('Suas mudanças foram recuperadas. Publique quando quiser.'); },
};
const todasAcoes = { ...acoesApp, ...painel.acoes, ...escala.acoes, ...ministros.acoes, ...lembretes.acoes, ...ajustes.acoes };
const entradas = { ...escala.entradas, ...ministros.entradas };
const mudancas = { ...escala.mudancas, ...lembretes.mudancas, ...ajustes.mudancas };

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]');
  if (!b || !S.D) return;
  const f = todasAcoes[b.dataset.act];
  if (!f) return;
  const deixarAbrir = f(b, ev) === true;
  if (b.tagName === 'A' && !deixarAbrir) return; // links seguem normalmente
});
document.addEventListener('input', (ev) => { const f = entradas[ev.target.id]; if (f) f(ev.target); });
document.addEventListener('change', (ev) => {
  const f = mudancas[ev.target.id];
  if (f) { f(ev.target); return; }
  ajustes.aoMudarCampo(ev.target);
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (S.modal) S.modal = null; else if (S.missaAberta) S.missaAberta = null; else if (S.pessoaAberta != null) S.pessoaAberta = null; else return;
  S.confirmar = null; desenhar();
});

iniciar();
