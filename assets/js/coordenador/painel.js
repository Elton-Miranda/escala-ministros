// Aba "Visão geral": o que precisa de atenção, próximas missas e primeiros passos.
import { esc, hora, dt, dd, DIAS_CURTOS, nomeMes, addMes, hojeISO, mesAtual, ICON, copiar } from '../core/util.js';
import { nomeLocal } from '../core/gerador.js';
import { S, render, escalaAtual, linkPublico, telefoneDe } from './estado.js';
import { githubPronto } from './github.js';

function saudacao() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

export function vPainel() {
  const { ger, D } = S;
  const e = escalaAtual();
  const cont = ger.contagem(e);
  const ativos = D.pessoas.filter((p) => !p.x);
  const conf = e ? ger.conflitos(e) : {};
  const atencao = e ? e.missas.filter((m) => ger.avisos(m).length || conf[m.id]) : [];
  const fora = ativos.filter((p) => !cont[p.id]);
  const prox = addMes(mesAtual(), 1);
  const link = linkPublico();
  let h = `<div><div class="eyebrow">${esc(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
    <h2 style="font-size:30px">${saudacao()}${D.config.coordNome ? ', ' + esc(D.config.coordNome.split(' ')[0]) : ''}!</h2></div>`;

  // Primeiros passos
  const passos = [
    { ok: githubPronto(), t: 'Conectar a publicação', s: 'Uma vez só. Permite que o botão Publicar atualize o site dos ministros.', b: `<button class="btn small" data-act="ir" data-v="ajustes" data-sec="publicacao">Conectar</button>` },
    { ok: !!D.config.coordTel, t: 'Informar o seu WhatsApp', s: 'Aparece para os ministros no botão “Avisar o coordenador”.', b: `<button class="btn small" data-act="ir" data-v="ajustes" data-sec="paroquia">Informar</button>` },
    { ok: !!D.escalas[prox], t: `Montar a escala de ${nomeMes(prox)}`, s: 'O sistema sugere e você confere.', b: `<button class="btn small" data-act="irMes" data-ym="${prox}">Abrir</button>` },
    { ok: !S.sujo, t: 'Publicar', s: S.sujo ? 'Há mudanças que os ministros ainda não veem.' : 'Tudo o que está aqui já está no site.', b: S.sujo ? '<button class="btn small primary" data-act="publicar">Publicar</button>' : '' },
    { ok: !!link, t: 'Enviar o link aos ministros', s: 'Mande uma vez no grupo. Cada um digita o nome e vê a própria escala.', b: link ? `<button class="btn small" data-act="copiarLink">Copiar link</button>` : `<button class="btn small" data-act="ir" data-v="ajustes" data-sec="paroquia">Informar link</button>` },
  ];
  const faltam = passos.filter((p) => !p.ok).length;
  if (faltam) {
    h += `<section class="card"><div class="row"><h3>Primeiros passos</h3><span class="badge blue">${passos.length - faltam} de ${passos.length} feitos</span></div>
      <div class="passos" style="margin-top:8px">${passos.map((p, i) => `<div class="passo${p.ok ? ' feito' : ''}"><span class="num">${p.ok ? ICON.ok : i + 1}</span><div><b>${esc(p.t)}</b><span class="sub">${esc(p.s)}</span></div>${p.ok ? '<span class="badge ok">Feito</span>' : p.b}</div>`).join('')}</div></section>`;
  }

  if (!e) {
    h += `<div class="empty"><img src="assets/img/pomba.svg" alt=""><p><b>${esc(nomeMes(S.ym))} ainda não tem escala.</b></p><button class="btn primary" data-act="ir" data-v="escala">${ICON.varinha}Ir para a escala</button></div>`;
    return h;
  }
  h += `<div class="row"><h3 style="font-size:20px">Resumo de ${esc(nomeMes(S.ym))}</h3></div>
    <div class="numeros">
      <div class="numero"><b class="tnum">${e.missas.length}</b><span>missas no mês</span></div>
      <div class="numero"><b class="tnum">${Object.keys(cont).length}</b><span>ministros escalados</span></div>
      <div class="numero ${atencao.length ? 'warn' : 'ok'}"><b class="tnum">${atencao.length}</b><span>${atencao.length === 1 ? 'missa precisa' : 'missas precisam'} de atenção</span></div>
      <div class="numero"><b class="tnum">${fora.length}</b><span>ativos sem missa</span></div>
    </div>`;

  h += '<div class="colunas"><div class="stack">';
  // Próximos 7 dias (pode cruzar o mês)
  const hoje = hojeISO(), lim = hojeISO(7);
  const proximas = Object.values(D.escalas).flatMap((x) => x.missas).filter((m) => m.data >= hoje && m.data <= lim).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  h += `<section class="card" style="padding:0;overflow:hidden"><div style="padding:16px 18px 8px"><h3>Próximos 7 dias</h3></div>`;
  h += proximas.length ? proximas.map((m) => miniMissa(m)).join('') : '<p class="muted" style="padding:0 18px 18px">Nenhuma missa escalada nos próximos 7 dias.</p>';
  h += '</section>';
  if (atencao.length) {
    h += `<section class="card" style="padding:0;overflow:hidden"><div style="padding:16px 18px 8px"><h3>Precisam de atenção</h3><p class="muted" style="font-size:15px">Toque para abrir e completar.</p></div>${atencao.map((m) => miniMissa(m, true)).join('')}</section>`;
  }
  h += '</div><div class="stack">';
  h += `<section class="card stack" style="gap:12px"><h3>Link para os ministros</h3>
    ${link ? `<p class="muted">Mande este link no grupo. Cada ministro digita o próprio nome e vê quando e onde serve.</p><div class="code" style="padding:10px 12px;word-break:break-all">${esc(link)}</div>
      <div class="row"><button class="btn small" data-act="copiarLink">${ICON.copiar}Copiar</button><a class="btn small whats" href="https://wa.me/?text=${encodeURIComponent('Escala dos Ministros: digite seu nome e veja quando e onde você serve. ' + link)}" target="_blank" rel="noopener">${ICON.whatsapp}Enviar no WhatsApp</a></div>`
      : `<p class="muted">O link aparece aqui depois que o site estiver no GitHub Pages. Você também pode informá-lo em Ajustes.</p>`}</section>`;
  const semTel = ativos.filter((p) => !telefoneDe(p.id)).length;
  h += `<section class="card stack" style="gap:10px"><h3>Cadastro</h3>
    <div class="li" style="padding:0;border:0;min-height:0"><span class="grow">Ministros ativos</span><b class="tnum">${ativos.length}</b></div>
    <div class="li" style="padding:0;border:0;min-height:0"><span class="grow">Líderes</span><b class="tnum">${ativos.filter((p) => p.l).length}</b></div>
    <div class="li" style="padding:0;border:0;min-height:0"><span class="grow">Sem WhatsApp cadastrado</span><b class="tnum">${semTel}</b></div>
    <div class="li" style="padding:0;border:0;min-height:0"><span class="grow">Afastados</span><b class="tnum">${D.pessoas.length - ativos.length}</b></div>
    <button class="btn small" data-act="ir" data-v="ministros">${ICON.pessoas}Ver ministros</button></section>`;
  h += '</div></div>';
  return h;
}

