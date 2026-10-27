// Aba "Escala do mês": montar, conferir e editar as missas.
import { esc, norm, hora, nomeMes, dataLonga, ICON, copiar, toast } from '../core/util.js';
import { grupo, nomeLocal, ordemMissa, novaMissa } from '../core/gerador.js';
import { textoMes, textoMissa, waLink, nomeExibicao, rotuloGrupo } from '../core/textos.js';
import { cartaoMissa, porDia, filtroIgrejas } from '../core/visual.js';
import { S, mudou, render, escalaAtual, acharMissa } from './estado.js';

export function vEscala() {
  const e = escalaAtual();
  let h = '';
  if (!e) {
    return h + `<div class="empty"><img src="assets/img/pomba.svg" alt=""><p><b>A escala de ${esc(nomeMes(S.ym))} ainda não foi montada.</b></p>
      <p>O sistema distribui os ministros pelas missas do mês seguindo os horários de cada um. Você confere, ajusta o que quiser e publica.</p>
      <button class="btn primary" data-act="montar">${ICON.varinha}Montar a escala de ${esc(nomeMes(S.ym))}</button></div>`;
  }
  const { ger } = S;
  const conf = ger.conflitos(e);
  const lista = e.missas.filter((m) => S.filtro === 'todos' || grupo(S.D, m.local) === S.filtro);
  const comAviso = e.missas.filter((m) => ger.avisos(m).length || conf[m.id]).length;
  h += `<div class="acoes-mes">
      <button class="btn" data-act="montar">${ICON.varinha}Montar de novo</button>
      <button class="btn" data-act="novaMissa">${ICON.mais}Missa extra</button>
      <span class="spacer"></span>
      <button class="btn" data-act="copiarMes">${ICON.copiar}Copiar texto</button>
      <a class="btn whats" href="${esc(waLink(textoMes(S.base, S.ym, lista, ger.linhas, S.filtro !== 'todos' ? rotuloGrupo(S.filtro) : '')))}" target="_blank" rel="noopener">${ICON.whatsapp}Enviar no WhatsApp</a>
    </div>`;
  h += comAviso
    ? `<div class="help warn">${ICON.alerta}<span><b>${comAviso} ${comAviso === 1 ? 'missa precisa' : 'missas precisam'} de atenção.</b> Elas aparecem com borda laranja. Abra a missa e toque em <b>Completar automaticamente</b>, ou adicione alguém à mão.</span></div>`
    : `<div class="help">${ICON.ok}<span>Todas as missas têm o mínimo de ministros${e.missas.some((m) => m.lider) ? ' e um líder onde é exigido' : ''}. Confira os nomes e, quando estiver tudo certo, toque em <b>Publicar</b> no alto da tela.</span></div>`;
  h += filtroIgrejas(S.filtro);
  if (!lista.length) return h + '<div class="empty">Nenhuma missa desta igreja neste mês.</div>';
  h += porDia(lista, (m) => {
    const av = ger.avisos(m);
    if (conf[m.id]) av.push({ texto: 'Alguém está em 2 missas no dia' });
    const badges = `<span class="badge ${m.ps.length >= m.min ? 'ok' : 'warn'} tnum">${m.ps.length} de mín. ${m.min}</span>` + av.filter((a) => a.tipo !== 'falta').map((a) => `<span class="badge warn">${esc(a.texto)}</span>`).join('');
    const rodape = `<button class="btn small" data-act="abrirMissa" data-id="${esc(m.id)}">${ICON.editar}Editar</button>
      ${m.ps.length < m.min || (m.lider && !ger.temLider(m)) ? `<button class="btn small" data-act="completar" data-id="${esc(m.id)}">${ICON.varinha}Completar automaticamente</button>` : ''}
      <span class="spacer"></span><a class="btn small ghost" href="${esc(waLink(textoMissa(S.base, m, ger.linhas)))}" target="_blank" rel="noopener">${ICON.whatsapp}Enviar esta missa</a>`;
    return cartaoMissa(S.base, ger, m, { badges, rodape, alerta: av.length > 0 });
  });
  return h;
}

