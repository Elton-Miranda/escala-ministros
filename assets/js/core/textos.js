// Textos prontos para WhatsApp e arquivo de agenda (.ics).
import { dataCurta, dataLonga, hora, nomeMes, mesCapital, dd } from './util.js';
import { nomeLocal, grupo } from './gerador.js';

export const primeiroNome = (p) => p.a || p.n.split(' ')[0];
export const nomeExibicao = (p) => p.n + (p.a ? ` (${p.a})` : '');
const tituloMissa = (m) => (m.nome && m.nome !== 'Missa' ? m.nome : 'Missa');

export function textoMissa(base, m, linhas) {
  const { D, P } = base;
  let t = `*${dataCurta(m.data)} · ${hora(m.hora)}*\n${m.nome && m.nome !== 'Missa' ? m.nome + ' · ' : ''}${nomeLocal(D, m.local)}\n`;
  if (m.obs) t += `_${m.obs}_\n`;
  linhas(m).flat().filter(Boolean).forEach((id) => {
    const p = P.get(id); if (!p) return;
    const e = [];
    if (m.cr.includes(id)) e.push('credência');
    if (p.l) e.push('líder');
    t += `• ${nomeExibicao(p)}${e.length ? ` (${e.join(', ')})` : ''}\n`;
  });
  return t;
}

export function textoMes(base, ym, missas, linhas, rotulo) {
  const { D } = base;
  let t = `*Escala dos Ministros · ${mesCapital(ym)}*\n_${D.paroquia}_\n`;
  if (rotulo) t += `_${rotulo}_\n`;
  missas.forEach((m) => { t += '\n' + textoMissa(base, m, linhas); });
  t += '\nSe não puder comparecer, avise o coordenador imediatamente.';
  if (D.config.link) t += `\nConsulte sua escala: ${D.config.link}`;
  return t;
}

export function textoPessoa(base, p, ym, missas) {
  const { D } = base;
  let t = `Olá, ${primeiroNome(p)}! Sua escala de ${nomeMes(ym)}:\n`;
  if (!missas.length) t += 'Neste mês você não está escalado(a).\n';
  missas.forEach((m) => {
    t += `• ${dataCurta(m.data)}, ${hora(m.hora)} – ${m.nome && m.nome !== 'Missa' ? m.nome + ', ' : ''}${nomeLocal(D, m.local)}${m.cr.includes(p.id) ? ' (credência)' : ''}\n`;
  });
  t += '\nSe não puder comparecer, avise o coordenador imediatamente.';
  if (D.config.link) t += `\nVeja sempre a sua escala: ${D.config.link}`;
  return t;
}

export function textoLembrete(base, p, m) {
  const { D } = base;
  return `Olá, ${primeiroNome(p)}! Lembrete: amanhã, ${dataLonga(m.data)}, você está escalado(a) para a ${tituloMissa(m).toLowerCase() === 'missa' ? 'missa' : tituloMissa(m)} das ${hora(m.hora)} – ${nomeLocal(D, m.local)}${m.cr.includes(p.id) ? ' (credência)' : ''}.\nSe não puder comparecer, avise o coordenador imediatamente. Deus abençoe!`;
}

/** Número no formato internacional para o wa.me (assume Brasil quando faltar o 55). */
export function telefoneWa(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length <= 11) d = '55' + d;
  return d;
}
export const waLink = (texto, tel = '') => `https://wa.me/${telefoneWa(tel)}?text=${encodeURIComponent(texto)}`;

/** Arquivo .ics com as missas da pessoa, para adicionar à agenda do celular (lembrete 1 dia antes). */
export function gerarICS(base, p, missas) {
  const { D } = base;
  const linhasICS = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Escala dos Ministros//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const agora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  for (const m of missas) {
    const [y, mo, d] = m.data.split('-');
    const [h, mi] = m.hora.split(':');
    const ini = `${y}${mo}${d}T${h}${mi}00`;
    const fimH = dd((+h + 1) % 24);
    const fim = `${y}${mo}${d}T${fimH}${mi}00`;
    const local = nomeLocal(D, m.local) + (D.locais[m.local]?.endereco ? ` – ${D.locais[m.local].endereco}` : '');
    linhasICS.push('BEGIN:VEVENT', `UID:${m.id}-${p.id}@escala-ministros`, `DTSTAMP:${agora}`,
      `DTSTART;TZID=America/Sao_Paulo:${ini}`, `DTEND;TZID=America/Sao_Paulo:${fim}`,
      `SUMMARY:${icsTexto(`Servir: ${tituloMissa(m)} – ${nomeLocal(D, m.local)}`)}`,
      `LOCATION:${icsTexto(local)}`,
      `DESCRIPTION:${icsTexto((m.cr.includes(p.id) ? 'Você está na credência. ' : '') + 'Se não puder comparecer, avise o coordenador imediatamente.')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Amanhã você serve na missa', 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
  }
  linhasICS.push('END:VCALENDAR');
  return linhasICS.join('\r\n');
}
const icsTexto = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function rotuloGrupo(g) {
  return { CM: 'Casa de Maria e Igreja Matriz', SE: 'Capela Santo Expedito', NSF: 'Capela N. Sra. de Fátima' }[g] || 'Todas as igrejas';
}
export { grupo };
