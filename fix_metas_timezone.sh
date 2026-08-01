#!/bin/bash
set -e

FILE="components/business/MetasContent.tsx"

if [ ! -f "$FILE" ]; then
  echo "Arquivo não encontrado em $FILE — ajuste o caminho e rode de novo."
  exit 1
fi

python3 - "$FILE" <<'PYEOF'
import sys, re

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_agendamentos = ".gte('created_at', start + 'T00:00:00').lte('created_at', end + 'T23:59:59');\n      return count || 0;\n    }\n    case 'avaliacoes'"
new_agendamentos = ".gte('created_at', start + 'T00:00:00-03:00').lte('created_at', end + 'T23:59:59-03:00');\n      return count || 0;\n    }\n    case 'avaliacoes'"

old_novos = ".gte('created_at', start + 'T00:00:00').lte('created_at', end + 'T23:59:59');\n      return count || 0;\n    }\n    case 'clientes_repetidores'"
new_novos = ".gte('created_at', start + 'T00:00:00-03:00').lte('created_at', end + 'T23:59:59-03:00');\n      return count || 0;\n    }\n    case 'clientes_repetidores'"

if old_agendamentos not in content:
    print("AVISO: bloco 'agendamentos' não encontrado exatamente como esperado — confira manualmente.")
else:
    content = content.replace(old_agendamentos, new_agendamentos)
    print("OK: agendamentos corrigido.")

if old_novos not in content:
    print("AVISO: bloco 'novos_clientes' não encontrado exatamente como esperado — confira manualmente.")
else:
    content = content.replace(old_novos, new_novos)
    print("OK: novos_clientes corrigido.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF

echo "--- diff ---"
git diff -- "$FILE"

git add "$FILE"
git commit -m "fix: corrige timezone (UTC->BRT) em agendamentos e novos_clientes no MetasContent"
git push

echo "Pronto. Deploy automático via Vercel deve iniciar em seguida."
