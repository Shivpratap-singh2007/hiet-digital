import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yitrzhnxpwunkywatiqu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdHJ6aG54cHd1bmt5d2F0aXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzkxMzAsImV4cCI6MjEwNDcxNTEzMH0.kxAhS4vT67GWFY41GCWCRBI8l2G_FFIdmfx_iCiGu6Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, name, email, role');
  console.log('Profiles:', profiles, pErr);

  const { data: depts } = await supabase.from('departments').select('*');
  console.log('Departments:', depts);

  const { data: branches } = await supabase.from('branches').select('*');
  console.log('Branches:', branches);

  const { data: subjs } = await supabase.from('subjects').select('*');
  console.log('Subjects:', subjs);
}

inspect().catch(console.error);
