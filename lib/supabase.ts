import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// 🔍 BUILD DEBUG: Log das variáveis durante o build (REMOVER APÓS TESTE)
console.log('🔍 SUPABASE INIT - URL:', supabaseUrl);
console.log('🔍 SUPABASE INIT - Key (first 20):', supabaseAnonKey?.substring(0, 20) + '...');
console.log('🔍 SUPABASE INIT - Projeto esperado: rwyyvilshrjhfwlzudqg');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit', // Isso desativa o PKCE direto no código
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
