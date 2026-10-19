// ============================================================================
// Unit & Integration Tests: HIET Digital Campus - Examination Admit Card & Seating Locator
// ============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('HIET Examination Admit Card & Seating Locator - Monochrome Palette Integrity', () => {
  const componentPath = path.resolve(__dirname, '../components/student/AdmitCardPrintView.tsx');
  const componentSource = fs.readFileSync(componentPath, 'utf-8');

  it('strictly adheres to the Primary Navy, Secondary Navy, White and Neutral Grey palette', () => {
    expect(componentSource).toContain('#0F2942'); // Primary Navy Blue
    expect(componentSource).toContain('#183B56'); // Secondary Navy Blue
    expect(componentSource).toContain('#F8FAFC'); // Light background
    expect(componentSource).toContain('#E2E8F0'); // Neutral border
    expect(componentSource).toContain('#64748B'); // Secondary text
  });

  it('removes all green accents, buttons, glowing effects and pills', () => {
    expect(componentSource).not.toContain('bg-emerald-700');
    expect(componentSource).not.toContain('bg-emerald-600');
    expect(componentSource).not.toContain('bg-emerald-500');
    expect(componentSource).not.toContain('text-emerald-300');
    expect(componentSource).not.toContain('text-emerald-700');
    expect(componentSource).not.toContain('text-emerald-800');
    expect(componentSource).not.toContain('text-emerald-900');
    expect(componentSource).not.toContain('ring-emerald-200');
    expect(componentSource).not.toContain('bg-emerald-50');
    expect(componentSource).not.toContain('border-emerald-300');
  });

  it('removes yellow desk highlights and bright blue pills', () => {
    expect(componentSource).not.toContain('text-amber-300');
    expect(componentSource).not.toContain('bg-blue-50');
    expect(componentSource).not.toContain('text-blue-700');
    expect(componentSource).not.toContain('border-blue-100');
    expect(componentSource).not.toContain('from-[#0f2942] to-[#1a385c]');
  });

  it('preserves institutional examination headings and session badge', () => {
    expect(componentSource).toContain('HPTU Examination Portal • Session Nov-Dec 2025');
    expect(componentSource).toContain('Official Examination Admit Card & Seating Locator');
    expect(componentSource).toContain('Himachal Pradesh Technical University, Hamirpur');
    expect(componentSource).toContain('Himachal Institute of Engineering & Technology, Shahpur (Kangra)');
    expect(componentSource).toContain('Centre of Examination: HIET Shahpur (Centre Code: 108)');
  });

  it('preserves the interactive 5x4 seating grid and clearly identifies student seat without relying on color alone', () => {
    expect(componentSource).toContain("['A', 'B', 'C', 'D', 'E']");
    expect(componentSource).toContain('[1, 2, 3, 4]');
    expect(componentSource).toContain('YOUR SEAT');
    expect(componentSource).toContain('INSTRUCTOR & INVIGILATOR DAIS / WHITEBOARD');
    expect(componentSource).toContain('Desk C-3 (Row 3, Col 3)');
  });

  it('preserves functional QR code generation and printable view modes', () => {
    expect(componentSource).toContain('DynamicQRCodeCanvas');
    expect(componentSource).toContain('verificationUrl');
    expect(componentSource).toContain('Printable Admit Card');
    expect(componentSource).toContain('Exam Seating Locator');
    expect(componentSource).toContain('window.print()');
  });

  it('preserves invigilator authentication simulation and approval toast', () => {
    expect(componentSource).toContain('Simulate Invigilator Scan Verification');
    expect(componentSource).toContain('CANDIDATE AUTHENTICATED & VERIFIED');
    expect(componentSource).toContain('ENTRY APPROVED');
  });
});
