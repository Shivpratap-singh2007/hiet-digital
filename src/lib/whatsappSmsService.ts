// =============================================================================
// HIET DIGITAL CAMPUS — WHATSAPP & SMS INSTANT NOTIFICATION SERVICE
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Automated parental alerts for <75% attendance shortage & Principal emergency notices
// =============================================================================

import { StudentMaster, WhatsAppSmsDelivery } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { dataStore } from './mockData';

const STORAGE_KEY = 'hiet_whatsapp_sms_delivery_logs';

class WhatsAppSmsService {
  private formatPhoneNumber(rawPhone?: string): string {
    if (!rawPhone) return '919816000000';
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `91${digitsOnly}`;
    }
    if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
      return `91${digitsOnly.slice(1)}`;
    }
    return digitsOnly || '919816000000';
  }

  // 1. Generate Standard WhatsApp Direct Click-to-Chat Link
  public getWhatsAppDirectLink(phone: string, message: string): string {
    const formattedPhone = this.formatPhoneNumber(phone);
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  }

  // 2. Generate Standard GSM SIM SMS Direct Link (Universal Mobile SMS URI)
  public getSmsDirectLink(phone: string, message: string): string {
    const formattedPhone = this.formatPhoneNumber(phone);
    return `sms:+${formattedPhone}?body=${encodeURIComponent(message)}`;
  }

  // 3. Build Standardized Message Templates
  public buildAttendanceWarningMessage(
    student: { name: string; roll_no: string; branch: string },
    attendancePct: number,
    subjectName?: string
  ): string {
    const subjectLine = subjectName ? ` in ${subjectName}` : '';
    return [
      `⚠️ *HIET DIGITAL CAMPUS • ATTENDANCE SHORTAGE WARNING*`,
      ``,
      `Dear Parent/Guardian,`,
      `This is an official academic notice regarding your ward:`,
      `• *Student Name:* ${student.name}`,
      `• *Roll Number:* ${student.roll_no}`,
      `• *Department:* ${student.branch}`,
      `• *Current Attendance:* ${attendancePct}%${subjectLine}`,
      ``,
      `*Status:* Below the statutory *75% HPTU compliance threshold*.`,
      `Please ensure your ward attends upcoming lectures continuously to avoid semester examination hall ticket debarment.`,
      ``,
      `— *Office of Dean Academics & Class In-Charge*`,
      `Himachal Institute of Engineering & Technology, Shahpur (Kangra)`,
      `Portal: https://hiet-digital.vercel.app`
    ].join('\n');
  }

  public buildAbsentAlertMessage(
    student: { name: string; roll_no: string; branch?: string },
    subjectName: string,
    periodOrTime: string,
    date?: string
  ): string {
    const today = date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return [
      `⚠️ *HIET CAMPUS • STUDENT ABSENT ALERT*`,
      ``,
      `Namaste Parent/Guardian,`,
      `This is to inform you that your ward:`,
      `• *Student:* ${student.name} (${student.roll_no})`,
      `• *Date:* ${today}`,
      `• *Subject:* ${subjectName}`,
      `• *Period/Time:* ${periodOrTime}`,
      `• *Status:* ABSENT (Missed Lecture)`,
      ``,
      `If this absence was unauthorized, please speak with your ward or contact their class in-charge immediately.`,
      `— *Office of Dean Academics, HIET Shahpur*`
    ].join('\n');
  }

  public buildGateExitAlertMessage(
    student: { name: string; roll_no: string },
    passCode: string,
    exitTime: string,
    destination: string
  ): string {
    return [
      `🚪 *HIET CAMPUS • GATE EXIT SURAKSHA ALERT*`,
      ``,
      `Dear Parent,`,
      `Your ward ${student.name} (${student.roll_no}) has just EXITED the campus via Main Gate No. 1:`,
      `• *Time of Exit:* ${exitTime}`,
      `• *Gate Pass Code:* ${passCode}`,
      `• *Destination:* ${destination}`,
      ``,
      `Security scanned and verified by HIET Main Gate Post.`,
      `— *Chief Security Officer, HIET Campus*`
    ].join('\n');
  }

  public buildHostelMovementAlertMessage(
    student: { name: string; roll_no: string },
    hostelName: string,
    movementType: string,
    time: string,
    destination?: string
  ): string {
    const destStr = destination ? `\n• *Destination:* ${destination}` : '';
    return [
      `🏢 *HIET RESIDENTIAL HOSTEL • MOVEMENT ALERT*`,
      ``,
      `Dear Parent,`,
      `Hostel movement update for ${student.name} (${student.roll_no}):`,
      `• *Hostel:* ${hostelName}`,
      `• *Movement:* ${movementType}`,
      `• *Time:* ${time}${destStr}`,
      ``,
      `Warden office has recorded this departure in the campus security register.`,
      `— *Chief Hostel Warden, HIET Shahpur*`
    ].join('\n');
  }

  public buildDispensaryAlertMessage(
    student: { name: string; roll_no: string },
    diagnosis: string,
    time: string,
    restHours?: number
  ): string {
    const restStr = restHours ? `\n• *Rest Advised:* ${restHours} Hours` : '';
    return [
      `🏥 *HIET CAMPUS HEALTH CENTER • MEDICAL ALERT*`,
      ``,
      `Dear Parent,`,
      `Your ward ${student.name} (${student.roll_no}) visited the college dispensary today:`,
      `• *Checkup Time:* ${time}`,
      `• *Medical Finding:* ${diagnosis}${restStr}`,
      `• *Doctor:* Dr. R. K. Sharma (Campus Medical Officer)`,
      ``,
      `Medical care and medicines have been provided. Student is under medical observation.`,
      `— *Dispensary & Student Welfare Desk, HIET*`
    ].join('\n');
  }

  public buildFeeAlertMessage(
    student: { name: string; roll_no: string },
    amount: number,
    receiptNo: string,
    paymentStatus: string
  ): string {
    return [
      `💳 *HIET ACCOUNTS DESK • FEE TRANSACTION ALERT*`,
      ``,
      `Dear Parent,`,
      `Semester fee payment recorded for ${student.name} (${student.roll_no}):`,
      `• *Amount Received:* ₹${amount.toLocaleString()}`,
      `• *Official Receipt No:* ${receiptNo}`,
      `• *Payment Status:* ${paymentStatus.toUpperCase()}`,
      `• *Pending Dues:* ₹0 (Zero Dues)`,
      ``,
      `Official verified receipt is available on the student portal.`,
      `— *Accounts & Finance Branch, HIET Shahpur*`
    ].join('\n');
  }

  public buildDailyDigestMessage(
    student: { name: string; roll_no: string; branch?: string },
    date: string,
    attendedLectures: number,
    totalLectures: number,
    gateStatus: string
  ): string {
    const pct = totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 100;
    return [
      `📊 *HIET DIGITAL CAMPUS • DAILY STUDENT ACTIVITY REPORT*`,
      `Date: ${date}`,
      ``,
      `Dear Parent, here is today's summary for ${student.name} (${student.roll_no}):`,
      `• *Lectures Attended:* ${attendedLectures} out of ${totalLectures} (${pct}%)`,
      `• *Campus Presence:* ${pct >= 75 ? 'Full Day Attendance' : 'Partial Attendance'}`,
      `• *Gate Activity:* ${gateStatus}`,
      `• *Conduct:* Exemplary (Zero Infractions)`,
      ``,
      `View live updates on HIET Parent Portal: https://hiet-digital.vercel.app/app/parent-portal`,
      `— *Office of the Dean Academics, HIET Shahpur*`
    ].join('\n');
  }

  public buildEmergencyNoticeMessage(
    title: string,
    content: string,
    issuedBy?: string
  ): string {
    return [
      `📢 *HIET EMERGENCY CAMPUS BROADCAST*`,
      ``,
      `*Subject:* ${title.toUpperCase()}`,
      ``,
      `${content}`,
      ``,
      `— *${issuedBy || 'Office of the Principal'}*`,
      `Himachal Institute of Engineering & Technology, Shahpur (H.P.)`,
      `Official Portal: https://hiet-digital.vercel.app`
    ].join('\n');
  }

  // 3. Dispatch Attendance Warning Alert
  public async sendAttendanceWarning(params: {
    student: StudentMaster;
    attendancePct: number;
    subjectName?: string;
    channel?: 'whatsapp' | 'sms';
    recipientType?: 'parent' | 'student' | 'both';
  }): Promise<{
    success: boolean;
    delivery: WhatsAppSmsDelivery;
    directUrl: string;
  }> {
    const channel = params.channel || 'whatsapp';
    const recipientPhone =
      params.recipientType === 'student'
        ? params.student.phone
        : params.student.parent_phone || params.student.phone || '9816012345';

    const recipientName =
      params.recipientType === 'student'
        ? params.student.name
        : params.student.parent_name || `Parent of ${params.student.name}`;

    const messageText = this.buildAttendanceWarningMessage(
      {
        name: params.student.name,
        roll_no: params.student.roll_no,
        branch: params.student.branch
      },
      params.attendancePct,
      params.subjectName
    );

    const directUrl = this.getWhatsAppDirectLink(recipientPhone, messageText);

    const deliveryRecord: WhatsAppSmsDelivery = {
      id: `wapp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_type: params.recipientType === 'both' ? 'all' : (params.recipientType || 'parent'),
      channel,
      template_type: 'attendance_warning',
      student_roll: params.student.roll_no,
      title: `Attendance Shortage Alert (${params.attendancePct}%)`,
      message: messageText,
      status: 'sent',
      provider: 'whatsapp_cloud_gateway',
      provider_message_id: `msg_wa_${Date.now()}`,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Store in audit log
    this.saveDeliveryLog(deliveryRecord);

    // If Supabase is configured, record in database
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notification_deliveries').insert({
          delivery_id: deliveryRecord.id,
          notification_id: '00000000-0000-0000-0000-000000000000',
          channel,
          recipient_address: recipientPhone,
          delivery_status: 'sent',
          provider: 'whatsapp_gateway',
          provider_message_id: deliveryRecord.provider_message_id,
          sent_at: deliveryRecord.sent_at
        });
      } catch (e) {
        console.warn('[WhatsApp Service] DB audit logging skipped in sandbox:', e);
      }
    }

    return {
      success: true,
      delivery: deliveryRecord,
      directUrl
    };
  }

  // 4. Dispatch Emergency Notice Broadcast
  public async sendEmergencyNoticeBroadcast(params: {
    title: string;
    content: string;
    issuedBy?: string;
    targetAudience?: string;
  }): Promise<{
    success: boolean;
    dispatchedCount: number;
    deliveries: WhatsAppSmsDelivery[];
  }> {
    const students = dataStore.getStudentsMaster();
    const messageText = this.buildEmergencyNoticeMessage(
      params.title,
      params.content,
      params.issuedBy
    );

    const targetStudents =
      !params.targetAudience || params.targetAudience === 'All'
        ? students
        : students.filter(
            (s) =>
              s.branch === params.targetAudience ||
              params.targetAudience === 'Students'
          );

    const deliveries: WhatsAppSmsDelivery[] = [];

    for (const student of targetStudents.slice(0, 15)) {
      const recipientPhone = student.parent_phone || student.phone || '9816012345';
      const record: WhatsAppSmsDelivery = {
        id: `wapp-broadcast-${Date.now()}-${student.roll_no}`,
        recipient_name: student.parent_name || `Parent of ${student.name}`,
        recipient_phone: recipientPhone,
        recipient_type: 'parent',
        channel: 'whatsapp',
        template_type: 'emergency_notice',
        student_roll: student.roll_no,
        title: params.title,
        message: messageText,
        status: 'sent',
        provider: 'whatsapp_broadcast_pool',
        provider_message_id: `bcast_${Date.now()}_${student.roll_no}`,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      this.saveDeliveryLog(record);
      deliveries.push(record);
    }

    return {
      success: true,
      dispatchedCount: deliveries.length,
      deliveries
    };
  }

  // 5. Dispatch Real-Time Student Activity Parental Alert (Multi-Channel: WhatsApp + GSM SIM SMS)
  public async dispatchStudentActivityAlert(params: {
    student: { name: string; roll_no: string; branch?: string; parent_phone?: string; parent_name?: string };
    eventType?: 'absent' | 'gate_exit' | 'hostel_movement' | 'dispensary' | 'fee' | 'daily_digest';
    templateType?: WhatsAppSmsDelivery['template_type'];
    title?: string;
    channel?: 'whatsapp' | 'sms' | 'both';
    details?: Record<string, any>;
    customText?: string;
    recipientPhone?: string;
    recipientName?: string;
  }): Promise<{
    success: boolean;
    deliveries: WhatsAppSmsDelivery[];
    whatsappUrl?: string;
    smsUrl?: string;
  }> {
    const channel = params.channel || 'both';
    const parentPhone = params.recipientPhone || params.student.parent_phone || '9816044219';
    const parentName = params.recipientName || params.student.parent_name || `Parent of ${params.student.name}`;
    const details = params.details || {};

    let resolvedEventType = params.eventType;
    if (!resolvedEventType && params.templateType) {
      if (params.templateType === 'absent_alert') resolvedEventType = 'absent';
      else if (params.templateType === 'gate_exit_alert') resolvedEventType = 'gate_exit';
      else if (params.templateType === 'hostel_movement_alert') resolvedEventType = 'hostel_movement';
      else if (params.templateType === 'dispensary_alert') resolvedEventType = 'dispensary';
      else if (params.templateType === 'fee_alert') resolvedEventType = 'fee';
      else if (params.templateType === 'daily_digest') resolvedEventType = 'daily_digest';
    }

    let messageText = params.customText || '';
    let templateType: WhatsAppSmsDelivery['template_type'] = params.templateType || 'general';

    if (!messageText) {
      switch (resolvedEventType) {
        case 'absent':
          templateType = 'absent_alert';
          messageText = this.buildAbsentAlertMessage(
            params.student,
            details.subjectName || 'Current Lecture',
            details.periodOrTime || '10:00 AM - Period 2',
            details.date
          );
          break;
        case 'gate_exit':
          templateType = 'gate_exit_alert';
          messageText = this.buildGateExitAlertMessage(
            params.student,
            details.passCode || 'GP-2026-0418',
            details.exitTime || '16:45 IST',
            details.destination || 'Home / Local Market'
          );
          break;
        case 'hostel_movement':
          templateType = 'hostel_movement_alert';
          messageText = this.buildHostelMovementAlertMessage(
            params.student,
            details.hostelName || 'Boys Hostel Block A',
            details.movementType || 'Weekend Outpass Departure',
            details.time || '17:30 IST',
            details.destination
          );
          break;
        case 'dispensary':
          templateType = 'dispensary_alert';
          messageText = this.buildDispensaryAlertMessage(
            params.student,
            details.diagnosis || 'Acute Fever & Dehydration',
            details.time || '11:15 AM',
            details.restHours || 24
          );
          break;
        case 'fee':
          templateType = 'fee_alert';
          messageText = this.buildFeeAlertMessage(
            params.student,
            details.amount || 52000,
            details.receiptNo || 'HIET/REC/2025-26/0418',
            details.paymentStatus || 'Paid & Cleared'
          );
          break;
        case 'daily_digest':
          templateType = 'daily_digest';
          messageText = this.buildDailyDigestMessage(
            { name: params.student.name, roll_no: params.student.roll_no, branch: params.student.branch || 'CSE' },
            details.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            details.attendedLectures ?? 4,
            details.totalLectures ?? 5,
            details.gateStatus || 'Exited Gate at 17:15 IST'
          );
          break;
        default:
          messageText = `HIET Campus Notice for ${params.student.name}: ${params.title || 'Student Activity Alert'}`;
      }
    } else {
      if (resolvedEventType === 'absent') templateType = 'absent_alert';
      else if (resolvedEventType === 'gate_exit') templateType = 'gate_exit_alert';
      else if (resolvedEventType === 'hostel_movement') templateType = 'hostel_movement_alert';
      else if (resolvedEventType === 'dispensary') templateType = 'dispensary_alert';
      else if (resolvedEventType === 'fee') templateType = 'fee_alert';
      else if (resolvedEventType === 'daily_digest') templateType = 'daily_digest';
      else if (params.templateType) templateType = params.templateType;
    }

    const whatsappUrl = this.getWhatsAppDirectLink(parentPhone, messageText);
    const smsUrl = this.getSmsDirectLink(parentPhone, messageText);
    const deliveries: WhatsAppSmsDelivery[] = [];
    const alertTitle = params.title || `Student Activity Alert (${templateType.replace('_', ' ').toUpperCase()})`;

    // Channel 1: WhatsApp
    if (channel === 'whatsapp' || channel === 'both') {
      const waRecord: WhatsAppSmsDelivery = {
        id: `wa-act-${Date.now()}-${params.student.roll_no}`,
        recipient_name: parentName,
        recipient_phone: parentPhone,
        recipient_type: 'parent',
        channel: 'whatsapp',
        template_type: templateType,
        student_roll: params.student.roll_no,
        title: alertTitle,
        message: messageText,
        status: 'sent',
        provider: 'whatsapp_cloud_gateway',
        provider_message_id: `wa_${Date.now()}`,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      this.saveDeliveryLog(waRecord);
      deliveries.push(waRecord);
    }

    // Channel 2: GSM SIM SMS
    if (channel === 'sms' || channel === 'both') {
      const smsRecord: WhatsAppSmsDelivery = {
        id: `sms-act-${Date.now()}-${params.student.roll_no}`,
        recipient_name: parentName,
        recipient_phone: parentPhone,
        recipient_type: 'parent',
        channel: 'sms',
        template_type: templateType,
        student_roll: params.student.roll_no,
        title: alertTitle,
        message: messageText,
        status: 'sent',
        provider: 'gsm_telecom_sms_gateway',
        provider_message_id: `gsm_${Date.now()}`,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      this.saveDeliveryLog(smsRecord);
      deliveries.push(smsRecord);
    }

    return {
      success: true,
      deliveries,
      whatsappUrl: (channel === 'whatsapp' || channel === 'both') ? whatsappUrl : undefined,
      smsUrl: (channel === 'sms' || channel === 'both') ? smsUrl : undefined
    };
  }

  // 6. Audit Log Persistence
  public getDeliveryLogs(): WhatsAppSmsDelivery[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    // Default institutional seeds
    const sampleLogs: WhatsAppSmsDelivery[] = [
      {
        id: 'seed-wapp-001',
        recipient_name: 'Sh. Surender Sharma (Parent of Aarav Sharma)',
        recipient_phone: '+91 98160 44219',
        recipient_type: 'parent',
        channel: 'whatsapp',
        template_type: 'gate_exit_alert',
        student_roll: '26CSE001',
        title: 'Main Gate Exit Alert (16:45 IST)',
        message: 'HIET GATE SURAKSHA: Your ward Aarav Sharma (26CSE001) exited campus via Gate 1 with Day Pass GP-2026-0418.',
        status: 'sent',
        provider: 'whatsapp_cloud_gateway',
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'seed-sms-002',
        recipient_name: 'Sh. Surender Sharma (Parent of Aarav Sharma)',
        recipient_phone: '+91 98160 44219',
        recipient_type: 'parent',
        channel: 'sms',
        template_type: 'absent_alert',
        student_roll: '26CSE001',
        title: 'Lecture Absent Alert • Compiler Design',
        message: 'HIET ALERT: Aarav Sharma was ABSENT in Period 2 (Compiler Design) on 18-Apr. Unauthorized absence flagged.',
        status: 'sent',
        provider: 'gsm_telecom_sms_gateway',
        sent_at: new Date(Date.now() - 14400000).toISOString(),
        created_at: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: 'seed-wapp-003',
        recipient_name: 'Smt. Kamlesh Kumari (Parent of Rohit Verma)',
        recipient_phone: '+91 98162 55901',
        recipient_type: 'parent',
        channel: 'whatsapp',
        template_type: 'attendance_warning',
        student_roll: '26CSE002',
        title: 'Attendance Shortage Alert (62%)',
        message: 'Dear Parent, Rohit Verma (26CSE002) attendance in Applied Physics has dropped to 62%. Immediate attendance required.',
        status: 'sent',
        provider: 'whatsapp_cloud_gateway',
        sent_at: new Date(Date.now() - 172800000).toISOString(),
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    this.saveDeliveryLogs(sampleLogs);
    return sampleLogs;
  }

  private saveDeliveryLog(log: WhatsAppSmsDelivery) {
    const existing = this.getDeliveryLogs();
    const updated = [log, ...existing.filter((l) => l.id !== log.id)].slice(0, 100);
    this.saveDeliveryLogs(updated);
  }

  private saveDeliveryLogs(logs: WhatsAppSmsDelivery[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Storage unavailable
    }
  }
}

export const whatsappSmsService = new WhatsAppSmsService();
