// Publicação no GitHub: grava data/dados.json direto no repositório.
// O GitHub Pages atualiza o site sozinho em 1 a 2 minutos depois de cada gravação.
// O token fica guardado apenas neste navegador (localStorage) e nunca vai para o repositório.
import { lsJSON, lsSet } from '../core/util.js';
import { CAMINHO_DADOS } from '../core/dados.js';

const CHAVE = 'coord-github';

export function configGithub() {
  const c = lsJSON(CHAVE, {});
  // No GitHub Pages o endereço é https://USUARIO.github.io/REPOSITORIO/ — dá para descobrir sozinho.
  if (!c.owner && location.hostname.endsWith('.github.io')) c.owner = location.hostname.split('.')[0];
  if (!c.repo && location.hostname.endsWith('.github.io')) c.repo = location.pathname.split('/').filter(Boolean)[0] || `${c.owner}.github.io`;
  c.branch ||= 'main';
  return c;
}
export function salvarConfigGithub(c) { lsSet(CHAVE, JSON.stringify(c)); }
export function esquecerToken() { const c = lsJSON(CHAVE, {}); delete c.token; lsSet(CHAVE, JSON.stringify(c)); }
export const githubPronto = (c = configGithub()) => !!(c.owner && c.repo && c.token);

async function api(c, caminho, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}${caminho}`, {
    ...opts,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${c.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) },
  });
  if (!r.ok) {
    let msg = '';
    try { msg = (await r.json()).message || ''; } catch { /* sem corpo */ }
    const e = new Error(traduzErro(r.status, msg)); e.status = r.status; throw e;
  }
  return r.status === 204 ? null : r.json();
}
function traduzErro(status, msg) {
  if (status === 401) return 'O token não foi aceito. Ele pode ter expirado ou sido copiado pela metade. Gere um novo e cole de novo.';
  if (status === 403) return 'O token não tem permissão para gravar neste repositório. Ao criar o token, marque "Contents: Read and write".';
  if (status === 404) return 'Repositório não encontrado. Confira o nome do usuário e do repositório, e se o token tem acesso a ele.';
  if (status === 409) return 'Outra gravação aconteceu ao mesmo tempo. Tente publicar de novo.';
  if (status === 422) return 'O GitHub recusou o arquivo. Tente publicar de novo; se continuar, baixe a cópia de segurança.';
  return `O GitHub respondeu com erro ${status}${msg ? ': ' + msg : ''}.`;
}

/** Testa a conexão e diz, em português, se está tudo certo. */
export async function testarConexao(c) {
  const repo = await api(c, '');
  if (!repo.permissions?.push) throw new Error('O token abre o repositório, mas não pode gravar nele. Ao criar o token, marque "Contents: Read and write".');
  return { nome: repo.full_name, publico: !repo.private, branch: repo.default_branch };
}

const paraBase64 = (texto) => {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const deBase64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (ch) => ch.charCodeAt(0)));

/** Lê a versão que está no GitHub agora (para avisar se alguém publicou depois que o painel abriu). */
export async function lerRemoto(c) {
  const r = await api(c, `/contents/${CAMINHO_DADOS}?ref=${encodeURIComponent(c.branch)}`);
  let dados = null;
  try { dados = JSON.parse(deBase64(r.content || '')); } catch { /* arquivo vazio ou grande demais */ }
  return { sha: r.sha, dados };
}

export async function publicar(c, dados, sha) {
  const corpo = {
    message: `Escala atualizada pelo painel em ${new Date().toLocaleString('pt-BR')}`,
    content: paraBase64(JSON.stringify(dados, null, 1) + '\n'),
    branch: c.branch,
  };
  if (sha) corpo.sha = sha;
  return api(c, `/contents/${CAMINHO_DADOS}`, { method: 'PUT', body: JSON.stringify(corpo), headers: { 'Content-Type': 'application/json' } });
}
