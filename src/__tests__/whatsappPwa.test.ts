import { describe, it, expect, beforeEach } from 'vitest';
import { whatsappSmsService } from '../lib/whatsappSmsService';
import fs from 'fs';
import path from 'path';

// Setup localStorage polyfill for node test environment
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0,
  };
}

describe('WhatsApp & SMS Notification System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('builds statutory attendance shortage message (< 75% HPTU compliance)', () => {
    const student = {
      name: 'Aarav Sharma',
      roll_no: '26CSE001',
      branch: 'Computer Science & Engineering'
    };
    const message = whatsappSmsService.buildAttendanceWarningMessage(student, 64.5, 'Operating Systems');

    expect(message).toContain('HIET DIGITAL CAMPUS • ATTENDANCE SHORTAGE WARNING');
    expect(message).toContain('Aarav Sharma');
    expect(message).toContain('26CSE001');
    expect(message).toContain('64.5%');
    expect(message).toContain('75% HPTU compliance threshold');
    expect(message).toContain('Operating Systems');
  });

  it('generates direct WhatsApp click-to-chat URL with clean numeric phone and encoded text', () => {
    const phone = '+91 98160 44219';
    const message = 'HIET Shahpur: Attendance shortage alert';
    const link = whatsappSmsService.getWhatsAppDirectLink(phone, message);

    expect(link).toContain('https://api.whatsapp.com/send?phone=919816044219');
    expect(link).toContain(encodeURIComponent(message));
  });

  it('formats Principal emergency holiday notices with official seal', () => {
    const title = 'Emergency Heavy Rain Holiday';
    const content = 'Due to severe weather warnings in Kangra district, college will remain closed tomorrow.';
    const formatted = whatsappSmsService.buildEmergencyNoticeMessage(
      title,
      content,
      'Office of the Principal, HIET Shahpur'
    );

    expect(formatted).toContain('HIET EMERGENCY CAMPUS BROADCAST');
    expect(formatted).toContain('EMERGENCY HEAVY RAIN HOLIDAY');
    expect(formatted).toContain('Office of the Principal, HIET Shahpur');
    expect(formatted).toContain('Kangra district');
  });

  it('dispatches attendance shortage warning and creates persistent audit log', async () => {
    const student = {
      id: 'std-test-1',
      name: 'Priya Verma',
      roll_no: '26ECE012',
      branch: 'ECE',
      semester: 4,
      section: 'A',
      course: 'B.Tech',
      status: 'active' as const,
      college_email: 'priya@hiet.ac.in',
      phone: '9816011111',
      parent_phone: '9816022222',
      parent_name: 'Mr. Rajesh Verma',
      whatsapp_notifications_enabled: true
    };

    const result = await whatsappSmsService.sendAttendanceWarning({
      student,
      attendancePct: 62,
      subjectName: 'Signals and Systems',
      channel: 'whatsapp',
      recipientType: 'parent'
    });

    expect(result.success).toBe(true);
    expect(result.delivery).toBeDefined();
    expect(result.delivery.recipient_name).toBe('Mr. Rajesh Verma');
    expect(result.delivery.recipient_phone).toBe('9816022222');
    expect(result.delivery.template_type).toBe('attendance_warning');
    expect(result.directUrl).toContain('9816022222');

    // Check delivery logs
    const logs = whatsappSmsService.getDeliveryLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].student_roll).toBe('26ECE012');
  });

  it('broadcasts urgent notices and logs multiple deliveries', async () => {
    const broadcastResult = await whatsappSmsService.sendEmergencyNoticeBroadcast({
      title: 'HPTU End-Term Practical Exams',
      content: 'Practical examination schedules have been published.',
      issuedBy: 'Principal, HIET',
      targetAudience: 'All'
    });

    expect(broadcastResult.success).toBe(true);
    expect(broadcastResult.dispatchedCount).toBeGreaterThan(0);
    expect(broadcastResult.deliveries.length).toBe(broadcastResult.dispatchedCount);
  });
});

describe('PWA (Progressive Web App) Manifest Configuration', () => {
  it('has a valid manifest.json with standalone mode and institutional styling', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestRaw);

    expect(manifest.name).toContain('HIET Digital Campus');
    expect(manifest.short_name).toBe('HIET Campus');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0f2942');
    expect(manifest.background_color).toBe('#f8fafc');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
  });

  it('service worker file exists and contains offline caching and push handlers', () => {
    const swPath = path.resolve(__dirname, '../../public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('hiet-campus-pwa-v2');
    expect(swContent).toContain('install');
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('push');
    expect(swContent).toContain('notificationclick');
  });
});
