// App do ministro: "Minha escala", "Escala do mês" e "Ajuda".
import { esc, norm, hora, dt, dd, DIAS, MESES, nomeMes, addMes, hojeISO, mesInicial, quandoTexto, lsGet, lsSet, toast, baixarArquivo, ICON, diasAte } from '../core/util.js';
import { carregarDados } from '../core/dados.js';
import { criarBase, criarEscalador, buscarPessoas, nomeLocal, grupo } from '../core/gerador.js';
import { primeiroNome, nomeExibicao, gerarICS, waLink } from '../core/textos.js';
import { cartaoMissa, porDia, filtroIgrejas } from '../core/visual.js';

const app = document.getElementById('app');
const CHAVE_EU = 'escala-meu-id';
const ui = { view: 'inicio', ym: null, filtro: 'todos', busca: '', eu: null, instalar: null };
let base, ger, D;

async function iniciar() {
  try {
    D = await carregarDados();
  } catch (e) {
    app.innerHTML = `<div class="empty" style="margin-top:30px"><img src="assets/img/pomba.svg" alt=""><p><b>Não foi possível carregar a escala.</b></p><p>Verifique sua internet e tente de novo.</p><button class="btn primary" onclick="location.reload()">Tentar de novo</button></div>`;
    return;
  }
  base = criarBase(D); ger = criarEscalador(base);
  document.getElementById('paroquia').textContent = D.paroquia;
  ui.ym = mesInicial(D.escalas);
  const salvo = +lsGet(CHAVE_EU);
  if (salvo && base.P.get(salvo)) ui.eu = salvo;
  lerHash();
  render();
}

function lerHash() {
  const h = location.hash.slice(1);
  const m = /^m-(\d+)$/.exec(h);
  if (m && base.P.get(+m[1])) { ui.eu = +m[1]; lsSet(CHAVE_EU, String(ui.eu)); ui.view = 'inicio'; return; }
  if (['inicio', 'escala', 'ajuda'].includes(h)) ui.view = h;
}
window.addEventListener('hashchange', () => { if (base) { lerHash(); render(); } });

function ir(v) {
  ui.view = v;
  history.replaceState(null, '', '#' + v);
  render();
  window.scrollTo({ top: 0 });
}

function render() {
  document.querySelectorAll('.nav button').forEach((b) => b.setAttribute('aria-current', b.dataset.v === ui.view ? 'page' : 'false'));
  let h = '';
  if (ui.view === 'inicio') h = ui.eu ? vMinha() : vBoasVindas();
  else if (ui.view === 'escala') h = vEscala();
  else h = vAjuda();
  app.innerHTML = `<div class="stack" style="padding-top:12px">${h}</div>`;
}

/* ---------- Boas-vindas e busca do nome ---------- */
function vBoasVindas() {
  let h = `<section class="boasvindas"><img class="arte" src="assets/img/vitral.svg" alt="">
    <div class="stack" style="gap:14px"><h1>Quando eu sirvo?</h1><p>Digite o seu nome para ver os dias, horários e igrejas em que você vai servir.</p>`;
  h += `<div class="busca-card"><label class="lbl" for="busca-nome">Seu nome</label>
    <div class="search">${ICON.busca}<input class="input big" id="busca-nome" type="search" autocomplete="off" autocapitalize="words" placeholder="Ex.: Maria Aparecida" value="${esc(ui.busca)}"></div>`;
  const res = ui.busca.trim().length >= 2 ? buscarPessoas(D, ui.busca, norm).filter((p) => !p.x).slice(0, 10) : [];
  if (ui.busca.trim().length >= 2) {
    h += res.length
      ? `<p class="muted">Toque no seu nome:</p><div class="stack" style="gap:8px">${res.map((p) => `<button class="resultado" data-act="sou" data-id="${p.id}"><span class="ini">${esc(iniciais(p.n))}</span><span><b>${esc(nomeExibicao(p))}</b><span class="muted">${esc(ger.prefPrincipal(p))}</span></span></button>`).join('')}</div>`
      : '<div class="help gold">' + ICON.info + '<span>Não encontramos esse nome. Tente digitar só o primeiro nome ou só o sobrenome. Se mesmo assim não aparecer, fale com o coordenador.</span></div>';
  } else {
    h += '<p class="muted" style="font-size:15px">Este celular vai lembrar de você. Da próxima vez, sua escala abre direto.</p>';
  }
  h += '</div></div></section>';
  return h + `<div class="rodape-arte"><img src="assets/img/pomba.svg" alt=""></div>`;
}
const iniciais = (n) => n.split(' ').filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ---------- Minha escala ---------- */
function minhasMissas(id) {
  const out = [];
  Object.keys(D.escalas).sort().forEach((ym) => D.escalas[ym].missas.forEach((m) => { if (m.ps.includes(id)) out.push(m); }));
  return out.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}