export function modalMontar() {
  const tem = !!escalaAtual();
  return `<h2>${tem ? 'Montar a escala de novo?' : 'Montar a escala de ' + esc(nomeMes(S.ym))}</h2>
    ${tem ? `<div class="help warn">${ICON.alerta}<span>A escala de ${esc(nomeMes(S.ym))} que está na tela, incluindo o que você mudou à mão, será <b>substituída</b> por uma nova sugestão.</span></div>` : ''}
    <p>O sistema vai:</p>
    <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
      <li>colocar cada ministro nos horários em que ele costuma servir;</li>
      <li>manter as duplas juntas;</li>
      <li>respeitar quem só serve em uma igreja ou só nas comunidades;</li>
      <li>colocar pelo menos um líder nas missas da Casa de Maria;</li>
      <li>evitar que alguém sirva duas vezes no mesmo dia ou mais de ${S.D.config.maxPorMes} vezes no mês.</li>
    </ul>
    <p class="muted">Nada chega aos ministros antes de você conferir e tocar em <b>Publicar</b>.</p>
    <div class="row"><button class="btn primary" data-act="montarOk">${tem ? 'Sim, montar de novo' : 'Montar escala'}</button><button class="btn" data-act="fecharModal">Cancelar</button></div>`;
}

export function modalNovaMissa() {
  const [y, m] = S.ym.split('-').map(Number);
  const ultimo = new Date(y, m, 0).getDate();
  const opts = Object.entries(S.D.locais).map(([k, l]) => `<option value="${k}">${esc(l.nome)}</option>`).join('');
  return `<h2>Adicionar missa extra</h2>
    <p class="muted">Use para festas, Finados, missa com o bispo ou qualquer missa fora do padrão de ${esc(nomeMes(S.ym))}. Depois de adicionar, o sistema sugere os ministros e você pode trocar.</p>
    <div class="grid2">
      <div class="field"><label for="nm-data">Data</label><input class="input" type="date" id="nm-data" min="${S.ym}-01" max="${S.ym}-${ultimo}" value="${S.ym}-01"></div>
      <div class="field"><label for="nm-hora">Horário</label><input class="input" type="time" id="nm-hora" value="19:00"></div>
      <div class="field"><label for="nm-local">Igreja</label><select class="input" id="nm-local">${opts}</select></div>
      <div class="field"><label for="nm-min">Quantos ministros</label><input class="input" type="number" id="nm-min" min="1" value="10"></div>
    </div>
    <div class="field"><label for="nm-nome">Nome da missa</label><input class="input" id="nm-nome" placeholder="Ex.: Missa de Finados"></div>
    <div class="row"><button class="btn primary" data-act="novaMissaOk">Adicionar e sugerir ministros</button><button class="btn" data-act="fecharModal">Cancelar</button></div>`;
}

