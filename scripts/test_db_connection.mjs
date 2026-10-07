import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yitrzhnxpwunkywatiqu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdHJ6aG54cHd1bmt5d2F0aXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzkxMzAsImV4cCI6MjEwNDcxNTEzMH0.kxAhS4vT67GWFY41GCWCRBI8l2G_FFIdmfx_iCiGu6Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Testing Supabase queries...');
  const tables = ['students_master', 'teachers_master', 'departments', 'branches', 'subjects', 'teacher_subjects', 'timetable', 'attendance', 'sessional_results', 'grades', 'syllabus', 'pyqs', 'import_jobs'];
  for (const t of tables) {
    const { data, count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${t}: Error -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table ${t}: OK (count: ${count})`);
    }
  }
}

check().catch(console.error);
