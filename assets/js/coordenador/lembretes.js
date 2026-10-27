// Aba "Lembretes": mensagem do dia anterior para cada ministro, pelo WhatsApp.
import { esc, hora, dataLonga, ICON, hojeISO } from '../core/util.js';
import { nomeLocal } from '../core/gerador.js';
import { nomeExibicao, textoLembrete, waLink } from '../core/textos.js';
import { S, render, telefoneDe } from './estado.js';

export function vLembretes() {
  const d = S.lemData;
  const e = S.D.escalas[d.slice(0, 7)];
  const missas = e ? e.missas.filter((m) => m.data === d) : [];
  const enviados = new Set(JSON.parse(sessionStorage.getItem('lembretes-' + d) || '[]'));
  let h = `<div class="card stack"><div class="etapas">
      <div class="etapa"><div><b>Escolha a data da missa.</b><span class="muted">Já vem marcado amanhã (${esc(dataLonga(hojeISO(1)))}).</span></div></div>
      <div class="etapa"><div><b>Toque em “Lembrar” ao lado de cada nome.</b><span class="muted">Abre o WhatsApp com a mensagem pronta para aquela pessoa. Confira e toque em enviar.</span></div></div>
      <div class="etapa"><div><b>Volte para esta tela e siga para o próximo nome.</b><span class="muted">Quem já recebeu fica marcado com “Enviado”.</span></div></div>
    </div>
    <div class="row"><div class="field"><label for="lem-data">Data da missa</label><input class="input" type="date" id="lem-data" value="${esc(d)}"></div>
    <button class="btn small" data-act="lemAmanha" style="align-self:flex-end">Amanhã</button></div></div>`;
  if (!missas.length) return h + `<div class="empty"><img src="assets/img/pomba.svg" alt=""><p>Não há missa escalada em ${esc(dataLonga(d))}.</p></div>`;
  missas.forEach((m) => {
    const semTel = m.ps.filter((id) => !telefoneDe(id)).length;
    h += `<section class="mass l-${esc(m.local)}"><div class="mhead"><div class="mtime">${hora(m.hora)}</div><div class="mtitle"><div class="t">${esc(m.nome || 'Missa')}</div><div class="p"><span class="dot"></span>${esc(nomeLocal(S.D, m.local))}</div></div>
      <div class="badges">${semTel ? `<span class="badge warn">${semTel} sem WhatsApp</span>` : '<span class="badge ok">Todos com WhatsApp</span>'}</div></div><div class="list" style="border:0;border-top:1px solid var(--line);border-radius:0">`;
    m.ps.forEach((id) => {
      const p = S.base.P.get(id); if (!p) return;
      const tel = telefoneDe(id);
      h += `<div class="li"><div class="grow"><b>${esc(nomeExibicao(p))}</b><div class="sub">${tel ? esc(tel) : 'Sem WhatsApp cadastrado'}</div></div>
        ${enviados.has(id) ? '<span class="badge ok">Enviado</span>' : ''}
        ${tel ? '' : `<button class="btn small ghost" data-act="abrirPessoa" data-id="${id}">Cadastrar número</button>`}
        <a class="btn small whats" data-act="lembrar" data-id="${id}" href="${esc(waLink(textoLembrete(S.base, p, m), tel))}" target="_blank" rel="noopener">${ICON.whatsapp}Lembrar</a></div>`;
    });
    h += '</div></section>';
  });
  h += `<div class="help">${ICON.info}<span>Sem número cadastrado, o WhatsApp abre a mensagem pronta e você escolhe o contato na lista.</span></div>`;
  return h;
}

export const acoes = {
  lemAmanha: () => { S.lemData = hojeISO(1); render(); },
  lembrar: (b) => {
    const k = 'lembretes-' + S.lemData;
    const s = new Set(JSON.parse(sessionStorage.getItem(k) || '[]')); s.add(+b.dataset.id);
    sessionStorage.setItem(k, JSON.stringify([...s]));
    setTimeout(render, 300);
    return true; // deixa o link abrir
  },
};
export const mudancas = { 'lem-data': (el) => { if (el.value) { S.lemData = el.value; render(); } } };
