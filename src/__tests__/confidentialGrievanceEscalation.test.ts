import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../lib/supabase';
import { dataStore, DEFAULT_GRIEVANCE_CONFIG } from '../lib/mockData';
import { Complaint, GrievanceCategory } from '../types';
import fs from 'fs';
import path from 'path';

describe('HIET Digital Campus — Student Confidential Grievance Box & Escalation Hierarchy', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    // Reset grievance config to institutional defaults
    dataStore.setGrievanceConfig({
      ...DEFAULT_GRIEVANCE_CONFIG,
      principal_action_deadline_hours: 48,
      md_escalation_deadline_hours: 96,
      auto_reminder_enabled: true,
      auto_escalate_to_md_enabled: true,
      updated_at: new Date().toISOString()
    });
  });

  describe('1. Escalation Hierarchy: Stage 1 — Principal Review', () => {
    it('assigns every newly submitted grievance to Principal review with Pending Principal Review status', async () => {
      const created = await apiService.submitComplaint({
        student_id: 'std-cse-001',
        student_name: 'Aarav Sharma',
        student_roll: 'CSE001',
        category: 'Academic',
        priority: 'High',
        title: 'Discrepancy in Engineering Mathematics Internal Marks',
        description: 'Sessional marks uploaded for test 2 do not match evaluated answer sheet.',
        is_anonymous: false
      });

      expect(created.id).toBeDefined();
      expect(created.reference_id).toMatch(/^HIET-GRV-\d{4}-\d{6}$/);
      expect(created.status).toBe('Pending Principal Review');
      expect(created.current_stage).toBe('principal');
      expect(created.created_at).toBeDefined();

      // Escalation audit history records Stage 1
      expect(created.escalation_history).toBeDefined();
      expect(created.escalation_history!.length).toBeGreaterThanOrEqual(1);
      expect(created.escalation_history![0].stage).toBe('Stage 1: Principal Review');
      expect(created.escalation_history![0].action).toContain('Principal Review');

      // Notification sent to Principal (prof-principal-01)
      const notifications = dataStore.getNotifications();
      const principalNotif = notifications.find(
        n => n.recipient_user_id === 'prof-principal-01' && n.related_record_id === created.id
      );
      expect(principalNotif).toBeDefined();
      expect(principalNotif?.title).toContain('Stage 1: Principal Review');
      expect(principalNotif?.message).toContain(created.reference_id);
    });

    it('allows Principal to review grievance, add remarks, record action taken, and update status', async () => {
      const created = await apiService.submitComplaint({
        student_id: 'std-cse-001',
        category: 'Infrastructure',
        priority: 'Medium',
        title: 'Projector faulty in C-204 Lecture Hall',
        description: 'HDMI display flickering during morning lectures.',
        is_anonymous: true
      });

      // Principal reviews and records action
      const reviewSuccess = await apiService.reviewComplaintByPrincipal(created.id, {
        remarks: 'Estate officer instructed to inspect wiring and replace HDMI splitter.',
        actionTaken: 'Maintenance team dispatched to inspect C-204 lecture hall.',
        newStatus: 'Under Review'
      });

      expect(reviewSuccess).toBe(true);

      const refreshed = await apiService.getComplaintByReference(created.reference_id);
      expect(refreshed).toBeDefined();
      expect(refreshed?.status).toBe('Under Review');
      expect(refreshed?.principal_remarks).toContain('Estate officer instructed');
      expect(refreshed?.principal_action_taken).toContain('Maintenance team dispatched');
      expect(refreshed?.principal_reviewed_at).toBeDefined();

      // Audit trail contains Principal action
      const lastHistory = refreshed?.escalation_history?.[refreshed.escalation_history.length - 1];
      expect(lastHistory?.stage).toBe('Stage 1: Principal Review');
      expect(lastHistory?.actor_role).toBe('principal');
      expect(lastHistory?.action).toContain('Maintenance team dispatched');
    });
  });

  describe('2. Escalation Hierarchy: Stage 2 — 48-Hour Principal Reminder', () => {
    it('marks complaint as Principal Action Overdue and dispatches reminder if no action in 48 hours without jumping to MD', async () => {
      // Create a complaint submitted 50 hours ago (> 48h deadline)
      const pastDate = new Date(Date.now() - 50 * 3600 * 1000).toISOString();
      const created = await apiService.submitComplaint({
        student_id: 'std-cse-002',
        category: 'Hostel',
        priority: 'High',
        title: 'Water supply interruption in Block B Hostel',
        description: 'No overhead tank supply on the 2nd floor for two consecutive mornings.',
        is_anonymous: true
      });

      // Manually set created_at to 50 hours ago to simulate time elapse
      await apiService.updateComplaint(created.id, {
        created_at: pastDate,
        status: 'Pending Principal Review',
        principal_reminder_sent: false
      });

      // Run evaluation engine
      const evalResult = await apiService.evaluateGrievanceEscalations();
      expect(evalResult.overdueRemindersSent).toBeGreaterThanOrEqual(1);

      // Verify status and stage
      const refreshed = await apiService.getComplaintByReference(created.reference_id);
      expect(refreshed?.status).toBe('Principal Action Overdue');
      expect(refreshed?.current_stage).toBe('principal_overdue');
      expect(refreshed?.principal_reminder_sent).toBe(true);
      expect(refreshed?.principal_reminder_sent_at).toBeDefined();

      // Crucial: Must NOT have escalated to MD directly at this stage!
      expect(refreshed?.status).not.toBe('Escalated to MD');
      expect(refreshed?.escalated_to_md).toBeFalsy();

      // Reminder notification sent to Principal
      const notifs = dataStore.getNotifications();
      const overdueNotif = notifs.find(
        n => n.recipient_user_id === 'prof-principal-01' && 
             n.title.includes('Principal Action Overdue') && 
             n.related_record_id === created.id
      );
      expect(overdueNotif).toBeDefined();

      // Escalation history records Stage 2 reminder
      const stage2Entry = refreshed?.escalation_history?.find(h => h.stage === 'Stage 2: Principal Reminder');
      expect(stage2Entry).toBeDefined();
      expect(stage2Entry?.action).toContain('Principal Action Reminder Dispatched');
    });
  });

  describe('3. Escalation Hierarchy: Stage 3 — MD Escalation', () => {
    it('forwards to MD queue with status Escalated to MD when unresolved after Principal escalation deadline', async () => {
      // Create a complaint submitted 100 hours ago (> 96h MD deadline) that is currently Principal Action Overdue
      const pastDate = new Date(Date.now() - 100 * 3600 * 1000).toISOString();
      const created = await apiService.submitComplaint({
        student_id: 'std-cse-003',
        category: 'Harassment',
        priority: 'Urgent',
        title: 'Harassment reported near sports ground',
        description: 'Persistent intimidation incident reported by senior students near ground.',
        is_anonymous: true
      });

      // Set to overdue state 100h ago
      await apiService.updateComplaint(created.id, {
        created_at: pastDate,
        status: 'Principal Action Overdue',
        current_stage: 'principal_overdue',
        principal_reminder_sent: true,
        principal_reminder_sent_at: new Date(Date.now() - 52 * 3600 * 1000).toISOString()
      });

      // Evaluate escalation
      const evalResult = await apiService.evaluateGrievanceEscalations();
      expect(evalResult.escalatedToMd).toBeGreaterThanOrEqual(1);

      const refreshed = await apiService.getComplaintByReference(created.reference_id);
      expect(refreshed?.status).toBe('Escalated to MD');
      expect(refreshed?.current_stage).toBe('md');
      expect(refreshed?.escalated_to_md).toBe(true);
      expect(refreshed?.escalated_at).toBeDefined();
      expect(refreshed?.escalation_reason).toContain('Principal escalation stage');

      // Notification sent to MD (prof-md-01)
      const notifs = dataStore.getNotifications();
      const mdNotif = notifs.find(
        n => n.recipient_user_id === 'prof-md-01' && 
             n.title.includes('Escalated Grievance') &&
             n.related_record_id === created.id
      );
      expect(mdNotif).toBeDefined();

      // Escalation history records Stage 3
      const stage3Entry = refreshed?.escalation_history?.find(h => h.stage === 'Stage 3: MD Escalation');
      expect(stage3Entry).toBeDefined();
      expect(stage3Entry?.action).toContain('Managing Director');
    });

    it('allows MD to review escalated grievance, add remarks, and record final resolution', async () => {
      const created = await apiService.submitComplaint({
        student_id: 'std-cse-004',
        category: 'Safety',
        priority: 'Urgent',
        title: 'Broken boundary wall near girls hostel',
        description: 'Boundary section compromised after heavy rain.',
        is_anonymous: true
      });

      // Principal manually refers to MD
      await apiService.reviewComplaintByPrincipal(created.id, {
        remarks: 'Urgent infrastructure capital expenditure required above departmental limit.',
        actionTaken: 'Forwarded to Managing Director Desk for budget sign-off.',
        newStatus: 'Escalated to MD'
      });

      // MD records final resolution
      const mdResolveSuccess = await apiService.resolveComplaintByMD(created.id, {
        remarks: 'Executive sanction granted for ₹4,50,000 emergency boundary wall reconstruction.',
        resolution: 'Contract awarded and perimeter security team deployed 24/7 in interim.',
        newStatus: 'Resolved'
      });

      expect(mdResolveSuccess).toBe(true);

      const finalRecord = await apiService.getComplaintByReference(created.reference_id);
      expect(finalRecord?.status).toBe('Resolved');
      expect(finalRecord?.current_stage).toBe('resolved');
      expect(finalRecord?.md_resolution).toContain('Contract awarded');
      expect(finalRecord?.md_remarks).toContain('Executive sanction granted');
      expect(finalRecord?.md_resolved_at).toBeDefined();

      // Full audit history preserved
      const stages = finalRecord?.escalation_history?.map(h => h.stage);
      expect(stages).toContain('Stage 1: Principal Review');
      expect(stages).toContain('Stage 3: MD Escalation');
      expect(stages).toContain('Resolution');
    });
  });

  describe('4. Genuine Anonymous Mode & Identity Protection', () => {
    it('does not store or expose student name, roll number, email, or phone when anonymous is selected', async () => {
      const anonGrievance = await apiService.submitComplaint({
        student_id: 'std-cse-005',
        student_name: 'Confidential Person',
        student_roll: 'CSE-SECRET',
        category: 'Faculty Behaviour',
        priority: 'High',
        title: 'Unfair evaluation in computer network viva',
        description: 'Biased grading witnessed during oral laboratory evaluation.',
        is_anonymous: true
      });

      expect(anonGrievance.is_anonymous).toBe(true);
      expect(anonGrievance.student_name).toBe('Anonymous Student');
      expect(anonGrievance.student_roll).toBeUndefined();

      // Lookup via Reference ID strips student details
      const lookedUp = await apiService.getComplaintByReference(anonGrievance.reference_id);
      expect(lookedUp?.student_name).toBe('Anonymous Student');
      expect(lookedUp?.student_roll).toBeUndefined();
    });

    it('tracks grievance accurately by Reference ID without exposing complainant identity', async () => {
      const grievance = await apiService.submitComplaint({
        student_id: 'anonymous',
        category: 'Administration',
        priority: 'Medium',
        title: 'Delay in scholarship disbursement clearance',
        description: 'NSP scholarship documents submitted two weeks ago still pending at scholarship desk.',
        is_anonymous: true
      });

      const tracked = await apiService.getComplaintByReference(grievance.reference_id);
      expect(tracked).not.toBeNull();
      expect(tracked?.reference_id).toBe(grievance.reference_id);
      expect(tracked?.title).toBe('Delay in scholarship disbursement clearance');
      expect(tracked?.student_name).toBe('Anonymous Student');
      expect(tracked?.status).toBe('Pending Principal Review');
    });
  });

  describe('5. 9 Required Grievance Categories Support', () => {
    const requiredCategories: GrievanceCategory[] = [
      'Academic',
      'Faculty Behaviour',
      'Harassment',
      'Ragging',
      'Infrastructure',
      'Hostel',
      'Safety',
      'Administration',
      'Other'
    ];

    it.each(requiredCategories)('supports submitting grievance under category: %s', async (cat) => {
      const created = await apiService.submitComplaint({
        student_id: 'anonymous',
        category: cat,
        priority: 'Medium',
        title: `Test grievance for category ${cat}`,
        description: `Detailed description verifying that the grievance category ${cat} is fully supported and stored properly.`,
        is_anonymous: true
      });

      expect(created.category).toBe(cat);
      const fetched = await apiService.getComplaintByReference(created.reference_id);
      expect(fetched?.category).toBe(cat);
    });
  });

  describe('6. Configurable Escalation Deadlines', () => {
    it('allows administrators to configure escalation deadlines and honors updated thresholds', async () => {
      const initialConfig = apiService.getGrievanceConfig();
      expect(initialConfig.principal_action_deadline_hours).toBe(48);
      expect(initialConfig.md_escalation_deadline_hours).toBe(96);

      // Admin updates deadlines to 24h for Principal and 48h for MD
      apiService.updateGrievanceConfig({
        principal_action_deadline_hours: 24,
        md_escalation_deadline_hours: 48
      });

      const updatedConfig = apiService.getGrievanceConfig();
      expect(updatedConfig.principal_action_deadline_hours).toBe(24);
      expect(updatedConfig.md_escalation_deadline_hours).toBe(48);

      // Create complaint 26 hours ago (exceeds new 24h limit)
      const past26h = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
      const testComp = await apiService.submitComplaint({
        student_id: 'anonymous',
        category: 'Safety',
        priority: 'High',
        title: 'Broken railing on stairwell 3',
        description: 'Hazardous broken handrail near third floor staircase.',
        is_anonymous: true
      });

      await apiService.updateComplaint(testComp.id, {
        created_at: past26h,
        status: 'Pending Principal Review',
        principal_reminder_sent: false
      });

      await apiService.evaluateGrievanceEscalations();

      const refreshed = await apiService.getComplaintByReference(testComp.reference_id);
      // Because 26h >= 24h limit, it must trigger Stage 2 overdue reminder
      expect(refreshed?.status).toBe('Principal Action Overdue');
    });
  });

  describe('7. UI Architecture & Institutional Navy Blue Compliance', () => {
    it('verifies ComplaintBoxView does not contain red-to-orange gradient button or purple-to-maroon banner', () => {
      const filePath = path.resolve(__dirname, '../components/student/ComplaintBoxView.tsx');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Gradient button check
      expect(fileContent).not.toContain('from-rose-600 to-amber-600');
      // Purple-to-maroon banner check
      expect(fileContent).not.toContain('from-purple-950 via-slate-900 to-rose-950');

      // Navy Blue theme check
      expect(fileContent).toContain('#0f2942');
      // Reference ID Tracking check
      expect(fileContent).toContain('Track Grievance by Reference ID');
      // Anonymity choice and metadata warning check
      expect(fileContent).toContain('Anonymous Grievance Mode');
      expect(fileContent).toContain('Metadata Notice');

      // 9 Categories verified in file
      expect(fileContent).toContain("'Academic'");
      expect(fileContent).toContain("'Faculty Behaviour'");
      expect(fileContent).toContain("'Harassment'");
      expect(fileContent).toContain("'Ragging'");
      expect(fileContent).toContain("'Infrastructure'");
      expect(fileContent).toContain("'Hostel'");
      expect(fileContent).toContain("'Safety'");
      expect(fileContent).toContain("'Administration'");
      expect(fileContent).toContain("'Other'");
    });
  });
});
