// ============================================================================
// Unit & Integration Tests: HIET Digital Campus - Monochrome Smart ID Card
// ============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('HIET Smart Digital Student ID Card - Monochrome Palette & Design Integrity', () => {
  const componentPath = path.resolve(__dirname, '../components/student/DigitalIdCardView.tsx');
  const componentSource = fs.readFileSync(componentPath, 'utf-8');

  it('strictly adheres to the Black + White + Navy Blue color scheme', () => {
    // Primary palette constants
    expect(componentSource).toContain('#0F2942'); // Deep Navy Blue
    expect(componentSource).toContain('#183B56'); // Secondary Navy
    expect(componentSource).toContain('#111827'); // Black
    expect(componentSource).toContain('#E2E8F0'); // Neutral border
    expect(componentSource).toContain('#64748B'); // Muted text
  });

  it('removes all bright multicolour and rainbow gradient strips', () => {
    // Rainbow gradients and bright strips
    expect(componentSource).not.toContain('from-amber-400 via-emerald-400 to-sky-400');
    expect(componentSource).not.toContain('from-sky-400 via-indigo-400 to-amber-400');
    expect(componentSource).not.toContain('from-amber-300 via-sky-400 to-indigo-600');
  });

  it('removes bright green, cyan, rose, and amber accent badges', () => {
    // Green badges and highlights
    expect(componentSource).not.toContain('bg-emerald-600');
    expect(componentSource).not.toContain('text-rose-400');
    expect(componentSource).not.toContain('text-amber-400');
    expect(componentSource).not.toContain('text-amber-300');
    expect(componentSource).not.toContain('bg-amber-400/20');
    expect(componentSource).not.toContain('bg-emerald-950/40');
    expect(componentSource).not.toContain('border-emerald-500/30');
  });

  it('removes blue and purple pill button backgrounds in favor of navy/white controls', () => {
    expect(componentSource).not.toContain('bg-blue-50 hover:bg-blue-100 text-blue-700');
    expect(componentSource).not.toContain('border-blue-200');
  });

  it('contains approved institutional identity credentials', () => {
    expect(componentSource).toContain('HIET DIGITAL CAMPUS');
    expect(componentSource).toContain('Himachal Institute of Engg. & Technology, Shahpur');
    expect(componentSource).toContain('Affiliated to HPTU Hamirpur • AICTE Approved');
    expect(componentSource).toContain('Verified Institutional ID');
    expect(componentSource).toContain('HIET/STD/2026');
  });

  it('preserves the QR code and campus barcode functional implementation', () => {
    expect(componentSource).toContain('DynamicQRCodeCanvas');
    expect(componentSource).toContain('CAMPUS BARCODE / LIBRARY CARD');
    expect(componentSource).toContain('libraryCardNo');
    expect(componentSource).toContain('verificationToken');
  });

  it('preserves anti-spoof live beacon clock and system hash', () => {
    expect(componentSource).toContain('ANTI-SPOOF LIVE AUTHENTICATION');
    expect(componentSource).toContain('Live Verification Beacon');
    expect(componentSource).toContain('currentTime');
    expect(componentSource).toContain('pulseTick');
    expect(componentSource).toContain('SHA256: 7f89b142ac0e');
  });

  it('preserves Gate Mode, Print ID, and Card Flip controls', () => {
    expect(componentSource).toContain('Gate Mode');
    expect(componentSource).toContain('Print ID');
    expect(componentSource).toContain('Flip to Back');
    expect(componentSource).toContain('Show Front');
    expect(componentSource).toContain('window.print()');
    expect(componentSource).toContain('isFullscreen');
  });
});
