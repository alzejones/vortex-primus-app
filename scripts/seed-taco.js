/**
 * seed-taco.js — Popula a tabela `foods` com os dados da TACO 4ª edição (UNICAMP)
 *
 * Pré-requisitos:
 *   SUPABASE_URL=https://qgeezszpcuypqujplkde.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<sua service role key>
 *
 * Execução:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/seed-taco.js
 */

const https = require("https");
const { createClient } = require("@supabase/supabase-js");

// ------------------------------------------------------------
// Configuração
// ------------------------------------------------------------
const SUPABASE_URL = "https://qgeezszpcuypqujplkde.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "\n[ERRO] SUPABASE_SERVICE_ROLE_KEY não definida.\n" +
    "Execute assim:\n" +
    "  SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/seed-taco.js\n" +
    "\nEncontre a chave em: Supabase Dashboard > Project Settings > API > service_role\n"
  );
  process.exit(1);
}

// Fonte primária: JSON verificado (marcelosanto/tabela_taco)
const TACO_JSON_URL =
  "https://raw.githubusercontent.com/marcelosanto/tabela_taco/main/TACO.json";
// Fontes CSV de fallback
const TACO_CSV_URLS = [
  "https://raw.githubusercontent.com/jpedroschmitz/taco/main/taco.csv",
  "https://raw.githubusercontent.com/danperrout/tabelataco/master/taco.csv",
];

const BATCH_SIZE = 50;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ------------------------------------------------------------
// Download do CSV (tenta URLs em sequência)
// ------------------------------------------------------------
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function downloadWithFallback() {
  // 1. Tenta JSON primário (fonte verificada)
  console.log(`Tentando JSON: ${TACO_JSON_URL}`);
  try {
    const text = await fetchURL(TACO_JSON_URL);
    console.log("  Download OK.\n");
    return { type: "json", data: text };
  } catch (err) {
    console.log(`  Falhou: ${err.message}`);
  }
  // 2. Tenta CSVs de fallback
  for (const url of TACO_CSV_URLS) {
    console.log(`Tentando CSV: ${url}`);
    try {
      const text = await fetchURL(url);
      console.log("  Download OK.\n");
      return { type: "csv", data: text };
    } catch (err) {
      console.log(`  Falhou: ${err.message}`);
    }
  }
  throw new Error("Todas as fontes falharam. Use um arquivo local: node scripts/seed-taco.js ./taco.csv");
}

// ------------------------------------------------------------
// Parser CSV simples (suporta aspas e vírgulas internas)
// ------------------------------------------------------------
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim().replace(/^"|"$/g, "")] = (values[i] || "").trim().replace(/^"|"$/g, "");
    });
    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ------------------------------------------------------------
// Mapeamento de colunas TACO → schema foods
// Aceita variações de nome encontradas em diferentes fontes do CSV
// ------------------------------------------------------------
function toFloat(val) {
  if (!val || val === "NA" || val === "*" || val === "") return null;
  // Substitui vírgula decimal por ponto
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : parseFloat(n.toFixed(1));
}

function mapRow(row, index) {
  // Número sequencial: coluna "Número" ou índice + 1
  const taco_id =
    parseInt(row["Número"] || row["numero"] || row["id"] || String(index + 1), 10) || index + 1;

  // Nome do alimento
  const name =
    row["Alimento"] || row["alimento"] || row["Descrição"] || row["descricao"] || "";

  if (!name) return null;

  return {
    taco_id,
    name,
    energy_kcal: toFloat(row["Energia(kcal)"] || row["Energia (kcal)"] || row["energia_kcal"] || row["kcal"]),
    protein:     toFloat(row["Proteína(g)"]   || row["Proteína (g)"]   || row["proteina"]   || row["protein"]),
    carbs:       toFloat(row["Carboidrato(g)"] || row["Carboidrato (g)"] || row["carboidrato"] || row["carbs"]),
    fat:         toFloat(row["Lipídeos(g)"]   || row["Lipídeos (g)"]   || row["lipideos"]   || row["fat"]),
    fiber:       toFloat(row["Fibra alimentar(g)"] || row["Fibra alimentar (g)"] || row["fibra"] || row["fiber"]),
    sodium:      toFloat(row["Sódio(mg)"]     || row["Sódio (mg)"]     || row["sodio"]      || row["sodium"]),
    calcium:     toFloat(row["Cálcio(mg)"]    || row["Cálcio (mg)"]    || row["calcio"]     || row["calcium"]),
    iron:        toFloat(row["Ferro(mg)"]     || row["Ferro (mg)"]     || row["ferro"]      || row["iron"]),
  };
}

