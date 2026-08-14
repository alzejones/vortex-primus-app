#!/bin/bash

# Script de teste de restore do backup do Vortex Primus
# Executa restore em banco local temporário e valida integridade

set -e

BACKUP_DIR="/home/p/vortex-backups"
REPORT_FILE="$BACKUP_DIR/restore-test-report-$(date +%Y%m%d).txt"
TEST_DB="vortex_restore_test"
PGUSER="${USER}"

echo "==========================================" | tee "$REPORT_FILE"
echo "Vortex Primus - Teste de Restore" | tee -a "$REPORT_FILE"
echo "==========================================" | tee -a "$REPORT_FILE"
echo "Data: $(date)" | tee -a "$REPORT_FILE"
echo "Banco de teste: $TEST_DB" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# [1/6] Encontrar backup mais recente
echo "[1/6] Procurando backup mais recente..." | tee -a "$REPORT_FILE"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/vortex_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ ERRO: Nenhum backup encontrado em $BACKUP_DIR" | tee -a "$REPORT_FILE"
  exit 1
fi

echo "✓ Backup encontrado: $(basename $LATEST_BACKUP)" | tee -a "$REPORT_FILE"
echo "  Tamanho: $(du -h "$LATEST_BACKUP" | cut -f1)" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# [2/6] Criar banco de teste
echo "[2/6] Criando banco de teste temporário..." | tee -a "$REPORT_FILE"

# Remover banco de teste se já existir (de execução anterior interrompida)
psql -U "$PGUSER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null || true

psql -U "$PGUSER" -d postgres -c "CREATE DATABASE $TEST_DB;" | tee -a "$REPORT_FILE"
echo "✓ Banco $TEST_DB criado" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# [3/6] Restaurar backup
echo "[3/6] Restaurando backup no banco de teste..." | tee -a "$REPORT_FILE"
gunzip -c "$LATEST_BACKUP" | psql -U "$PGUSER" -d "$TEST_DB" -q 2>&1 | tee -a "$REPORT_FILE"
echo "✓ Restore concluído" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# [4/6] Verificações de integridade
echo "[4/6] Verificando integridade do restore..." | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Contagem de tabelas base
echo ">> Tabelas base (schema public):" | tee -a "$REPORT_FILE"
TABLE_COUNT=$(psql -U "$PGUSER" -d "$TEST_DB" -t -A -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
")
echo "   Total: $TABLE_COUNT tabelas" | tee -a "$REPORT_FILE"

if [ "$TABLE_COUNT" -ge 33 ]; then
  echo "   ✓ Contagem OK (esperado >= 33)" | tee -a "$REPORT_FILE"
else
  echo "   ⚠ ATENÇÃO: Esperado >= 33 tabelas, encontrado $TABLE_COUNT" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

# Listar todas as tabelas com contagem de linhas
echo ">> Contagem de registros por tabela:" | tee -a "$REPORT_FILE"
psql -U "$PGUSER" -d "$TEST_DB" -t -A -F $'\t' -c "
  SELECT 
    table_name,
    (xpath('/row/c/text()', 
      query_to_xml(format('select count(*) as c from %I.%I', 'public', table_name), false, true, ''))
    )[1]::text::int AS row_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  ORDER BY table_name;
" | while IFS=$'\t' read -r table_name row_count; do
  printf "   %-30s %s linhas\n" "$table_name" "$row_count" | tee -a "$REPORT_FILE"
done
echo "" | tee -a "$REPORT_FILE"

# Verificar RLS policies
echo ">> Row Level Security (RLS):" | tee -a "$REPORT_FILE"
RLS_COUNT=$(psql -U "$PGUSER" -d "$TEST_DB" -t -A -c "
  SELECT COUNT(*) 
  FROM pg_policies 
  WHERE schemaname = 'public';
")
echo "   Total de policies: $RLS_COUNT" | tee -a "$REPORT_FILE"

if [ "$RLS_COUNT" -gt 0 ]; then
  echo "   ✓ RLS policies restauradas" | tee -a "$REPORT_FILE"
else
  echo "   ⚠ ATENÇÃO: Nenhuma RLS policy encontrada" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

# Listar policies por tabela
echo ">> Policies por tabela:" | tee -a "$REPORT_FILE"
psql -U "$PGUSER" -d "$TEST_DB" -t -A -F $'\t' -c "
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY tablename;
" | while IFS=$'\t' read -r table_name policy_count; do
  printf "   %-30s %s policies\n" "$table_name" "$policy_count" | tee -a "$REPORT_FILE"
done
echo "" | tee -a "$REPORT_FILE"

# Verificar funções PL/pgSQL
echo ">> Funções PL/pgSQL:" | tee -a "$REPORT_FILE"
FUNCTION_COUNT=$(psql -U "$PGUSER" -d "$TEST_DB" -t -A -c "
  SELECT COUNT(*) 
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.prokind = 'f';
")
echo "   Total de funções: $FUNCTION_COUNT" | tee -a "$REPORT_FILE"

if [ "$FUNCTION_COUNT" -ge 13 ]; then
  echo "   ✓ Funções restauradas (esperado >= 13)" | tee -a "$REPORT_FILE"
else
  echo "   ⚠ ATENÇÃO: Esperado >= 13 funções, encontrado $FUNCTION_COUNT" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

# Listar funções
echo ">> Lista de funções:" | tee -a "$REPORT_FILE"
psql -U "$PGUSER" -d "$TEST_DB" -t -A -c "
  SELECT proname
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.prokind = 'f'
  ORDER BY proname;
" | while read -r func_name; do
  echo "   - $func_name" | tee -a "$REPORT_FILE"
done
echo "" | tee -a "$REPORT_FILE"

# Verificar views
echo ">> Views:" | tee -a "$REPORT_FILE"
VIEW_COUNT=$(psql -U "$PGUSER" -d "$TEST_DB" -t -A -c "
  SELECT COUNT(*) 
  FROM information_schema.views 
  WHERE table_schema = 'public';
")
echo "   Total de views: $VIEW_COUNT" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# [5/6] Resultado final
echo "[5/6] Resultado da validação:" | tee -a "$REPORT_FILE"
ERRORS=0

if [ "$TABLE_COUNT" -lt 33 ]; then
  echo "   ❌ Contagem de tabelas abaixo do esperado" | tee -a "$REPORT_FILE"
  ERRORS=$((ERRORS + 1))
fi

if [ "$RLS_COUNT" -eq 0 ]; then
  echo "   ⚠ Nenhuma RLS policy encontrada" | tee -a "$REPORT_FILE"
  ERRORS=$((ERRORS + 1))
fi

if [ "$FUNCTION_COUNT" -lt 13 ]; then
  echo "   ❌ Contagem de funções abaixo do esperado" | tee -a "$REPORT_FILE"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -eq 0 ]; then
  echo "   ✅ TESTE PASSOU: Backup restaurado com sucesso!" | tee -a "$REPORT_FILE"
else
  echo "   ⚠ TESTE PARCIAL: $ERRORS validações falharam" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

# [6/6] Limpar banco de teste
echo "[6/6] Limpando banco de teste..." | tee -a "$REPORT_FILE"
psql -U "$PGUSER" -d postgres -c "DROP DATABASE $TEST_DB;" | tee -a "$REPORT_FILE"
echo "✓ Banco $TEST_DB removido" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

echo "==========================================" | tee -a "$REPORT_FILE"
echo "Teste de restore concluído!" | tee -a "$REPORT_FILE"
echo "==========================================" | tee -a "$REPORT_FILE"
echo "Relatório salvo em: $REPORT_FILE" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
