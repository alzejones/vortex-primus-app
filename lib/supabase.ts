import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgeezszpcuypqujplkde.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZWV6c3pwY3V5cHF1anBsa2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjU5OTYsImV4cCI6MjA4NDUwMTk5Nn0.OLdh9gNyaz8x2c9-QXpqE5FH2r0-8r54vyvhWjowwJo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit', // Isso desativa o PKCE direto no código
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
