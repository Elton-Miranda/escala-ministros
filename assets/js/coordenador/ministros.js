// Aba "Ministros": cadastro de cada pessoa, como uma ficha (CRM).
import { esc, norm, hora, dataCurta, nomeMes, ICON, toast } from '../core/util.js';
import { buscarPessoas, nomeLocal } from '../core/gerador.js';
import { nomeExibicao, textoPessoa, waLink } from '../core/textos.js';
import { S, mudou, render, escalaAtual, telefoneDe, definirTelefone } from './estado.js';

const FILTROS = [
  ['ativos', 'Ativos'], ['lideres', 'Líderes'], ['comunidade', 'Só comunidade'], ['fora', 'Sem missa no mês'],
  ['semtel', 'Sem WhatsApp'], ['semdupla', 'Sem dupla'], ['unificados', 'Nomes unificados'], ['afastados', 'Afastados'],
];
const iniciais = (n) => n.split(' ').filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export function vMinistros() {
  const cont = S.ger.contagem(escalaAtual());
  const q = S.busca.trim();
  let lista = q.length ? buscarPessoas(S.D, q, norm) : [...S.D.pessoas].sort((a, b) => a.n.localeCompare(b.n, 'pt'));
  lista = lista.filter((p) => {
    switch (S.filtroP) {
      case 'lideres': return p.l && !p.x;
      case 'comunidade': return p.c && !p.x;
      case 'fora': return !p.x && !cont[p.id];
      case 'semtel': return !p.x && !telefoneDe(p.id);
      case 'semdupla': return !p.x && !p.p;
      case 'unificados': return p.v?.length;
      case 'afastados': return p.x;
      default: return q ? true : !p.x;
    }
  });
  const explic = {
    fora: `Ministros ativos que não estão em nenhuma missa de ${nomeMes(S.ym)}. Normalmente são pessoas cujo horário já está cheio.`,
    semtel: 'Sem WhatsApp cadastrado não dá para mandar lembrete direto para a pessoa. O número fica guardado só neste computador.',
    unificados: 'Estes nomes estavam escritos de jeitos diferentes nas listas antigas e foram juntados. Abra a ficha para conferir.',
    afastados: 'Afastados não entram na escala. Para voltar, abra a ficha e desmarque "Afastado".',
    comunidade: 'Servem apenas nas capelas Santo Expedito e Nossa Senhora de Fátima.',
  }[S.filtroP];
  let h = `<div class="row" style="align-items:flex-end"><div class="field" style="flex:1;min-width:240px"><label for="busca-p">Buscar ministro</label>
      <div class="search">${ICON.busca}<input class="input" id="busca-p" type="search" autocomplete="off" placeholder="Nome, sobrenome ou apelido" value="${esc(S.busca)}"></div></div>
      <button class="btn primary" data-act="novaPessoa">${ICON.mais}Novo ministro</button></div>
    <div class="chips scroll">${FILTROS.map(([k, t]) => `<button class="chip" data-act="filtroP" data-f="${k}" aria-pressed="${S.filtroP === k}">${t}</button>`).join('')}</div>`;
  if (explic) h += `<div class="help">${ICON.info}<span>${esc(explic)}</span></div>`;
  h += `<p class="muted">${lista.length} ${lista.length === 1 ? 'pessoa' : 'pessoas'}</p>`;
  if (!lista.length) return h + '<div class="empty">Ninguém encontrado.</div>';
  h += '<div class="list">' + lista.map((p) => {
    const n = cont[p.id] || 0;
    const dupla = p.p && S.base.P.get(p.p);
    return `<button class="li pessoa-li${p.x ? ' off' : ''}" data-act="abrirPessoa" data-id="${p.id}">
      <span class="ini${p.l ? ' ld' : ''}">${esc(iniciais(p.n))}</span>
      <span class="grow"><b>${esc(nomeExibicao(p))}</b><span class="sub" style="display:block">${esc(S.ger.prefPrincipal(p))}${dupla ? ' · Dupla: ' + esc(dupla.n) : ''}${S.filtroP === 'unificados' ? ' · Também escrito: ' + esc(p.v.join(' / ')) : ''}</span></span>
      <span class="badges">${p.l ? '<span class="badge gold">Líder</span>' : ''}${p.c ? '<span class="badge">Só comunidade</span>' : ''}${p.x ? '<span class="badge warn">Afastado</span>' : `<span class="badge ${n ? 'blue' : 'warn'} tnum">${n} no mês</span>`}</span>
    </button>`;
  }).join('') + '</div>';
  return h;
}

