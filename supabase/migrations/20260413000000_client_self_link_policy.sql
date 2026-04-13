-- ============================================================
-- FIX BUG 3: RLS policy para vínculo clients.user_id no aceite do convite
-- ============================================================
--
-- Problema: o trigger link_client_user_id() roda em contexto de trigger
-- (sem JWT), portanto auth.uid() = NULL e a RLS bloqueia o UPDATE em clients.
-- O EXCEPTION WHEN OTHERS engolia o erro silenciosamente.
--
-- Solução: o set-password.tsx faz o UPDATE diretamente após verifyOtp retornar
-- sucesso, enquanto a sessão do aluno está ativa (auth.uid() = user.id correto).
-- Esta policy autoriza esse UPDATE pontual de forma segura:
--   • USING (user_id IS NULL)       → só em linhas ainda não vinculadas
--   • WITH CHECK (user_id = auth.uid()) → só pode setar o próprio auth.uid()

CREATE POLICY "client_self_link_on_invite" ON public.clients
  FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (user_id = auth.uid());
