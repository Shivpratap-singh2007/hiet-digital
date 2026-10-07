import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const targetTables = [
  'departments',
  'branches',
  'teachers_master',
  'students_master',
  'subjects',
  'teacher_subjects',
  'timetable',
  'attendance',
  'sessional_results',
  'grades',
  'syllabus',
  'pyqs',
  'assignments',
  'assignment_submissions',
  'gallery_items',
  'complaints',
  'gate_passes',
  'profiles',
  'import_jobs',
  'import_errors'
];

async function generateBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDate = new Date().toISOString().slice(0, 10);
  const backupDirName = `HIET_PRODUCTION_PRE_REAL_DATA_${backupDate}`;
  const backupDirPath = path.join(process.cwd(), 'backups', backupDirName);

  if (!fs.existsSync(backupDirPath)) {
    fs.mkdirSync(backupDirPath, { recursive: true });
  }

  console.log(`Starting Production Database Export...`);
  console.log(`Target: ${supabaseUrl}`);
  console.log(`Destination: ${backupDirPath}`);

  const fullDump = {};
  const manifest = {
    backup_name: backupDirName,
    created_at: new Date().toISOString(),
    project_url: supabaseUrl,
    tables: {},
    total_records: 0
  };

  let sqlStatements = `-- =============================================================================\n`;
  sqlStatements += `-- HIET PRODUCTION DATABASE BACKUP PRE-REAL-DATA\n`;
  sqlStatements += `-- Generated: ${new Date().toISOString()}\n`;
  sqlStatements += `-- Project URL: ${supabaseUrl}\n`;
  sqlStatements += `-- =============================================================================\n\n`;

  for (const table of targetTables) {
    try {
      const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' });
      if (error) {
        console.warn(`Table ${table} export warning: ${error.message}`);
        manifest.tables[table] = { status: 'skipped/error', error: error.message, count: 0 };
      } else {
        const rows = data || [];
        fullDump[table] = rows;
        manifest.tables[table] = { status: 'exported', count: rows.length };
        manifest.total_records += rows.length;
        console.log(`✓ Table [${table}]: Exported ${rows.length} rows`);

        if (rows.length > 0) {
          sqlStatements += `-- Table: public.${table} (${rows.length} rows)\n`;
          for (const row of rows) {
            const cols = Object.keys(row);
            const vals = cols.map(c => {
              const val = row[c];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number' || typeof val === 'boolean') return String(val);
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            sqlStatements += `INSERT INTO public.${table} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
          }
          sqlStatements += `\n`;
        }
      }
    } catch (e) {
      console.error(`Exception exporting ${table}:`, e.message);
      manifest.tables[table] = { status: 'exception', error: e.message, count: 0 };
    }
  }

  // Write JSON dump
  const jsonPath = path.join(backupDirPath, `${backupDirName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(fullDump, null, 2), 'utf8');

  // Write SQL dump
  const sqlPath = path.join(backupDirPath, `${backupDirName}.sql`);
  fs.writeFileSync(sqlPath, sqlStatements, 'utf8');

  // Write Manifest
  const manifestPath = path.join(backupDirPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n===============================================================`);
  console.log(`BACKUP COMPLETE & PERSISTED LOCALLY`);
  console.log(`Total Records Exported: ${manifest.total_records}`);
  console.log(`JSON Dump: ${jsonPath} (${(fs.statSync(jsonPath).size / 1024).toFixed(2)} KB)`);
  console.log(`SQL Dump: ${sqlPath} (${(fs.statSync(sqlPath).size / 1024).toFixed(2)} KB)`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`===============================================================`);
}

generateBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
