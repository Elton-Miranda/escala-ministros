// Aba "Ajustes": publicação, dados da paróquia, igrejas, missas fixas, regras e cópia de segurança.
import { esc, ICON, toast, baixarArquivo, hojeISO } from '../core/util.js';
import { S, mudou, render, substituirContatos, reindexar } from './estado.js';
import { configGithub, salvarConfigGithub, esquecerToken, githubPronto, testarConexao } from './github.js';

const SECOES = [
  ['publicacao', 'Publicação'], ['paroquia', 'Paróquia e coordenador'], ['igrejas', 'Igrejas'],
  ['missas', 'Missas fixas'], ['regras', 'Regras da escala'], ['backup', 'Cópia de segurança'],
];
let teste = null; // resultado do último teste de conexão

export function vAjustes() {
  const sec = S.secao || 'publicacao';
  let h = `<div class="chips scroll">${SECOES.map(([k, t]) => `<button class="chip" data-act="secao" data-s="${k}" aria-pressed="${sec === k}">${t}</button>`).join('')}</div>`;
  h += { publicacao: vPublicacao, paroquia: vParoquia, igrejas: vIgrejas, missas: vMissas, regras: vRegras, backup: vBackup }[sec]();
  return h;
}

function vPublicacao() {
  const c = configGithub();
  const pronto = githubPronto(c);
  let h = `<section class="card stack"><div class="row"><h2>Publicação no site</h2>${pronto ? '<span class="badge ok">Conectado</span>' : '<span class="badge warn">Não conectado</span>'}</div>
    <p>O site dos ministros fica no <b>GitHub Pages</b>. Quando você toca em <b>Publicar</b>, o painel grava a escala no GitHub e o site se atualiza sozinho em <b>1 a 2 minutos</b>.</p>
    <p class="muted">Para isso, o GitHub precisa de uma “chave de acesso” (token). Você faz isto <b>uma única vez</b> em cada computador que usar para publicar.</p></section>`;
  h += `<section class="card stack"><h3>Passo a passo</h3><div class="etapas">
    <div class="etapa"><div><b>Abra a página de criação de chave do GitHub</b><span class="muted">Entre com a conta onde está o repositório do site.</span>
      <a class="btn small" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style="align-self:flex-start">Abrir página do GitHub</a></div></div>
    <div class="etapa"><div><b>Preencha assim:</b>
      <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px">
        <li><b>Token name:</b> Escala dos Ministros</li>
        <li><b>Expiration:</b> escolha 1 ano (a data em que a chave deixa de funcionar)</li>
        <li><b>Repository access:</b> “Only select repositories” e escolha <code>${esc(c.repo || 'escala-ministros')}</code></li>
        <li><b>Permissions → Repository permissions → Contents:</b> “Read and write”</li>
      </ul></div></div>
    <div class="etapa"><div><b>Clique em “Generate token” e copie a chave</b><span class="muted">Ela começa com <code>github_pat_</code>. O GitHub só mostra uma vez; se perder, é só gerar outra.</span></div></div>
    <div class="etapa"><div><b>Cole abaixo e toque em “Testar e guardar”</b></div></div>
  </div>
  <div class="grid2">
    <div class="field"><label for="gh-owner">Usuário do GitHub</label><input class="input" id="gh-owner" value="${esc(c.owner || '')}" placeholder="ex.: Elton-Miranda" autocomplete="off"></div>
    <div class="field"><label for="gh-repo">Nome do repositório</label><input class="input" id="gh-repo" value="${esc(c.repo || '')}" placeholder="ex.: escala-ministros" autocomplete="off"></div>
    <div class="field"><label for="gh-branch">Ramo (branch)</label><input class="input" id="gh-branch" value="${esc(c.branch || 'main')}" autocomplete="off"><span class="hint">Quase sempre é <code>main</code>. Não mude se não tiver certeza.</span></div>
    <div class="field"><label for="gh-token">Chave de acesso (token)</label><input class="input" id="gh-token" type="password" value="${esc(c.token || '')}" placeholder="github_pat_…" autocomplete="off"><span class="hint">Fica guardada só neste navegador. Não compartilhe com ninguém.</span></div>
  </div>
  <div class="row"><button class="btn primary" data-act="ghTestar">${ICON.ok}Testar e guardar</button>${c.token ? `<button class="btn ghost" data-act="ghEsquecer">Remover a chave deste computador</button>` : ''}</div>
  ${teste ? (teste.ok ? `<div class="help">${ICON.ok}<span><b>Tudo certo!</b> Conectado a <code>${esc(teste.nome)}</code>. Agora o botão Publicar já funciona.${teste.publico ? '' : ' Atenção: o repositório é privado; o GitHub Pages gratuito só funciona com repositório público.'}</span></div>` : `<div class="help warn">${ICON.alerta}<span>${esc(teste.erro)}</span></div>`) : ''}
  </section>`;
  h += `<section class="card stack"><h3>Sem conexão com o GitHub?</h3><p>Você ainda pode publicar à mão: em <b>Cópia de segurança</b>, baixe o arquivo <code>dados.json</code>, coloque-o na pasta <code>data</code> do projeto (substituindo o antigo) e faça o commit. Se usar o Claude Code, é só pedir “publique a escala nova”.</p></section>`;
  return h;
}

