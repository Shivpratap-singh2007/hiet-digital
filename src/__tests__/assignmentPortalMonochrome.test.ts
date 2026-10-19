// ============================================================================
// Unit & Integration Tests: HIET Digital Campus - Course Assignments & Deadlines
// Navy Blue & White Redesign Validation
// ============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('HIET Digital Campus — Assignment Portal Navy Blue & White Redesign', () => {
  const componentPath = path.resolve(__dirname, '../components/student/StudentAssignmentsView.tsx');
  const componentSource = fs.readFileSync(componentPath, 'utf-8');

  it('1. strictly adheres to the Navy Blue & White institutional palette', () => {
    // Primary Navy Blue: #0F2942
    expect(componentSource).toContain('#0F2942');
    // Secondary Navy Blue: #183B56
    expect(componentSource).toContain('#183B56');
    // Deep Navy: #0B1F33
    expect(componentSource).toContain('#0B1F33');
    // Light Background: #F8FAFC
    expect(componentSource).toContain('#F8FAFC');
    // Neutral Border: #E2E8F0
    expect(componentSource).toContain('#E2E8F0');
    // Secondary Text: #64748B
    expect(componentSource).toContain('#64748B');
  });

  it('2. completely eliminates all green, emerald, and teal classes', () => {
    // Check for emerald classes
    expect(componentSource).not.toMatch(/bg-emerald/);
    expect(componentSource).not.toMatch(/text-emerald/);
    expect(componentSource).not.toMatch(/border-emerald/);
    expect(componentSource).not.toMatch(/ring-emerald/);
    expect(componentSource).not.toMatch(/from-emerald/);
    
    // Check for teal classes
    expect(componentSource).not.toMatch(/teal/);

    // Check for green classes
    expect(componentSource).not.toMatch(/bg-green/);
    expect(componentSource).not.toMatch(/text-green/);
    expect(componentSource).not.toMatch(/border-green/);
  });

  it('3. eliminates decorative accent colours (purple, orange, yellow, cyan)', () => {
    expect(componentSource).not.toMatch(/purple/i);
    expect(componentSource).not.toMatch(/orange/i);
    expect(componentSource).not.toMatch(/yellow/i);
    expect(componentSource).not.toMatch(/cyan/i);
  });

  it('4. preserves the Header Hero Card with navy gradient and official badge', () => {
    expect(componentSource).toContain('from-[#0B1F33]');
    expect(componentSource).toContain('via-[#0F2942]');
    expect(componentSource).toContain('to-[#183B56]');
    expect(componentSource).toContain('ONLINE ACADEMIC ASSIGNMENT SYSTEM');
    expect(componentSource).toContain('Course Assignments & Deadlines');
    expect(componentSource).toContain('Submit coursework solutions, upload research reports');
  });

  it('5. preserves the Course Filter and dynamically calculated assignment count', () => {
    expect(componentSource).toContain('Filter Course:');
    expect(componentSource).toContain('All Registered Courses');
    expect(componentSource).toContain('{filteredAssignments.length} Assignments');
    expect(componentSource).toContain('selectedSubjectId');
  });

  it('6. provides the No Pending Assignments state styled in navy and neutral grey', () => {
    expect(componentSource).toContain('No pending assignments');
    expect(componentSource).toContain('You are all caught up with your subject coursework!');
    expect(componentSource).toContain('CheckCircle2');
    expect(componentSource).toContain('text-[#0F2942]');
  });

  it('7. provides the Assignment Selection Panel styled in navy and neutral grey', () => {
    expect(componentSource).toContain('Select an assignment to view instructions and submit');
    expect(componentSource).toContain('FileSpreadsheet');
    expect(componentSource).toContain('text-[#0F2942]');
  });

  it('8. preserves all submission workflows, file uploads, feedback, and mobile clearance', () => {
    expect(componentSource).toContain('apiService.submitAssignment');
    expect(componentSource).toContain('apiService.uploadAssignmentFile');
    expect(componentSource).toContain('apiService.getFileSignedUrl');
    expect(componentSource).toContain('Teacher Attachment / Problem Statement');
    expect(componentSource).toContain('Graded by Subject Faculty');
    expect(componentSource).toContain('Faculty Feedback:');
    expect(componentSource).toContain('Resubmission Allowed');
    expect(componentSource).toContain('pb-24'); // Safe bottom padding for mobile navigation bar
  });
});