function vMinha() {
  const p = base.P.get(ui.eu);
  const todas = minhasMissas(p.id);
  const hoje = hojeISO();
  const futuras = todas.filter((m) => m.data >= hoje);
  const passadasMes = todas.filter((m) => m.data < hoje && m.data.slice(0, 7) === hoje.slice(0, 7));
  const prox = futuras[0];
  let h = `<div class="saudacao"><div style="flex:1;min-width:0"><div class="eyebrow">Paz e bem</div><h1>${esc(primeiroNome(p))}</h1></div>
    <button class="btn small ghost" data-act="trocar">Não sou ${esc(primeiroNome(p))}</button></div>`;
  if (p.x) h += `<div class="help gold">${ICON.info}<span>No momento você está afastado(a) da escala. Quando quiser voltar, fale com o coordenador.</span></div>`;
  if (prox) {
    const q = p.p && prox.ps.includes(p.p) ? base.P.get(p.p) : null;
    const d = dt(prox.data);
    h += `<section class="proxima" aria-label="Sua próxima missa"><img class="cruz" src="assets/img/logo.svg" alt="">
      <span class="rotulo">Sua próxima missa</span>
      <div class="quando">${esc(DIAS[d.getDay()])},<br>${d.getDate()} de ${MESES[d.getMonth()]} · ${hora(prox.hora)}</div>
      <div class="onde">${ICON.igreja}<span>${esc((prox.nome && prox.nome !== 'Missa' ? prox.nome + ' · ' : '') + nomeLocal(D, prox.local))}${D.locais[prox.local]?.endereco ? `<br><span style="opacity:.85;font-size:16px">${esc(D.locais[prox.local].endereco)}</span>` : ''}</span></div>
      <span class="falta">${esc(quandoTexto(prox.data))}${prox.cr.includes(p.id) ? ' · Você está na credência' : ''}</span>
      ${q ? `<div style="font-size:16px;opacity:.92">Junto com ${esc(q.n)}</div>` : ''}
      <div class="acoes"><button class="btn gold" data-act="agenda">${ICON.calendario}Pôr na agenda do celular</button><button class="btn" data-act="verMissa" data-id="${esc(prox.id)}">${ICON.pessoas}Quem serve comigo</button></div>
    </section>`;
  } else {
    h += `<div class="empty"><img src="assets/img/pomba.svg" alt=""><p><b>Nenhuma missa marcada para você por enquanto.</b></p><p>Quando o coordenador publicar a próxima escala, ela aparece aqui.</p></div>`;
  }
  if (futuras.length > 1) {
    h += '<div class="secao-titulo">Próximas datas</div><div class="datas">' + futuras.slice(1).map((m) => itemData(m, p)).join('') + '</div>';
  }
  if (passadasMes.length) {
    h += '<div class="secao-titulo">Já servidas neste mês</div><div class="datas">' + passadasMes.map((m) => itemData(m, p, true)).join('') + '</div>';
  }
  h += `<div class="help warn">${ICON.alerta}<span><b>Não vai poder ir?</b> Avise o coordenador o quanto antes, para que outra pessoa possa ser chamada.${D.config.coordTel ? '' : ''}</span></div>`;
  if (D.config.coordTel) {
    const msg = `Olá${D.config.coordNome ? ', ' + D.config.coordNome.split(' ')[0] : ''}! Aqui é ${p.n}. Não vou poder servir na missa de ${prox ? dataTexto(prox) : '(data)'}.`;
    h += `<a class="btn whats block" href="${esc(waLink(msg, D.config.coordTel))}" target="_blank" rel="noopener">${ICON.whatsapp}Avisar o coordenador pelo WhatsApp</a>`;
  }
  if (ui.instalar) h += `<button class="btn block" data-act="instalar">${ICON.baixar}Instalar o app neste celular</button>`;
  return h;
}
const dataTexto = (m) => { const d = dt(m.data); return `${DIAS[d.getDay()]}, ${dd(d.getDate())}/${dd(d.getMonth() + 1)}, às ${hora(m.hora)}`; };
function itemData(m, p, passada) {
  const d = dt(m.data);
  return `<button class="data-item l-${esc(m.local)}${passada ? ' passada' : ''}" data-act="verMissa" data-id="${esc(m.id)}" style="text-align:left;cursor:pointer;font:inherit;color:inherit">
    <div class="cal"><div class="d tnum">${dd(d.getDate())}</div><div class="m">${MESES[d.getMonth()].slice(0, 3)}</div></div>
    <div><div class="t">${esc(DIAS[d.getDay()])} às ${hora(m.hora)}</div><div class="muted">${esc((m.nome && m.nome !== 'Missa' ? m.nome + ' · ' : '') + nomeLocal(D, m.local))}${m.cr.includes(p.id) ? ' · <b>Credência</b>' : ''}</div></div></button>`;
}