function vParoquia() {
  const c = S.D.config;
  return `<section class="card stack"><h2>Paróquia e coordenador</h2>
    <div class="grid2">
      <div class="field"><label for="cf-paroquia">Nome da paróquia</label><input class="input cf" id="cf-paroquia" data-k="paroquia" value="${esc(S.D.paroquia)}"></div>
      <div class="field"><label for="cf-coordNome">Seu nome</label><input class="input cf" id="cf-coordNome" data-k="coordNome" value="${esc(c.coordNome || '')}"></div>
      <div class="field"><label for="cf-coordTel">Seu WhatsApp</label><input class="input cf" id="cf-coordTel" data-k="coordTel" inputmode="tel" value="${esc(c.coordTel || '')}" placeholder="(14) 99999-9999"><span class="hint">Este número <b>aparece no site</b> para os ministros avisarem quando não puderem ir.</span></div>
      <div class="field"><label for="cf-link">Endereço do site dos ministros</label><input class="input cf" id="cf-link" data-k="link" value="${esc(c.link || '')}" placeholder="https://usuario.github.io/escala-ministros/"><span class="hint">Vai nas mensagens de WhatsApp. No GitHub Pages ele é preenchido sozinho.</span></div>
    </div><p class="muted">As mudanças são guardadas na hora e vão para o site quando você publicar.</p></section>`;
}

function vIgrejas() {
  return `<section class="card stack"><h2>Igrejas</h2><p class="muted">O endereço aparece para o ministro junto da próxima missa e vai para a agenda do celular.</p>
    ${Object.entries(S.D.locais).map(([k, l]) => `<div class="grid2"><div class="field"><label for="lo-n-${k}"><span class="dot l-${k}"></span> Nome</label><input class="input lo" id="lo-n-${k}" data-l="${k}" data-k="nome" value="${esc(l.nome)}"></div>
      <div class="field"><label for="lo-e-${k}">Endereço</label><input class="input lo" id="lo-e-${k}" data-l="${k}" data-k="endereco" value="${esc(l.endereco || '')}" placeholder="Rua, número – bairro"></div></div>`).join('')}</section>`;
}

function vMissas() {
  const quando = (md) => {
    const dia = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][md.dia];
    if (md.regra === 'nth') return `${md.n}º ${dia} do mês`;
    return md.dia === 0 || md.dia === 6 ? `Todo ${dia}` : `Toda ${dia}`;
  };
  return `<section class="card stack"><h2>Missas fixas de cada mês</h2>
    <div class="help">${ICON.info}<span>Estas são as missas que entram automaticamente quando você monta um mês novo. Mudar aqui <b>não altera</b> escalas já montadas; para isso, edite a missa direto na aba Escala.</span></div>
    <div class="tabela"><table class="regras"><thead><tr><th>Usar</th><th>Missa</th><th>Quando</th><th>Horário</th><th>Mínimo</th><th>Máximo</th><th>Exige líder</th><th>Credência</th></tr></thead><tbody>
    ${S.D.modelos.map((md, i) => `<tr>
      <td><input type="checkbox" class="rg" id="rg-a-${i}" data-i="${i}" data-k="ativa"${md.ativa ? ' checked' : ''} aria-label="Usar esta missa"></td>
      <td><b>${esc(md.nome)}</b><br><span class="muted" style="font-size:14px"><span class="dot l-${md.local}"></span> ${esc(S.D.locais[md.local]?.nome || md.local)}</span></td>
      <td>${esc(quando(md))}</td>
      <td><input class="input rg" type="time" id="rg-h-${i}" data-i="${i}" data-k="hora" value="${md.hora}"></td>
      <td><input class="input rg" type="number" min="1" id="rg-mi-${i}" data-i="${i}" data-k="min" value="${md.min}" aria-label="Mínimo"></td>
      <td><input class="input rg" type="number" min="1" id="rg-ma-${i}" data-i="${i}" data-k="max" value="${md.max}" aria-label="Máximo"></td>
      <td><input type="checkbox" class="rg" id="rg-l-${i}" data-i="${i}" data-k="lider"${md.lider ? ' checked' : ''} aria-label="Exige líder"></td>
      <td><input class="input rg" type="number" min="0" id="rg-c-${i}" data-i="${i}" data-k="cred" value="${md.cred || 0}" aria-label="Pessoas na credência"></td></tr>`).join('')}
    </tbody></table></div>
    <p class="muted" style="font-size:15px"><b>Mínimo:</b> a escala sempre tenta chegar a este número. <b>Máximo:</b> o limite quando sobra gente. <b>Credência:</b> quantas pessoas ficam na credência (0 = não usa).</p></section>`;
}

