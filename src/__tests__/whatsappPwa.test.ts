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

  describe('Multi-Channel Parent Notification & Daily Student Activity Alerts', () => {
    const sampleStudent = {
      name: 'Aarav Sharma',
      roll_no: '26CSE001',
      branch: 'Computer Science & Engineering',
      parent_name: 'Sh. Surender Sharma',
      parent_phone: '+91 98160 44219'
    };

    it('generates universal SIM SMS direct link for native phone messenger', () => {
      const link = whatsappSmsService.getSmsDirectLink('+91 98160 44219', 'Attendance Alert: Bunked Lecture 3');
      expect(link).toContain('sms:+919816044219');
      expect(link).toContain('body=Attendance%20Alert%3A%20Bunked%20Lecture%203');
    });

    it('builds real-time absent/bunk alert message for instant parent dispatch', () => {
      const msg = whatsappSmsService.buildAbsentAlertMessage(
        sampleStudent,
        'Computer Networks',
        'Period 3 (11:30 AM - 12:30 PM)',
        '19 Oct 2026'
      );
      expect(msg).toContain('⚠️ *HIET CAMPUS • STUDENT ABSENT ALERT*');
      expect(msg).toContain('Aarav Sharma');
      expect(msg).toContain('Computer Networks');
      expect(msg).toContain('Period 3 (11:30 AM - 12:30 PM)');
      expect(msg).toContain('ABSENT (Missed Lecture)');
    });

    it('builds campus gate exit alert with security guard sync', () => {
      const msg = whatsappSmsService.buildGateExitAlertMessage(
        sampleStudent,
        'GP-2026-9812',
        '11:45 AM',
        'Kangra Market'
      );
      expect(msg).toContain('🚪 *HIET CAMPUS • GATE EXIT SURAKSHA ALERT*');
      expect(msg).toContain('Aarav Sharma');
      expect(msg).toContain('GP-2026-9812');
      expect(msg).toContain('11:45 AM');
      expect(msg).toContain('Kangra Market');
    });

    it('builds hostel movement & outpass notification', () => {
      const msg = whatsappSmsService.buildHostelMovementAlertMessage(
        sampleStudent,
        'Boys Hostel Block A (Room 204)',
        'Weekend Home Leave',
        '2026-10-21 18:00',
        'Dharamshala'
      );
      expect(msg).toContain('🏢 *HIET RESIDENTIAL HOSTEL • MOVEMENT ALERT*');
      expect(msg).toContain('Boys Hostel Block A (Room 204)');
      expect(msg).toContain('Weekend Home Leave');
      expect(msg).toContain('2026-10-21 18:00');
    });

    it('builds campus medical & dispensary visit alert', () => {
      const msg = whatsappSmsService.buildDispensaryAlertMessage(
        sampleStudent,
        'Mild Fever & Headache',
        '11:15 AM',
        24
      );
      expect(msg).toContain('🏥 *HIET CAMPUS HEALTH CENTER • MEDICAL ALERT*');
      expect(msg).toContain('Mild Fever & Headache');
      expect(msg).toContain('11:15 AM');
      expect(msg).toContain('24 Hours');
    });

    it('builds semester fee payment confirmation message', () => {
      const msg = whatsappSmsService.buildFeeAlertMessage(
        sampleStudent,
        52000,
        'HIET-REC-2026-449',
        'Paid & Cleared'
      );
      expect(msg).toContain('💳 *HIET ACCOUNTS DESK • FEE TRANSACTION ALERT*');
      expect(msg).toContain('₹52,000');
      expect(msg).toContain('HIET-REC-2026-449');
      expect(msg).toContain('PAID & CLEARED');
    });

    it('builds comprehensive end-of-day daily report card digest', () => {
      const msg = whatsappSmsService.buildDailyDigestMessage(
        sampleStudent,
        '19 Oct 2026',
        5,
        6,
        'Exited Gate 1 at 17:15 IST'
      );
      expect(msg).toContain('📊 *HIET DIGITAL CAMPUS • DAILY STUDENT ACTIVITY REPORT*');
      expect(msg).toContain('Aarav Sharma (26CSE001)');
      expect(msg).toContain('5 out of 6 (83%)');
      expect(msg).toContain('Exited Gate 1 at 17:15 IST');
    });

    it('dispatches dual-channel (WhatsApp + SIM SMS) alert simultaneously and logs both', async () => {
      const result = await whatsappSmsService.dispatchStudentActivityAlert({
        student: sampleStudent,
        templateType: 'absent_alert',
        channel: 'both',
        customText: 'Immediate Alert: Ward did not report for morning lab.',
        recipientPhone: '+919816044219',
        recipientName: 'Sh. Surender Sharma'
      });

      expect(result.success).toBe(true);
      expect(result.whatsappUrl).toContain('https://api.whatsapp.com/send?phone=919816044219');
      expect(result.smsUrl).toContain('sms:+919816044219');
      expect(result.deliveries.length).toBe(2);

      const [waDelivery, smsDelivery] = result.deliveries;
      expect(waDelivery.channel).toBe('whatsapp');
      expect(waDelivery.template_type).toBe('absent_alert');
      expect(smsDelivery.channel).toBe('sms');
      expect(smsDelivery.template_type).toBe('absent_alert');

      // Verify stored audit log
      const logs = whatsappSmsService.getDeliveryLogs();
      expect(logs.some(l => l.channel === 'sms' && l.student_roll === '26CSE001')).toBe(true);
      expect(logs.some(l => l.channel === 'whatsapp' && l.student_roll === '26CSE001')).toBe(true);
    });

    it('dispatches SIM SMS only for parents without smartphone/WhatsApp', async () => {
      const result = await whatsappSmsService.dispatchStudentActivityAlert({
        student: sampleStudent,
        templateType: 'gate_exit_alert',
        channel: 'sms',
        recipientPhone: '9816044219',
        recipientName: 'Sh. Surender Sharma'
      });

      expect(result.success).toBe(true);
      expect(result.whatsappUrl).toBeUndefined();
      expect(result.smsUrl).toContain('sms:+919816044219');
      expect(result.deliveries.length).toBe(1);
      expect(result.deliveries[0].channel).toBe('sms');
    });
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
    expect(swContent).toMatch(/hiet-campus-pwa-v\d+/);
    expect(swContent).toContain('install');
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('push');
    expect(swContent).toContain('notificationclick');
  });

  it('index.html explicitly disables automatic Google Translate popups in PWA', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const indexHtml = fs.readFileSync(indexPath, 'utf-8');
    expect(indexHtml).toContain('meta name="google" content="notranslate"');
    expect(indexHtml).toContain('translate="no"');
    expect(indexHtml).toContain('class="notranslate"');
  });
});
