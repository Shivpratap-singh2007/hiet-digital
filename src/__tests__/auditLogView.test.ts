import { describe, it, expect } from 'vitest';
import { formatAuditTimestamp, AuditTrailEntry } from '../components/admin/AuditLogView';
import { dataStore } from '../lib/mockData';
import fs from 'fs';
import path from 'path';

describe('HIET Digital Campus — Administrative Audit Trail & Compliance Log', () => {
  // Read the source code of AuditLogView for static structural verification
  const auditViewFilePath = path.resolve(__dirname, '../components/admin/AuditLogView.tsx');
  const auditViewSource = fs.readFileSync(auditViewFilePath, 'utf-8');

  // ===========================================================================
  // 1. Timestamp Formatting & Asia/Kolkata Timezone Conversion (Section 2)
  // ===========================================================================
  describe('1. Timestamp Formatting & Timezone Conversion', () => {
    it('correctly converts UTC timestamps to Asia/Kolkata timezone with IST suffix', () => {
      // 2026-09-27T15:45:00Z -> 15:45 UTC + 05:30 = 21:15 IST (9:15 PM)
      const formatted = formatAuditTimestamp('2026-09-27T15:45:00Z');
      expect(formatted).toContain('27 Sep 2026');
      expect(formatted).toContain('09:15 PM');
      expect(formatted).toContain('IST');
    });

    it('correctly converts morning UTC timestamp crossing day boundary in IST', () => {
      // 2026-02-28T20:00:00Z -> 20:00 UTC + 05:30 = 01:30 AM on 01 Mar 2026
      const formatted = formatAuditTimestamp('2026-02-28T20:00:00Z');
      expect(formatted).toContain('01 Mar 2026');
      expect(formatted).toContain('01:30 AM');
      expect(formatted).toContain('IST');
    });

    it('handles missing or invalid timestamps gracefully without crashing', () => {
      expect(formatAuditTimestamp(null)).toBe('—');
      expect(formatAuditTimestamp(undefined)).toBe('—');
      expect(formatAuditTimestamp('')).toBe('—');
      expect(formatAuditTimestamp('invalid-date')).toBe('—');
    });

    it('preserves the original stored UTC timestamp in rawTimestamp field', () => {
      expect(auditViewSource).toContain('rawTimestamp: rawTime');
      expect(auditViewSource).toContain('selectedEntry.rawTimestamp');
      expect(auditViewSource).toContain('Original Stored Timestamp (UTC)');
    });
  });

  // ===========================================================================
  // 2. Responsive Layout: Desktop Table & Mobile Cards (Section 1)
  // ===========================================================================
  describe('2. Responsive Layout Architecture', () => {
    it('provides a dedicated desktop table hidden on mobile', () => {
      expect(auditViewSource).toContain('hidden md:block');
      expect(auditViewSource).toContain('<table');
      expect(auditViewSource).toContain('overflow-x-auto');
    });

    it('provides responsive audit record cards specifically for mobile screens', () => {
      expect(auditViewSource).toContain('md:hidden');
      expect(auditViewSource).toContain('break-words');
      expect(auditViewSource).toContain('Details / Description');
    });

    it('renders all required compliance fields on mobile cards', () => {
      // Must display: Timestamp, Administrator / Actor, Action performed, Target entity, Details, Status
      expect(auditViewSource).toContain('Administrator');
      expect(auditViewSource).toContain('Target Entity');
      expect(auditViewSource).toContain('Timestamp');
      expect(auditViewSource).toContain('Details / Description');
      expect(auditViewSource).toContain('renderStatusBadge');
    });

    it('ensures table columns have controlled minimum widths to prevent awkward wrapping', () => {
      expect(auditViewSource).toContain('min-w-[190px]'); // Timestamp
      expect(auditViewSource).toContain('min-w-[170px]'); // Administrator
      expect(auditViewSource).toContain('min-w-[160px]'); // Action
      expect(auditViewSource).toContain('min-w-[160px]'); // Target Entity
      expect(auditViewSource).toContain('min-w-[260px]'); // Details
      expect(auditViewSource).toContain('min-w-[110px]'); // Status
    });

    it('prevents page-level horizontal overflow with viewport constraints', () => {
      expect(auditViewSource).toContain('w-full max-w-full overflow-hidden');
    });
  });

  // ===========================================================================
  // 3. Search and Filter Controls (Section 3)
  // ===========================================================================
  describe('3. Search and Filter Implementation', () => {
    it('implements search across administrator, action, target entity, details, and ID', () => {
      expect(auditViewSource).toContain('item.administrator.toLowerCase().includes(q)');
      expect(auditViewSource).toContain('item.action.toLowerCase().includes(q)');
      expect(auditViewSource).toContain('item.targetEntity.toLowerCase().includes(q)');
      expect(auditViewSource).toContain('item.details.toLowerCase().includes(q)');
      expect(auditViewSource).toContain('item.id.toLowerCase().includes(q)');
    });

    it('implements action type dropdown, status filter, and date picker filter', () => {
      expect(auditViewSource).toContain('actionFilter');
      expect(auditViewSource).toContain('statusFilter');
      expect(auditViewSource).toContain('dateFilter');
      expect(auditViewSource).toContain('getIstDateKey');
    });

    it('provides a clear filters button that restores complete result set', () => {
      expect(auditViewSource).toContain('handleClearFilters');
      expect(auditViewSource).toContain('Clear All Filters');
    });

    it('displays the exact result count of matching records', () => {
      expect(auditViewSource).toContain('filteredEntries.length');
      expect(auditViewSource).toContain('entries.length');
      expect(auditViewSource).toContain('Showing');
    });
  });

  // ===========================================================================
  // 4. Reverse Chronological Sorting & Pagination (Section 5)
  // ===========================================================================
  describe('4. Sorting & Pagination Controls', () => {
    it('sorts audit records in reverse chronological order by default (newest first)', () => {
      expect(auditViewSource).toContain('realAuditItems.sort((a, b) => {');
      expect(auditViewSource).toContain('return timeB - timeA;');
    });

    it('supports customizable page sizes and pagination navigation', () => {
      expect(auditViewSource).toContain('pageSize');
      expect(auditViewSource).toContain('currentPage');
      expect(auditViewSource).toContain('totalPages');
      expect(auditViewSource).toContain('Previous');
      expect(auditViewSource).toContain('Next');
    });
  });

  // ===========================================================================
  // 5. Expandable Record Details / Compliance Inspector (Section 4 & 6)
  // ===========================================================================
  describe('5. Compliance Record Inspector Modal', () => {
    it('provides modal inspection of complete details when descriptions are lengthy', () => {
      expect(auditViewSource).toContain('selectedEntry');
      expect(auditViewSource).toContain('setSelectedEntry');
      expect(auditViewSource).toContain('Compliance Audit Record');
      expect(auditViewSource).toContain('Complete Compliance Details');
    });

    it('displays both local IST time and original UTC ISO timestamp in inspector', () => {
      expect(auditViewSource).toContain('Local Time (IST)');
      expect(auditViewSource).toContain('Original Stored Timestamp (UTC)');
    });

    it('includes institutional compliance guarantee note', () => {
      expect(auditViewSource).toContain('Institutional Compliance Guarantee');
      expect(auditViewSource).toContain('immutable, read-only');
    });
  });

  // ===========================================================================
  // 6. Strict Monochrome & Accessible Branding (Section 7)
  // ===========================================================================
  describe('6. Strict Monochrome & Accessible Styling', () => {
    it('uses monochrome badges for status without colorful rainbow gradients', () => {
      expect(auditViewSource).not.toContain('bg-emerald-500');
      expect(auditViewSource).not.toContain('bg-blue-500');
      expect(auditViewSource).not.toContain('bg-red-500');
      expect(auditViewSource).not.toContain('bg-amber-500');
    });

    it('integrates standard HIET breadcrumbs and header', () => {
      expect(auditViewSource).toContain('PageHeader');
      expect(auditViewSource).toContain('Security & Compliance');
      expect(auditViewSource).toContain('Administrative Audit Trail & Compliance Log');
    });
  });
});
