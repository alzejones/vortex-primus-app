#!/bin/bash

# Backup completo do banco de dados Vortex Primus
# Projeto: rwyyvilshrjhfwlzudqg
# Data: $(date +%Y-%m-%d)

set -e

BACKUP_DIR="/home/p/vortex-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vortex_backup_$TIMESTAMP.sql"
SUPABASE_DB_PASSWORD="stcvip01vortex"
DB_HOST="db.rwyyvilshrjhfwlzudqg.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "Vortex Primus - Backup Completo"
echo "=========================================="
echo "Timestamp: $TIMESTAMP"
echo "Destino: $BACKUP_FILE"
echo ""

echo "[1/4] Exportando schema e dados..."
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --schema=public \
  --no-owner \
  --no-acl \
  --format=plain \
  --file="$BACKUP_FILE"

echo "[2/4] Compactando backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "[3/4] Gerando metadados..."
METADATA_FILE="$BACKUP_DIR/vortex_backup_${TIMESTAMP}_metadata.txt"
cat > "$METADATA_FILE" <<EOF
Vortex Primus - Backup Completo
================================
Data: $(date)
Projeto Supabase: rwyyvilshrjhfwlzudqg
Host: $DB_HOST
Database: $DB_NAME

Arquivo: $(basename $BACKUP_FILE)
Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)

Tabelas incluídas:
------------------
EOF

PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -t -A -F $'\t' \
  -c "SELECT 
    table_name, 
    pg_size_pretty(pg_total_relation_size('public.' || table_name)) as size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=t.table_name) as columns
  FROM information_schema.tables t
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  ORDER BY table_name;" \
  >> "$METADATA_FILE"

echo "" >> "$METADATA_FILE"
echo "Views incluídas:" >> "$METADATA_FILE"
echo "----------------" >> "$METADATA_FILE"

PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -t -A -F $'\t' \
  -c "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name;" \
  >> "$METADATA_FILE"

echo "" >> "$METADATA_FILE"
echo "Funções incluídas:" >> "$METADATA_FILE"
echo "------------------" >> "$METADATA_FILE"

PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -t -A -F $'\t' \
  -c "SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;" \
  >> "$METADATA_FILE"

echo "[4/5] Limpando backups antigos (mantendo últimos 30 dias)..."
find "$BACKUP_DIR" -name "vortex_backup_*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "vortex_backup_*_metadata.txt" -mtime +30 -delete

echo "[5/5] Enviando para Google Drive (myboxiraja@gmail.com)..."
if rclone copy "$BACKUP_FILE" gdrive-vortex:Vortex-Backups 2>&1; then
  echo "✓ Backup (.sql.gz) enviado para Google Drive"
else
  echo "⚠ ERRO: Falha ao enviar backup (.sql.gz) para Google Drive - backup local mantido" >&2
fi

if rclone copy "$METADATA_FILE" gdrive-vortex:Vortex-Backups 2>&1; then
  echo "✓ Metadados (.txt) enviados para Google Drive"
else
  echo "⚠ ERRO: Falha ao enviar metadados (.txt) para Google Drive - backup local mantido" >&2
fi

echo ""
echo "=========================================="
echo "Backup concluído com sucesso!"
echo "=========================================="
echo "Arquivo: $BACKUP_FILE"
echo "Metadados: $METADATA_FILE"
echo "Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
echo "Para restaurar:"
echo "gunzip -c $BACKUP_FILE | PGPASSWORD=stcvip01vortex psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo ""