export function vFicha() {
  const nova = S.pessoaAberta === 0;
  const p = nova ? { id: 0, n: '', pref: {}, locs: ['CM'] } : S.base.P.get(S.pessoaAberta);
  if (!p) return '';
  const opcoesDupla = [...S.D.pessoas].filter((o) => o.id !== p.id && !o.x).sort((a, b) => a.n.localeCompare(b.n, 'pt'))
    .map((o) => `<option value="${o.id}"${o.id === p.p ? ' selected' : ''}>${esc(o.n)}</option>`).join('');
  let h = `<div class="scrim" data-act="fecharPessoa"></div><aside class="sheet" role="dialog" aria-modal="true" aria-label="Ficha do ministro">
    <header><div style="flex:1;min-width:0"><div class="eyebrow">${nova ? 'Novo ministro' : 'Ficha do ministro'}</div><h2>${esc(nova ? 'Cadastrar ministro' : p.n)}</h2></div>
    <button class="iconbtn" data-act="fecharPessoa" aria-label="Fechar">${ICON.fechar}</button></header><div class="body">`;
  h += `<div class="grid2">
      <div class="field"><label for="pe-n">Nome completo</label><input class="input" id="pe-n" value="${esc(p.n)}" autocomplete="off"></div>
      <div class="field"><label for="pe-a">Apelido <span class="muted">(opcional)</span></label><input class="input" id="pe-a" value="${esc(p.a || '')}"></div>
      <div class="field"><label for="pe-tel">WhatsApp</label><input class="input" id="pe-tel" inputmode="tel" placeholder="(14) 99999-9999" value="${esc(telefoneDe(p.id))}"><span class="hint">Fica guardado só neste computador. Não aparece no site.</span></div>
      <div class="field"><label for="pe-p">Serve em dupla com</label><select class="input" id="pe-p"><option value="">Ninguém (serve sozinho)</option>${opcoesDupla}</select><span class="hint">A dupla é sempre escalada junto.</span></div>
    </div>`;
  h += `<div class="card" style="padding:14px 18px"><div class="lbl">Situação</div>
      <label class="check"><input type="checkbox" id="pe-l"${p.l ? ' checked' : ''}> <span><b>Líder</b> — apoia o coordenador; toda missa da Casa de Maria recebe um.</span></label>
      <label class="check"><input type="checkbox" id="pe-c"${p.c ? ' checked' : ''}> <span><b>Só serve nas comunidades</b> — nunca vai para a Casa de Maria.</span></label>
      <label class="check"><input type="checkbox" id="pe-x"${p.x ? ' checked' : ''}> <span><b>Afastado</b> — não entra nas próximas escalas.</span></label></div>`;
  h += `<div class="card" style="padding:14px 18px"><div class="lbl">Onde pode servir</div>
      ${[['CM', 'Casa de Maria e Igreja Matriz'], ['SE', 'Capela Santo Expedito'], ['NSF', 'Capela N. Sra. de Fátima']].map(([k, t]) => `<label class="check"><input type="checkbox" class="pe-loc" value="${k}"${(p.locs || []).includes(k) ? ' checked' : ''}><span class="dot l-${k}"></span>${t}</label>`).join('')}</div>`;
  h += `<div class="card" style="padding:14px 18px"><div class="lbl">Horários em que costuma servir</div>
      <p class="muted" style="font-size:15px;margin:4px 0 6px">A montagem automática coloca a pessoa nestes horários. Vieram da planilha de escolha de horários e da escala de setembro.</p>
      ${S.D.horarios.map((x) => `<label class="check"><input type="checkbox" class="pe-pref" value="${x.id}"${p.pref[x.id] ? ' checked' : ''}>${esc(x.nome)}</label>`).join('')}</div>`;
  h += `<div class="field"><label for="pe-obs">Observações</label><textarea class="input" id="pe-obs" placeholder="Ex.: dificuldade de locomoção; prefere a capela">${esc(p.obs || '')}</textarea><span class="hint">Atenção: as observações vão junto com a escala publicada. Não escreva informações de saúde ou pessoais.</span></div>`;
  if (!nova) {
    if (p.v?.length) h += `<div class="help gold">${ICON.info}<span><b>Nas listas antigas também aparecia como:</b> ${esc(p.v.join(' · '))}</span></div>`;
    h += `<div class="card" style="padding:14px 18px"><div class="lbl">Histórico de missas</div><div class="historico">${historico(p)}</div></div>`;
    h += `<div class="row"><a class="btn whats" href="${esc(waLink(textoPessoa(S.base, p, S.ym, missasNoMes(p.id, S.ym)), telefoneDe(p.id)))}" target="_blank" rel="noopener">${ICON.whatsapp}Enviar escala de ${esc(nomeMes(S.ym))}</a>
      <a class="btn" href="index.html#m-${p.id}" target="_blank" rel="noopener">${ICON.pessoa}Ver como o ministro vê</a></div>`;
    if (S.confirmar === 'excluirPessoa') {
      h += `<div class="help warn">${ICON.alerta}<div class="stack" style="gap:10px"><span>Excluir <b>${esc(p.n)}</b> apaga a ficha e tira a pessoa de todas as escalas. Se ela só vai ficar um tempo sem servir, marque <b>Afastado</b>.</span>
        <div class="row"><button class="btn danger" data-act="excluirPessoaOk">Excluir mesmo</button><button class="btn" data-act="cancelarConf">Cancelar</button></div></div></div>`;
    }
  }
  h += `</div><footer><button class="btn primary" data-act="salvarPessoa">${nova ? 'Cadastrar' : 'Guardar ficha'}</button><button class="btn" data-act="fecharPessoa">Cancelar</button><span class="spacer"></span>
    ${nova ? '' : `<button class="btn ghost" data-act="excluirPessoa" style="color:var(--warn)">${ICON.lixo}Excluir</button>`}</footer></aside>`;
  return h;
}

