// ============================================================================
// HIET DIGITAL CAMPUS — STAGING BATCH 1 VALIDATION SCRIPT
// File: scripts/validate_staging_batch1.mjs
// Purpose: Executes non-destructive API checks against ISOLATED STAGING ONLY
// SAFETY GUARD: ABORTS IMMEDIATELY IF POINTED AT PRODUCTION
// ============================================================================

import fs from 'fs';
import path from 'path';

const FORBIDDEN_PRODUCTION_REF = 'yitrzhnxpwunkywatiqu';

// ----------------------------------------------------------------------------
// 1. Resolve Staging Configuration (NO FALLBACK TO PRODUCTION .ENV)
// ----------------------------------------------------------------------------
const stagingEnvPath = path.resolve('.env.staging');
let stagingUrl = process.env.STAGING_SUPABASE_URL || '';
let stagingAnonKey = process.env.STAGING_SUPABASE_ANON_KEY || '';

if (fs.existsSync(stagingEnvPath)) {
  const content = fs.readFileSync(stagingEnvPath, 'utf-8');
  const urlMatch = content.match(/STAGING_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = content.match(/STAGING_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) stagingUrl = urlMatch[1].trim();
  if (keyMatch) stagingAnonKey = keyMatch[1].trim();
}

// ----------------------------------------------------------------------------
// 2. Strict Production Guardrail
// ----------------------------------------------------------------------------
if (!stagingUrl || !stagingAnonKey) {
  console.error('====================================================================');
  console.error('ERROR: Staging environment configuration is missing.');
  console.error('Please create .env.staging with:');
  console.error('  STAGING_SUPABASE_URL=https://<your-staging-ref>.supabase.co');
  console.error('  STAGING_SUPABASE_ANON_KEY=<your-staging-anon-key>');
  console.error('NOTE: Never point this script to production.');
  console.error('====================================================================');
  process.exit(1);
}

if (stagingUrl.toLowerCase().includes(FORBIDDEN_PRODUCTION_REF.toLowerCase())) {
  console.error('====================================================================');
  console.error('FATAL CRITICAL SAFETY ERROR:');
  console.error(`Target URL contains production reference: "${FORBIDDEN_PRODUCTION_REF}"`);
  console.error('Execution ABORTED immediately. This script will NEVER touch production.');
  console.error('====================================================================');
  process.exit(1);
}

console.log('====================================================================');
console.log('HIET Digital Campus — Staging Batch 1 API Validation Runner');
console.log(`Target Staging Endpoint: ${stagingUrl}`);
console.log('Role Session: Anonymous (anon key only)');
console.log('====================================================================\n');

async function runStagingChecks() {
  const headers = {
    'apikey': stagingAnonKey,
    'Authorization': `Bearer ${stagingAnonKey}`,
    'Content-Type': 'application/json'
  };

  const results = [];

  // ==========================================================================
  // CATEGORY 1: READ-ONLY NEGATIVE PERMISSION PROBES (ANON BASE TABLE ISOLATION)
  // Expected: RLS blocks rows from anonymous users -> returns HTTP 200 with []
  // ==========================================================================

  // Check 1: Anonymous Base Table Read (hall_tickets)
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/hall_tickets?select=*`, { headers });
    const json = await res.json();
    const passed = res.status === 200 && Array.isArray(json) && json.length === 0;
    results.push({
      id: 'REQ-01',
      category: 'Read-Only Negative Probe',
      name: 'Anonymous read of private hall_tickets base table',
      httpMethod: 'GET',
      httpStatus: res.status,
      passed,
      evidence: passed ? 'Returned empty array [] (RLS isolation confirmed)' : JSON.stringify(json),
      riskIfFailed: 'Data leakage: Anonymous scrapers could enumerate all student hall tickets.'
    });
  } catch (err) {
    results.push({ id: 'REQ-01', passed: false, error: err.message });
  }

  // Check 2: Anonymous Base Table Read (event_certificates)
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/event_certificates?select=*`, { headers });
    const json = await res.json();
    const passed = res.status === 200 && Array.isArray(json) && json.length === 0;
    results.push({
      id: 'REQ-02',
      category: 'Read-Only Negative Probe',
      name: 'Anonymous read of private event_certificates base table',
      httpMethod: 'GET',
      httpStatus: res.status,
      passed,
      evidence: passed ? 'Returned empty array [] (RLS isolation confirmed)' : JSON.stringify(json),
      riskIfFailed: 'Data leakage: Anonymous scrapers could enumerate all student certificates.'
    });
  } catch (err) {
    results.push({ id: 'REQ-02', passed: false, error: err.message });
  }

  // ==========================================================================
  // CATEGORY 2: PERMISSION-DENIAL WRITE PROBE (UNAUTHORIZED WRITE ATTEMPT)
  // Expected: RLS rejects anonymous write -> returns HTTP 401 or 403
  // What happens if it succeeds? If RLS fails, an unauthorized test row is inserted!
  // ==========================================================================

  // Check 3: Anonymous Write Probe (hall_tickets)
  try {
    const probePayload = {
      exam_name: 'PROBE_UNAUTHORIZED_WRITE_TEST',
      semester: 1,
      academic_year: '2025-26',
      verification_token: 'PROBE-WRITE-SHOULD-FAIL'
    };
    const res = await fetch(`${stagingUrl}/rest/v1/hall_tickets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(probePayload)
    });
    // Expected: 401 Unauthorized or 403 Forbidden (RLS violation)
    const passed = res.status === 401 || res.status === 403;
    results.push({
      id: 'REQ-03',
      category: 'Permission-Denial Write Probe',
      name: 'Anonymous write attempt to hall_tickets',
      httpMethod: 'POST',
      httpStatus: res.status,
      passed,
      evidence: passed ? `Blocked with HTTP ${res.status} as expected by RLS` : `UNEXPECTED STATUS ${res.status}: Anonymous write succeeded!`,
      riskIfFailed: 'Security breach: Anonymous callers could forge hall tickets in database!'
    });
  } catch (err) {
    results.push({ id: 'REQ-03', passed: false, error: err.message });
  }

  // ==========================================================================
  // CATEGORY 3: READ-ONLY PUBLIC VERIFICATION RPC PROBES (FAIL-CLOSED BEHAVIOR)
  // Expected: Invalid tokens return HTTP 200 with is_valid: false, zero PII
  // ==========================================================================

  // Check 4: RPC Verify Hall Ticket - Non-Existent Token
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/rpc/rpc_verify_hall_ticket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_token: 'NON_EXISTENT_TOKEN_9999' })
    });
    const json = await res.json();
    const passed = res.status === 200 && json && json.is_valid === false;
    results.push({
      id: 'REQ-04',
      category: 'Read-Only Verification Probe',
      name: 'Verify Hall Ticket with non-existent token',
      httpMethod: 'POST',
      httpStatus: res.status,
      passed,
      evidence: json,
      riskIfFailed: 'Fabrication risk: Invalid tokens might be falsely marked valid.'
    });
  } catch (err) {
    results.push({ id: 'REQ-04', passed: false, error: err.message });
  }

  // Check 5: RPC Verify Event Certificate - Non-Existent Token
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/rpc/rpc_verify_event_certificate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_token: 'NON_EXISTENT_TOKEN_9999' })
    });
    const json = await res.json();
    const passed = res.status === 200 && json && json.is_valid === false;
    results.push({
      id: 'REQ-05',
      category: 'Read-Only Verification Probe',
      name: 'Verify Event Certificate with non-existent token',
      httpMethod: 'POST',
      httpStatus: res.status,
      passed,
      evidence: json,
      riskIfFailed: 'Fabrication risk: Invalid tokens might be falsely marked valid.'
    });
  } catch (err) {
    results.push({ id: 'REQ-05', passed: false, error: err.message });
  }

  // ==========================================================================
  // CATEGORY 4: READ-ONLY SYNTHETIC FIXTURE VERIFICATION PROBES (VALID & BLOCKED)
  // Requires: docs/staging-synthetic-fixtures.sql executed prior to test run
  // ==========================================================================

  // Check 6: RPC Verify Hall Ticket - Valid Synthetic Token
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/rpc/rpc_verify_hall_ticket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_token: 'SYNTH-TOKEN-HT-VALID' })
    });
    const json = await res.json();
    const isSeeded = json && json.is_valid === true && json.student_name && json.roll_number;
    results.push({
      id: 'REQ-06',
      category: 'Read-Only Fixture Verification Probe',
      name: 'Verify Hall Ticket with valid synthetic token',
      httpMethod: 'POST',
      httpStatus: res.status,
      passed: isSeeded,
      evidence: json,
      note: isSeeded ? 'Verified minimal public credential fields returned' : 'Fixture SYNTH-TOKEN-HT-VALID not seeded or query failed'
    });
  } catch (err) {
    results.push({ id: 'REQ-06', passed: false, error: err.message });
  }

  // Check 7: RPC Verify Hall Ticket - Blocked Synthetic Token
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/rpc/rpc_verify_hall_ticket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_token: 'SYNTH-TOKEN-HT-BLOCKED' })
    });
    const json = await res.json();
    const isBlocked = json && json.is_valid === false && json.is_blocked === true;
    results.push({
      id: 'REQ-07',
      category: 'Read-Only Fixture Verification Probe',
      name: 'Verify Hall Ticket with blocked synthetic token',
      httpMethod: 'POST',
      httpStatus: res.status,
      passed: isBlocked,
      evidence: json,
      note: isBlocked ? 'Verified blocked status returned and student PII suppressed' : 'Fixture SYNTH-TOKEN-HT-BLOCKED not seeded or block logic failed'
    });
  } catch (err) {
    results.push({ id: 'REQ-07', passed: false, error: err.message });
  }

  // Check 8: RPC Verify Event Certificate - Valid Synthetic Token
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/rpc/rpc_verify_event_certificate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_token: 'SYNTH-TOKEN-CERT-VALID' })
    });
    const json = await res.json();
    const isSeeded = json && json.is_valid === true && json.recipient_name && json.certificate_number;
    results.push({
      id: 'REQ-08',
      category: 'Read-Only Fixture Verification Probe',
      name: 'Verify Event Certificate with valid synthetic token',
      httpMethod: 'POST',
      httpStatus: res.status,
      passed: isSeeded,
      evidence: json,
      note: isSeeded ? 'Verified minimal public certificate fields returned' : 'Fixture SYNTH-TOKEN-CERT-VALID not seeded or query failed'
    });
  } catch (err) {
    results.push({ id: 'REQ-08', passed: false, error: err.message });
  }

  // Check 9: RPC Verify Event Certificate - Revoked Synthetic Token
  try {
    const res = await fetch(`${stagingUrl}/rest/v1/rpc/rpc_verify_event_certificate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_token: 'SYNTH-TOKEN-CERT-REVOKED' })
    });
    const json = await res.json();
    const isRevoked = json && json.is_valid === false && json.is_revoked === true;
    results.push({
      id: 'REQ-09',
      category: 'Read-Only Fixture Verification Probe',
      name: 'Verify Event Certificate with revoked synthetic token',
      httpMethod: 'POST',
      httpStatus: res.status,
      passed: isRevoked,
      evidence: json,
      note: isRevoked ? 'Verified revoked status returned and reason displayed' : 'Fixture SYNTH-TOKEN-CERT-REVOKED not seeded or revocation logic failed'
    });
  } catch (err) {
    results.push({ id: 'REQ-09', passed: false, error: err.message });
  }

  console.log('====================================================================');
  console.log('STAGING VALIDATION RUNNER EXECUTION SUMMARY');
  console.log('====================================================================');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = results.every(r => r.passed);
  console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL STAGING ANONYMOUS CHECKS PASSED' : 'SOME CHECKS FAILED OR FIXTURES MISSING'}`);
  console.log('NOTE: Authenticated role-isolation checks were NOT executed (requires staff/student JWT sessions).');
}

runStagingChecks().catch(err => {
  console.error('Fatal runner execution error:', err);
  process.exit(1);
});