/* ---------- Escala do mês ---------- */
function vEscala() {
  const e = D.escalas[ui.ym];
  const meses = Object.keys(D.escalas).sort();
  let h = `<div class="mesbar"><button class="iconbtn" data-act="mes" data-k="-1" aria-label="Mês anterior"${meses[0] >= ui.ym ? ' disabled' : ''}>${ICON.esq}</button>
    <h1>${esc(nomeMes(ui.ym).replace(/^./, (c) => c.toUpperCase()))}</h1>
    <button class="iconbtn" data-act="mes" data-k="1" aria-label="Próximo mês"${meses[meses.length - 1] <= ui.ym ? ' disabled' : ''}>${ICON.dir}</button></div>`;
  if (!e) return h + `<div class="empty"><img src="assets/img/pomba.svg" alt=""><p>A escala deste mês ainda não foi publicada.</p></div>`;
  h += filtroIgrejas(ui.filtro);
  if (ui.eu) h += `<p class="muted" style="font-size:15px">Seu nome aparece destacado em amarelo.</p>`;
  const lista = e.missas.filter((m) => ui.filtro === 'todos' || grupo(D, m.local) === ui.filtro);
  if (!lista.length) return h + '<div class="empty">Nenhuma missa para esta igreja neste mês.</div>';
  return h + porDia(lista, (m) => cartaoMissa(base, ger, m, { badges: `<span class="badge tnum">${m.ps.length} ministros</span>`, destaque: ui.eu }));
}

/* ---------- Ajuda ---------- */
function vAjuda() {
  const q = (t, r, aberto) => `<details${aberto ? ' open' : ''}><summary>${t}</summary><div class="resp">${r}</div></details>`;
  return `<h1 style="font-size:30px">Ajuda</h1><div class="faq stack" style="gap:10px">
  ${q('Como ver a minha escala?', '<p>Toque em <b>Minha escala</b>, digite seu nome e toque nele. O celular lembra de você e, das próximas vezes, a escala abre direto.</p>', true)}
  ${q('Como colocar o app na tela do celular?', `<p><b>Android (Chrome):</b></p><ol><li>Abra este site no Chrome.</li><li>Toque nos três pontinhos <b>⋮</b> no canto de cima.</li><li>Toque em <b>Adicionar à tela inicial</b> ou <b>Instalar app</b>.</li></ol>
     <p><b>iPhone (Safari):</b></p><ol><li>Abra este site no Safari.</li><li>Toque no botão <b>Compartilhar</b> (quadrado com uma seta para cima).</li><li>Toque em <b>Adicionar à Tela de Início</b>.</li></ol><p>Depois disso, aparece um ícone com um cálice na tela do celular.</p>`)}
  ${q('Como receber lembrete antes da missa?', '<p>Na tela <b>Minha escala</b>, toque em <b>Pôr na agenda do celular</b>. A agenda do celular vai avisar um dia antes de cada missa em que você está escalado(a).</p><p>O coordenador também pode mandar um lembrete pelo WhatsApp.</p>')}
  ${q('Não vou poder ir. O que faço?', '<p>Avise o coordenador <b>o quanto antes</b>, para que outra pessoa seja chamada. Não troque de lugar com outro ministro sem avisar o coordenador.</p>')}
  ${q('O que significa “Credência” e “Líder”?', '<p><b>Credência:</b> você ajuda na mesa da credência durante a missa.</p><p><b>Líder:</b> ministro que apoia o coordenador e orienta a equipe naquela missa. Toda missa da Casa de Maria tem pelo menos um líder.</p>')}
  ${q('Meu nome está errado ou não aparece', '<p>Fale com o coordenador para corrigir. O nome aparece igual para todos os ministros.</p>')}
  ${q('Como a escala é feita?', '<p>O coordenador monta a escala todo mês, respeitando os dias e horários em que cada ministro costuma servir e quem serve em dupla. Depois ele confere e publica aqui.</p>')}
  </div><div class="rodape-arte"><img src="assets/img/pomba.svg" alt=""></div>`;
}

