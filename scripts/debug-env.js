#!/usr/bin/env node

console.log('🔍 ===== VERCEL BUILD ENV DEBUG =====');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('🔍 EXPO_PUBLIC_SUPABASE_ANON_KEY (first 20 chars):', 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 
    'UNDEFINED'
);
console.log('🔍 All EXPO_PUBLIC vars:');
Object.keys(process.env)
    .filter(key => key.startsWith('EXPO_PUBLIC_'))
    .forEach(key => {
        const value = process.env[key];
        if (key.includes('KEY') || key.includes('SECRET')) {
            console.log(`🔍   ${key}: ${value ? value.substring(0, 20) + '...' : 'UNDEFINED'}`);
        } else {
            console.log(`🔍   ${key}: ${value || 'UNDEFINED'}`);
        }
    });
console.log('🔍 ===== END DEBUG =====');