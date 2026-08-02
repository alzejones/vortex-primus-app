#!/bin/bash

# Script para fazer deploy da Edge Function import-fineshape
# Uso: ./deploy-import-fineshape.sh <SUPABASE_ACCESS_TOKEN>

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Token de acesso não fornecido"
  echo ""
  echo "Uso: ./deploy-import-fineshape.sh <SUPABASE_ACCESS_TOKEN>"
  echo ""
  echo "Para obter o token:"
  echo "1. Acesse https://supabase.com/dashboard/account/tokens"
  echo "2. Gere um novo token se necessário"
  echo "3. Execute: ./deploy-import-fineshape.sh seu_token_aqui"
  echo ""
  echo "OU faça deploy manual pelo dashboard:"
  echo "https://supabase.com/dashboard/project/rwyyvilshrjhfwlzudqg/functions"
  exit 1
fi

ACCESS_TOKEN="$1"
PROJECT_REF="rwyyvilshrjhfwlzudqg"
FUNCTION_NAME="import-fineshape"
FUNCTION_DIR="supabase/functions/${FUNCTION_NAME}"

echo "📦 Preparando deploy da função ${FUNCTION_NAME}..."

if [ ! -d "$FUNCTION_DIR" ]; then
  echo "❌ Erro: Diretório ${FUNCTION_DIR} não encontrado"
  exit 1
fi

cd "$FUNCTION_DIR"

echo "📝 Criando pacote..."
tar -czf /tmp/${FUNCTION_NAME}.tar.gz .

echo "🚀 Fazendo deploy via API Supabase Management..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/x-tar" \
  --data-binary "@/tmp/${FUNCTION_NAME}.tar.gz")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

rm /tmp/${FUNCTION_NAME}.tar.gz

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Deploy realizado com sucesso!"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Erro no deploy (HTTP ${HTTP_CODE})"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  exit 1
fi
