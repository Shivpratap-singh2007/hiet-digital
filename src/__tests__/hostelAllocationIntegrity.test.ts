import { describe, it, expect, beforeEach } from 'vitest';
import { verifyHostelAllocation, isGirlsHostel, isBoysHostel } from '../lib/hostelValidation';
import { dataStore } from '../lib/mockData';
import { apiService } from '../lib/supabase';
import type { StudentMaster } from '../types';

describe('Hostel Allocation & Gender Data Integrity Tests', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('correctly identifies Girls and Boys hostel identifiers', () => {
    expect(isGirlsHostel('Girls Hostel Block A')).toBe(true);
    expect(isGirlsHostel('GIRLS-HOSTEL-A')).toBe(true);
    expect(isGirlsHostel('Boys Hostel Block B')).toBe(false);

    expect(isBoysHostel('Boys Hostel Block B')).toBe(true);
    expect(isBoysHostel('BOYS-HOSTEL-B')).toBe(true);
    expect(isBoysHostel('Block A (Boys)')).toBe(true);
    expect(isBoysHostel('Girls Hostel Block A')).toBe(false);
  });

  it('authoritatively identifies Aditi Sharma as Female residing in Girls Hostel Block A', () => {
    const students = dataStore.getStudentsMaster();
    const aditi = students.find(s => s.roll_no === 'HIET-ECE-2026-001');

    expect(aditi).toBeDefined();
    expect(aditi?.name).toBe('Aditi Sharma');
    expect(aditi?.gender).toBe('Female');
    expect(aditi?.hostel_name || aditi?.hostel_code).toBe('Girls Hostel Block A');
  });

  it('flags gender mismatch when female student is assigned to Boys Hostel', () => {
    const aditi: StudentMaster = {
      id: 'std-demo-16',
      roll_no: 'HIET-ECE-2026-001',
      name: 'Aditi Sharma',
      gender: 'Female',
      course: 'B.Tech',
      branch: 'ECE',
      semester: 1,
      section: 'A',
      college_email: 'aditi.ece01@hiet.demo',
      phone: '+91 98160 44016',
      hostel_name: 'Girls Hostel Block A',
      hostel_code: 'GIRLS-HOSTEL-A',
      room_no: 'R-206',
      status: 'active'
    };

    // Simulated bug: Outpass was displaying "Block A (Boys)" with Room "#204"
    const check = verifyHostelAllocation(aditi, 'Block A (Boys)', '204');
    expect(check.status).toBe('gender_mismatch');
    expect(check.isValid).toBe(false);
    expect(check.badgeText).toBe('Allocation Mismatch');
    expect(check.warning?.toLowerCase()).toContain('female student assigned to a boys hostel block');
  });

  it('verifies female student assigned to Girls Hostel Block A', () => {
    const aditi: StudentMaster = {
      id: 'std-demo-16',
      roll_no: 'HIET-ECE-2026-001',
      name: 'Aditi Sharma',
      gender: 'Female',
      course: 'B.Tech',
      branch: 'ECE',
      semester: 1,
      section: 'A',
      college_email: 'aditi.ece01@hiet.demo',
      phone: '+91 98160 44016',
      hostel_name: 'Girls Hostel Block A',
      hostel_code: 'GIRLS-HOSTEL-A',
      room_no: 'R-206',
      status: 'active'
    };

    const check = verifyHostelAllocation(aditi, 'Girls Hostel Block A', 'R-206');
    expect(check.status).toBe('verified');
    expect(check.isValid).toBe(true);
    expect(check.displayHostel).toBe('Girls Hostel Block A');
    expect(check.displayRoom).toBe('R-206');
    expect(check.badgeText).toBe('Verified Resident');
  });

  it('flags gender mismatch when male student is assigned to Girls Hostel', () => {
    const aditya: StudentMaster = {
      id: 'std-demo-1',
      roll_no: 'HIET-CSE-2026-001',
      name: 'Aditya Nanda',
      gender: 'Male',
      course: 'B.Tech',
      branch: 'CSE',
      semester: 1,
      section: 'A',
      college_email: 'aditya.cse01@hiet.demo',
      phone: '+91 98160 44001',
      hostel_name: 'Boys Hostel Block B',
      hostel_code: 'BOYS-HOSTEL-B',
      room_no: 'R-001',
      status: 'active'
    };

    const check = verifyHostelAllocation(aditya, 'Girls Hostel Block A', 'R-003');
    expect(check.status).toBe('gender_mismatch');
    expect(check.isValid).toBe(false);
    expect(check.warning?.toLowerCase()).toContain('male student assigned to a girls hostel block');
  });

  it('correctly handles Day Scholar students', () => {
    const dayScholar: StudentMaster = {
      id: 'std-demo-7',
      roll_no: 'HIET-CSE-2026-007',
      name: 'Karan Thakur',
      gender: 'Male',
      course: 'B.Tech',
      branch: 'CSE',
      semester: 1,
      section: 'A',
      college_email: 'karan.cse07@hiet.demo',
      phone: '+91 98160 44007',
      hostel_name: 'Day Scholar',
      hostel_code: 'Day Scholar',
      status: 'active'
    };

    const check = verifyHostelAllocation(dayScholar, 'Boys Hostel Block B', 'R-101');
    expect(check.status).toBe('day_scholar');
    expect(check.isValid).toBe(false);
    expect(check.badgeText).toBe('Day Scholar');
  });

  it('handles missing hostel allocations without inventing arbitrary defaults', () => {
    const unallocated: StudentMaster = {
      id: 'std-demo-99',
      roll_no: 'HIET-CSE-2026-099',
      name: 'New Student',
      gender: 'Male',
      course: 'B.Tech',
      branch: 'CSE',
      semester: 1,
      section: 'A',
      college_email: 'new.student@hiet.demo',
      phone: '+91 98160 44099',
      status: 'active'
    };

    const check = verifyHostelAllocation(unallocated);
    expect(check.status).toBe('not_assigned');
    expect(check.isValid).toBe(false);
    expect(check.displayHostel).toBe('Not Assigned');
    expect(check.badgeText).toBe('Not Assigned');
  });

  it('handles unverified students whose IDs do not exist in master records', () => {
    const check = verifyHostelAllocation(null, 'Block A (Boys)', '204');
    expect(check.status).toBe('unverified');
    expect(check.isValid).toBe(false);
    expect(check.badgeText).toBe('Verification Required');
  });

  it('apiService.getHostelOutpasses correctly loads and verifies outpass records', async () => {
    const outpasses = await apiService.getHostelOutpasses();
    expect(outpasses.length).toBeGreaterThan(0);

    const aditiPass = outpasses.find(p => p.student_roll === 'HIET-ECE-2026-001');
    expect(aditiPass).toBeDefined();
    expect(aditiPass?.student_name).toBe('Aditi Sharma');
    expect(aditiPass?.hostel_block).toBe('Girls Hostel Block A');
    expect(aditiPass?.room_number).toBe(dataStore.getStudentsMaster().find(s => s.roll_no === 'HIET-ECE-2026-001')?.room_no);
    expect(aditiPass?.hostel_block).not.toContain('Boys');
  });

  it('apiService.createHostelOutpass prevents day scholars and gender mismatches', async () => {
    // Attempt to create outpass for female student in Boys Hostel
    await expect(
      apiService.createHostelOutpass({
        student_id: 'std-demo-16',
        student_name: 'Aditi Sharma',
        student_roll: 'HIET-ECE-2026-001',
        branch: 'ECE',
        hostel_block: 'Block A (Boys)',
        room_number: '204',
        destination: 'Shimla',
        departure_date: '2026-10-20',
        departure_time: '16:00',
        expected_return_date: '2026-10-22',
        expected_return_time: '18:00',
        parent_contact: '+91 98165 55016',
        reason: 'Weekend visit',
        status: 'Pending',
        qr_token: 'TEST-MISMATCH-TOKEN'
      })
    ).rejects.toThrow(/Data Integrity Error/);
  });
});