/* ---------- Folha com os nomes de uma missa ---------- */
function abrirMissa(id) {
  let m = null;
  for (const ym in D.escalas) { m = D.escalas[ym].missas.find((x) => x.id === id) || m; }
  if (!m) return;
  const d = dt(m.data);
  const html = `<div class="scrim" data-act="fechar"></div><aside class="sheet" role="dialog" aria-modal="true" aria-label="Ministros da missa">
    <header><div style="flex:1;min-width:0"><div class="eyebrow">${esc(DIAS[d.getDay()])}, ${d.getDate()} de ${MESES[d.getMonth()]}</div><h2>${hora(m.hora)} · ${esc(nomeLocal(D, m.local))}</h2></div><button class="iconbtn" data-act="fechar" aria-label="Fechar">${ICON.fechar}</button></header>
    <div class="body">${cartaoMissa(base, ger, m, { badges: `<span class="badge tnum">${m.ps.length} ministros</span>`, destaque: ui.eu })}</div></aside>`;
  const w = document.createElement('div'); w.id = 'folha'; w.innerHTML = html; document.body.append(w);
  w.querySelector('.iconbtn').focus();
}
function fecharFolha() { document.getElementById('folha')?.remove(); }

/* ---------- eventos ---------- */
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b || !base) return;
  const a = b.dataset.act;
  if (a === 'ir') ir(b.dataset.v);
  else if (a === 'sou') { ui.eu = +b.dataset.id; lsSet(CHAVE_EU, String(ui.eu)); ui.busca = ''; history.replaceState(null, '', '#inicio'); render(); window.scrollTo({ top: 0 }); }
  else if (a === 'trocar') { ui.eu = null; lsSet(CHAVE_EU, null); render(); setTimeout(() => document.getElementById('busca-nome')?.focus(), 50); }
  else if (a === 'mes') { ui.ym = addMes(ui.ym, +b.dataset.k); render(); }
  else if (a === 'filtro') { ui.filtro = b.dataset.f; render(); }
  else if (a === 'verMissa') abrirMissa(b.dataset.id);
  else if (a === 'fechar') fecharFolha();
  else if (a === 'agenda') {
    const p = base.P.get(ui.eu);
    const futuras = minhasMissas(p.id).filter((m) => diasAte(m.data) >= 0);
    baixarArquivo('minha-escala.ics', gerarICS(base, p, futuras), 'text/calendar');
    toast('Abra o arquivo baixado para salvar as datas na agenda.');
  } else if (a === 'instalar' && ui.instalar) { ui.instalar.prompt(); ui.instalar = null; render(); }
});
app.addEventListener('input', (ev) => {
  if (ev.target.id === 'busca-nome') {
    ui.busca = ev.target.value;
    const pos = ev.target.selectionStart;
    render();
    const el = document.getElementById('busca-nome'); el.focus(); el.setSelectionRange(pos, pos);
  }
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fecharFolha(); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); ui.instalar = e; if (base) render(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

iniciar();
