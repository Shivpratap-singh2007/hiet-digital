// =============================================================================
// HIET DIGITAL CAMPUS — ADMINISTRATIVE DEMO SEED SCRIPT
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Runs server-side with SUPABASE_SERVICE_ROLE_KEY
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_USERS = [
  { role: 'student', email: 'student.cse01@hiet.demo', name: 'Aditya Nanda', identifier: 'HIET-CSE-2026-001' },
  { role: 'faculty', email: 'faculty.cse01@hiet.demo', name: 'Dr. Anuj Sharma', identifier: 'HIET-FAC-CSE-001' },
  { role: 'hod', email: 'hod.cse@hiet.demo', name: 'Dr. Anuj Sharma (HOD)', identifier: 'HIET-HOD-CSE-001' },
  { role: 'principal', email: 'principal@hiet.demo', name: 'Dr. Rajesh Kumar', identifier: 'HIET-PRI-001' },
  { role: 'managing_director', email: 'md@hiet.demo', name: 'Mr. R. K. Sharma', identifier: 'HIET-MD-001' },
  { role: 'security', email: 'security@hiet.demo', name: 'Ramesh Thakur', identifier: 'HIET-SEC-001' },
  { role: 'warden', email: 'warden@hiet.demo', name: 'Ms. Neha Verma', identifier: 'HIET-WAR-001' },
  { role: 'library_staff', email: 'library@hiet.demo', name: 'Sunita Devi', identifier: 'HIET-LIB-001' },
  { role: 'lab_staff', email: 'lab@hiet.demo', name: 'Mohit Kumar', identifier: 'HIET-LAB-001' },
  { role: 'it_staff', email: 'it@hiet.demo', name: 'Vikram Singh', identifier: 'HIET-IT-001' }
];

const DEFAULT_PASSWORD = 'Hiet@12345';

async function seedDemoUsers() {
  console.log('--- Seeding HIET Digital Campus Demo Users ---');
  for (const u of DEMO_USERS) {
    try {
      // 1. Create or retrieve auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: u.name, role: u.role, identifier: u.identifier, demo: true }
      });

      let authUserId: string;
      if (authErr) {
        if (authErr.message.includes('already exists') || authErr.message.includes('duplicate')) {
          console.log(`User ${u.email} exists in auth. Fetching ID...`);
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existing = listData?.users.find(usr => usr.email === u.email);
          if (!existing) {
            console.warn(`Could not locate existing auth user for ${u.email}`);
            continue;
          }
          authUserId = existing.id;
        } else {
          console.error(`Auth creation failed for ${u.email}:`, authErr.message);
          continue;
        }
      } else {
        authUserId = authData.user.id;
        console.log(`Created auth account: ${u.email} (${authUserId})`);
      }

      // 2. Upsert in public.users
      const { data: userRec, error: userErr } = await supabase
        .from('users')
        .upsert({
          supabase_auth_id: authUserId,
          email: u.email,
          role: u.role,
          is_active: true
        }, { onConflict: 'email' })
        .select()
        .single();

      if (userErr) {
        console.error(`Upsert public.users failed for ${u.email}:`, userErr.message);
        continue;
      }

      // 3. Insert role master record if student or faculty/hod
      if (u.role === 'student') {
        await supabase.from('students_master').upsert({
          user_id: userRec.id,
          roll_no: u.identifier,
          name: u.name,
          full_name: u.name,
          course: 'B.Tech',
          department: 'CSE',
          branch: 'CSE',
          semester: 1,
          section: 'A',
          college_email: u.email,
          phone: '+91 98160 44001',
          cgpa: 8.24,
          sgpa: 8.18,
          status: 'active'
        }, { onConflict: 'roll_no' });
      } else if (u.role === 'faculty' || u.role === 'hod') {
        await supabase.from('teachers_master').upsert({
          user_id: userRec.id,
          faculty_id: u.identifier,
          name: u.name,
          full_name: u.name,
          department: 'CSE',
          designation: u.role === 'hod' ? 'Professor & HOD' : 'Associate Professor',
          role: u.role === 'hod' ? 'hod' : 'teacher',
          college_email: u.email,
          phone: '+91 98160 55001',
          is_hod: u.role === 'hod',
          status: 'active'
        }, { onConflict: 'faculty_id' });
      }

      console.log(`✓ Synchronized ${u.role}: ${u.name} [${u.email}]`);
    } catch (err: any) {
      console.error(`Error processing ${u.email}:`, err);
    }
  }
  console.log('--- Demo Seeding Completed Successfully ---');
}

seedDemoUsers().catch(console.error);