function miniMissa(m, comAviso) {
  const d = dt(m.data);
  const av = comAviso ? S.ger.avisos(m).map((a) => a.texto).join(' · ') || 'Alguém está em 2 missas no dia' : '';
  return `<button class="mini l-${esc(m.local)}" data-act="abrirMissaIr" data-id="${esc(m.id)}">
    <span class="d"><b class="tnum">${dd(d.getDate())}/${dd(d.getMonth() + 1)}</b><span>${DIAS_CURTOS[d.getDay()]}</span></span>
    <span><b>${hora(m.hora)} · ${esc(nomeLocal(S.D, m.local))}</b><span class="muted" style="display:block;font-size:15px">${comAviso ? esc(av) : esc(m.nome || 'Missa')}</span></span>
    <span class="badge ${m.ps.length >= m.min ? 'ok' : 'warn'} tnum">${m.ps.length}/${m.min}</span></button>`;
}

export const acoes = {
  copiarLink: () => copiar(linkPublico()),
  irMes: (b) => { S.ym = b.dataset.ym; S.view = 'escala'; history.replaceState(null, '', '#escala'); render(); },
  abrirMissaIr: (b) => { S.ym = b.dataset.id.slice(0, 7); S.view = 'escala'; S.missaAberta = b.dataset.id; history.replaceState(null, '', '#escala'); render(); },
};
