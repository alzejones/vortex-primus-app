-- Tabela de suplementos
CREATE TABLE IF NOT EXISTS supplements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand          text NOT NULL DEFAULT 'Herbalife',
  sku            text,
  name           text NOT NULL,
  serving_size_g numeric NOT NULL,
  calories       numeric,
  protein_g      numeric,
  carbs_g        numeric,
  fat_g          numeric,
  fiber_g        numeric,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplements_select" ON supplements
  FOR SELECT USING (true);

-- Seed: produtos Herbalife com dados completos verificados
INSERT INTO supplements (brand, sku, name, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, notes) VALUES
  ('Herbalife', '0940/0951/0953/3144/326K/249K/295K/0930/439K/447K', 'Shake Fórmula 1 (todos sabores)', 26, 83, 9, 8.1, 1.9, 1.3, 'Pó puro (26g). Preparado com NutreV: ~206kcal, 19g prot.'),
  ('Herbalife', '0242/0246', 'Protein Powder', 6, 22, 5, 0, 0, 0, 'Não contém quantidade significativa de carboidratos, gorduras ou fibras.'),
  ('Herbalife', '147K', 'Whey Protein 3W Chocolate', 34, 128, 25, 3.3, 1.6, 0.7, 'Blend whey isolado + concentrado + hidrolisado.'),
  ('Herbalife', '191K', 'Whey Protein 3W Baunilha', 34, 137, 26, 3, 1.6, 0.7, 'Blend whey isolado + concentrado + hidrolisado.'),
  ('Herbalife', '1639', 'NutreV', 32, 112, 9.3, 15, 1.2, 3.6, 'Alternativa vegetal ao leite. Zero lactose.'),
  ('Herbalife', '214K', 'Barra de Proteína Vanilla Almond', 35, 136, 12, 15, 3.7, 5, '1 barra = 35g. Contém glúten e lactose.'),
  ('Herbalife', '0031', 'Barra de Proteína Citrus Lemon', 35, 134, 9.9, 15, 3.8, 0, '1 barra = 35g. Contém glúten.');