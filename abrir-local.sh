#!/usr/bin/env bash
# Abre o site no seu computador para testar: http://localhost:8000
cd "$(dirname "$0")"
PORTA=8000
echo "Site dos ministros:    http://localhost:$PORTA/"
echo "Painel do coordenador: http://localhost:$PORTA/coordenador.html"
echo "Para parar, aperte Ctrl+C."
( sleep 1; xdg-open "http://localhost:$PORTA/coordenador.html" >/dev/null 2>&1 || open "http://localhost:$PORTA/coordenador.html" >/dev/null 2>&1 ) &
python3 -m http.server "$PORTA"
