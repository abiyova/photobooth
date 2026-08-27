import { createClient } from '@supabase/supabase-js';

// TODO: Ganti placeholder ini dengan URL dan ANON KEY dari Supabase Dashboard Anda.
// (Project Settings -> API)
const supabaseUrl = 'https://ujjiztxkaqsrlsnrwxzj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqaml6dHhrYXFzcmxzbnJ3eHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzE5MzIsImV4cCI6MjEwMDMwNzkzMn0.N60ap2aLIGwi5XBnfPdJ_kcbhTzYaSGeEf5my5KJ-f0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