function vRegras() {
  const c = S.D.config;
  return `<section class="card stack"><h2>Regras da escala</h2><div class="grid2">
    <div class="field"><label for="cf-maxPorMes">Máximo de missas por ministro no mês</label><input class="input cf" type="number" min="1" id="cf-maxPorMes" data-k="maxPorMes" value="${c.maxPorMes}"><span class="hint">Ninguém é escalado mais vezes do que isso.</span></div>
    <div class="field"><label for="cf-alvoPorMes">Quantas vezes cada um deveria servir</label><input class="input cf" type="number" min="1" id="cf-alvoPorMes" data-k="alvoPorMes" value="${c.alvoPorMes}"><span class="hint">Depois de completar as missas, o sistema tenta dar pelo menos este número a todos.</span></div>
    </div><p class="muted">Valem para os próximos meses que você montar.</p></section>`;
}

function vBackup() {
  return `<section class="card stack"><h2>Cópia de segurança</h2>
    <p>Guarde uma cópia de vez em quando, principalmente antes de montar um mês novo. A cópia inclui os telefones, que não ficam no site.</p>
    <div class="row"><button class="btn primary" data-act="baixarBackup">${ICON.baixar}Baixar cópia de segurança</button>
    <label class="btn" for="imp-backup" style="cursor:pointer">${ICON.subir}Restaurar uma cópia</label><input type="file" id="imp-backup" accept=".json,application/json" hidden></div>
    <div class="help">${ICON.info}<span>Restaurar substitui o que está no painel por o que está na cópia. Nada vai para o site até você publicar.</span></div></section>
    <section class="card stack"><h3>Publicar à mão</h3><p>Baixe só o arquivo da escala (<code>dados.json</code>) para colocar na pasta <code>data</code> do projeto e fazer o commit.</p>
    <button class="btn" data-act="baixarDados" style="align-self:flex-start">${ICON.baixar}Baixar dados.json</button></section>`;
}

export const acoes = {
  secao: (b) => { S.secao = b.dataset.s; teste = null; render(); },
  ghTestar: async () => {
    const v = (id) => document.getElementById(id).value.trim();
    const c = { owner: v('gh-owner'), repo: v('gh-repo'), branch: v('gh-branch') || 'main', token: v('gh-token') };
    if (!c.owner || !c.repo || !c.token) { teste = { ok: false, erro: 'Preencha o usuário, o repositório e a chave de acesso.' }; render(); return; }
    salvarConfigGithub(c);
    try { const r = await testarConexao(c); teste = { ok: true, ...r }; }
    catch (e) { teste = { ok: false, erro: e.message || 'Não foi possível falar com o GitHub. Verifique a internet.' }; }
    render();
  },
  ghEsquecer: () => { esquecerToken(); teste = null; render(); toast('Chave removida deste computador.'); },
  baixarBackup: () => {
    baixarArquivo(`escala-ministros-copia-${hojeISO()}.json`, JSON.stringify({ tipo: 'copia-escala-ministros', dados: S.D, contatos: S.contatos }, null, 1));
  },
  baixarDados: () => baixarArquivo('dados.json', JSON.stringify(S.D, null, 1) + '\n'),
};
export const mudancas = {
  'imp-backup': async (el) => {
    const f = el.files?.[0]; if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      const dados = o.tipo === 'copia-escala-ministros' ? o.dados : o;
      if (!dados?.pessoas || !dados?.escalas) throw new Error();
      S.D = dados; if (o.contatos) substituirContatos(o.contatos);
      reindexar(); mudou(); toast('Cópia restaurada. Confira e publique quando quiser.');
    } catch { toast('Este arquivo não é uma cópia da escala.'); }
  },
};
// Campos que salvam ao sair do campo (change)
export function aoMudarCampo(el) {
  if (el.classList.contains('cf')) {
    const k = el.dataset.k;
    if (k === 'paroquia') S.D.paroquia = el.value.trim() || S.D.paroquia;
    else S.D.config[k] = el.type === 'number' ? Math.max(1, +el.value || 1) : el.value.trim();
    mudou(); return true;
  }
  if (el.classList.contains('lo')) { S.D.locais[el.dataset.l][el.dataset.k] = el.value.trim(); mudou(); return true; }
  if (el.classList.contains('rg')) {
    const md = S.D.modelos[+el.dataset.i], k = el.dataset.k;
    md[k] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.type === 'number' ? Math.max(0, +el.value || 0) : el.value;
    if (md.max < md.min) md.max = md.min;
    mudou(); return true;
  }
  return false;
}
