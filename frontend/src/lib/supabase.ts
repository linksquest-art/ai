import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fkqhbfahipuqhknwvvat.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcWhiZmFoaXB1cWhrbnd2dmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTg4NjAsImV4cCI6MjA5ODkzNDg2MH0.rszShYkaCi_BDihlSO1iiLRES30mmDIRbXdphyyzO5Y';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
