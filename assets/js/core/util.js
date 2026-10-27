// Utilidades compartilhadas entre o app do ministro e o painel do coordenador.

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Texto sem acentos, minúsculo, para buscas. */
export function norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function dt(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
export function diaN(iso) { return Math.round(dt(iso).getTime() / 864e5); }
export function hora(h) { const [a, b] = h.split(':'); return `${+a}h${b === '00' ? '' : b}`; }
export function dd(n) { return String(n).padStart(2, '0'); }
export function dataCurta(iso) { const d = dt(iso); return `${DIAS_CURTOS[d.getDay()]}, ${dd(d.getDate())}/${dd(d.getMonth() + 1)}`; }
export function dataLonga(iso) { const d = dt(iso); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`; }
export function diaSemana(iso) { return DIAS[dt(iso).getDay()]; }
export function nomeMes(ym) { const [y, m] = ym.split('-'); return `${MESES[+m - 1]} de ${y}`; }
export function mesCapital(ym) { const s = nomeMes(ym); return s[0].toUpperCase() + s.slice(1); }
export function addMes(ym, k) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return `${d.getFullYear()}-${dd(d.getMonth() + 1)}`; }
export function hojeISO(off = 0) { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`; }
export function mesAtual() { return hojeISO().slice(0, 7); }
export function diasAte(iso) { return diaN(iso) - diaN(hojeISO()); }
export function quandoTexto(iso) {
  const n = diasAte(iso);
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  if (n > 1) return `Daqui a ${n} dias`;
  if (n === -1) return 'Ontem';
  return `Há ${-n} dias`;
}

/** Mês a mostrar ao abrir: o atual, ou o próximo a partir do dia 20 se já houver escala dele. */
export function mesInicial(escalas) {
  const atual = mesAtual(), prox = addMes(atual, 1);
  if (escalas[atual] && +hojeISO().slice(8) < 20) return atual;
  if (escalas[prox]) return prox;
  if (escalas[atual]) return atual;
  const ks = Object.keys(escalas).sort();
  return ks[ks.length - 1] || prox;
}

export function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
export function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sem armazenamento */ } }
export function lsJSON(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }

let toastTimer;
export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3800);
}

export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast('Texto copiado. Agora é só colar no WhatsApp.'); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = texto; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* ignora */ }
    ta.remove(); toast(ok ? 'Texto copiado.' : 'Não foi possível copiar automaticamente.'); return ok;
  }
}

export function baixarArquivo(nome, conteudo, tipo = 'application/json') {
  const blob = new Blob([conteudo], { type: tipo });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Ícones em linha (traço), herdando a cor do texto. */
const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICON = {
  esq: I('<path d="M15 18l-6-6 6-6"/>'),
  dir: I('<path d="M9 18l6-6-6-6"/>'),
  fechar: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  busca: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  calendario: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  pessoa: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  pessoas: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>'),
  igreja: I('<path d="M12 2v4M10 4h4"/><path d="M5 21V11l7-5 7 5v10"/><path d="M10 21v-5a2 2 0 014 0v5"/>'),
  sino: I('<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>'),
  engrenagem: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  painel: I('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  editar: I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),
  copiar: I('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>'),
  ajuda: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  alerta: I('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17h.01"/>'),
  ok: I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
  nuvem: I('<path d="M7 18a5 5 0 01-.6-10A6 6 0 0118 9a4.5 4.5 0 01-.5 9z"/><path d="M12 11v6M9.5 13.5L12 11l2.5 2.5"/>'),
  baixar: I('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 19h16"/>'),
  subir: I('<path d="M12 20V9M7.5 13.5L12 9l4.5 4.5"/><path d="M4 5h16"/>'),
  mais: I('<path d="M12 5v14M5 12h14"/>'),
  varinha: I('<path d="M4 20L15 9"/><path d="M15 4v2M20 9h-2M18.5 5.5l-1.4 1.4M12 2.5l.6 1.4M21.5 12l-1.4-.6"/>'),
  telefone: I('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>'),
  lixo: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  casa: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  lista: I('<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>'),
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>',
};
