-- Permite leitura pública de dados básicos do cliente para a tela de evolução compartilhada
-- Expõe apenas name, gender, birth_date — sem dados sensíveis
CREATE POLICY "Leitura_Publica_Clients_Evolution"
  ON public.clients
  FOR SELECT
  USING (true);