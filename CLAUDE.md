# Escala dos Ministros — guia para o Claude Code

Site estático (GitHub Pages) para a escala mensal dos ministros da eucaristia. Sem build, sem dependências: HTML + CSS + JavaScript em módulos ES.

## Páginas
- `index.html` + `assets/js/ministro/app.js`: site dos ministros (mobile first, PWA). Busca por nome, "Minha escala", escala do mês, ajuda. Lembra o ministro em `localStorage` (`escala-meu-id`). Link direto para um ministro: `index.html#m-<id>`.
- `coordenador.html` + `assets/js/coordenador/*.js`: painel. Uma aba por arquivo (`painel.js`, `escala.js`, `ministros.js`, `lembretes.js`, `ajustes.js`); `app.js` cuida do layout, navegação e publicação; `estado.js` guarda o estado e o rascunho; `github.js` grava `data/dados.json` pela API do GitHub (token só em `localStorage`).
- `assets/js/core/`: código compartilhado. `gerador.js` tem as regras de montagem da escala; `textos.js` tem mensagens de WhatsApp e o `.ics`; `visual.js` desenha o cartão de missa.

## Dados: `data/dados.json`
- `pessoas[]`: `id`, `n` (nome), `a` (apelido), `l` (líder), `x` (afastado), `c` (só comunidades), `locs` (grupos onde pode servir: `CM`, `SE`, `NSF`), `pref` (peso por horário, chaves de `horarios[].id`), `p` (id da dupla, sempre recíproco), `v` (grafias antigas, para busca), `obs`.
- `locais`: `CM` Casa de Maria, `SP` Igreja São Paulo Apóstolo (grupo `CM`), `SE` Capela Santo Expedito, `NSF` Capela N. Sra. de Fátima.
- `modelos[]`: missas fixas do mês (`dia` 0=domingo, `regra` `semanal` ou `nth` com `n`), `min`, `max`, `lider`, `cred` (pessoas na credência), `pool` (horários de preferência que alimentam aquela missa).
- `escalas["AAAA-MM"].missas[]`: `id`, `data`, `hora`, `local`, `nome`, `min`, `max`, `ps` (ids escalados), `cr` (ids na credência), `obs`.
- `config`: `maxPorMes`, `alvoPorMes`, `coordNome`, `coordTel` (público), `link`.
- Sempre atualize `atualizadoEm` (ISO) ao alterar o arquivo; o painel usa isso para detectar versões diferentes.
- **Nunca** coloque telefones de ministros neste arquivo: ele é público.

## Regras ao alterar o código
- Textos da interface em português do Brasil, claros e diretos; o público é majoritariamente idoso. Botões dizem exatamente o que fazem.
- Cores só pelos tokens de `assets/css/tokens.css` (claro e escuro).
- Ao mudar qualquer arquivo listado em `sw.js`, aumente `VERSAO` em `sw.js` (ex.: `escala-v2`) para os celulares receberem a versão nova.
- Para testar: `bash abrir-local.sh` (servidor em `http://localhost:8000`). Os módulos ES não funcionam abrindo o arquivo com dois cliques.

## Publicar
- `bash publicar.sh "mensagem"` faz `git add -A`, `commit` e `push` para `origin main`. O GitHub Pages atualiza em 1–2 minutos.
- O painel também publica sozinho (grava só `data/dados.json`). Antes de editar `data/dados.json` aqui, rode `git pull` para não sobrescrever uma publicação feita pelo painel.
