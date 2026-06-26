-- Permite leitura pública das tabelas de condicionamento (tela pública do aluno)
CREATE POLICY "public_read_conditioning_tests"
  ON conditioning_tests FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "public_read_strength_tests"
  ON strength_tests FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "public_read_endurance_tests"
  ON endurance_tests FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "public_read_mobility_tests"
  ON mobility_tests FOR SELECT
  TO anon
  USING (true);
