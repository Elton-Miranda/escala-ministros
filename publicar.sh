#!/usr/bin/env bash
# Envia as mudanças desta pasta para o GitHub (o GitHub Pages atualiza o site em 1 a 2 minutos).
# Uso: bash publicar.sh "mensagem opcional"
set -e
cd "$(dirname "$0")"

if [ ! -d .git ]; then
  git init -b main >/dev/null
  echo "✔ Pasta preparada para o Git."
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Cole o endereço do repositório do GitHub"
  echo "(exemplo: https://github.com/SEU-USUARIO/escala-ministros.git) e aperte Enter:"
  read -r URL
  git remote add origin "$URL"
fi

# Traz o que o painel do coordenador publicou, para não apagar nada.
git pull --rebase origin main 2>/dev/null || true

git add -A
if git diff --cached --quiet; then
  echo "Nada novo para publicar."
else
  git commit -m "${1:-Atualiza a escala dos ministros}" >/dev/null
  echo "✔ Mudanças registradas."
fi

git push -u origin main
echo "✔ Enviado. O site atualiza em 1 a 2 minutos."