export function vEditorMissa() {
  const { m, ym } = acharMissa(S.missaAberta);
  if (!m) return '';
  const { ger, D, P } = { ger: S.ger, D: S.D, P: S.base.P };
  const e = S.D.escalas[ym];
  const st = ger.novoEstado(e, m.id);
  const av = ger.avisos(m);
  let h = `<div class="scrim" data-act="fecharMissa"></div><aside class="sheet" role="dialog" aria-modal="true" aria-label="Editar missa">
    <header><div style="flex:1;min-width:0"><div class="eyebrow">${esc(dataLonga(m.data))}</div><h2>${hora(m.hora)} · ${esc(m.nome || 'Missa')}</h2><div class="muted">${esc(nomeLocal(D, m.local))}</div></div>
    <button class="iconbtn" data-act="fecharMissa" aria-label="Fechar">${ICON.fechar}</button></header><div class="body">`;
  h += `<div class="row"><span class="badge ${m.ps.length >= m.min ? 'ok' : 'warn'} tnum">${m.ps.length} escalados · mínimo ${m.min}</span>${av.filter((a) => a.tipo !== 'falta').map((a) => `<span class="badge warn">${esc(a.texto)}</span>`).join('')}
    <span class="spacer"></span>${av.length ? `<button class="btn small primary" data-act="completar" data-id="${esc(m.id)}">${ICON.varinha}Completar automaticamente</button>` : ''}</div>`;
  if (m.cred) h += `<div class="help">${ICON.info}<span>Toque em <b>Credência</b> para marcar ou desmarcar quem ajuda na mesa da credência. Esta missa pede ${m.cred} pessoas.</span></div>`;
  h += '<div><div class="lbl" style="margin-bottom:8px">Escalados nesta missa</div><div class="list">';
  if (!m.ps.length) h += '<div class="li muted">Ninguém ainda.</div>';
  ger.linhas(m).flat().filter(Boolean).forEach((id) => {
    const p = P.get(id); if (!p) return;
    const outras = st.cnt[id] || 0;
    h += `<div class="li"><div class="grow"><b>${esc(nomeExibicao(p))}</b>${p.l ? ' <span class="badge gold">Líder</span>' : ''}<div class="sub">${outras ? `Também em ${outras} outra${outras > 1 ? 's' : ''} missa${outras > 1 ? 's' : ''} no mês` : 'Só esta missa no mês'}</div></div>
      ${m.cred || m.cr.length ? `<button class="tgl" data-act="cred" data-id="${id}" aria-pressed="${m.cr.includes(id)}">Credência</button>` : ''}
      <button class="x" data-act="tirar" data-id="${id}" aria-label="Tirar ${esc(p.n)} desta missa">${ICON.fechar}</button></div>`;
  });
  h += '</div></div>';
  // adicionar
  h += `<div class="stack" style="gap:8px"><div class="lbl">Adicionar ministro</div>
    <div class="search">${ICON.busca}<input class="input" id="add-busca" type="search" autocomplete="off" placeholder="Buscar pelo nome" value="${esc(S.addBusca)}"></div>
    <label class="check" style="font-size:15px"><input type="checkbox" id="add-todos"${S.addTodos ? ' checked' : ''}> Mostrar também quem não costuma servir neste horário</label>`;
  const q = norm(S.addBusca);
  const cand = S.D.pessoas
    .filter((p) => !m.ps.includes(p.id) && !p.x)
    .filter((p) => (q ? q.split(' ').every((t) => norm(`${p.n} ${p.a || ''} ${(p.v || []).join(' ')}`).includes(t)) : ger.podeServir(p, m) && (S.addTodos || ger.share(p, m) > 0)))
    .map((p) => ({ p, s: ger.pontos(p, m, st, {}) - (ger.podeServir(p, m) ? 0 : 1000) - ((st.dias[p.id] || []).includes(m.data) ? 300 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, 30);
  h += '<div class="list">';
  if (!cand.length) h += `<div class="li muted">${q ? 'Ninguém encontrado com esse nome.' : 'Todos que costumam servir neste horário já estão escalados ou indisponíveis. Marque a opção acima para ver outras pessoas.'}</div>`;
  cand.forEach(({ p }) => {
    h += `<div class="li"><div class="grow"><b>${esc(nomeExibicao(p))}</b>${p.l ? ' <span class="badge gold">Líder</span>' : ''}<div class="sub">${esc(ger.motivos(p, m, st).join(' · '))}</div></div>
      <button class="add" data-act="por" data-id="${p.id}" aria-label="Adicionar ${esc(p.n)}">${ICON.mais}</button></div>`;
  });
  h += '</div></div>';
  h += `<details class="card" style="padding:14px 18px"><summary style="cursor:pointer;font-weight:700;min-height:36px;display:flex;align-items:center">Mudar horário, mínimo ou deixar um recado</summary>
    <div class="stack" style="margin-top:12px">
      <div class="grid2"><div class="field"><label for="me-hora">Horário</label><input class="input" type="time" id="me-hora" value="${esc(m.hora)}"></div>
      <div class="field"><label for="me-min">Mínimo de ministros</label><input class="input" type="number" min="1" id="me-min" value="${m.min}"></div></div>
      <div class="field"><label for="me-nome">Nome da missa</label><input class="input" id="me-nome" value="${esc(m.nome || '')}"></div>
      <div class="field"><label for="me-obs">Recado para os ministros</label><input class="input" id="me-obs" value="${esc(m.obs || '')}" placeholder="Ex.: chegar 20 minutos antes"><span class="hint">Aparece no cartão da missa e na mensagem do WhatsApp.</span></div>
      <div class="row"><button class="btn" data-act="salvarMissa">Aplicar mudanças</button>
      ${S.confirmar === 'excluirMissa' ? `<button class="btn danger" data-act="excluirMissaOk">${ICON.lixo}Confirmar: excluir missa</button><button class="btn ghost" data-act="cancelarConf">Cancelar</button>` : `<button class="btn danger" data-act="excluirMissa">${ICON.lixo}Excluir esta missa</button>`}</div>
    </div></details>`;
  h += `</div><footer><button class="btn primary" data-act="fecharMissa">Pronto</button><span class="spacer"></span><a class="btn whats" href="${esc(waLink(textoMissa(S.base, m, ger.linhas)))}" target="_blank" rel="noopener">${ICON.whatsapp}Enviar esta missa</a></footer></aside>`;
  return h;
}

export const acoes = {
  filtro: (b) => { S.filtro = b.dataset.f; render(); },
  montar: () => { S.modal = 'montar'; render(); },
  montarOk: () => {
    S.D.escalas[S.ym] = S.ger.gerarMes(S.ym);
    S.modal = null; mudou();
    toast(`Escala de ${nomeMes(S.ym)} montada. Confira e depois toque em Publicar.`);
  },
  novaMissa: () => { S.modal = 'novaMissa'; render(); },
  novaMissaOk: () => {
    const v = (id) => document.getElementById(id).value;
    const data = v('nm-data');
    if (!data || data.slice(0, 7) !== S.ym) { toast(`Escolha uma data dentro de ${nomeMes(S.ym)}.`); return; }
    const min = Math.max(1, +v('nm-min') || 1);
    const local = v('nm-local');
    const e = (S.D.escalas[S.ym] ||= { missas: [], geradaEm: new Date().toISOString() });
    const m = novaMissa({ data, hora: v('nm-hora') || '19:00', local, nome: v('nm-nome').trim() || 'Missa', modelo: null, min, max: min + 4, lider: grupo(S.D, local) === 'CM' ? 1 : 0 });
    e.missas.push(m); e.missas.sort(ordemMissa);
    S.ger.completar(e, m);
    S.modal = null; S.missaAberta = m.id; mudou();
  },
  copiarMes: () => {
    const e = escalaAtual();
    const lista = e.missas.filter((m) => S.filtro === 'todos' || grupo(S.D, m.local) === S.filtro);
    copiar(textoMes(S.base, S.ym, lista, S.ger.linhas, S.filtro !== 'todos' ? rotuloGrupo(S.filtro) : ''));
  },
  abrirMissa: (b) => { S.missaAberta = b.dataset.id; S.addBusca = ''; S.addTodos = false; S.confirmar = null; render(); },
  fecharMissa: () => { S.missaAberta = null; S.confirmar = null; render(); },
  completar: (b) => {
    const { m, ym } = acharMissa(b.dataset.id); if (!m) return;
    S.ger.completar(S.D.escalas[ym], m); mudou();
    toast(m.ps.length >= m.min && (!m.lider || S.ger.temLider(m)) ? 'Missa completada.' : 'Não há ministros livres suficientes para esta missa. Adicione alguém à mão.');
  },
  tirar: (b) => { const { m } = acharMissa(S.missaAberta); const id = +b.dataset.id; m.ps = m.ps.filter((x) => x !== id); m.cr = m.cr.filter((x) => x !== id); mudou(); },
  por: (b) => { const { m } = acharMissa(S.missaAberta); const id = +b.dataset.id; if (!m.ps.includes(id)) m.ps.push(id); mudou(); toast('Ministro adicionado.'); },
  cred: (b) => { const { m } = acharMissa(S.missaAberta); const id = +b.dataset.id; const i = m.cr.indexOf(id); if (i >= 0) m.cr.splice(i, 1); else m.cr.push(id); mudou(); },
  salvarMissa: () => {
    const { m, ym } = acharMissa(S.missaAberta);
    m.hora = document.getElementById('me-hora').value || m.hora;
    m.min = Math.max(1, +document.getElementById('me-min').value || m.min); m.max = Math.max(m.max, m.min);
    m.nome = document.getElementById('me-nome').value.trim() || 'Missa';
    m.obs = document.getElementById('me-obs').value.trim();
    S.D.escalas[ym].missas.sort(ordemMissa); mudou(); toast('Missa atualizada.');
  },
  excluirMissa: () => { S.confirmar = 'excluirMissa'; render(); },
  excluirMissaOk: () => {
    const { ym } = acharMissa(S.missaAberta);
    S.D.escalas[ym].missas = S.D.escalas[ym].missas.filter((x) => x.id !== S.missaAberta);
    S.missaAberta = null; S.confirmar = null; mudou(); toast('Missa excluída.');
  },
};
export const entradas = {
  'add-busca': (el) => { S.addBusca = el.value; render(); },
};
export const mudancas = {
  'add-todos': (el) => { S.addTodos = el.checked; render(); },
};
