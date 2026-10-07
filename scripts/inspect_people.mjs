import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yitrzhnxpwunkywatiqu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdHJ6aG54cHd1bmt5d2F0aXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzkxMzAsImV4cCI6MjEwNDcxNTEzMH0.kxAhS4vT67GWFY41GCWCRBI8l2G_FFIdmfx_iCiGu6Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectPeople() {
  const { data: teachers } = await supabase.from('teachers_master').select('id, faculty_id, name, department, role');
  console.log('Teachers:', teachers);

  const { data: students } = await supabase.from('students_master').select('id, roll_no, name, branch, semester, section').limit(5);
  console.log('Sample Students:', students);
}

inspectPeople().catch(console.error);