// ------------------------------------------------------------
// Inserção em lotes
// ------------------------------------------------------------
async function insertBatch(rows, batchNum, total) {
  const { error } = await supabase.from("foods").upsert(rows, {
    onConflict: "taco_id",
    ignoreDuplicates: false,
  });
  if (error) throw new Error(`Erro no lote ${batchNum}: ${error.message}`);
  const start = (batchNum - 1) * BATCH_SIZE + 1;
  const end = Math.min(batchNum * BATCH_SIZE, total);
  console.log(`  Lote ${batchNum}: registros ${start}–${end} inseridos.`);
}

// ------------------------------------------------------------
// Mapeamento do JSON TACO (marcelosanto/tabela_taco) → schema foods
// Chaves verificadas: id, description, energy_kcal, protein_g,
//   carbohydrate_g, lipid_g, fiber_g, sodium_mg, calcium_mg, iron_mg
// ------------------------------------------------------------
function mapJSONItems(items) {
  return items
    .map((item, index) => {
      const name = item.description || item.name || item.alimento || "";
      if (!name) return null;
      return {
        taco_id:     item.id || index + 1,
        name,
        energy_kcal: toFloat(String(item.energy_kcal  ?? "")),
        protein:     toFloat(String(item.protein_g     ?? item.protein    ?? "")),
        carbs:       toFloat(String(item.carbohydrate_g ?? item.carbs     ?? "")),
        fat:         toFloat(String(item.lipid_g       ?? item.fat        ?? "")),
        fiber:       toFloat(String(item.fiber_g       ?? item.fiber      ?? "")),
        sodium:      toFloat(String(item.sodium_mg     ?? item.sodium     ?? "")),
        calcium:     toFloat(String(item.calcium_mg    ?? item.calcium    ?? "")),
        iron:        toFloat(String(item.iron_mg       ?? item.iron       ?? "")),
      };
    })
    .filter(Boolean);
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
async function main() {
  console.log("\n=== Seed TACO 4ª edição ===\n");

  // Suporte a arquivo local passado como argumento
  // (node scripts/seed-taco.js ./taco.csv)
  let mapped;
  if (process.argv[2]) {
    const fs = require("fs");
    const rawText = fs.readFileSync(process.argv[2], "utf-8");
    console.log(`Usando arquivo local: ${process.argv[2]}\n`);
    const rows = parseCSV(rawText);
    mapped = rows.map((r, i) => mapRow(r, i)).filter(Boolean);
  } else {
    // 1. Download automático com fallback
    let result;
    try {
      result = await downloadWithFallback();
    } catch (err) {
      console.error("\n[ERRO]", err.message);
      process.exit(1);
    }

    // 2. Parse conforme a fonte
    if (result.type === "json") {
      const json = JSON.parse(result.data);
      const items = Array.isArray(json) ? json : json.foods || json.data || [];
      console.log(`Total de itens no JSON: ${items.length}`);
      mapped = mapJSONItems(items);
    } else {
      const rows = parseCSV(result.data);
      console.log(`Total de linhas no CSV: ${rows.length}`);
      mapped = rows.map((r, i) => mapRow(r, i)).filter(Boolean);
    }
  }

  console.log(`Registros válidos para inserção: ${mapped.length}\n`);

  if (mapped.length === 0) {
    console.error("[ERRO] Nenhum registro foi mapeado. Verifique o formato da fonte de dados.");
    process.exit(1);
  }

  // 3. Inserção em lotes de BATCH_SIZE
  const totalBatches = Math.ceil(mapped.length / BATCH_SIZE);
  for (let i = 0; i < totalBatches; i++) {
    const batch = mapped.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    await insertBatch(batch, i + 1, mapped.length);
  }

  console.log(`\n✔ Seed concluído: ${mapped.length} alimentos inseridos na tabela foods.\n`);
}

main().catch((err) => {
  console.error("\n[ERRO FATAL]", err.message);
  process.exit(1);
});
