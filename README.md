# Escala dos Ministros

Site para a escala mensal dos Ministros Extraordinários da Sagrada Comunhão da Paróquia São Paulo Apóstolo.

- **Site dos ministros** (`index.html`): cada ministro digita o nome e vê quando e onde serve. Funciona como app no celular.
- **Painel do coordenador** (`coordenador.html`): monta a escala do mês automaticamente, permite editar, cadastra ministros, envia lembretes pelo WhatsApp e publica.

Não precisa de servidor nem de banco de dados. Tudo roda no **GitHub Pages** (gratuito).

---

## Estrutura das pastas

```
escala-ministros/
├── index.html              ← site dos ministros
├── coordenador.html        ← painel do coordenador
├── data/dados.json         ← A ESCALA: ministros, missas e escalas de cada mês
├── assets/
│   ├── css/                ← cores (tokens.css), componentes (base.css) e cada página
│   ├── js/core/            ← regras da escala, textos do WhatsApp, utilidades
│   ├── js/ministro/        ← código do site dos ministros
│   ├── js/coordenador/     ← código do painel (uma aba por arquivo)
│   └── img/                ← vitral, cálice, pomba e ícones do app
├── manifest.webmanifest    ← permite instalar no celular
├── sw.js                   ← faz o app abrir rápido e com internet fraca
├── publicar.sh             ← envia as mudanças para o GitHub
└── abrir-local.sh          ← abre o site no seu computador para testar
```

---

## Primeira publicação (uma vez só)

1. **Crie o repositório no GitHub.** Entre em <https://github.com/new>, dê o nome `escala-ministros`, deixe **Public** e **não** marque nenhuma opção de criar arquivos. Clique em *Create repository*.
2. **Envie esta pasta.** No terminal, dentro desta pasta, rode:
   ```bash
   bash publicar.sh "Primeira versão"
   ```
   Na primeira vez ele pergunta o endereço do repositório. Cole o que o GitHub mostrou, por exemplo `https://github.com/Elton-Miranda/escala-ministros.git`.
3. **Ligue o GitHub Pages.** No repositório, vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e clique em *Save*.
4. Em 1 ou 2 minutos o site estará em `https://SEU-USUARIO.github.io/escala-ministros/`.
   - Ministros: `https://SEU-USUARIO.github.io/escala-ministros/`
   - Coordenador: `https://SEU-USUARIO.github.io/escala-ministros/coordenador.html`
5. **Conecte o botão Publicar.** Abra o painel, vá em **Ajustes → Publicação** e siga o passo a passo para criar a chave de acesso (token). Depois disso, publicar é um clique.

---

## Uso no dia a dia (coordenador)

1. Abra o **painel do coordenador**.
2. Na aba **Escala do mês**, vá para o mês desejado e toque em **Montar a escala**.
3. Confira. Missas com borda laranja precisam de atenção: abra e toque em **Completar automaticamente**, ou adicione alguém à mão.
4. Toque em **Publicar** no alto da tela. Em 1 a 2 minutos os ministros veem a escala nova.
5. Na véspera de cada missa, use a aba **Lembretes** para mandar a mensagem de WhatsApp a cada ministro.

Enquanto você não publica, as mudanças ficam guardadas só no seu navegador, e nada se perde se você fechar a página.

---

## Privacidade: o que fica público e o que não fica

- `data/dados.json` é **público**, porque o site precisa dele: nomes, escalas e o WhatsApp do coordenador (se você preencher).
- **Telefones dos ministros NÃO são publicados.** Eles ficam só no navegador do coordenador. Use **Ajustes → Cópia de segurança** para guardar uma cópia com os telefones.
- O campo **Observações** da ficha vai junto com a escala publicada. Não escreva informações de saúde ou pessoais ali.
- Qualquer pessoa pode abrir o `coordenador.html`, mas **ninguém consegue publicar sem a chave de acesso**, que fica só no seu computador.

---

## Testar no computador

**No VS Code (mais fácil):** abra esta pasta em *Arquivo → Abrir Pasta*. O VS Code vai sugerir a extensão **Live Server**; instale. Depois clique com o botão direito em `index.html` (ou `coordenador.html`) e escolha **Open with Live Server**. O navegador abre em `http://127.0.0.1:5500` e atualiza sozinho a cada mudança.

**Pelo terminal:**

Os navegadores bloqueiam páginas abertas com dois cliques no arquivo. Para testar antes de publicar:

```bash
bash abrir-local.sh
```

Isso abre `http://localhost:8000` no navegador. Para parar, feche o terminal ou aperte `Ctrl+C`.

---

## Com o Claude Code

O arquivo `CLAUDE.md` explica o projeto para o Claude Code. Abra o terminal nesta pasta, rode `claude` e peça, por exemplo:

- “publique as mudanças no GitHub”
- “adicione a missa de Finados no dia 2 de novembro às 8h na Casa de Maria”
- “mude o mínimo da missa de domingo 18h para 24”
