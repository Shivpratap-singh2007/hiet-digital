// ============================================================================
// Unit & Integration Tests: HIET Digital Campus - Interactive Doubt & Query Box
// Navy Blue & White Redesign Validation
// ============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('HIET Digital Campus — Interactive Doubt & Query Box Monochrome Redesign', () => {
  const componentPath = path.resolve(__dirname, '../components/student/DoubtBoxView.tsx');
  const componentSource = fs.readFileSync(componentPath, 'utf-8');

  it('1. strictly adheres to the Navy Blue (#0F2942) and White institutional palette', () => {
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
    expect(componentSource).not.toMatch(/bg-emerald/);
    expect(componentSource).not.toMatch(/text-emerald/);
    expect(componentSource).not.toMatch(/border-emerald/);
    expect(componentSource).not.toMatch(/ring-emerald/);
    expect(componentSource).not.toMatch(/icon-glow-emerald/);
    expect(componentSource).not.toMatch(/teal/i);
    expect(componentSource).not.toMatch(/bg-green/);
    expect(componentSource).not.toMatch(/text-green/);
    expect(componentSource).not.toMatch(/border-green/);
  });

  it('3. eliminates decorative accent colours (purple, orange, yellow, cyan, bright blue)', () => {
    expect(componentSource).not.toMatch(/purple/i);
    expect(componentSource).not.toMatch(/orange/i);
    expect(componentSource).not.toMatch(/yellow/i);
    expect(componentSource).not.toMatch(/cyan/i);
    expect(componentSource).not.toMatch(/bg-blue-[5-7]00/);
    expect(componentSource).not.toMatch(/text-blue-[5-7]00/);
  });

  it('4. styles the page heading and question-mark icon in institutional navy blue', () => {
    expect(componentSource).toContain('Interactive Doubt & Query Box');
    expect(componentSource).toContain('HelpCircle');
    expect(componentSource).toContain('text-[#0F2942]');
  });

  it('5. styles "Ask a New Doubt" button in solid navy blue with hover/pressed states and white plus icon', () => {
    expect(componentSource).toContain('Ask a New Doubt');
    expect(componentSource).toContain('bg-[#0F2942]');
    expect(componentSource).toContain('hover:bg-[#183B56]');
    expect(componentSource).toContain('active:bg-[#0B1F33]');
    expect(componentSource).toContain('Plus');
    expect(componentSource).toContain('text-white');
  });

  it('6. preserves all doubt creation, thread discussion, and privacy shield workflows', () => {
    expect(componentSource).toContain('apiService.createDoubt');
    expect(componentSource).toContain('apiService.sendDoubtReply');
    expect(componentSource).toContain('handleCreateDoubt');
    expect(componentSource).toContain('handleSendFollowup');
    expect(componentSource).toContain('Student Privacy Shield Active');
    expect(componentSource).toContain('My Queries');
    expect(componentSource).toContain('Select a question to view the discussion or ask a new doubt');
    expect(componentSource).toContain('pb-24'); // mobile clearance
  });
});