function missasNoMes(id, ym) { return (S.D.escalas[ym]?.missas || []).filter((m) => m.ps.includes(id)); }
function historico(p) {
  const meses = Object.keys(S.D.escalas).sort().reverse();
  const partes = meses.map((ym) => {
    const ms = missasNoMes(p.id, ym);
    if (!ms.length) return `<div class="mes">${esc(nomeMes(ym))}</div><div class="muted">Nenhuma missa.</div>`;
    return `<div class="mes">${esc(nomeMes(ym))} · ${ms.length} missa${ms.length > 1 ? 's' : ''}</div>` +
      ms.map((m) => `<div>${esc(dataCurta(m.data))} · ${hora(m.hora)} · ${esc(nomeLocal(S.D, m.local))}${m.cr.includes(p.id) ? ' · credência' : ''}</div>`).join('');
  });
  return partes.join('') || '<div class="muted">Ainda sem escalas.</div>';
}

function salvarPessoa() {
  const nome = document.getElementById('pe-n').value.trim().replace(/\s+/g, ' ');
  if (!nome) { toast('Escreva o nome do ministro.'); document.getElementById('pe-n').focus(); return; }
  const nova = S.pessoaAberta === 0;
  const p = nova ? { id: S.D.pessoas.reduce((a, b) => Math.max(a, b.id), 0) + 1, pref: {}, locs: [] } : S.base.P.get(S.pessoaAberta);
  p.n = nome;
  const set = (k, v) => { if (v) p[k] = v; else delete p[k]; };
  set('a', document.getElementById('pe-a').value.trim());
  set('obs', document.getElementById('pe-obs').value.trim());
  ['l', 'c', 'x'].forEach((k) => set(k, document.getElementById('pe-' + k).checked ? 1 : 0));
  p.locs = [...document.querySelectorAll('.pe-loc:checked')].map((i) => i.value);
  if (p.c) p.locs = p.locs.filter((l) => l !== 'CM');
  const pref = {};
  document.querySelectorAll('.pe-pref').forEach((i) => { if (i.checked) pref[i.value] = p.pref[i.value] || 2; });
  p.pref = pref;
  // dupla: as duas fichas apontam uma para a outra
  const P = S.base.P;
  const nova_dupla = +document.getElementById('pe-p').value || null;
  if (p.p && p.p !== nova_dupla) { const ant = P.get(p.p); if (ant?.p === p.id) delete ant.p; }
  if (nova_dupla) {
    const q = P.get(nova_dupla);
    if (q.p && q.p !== p.id) { const ex = P.get(q.p); if (ex?.p === q.id) delete ex.p; }
    q.p = p.id; p.p = nova_dupla;
  } else delete p.p;
  if (nova) S.D.pessoas.push(p);
  definirTelefone(p.id, document.getElementById('pe-tel').value.trim());
  S.pessoaAberta = null; S.confirmar = null;
  mudou();
  toast(nova ? 'Ministro cadastrado.' : 'Ficha guardada.');
}

export const acoes = {
  filtroP: (b) => { S.filtroP = b.dataset.f; render(); },
  novaPessoa: () => { S.pessoaAberta = 0; S.confirmar = null; render(); setTimeout(() => document.getElementById('pe-n')?.focus(), 30); },
  abrirPessoa: (b) => { S.pessoaAberta = +b.dataset.id; S.confirmar = null; render(); },
  fecharPessoa: () => { S.pessoaAberta = null; S.confirmar = null; render(); },
  salvarPessoa,
  excluirPessoa: () => { S.confirmar = 'excluirPessoa'; render(); },
  excluirPessoaOk: () => {
    const id = S.pessoaAberta;
    S.D.pessoas = S.D.pessoas.filter((p) => p.id !== id);
    S.D.pessoas.forEach((p) => { if (p.p === id) delete p.p; });
    Object.values(S.D.escalas).forEach((e) => e.missas.forEach((m) => { m.ps = m.ps.filter((x) => x !== id); m.cr = m.cr.filter((x) => x !== id); }));
    definirTelefone(id, '');
    S.pessoaAberta = null; S.confirmar = null; mudou(); toast('Ministro excluído.');
  },
};
export const entradas = { 'busca-p': (el) => { S.busca = el.value; render(); } };
