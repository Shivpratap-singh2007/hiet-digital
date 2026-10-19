import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '../lib/mockData';
import { apiService } from '../lib/supabase';
import { calculateItemMatch, findPotentialMatches, findUserReportMatches } from '../lib/lostFoundMatcher';
import { LostFoundItem } from '../types';

describe('HIET Digital Campus — Lost & Found Vault Tests', () => {
  beforeEach(() => {
    // Reset dataStore to clean state
    const all = dataStore.getLostFoundItems('all');
    expect(all.length).toBeGreaterThan(0);
  });

  it('1. Correctly separates lost items from found items in dataStore', () => {
    const allItems = dataStore.getLostFoundItems('all');
    const lostItems = dataStore.getLostFoundItems('lost');
    const foundItems = dataStore.getLostFoundItems('found');

    expect(allItems.length).toBe(lostItems.length + foundItems.length);
    expect(lostItems.every(i => i.report_type === 'lost')).toBe(true);
    expect(foundItems.every(i => i.report_type === 'found')).toBe(true);
  });

  it('2. Submits a new lost-item report with generated reference code and user attribution', async () => {
    const newLostReport: Partial<LostFoundItem> = {
      title: 'Sony WH-1000XM4 Headphones',
      category: 'Electronics',
      description: 'Silver wireless noise cancelling over-ear headphones left in study cube 4.',
      location: 'Central Library 1st Floor Study Cube 4',
      item_date: '2026-03-30',
      approximate_time: '03:30 PM',
      identifying_characteristics: 'Small scratch on right hinge; custom sticker "HIET-CSE" on case.',
      contact_preference: 'Institutional_Email',
      contact_email: 'aditi.sharma@hiet.ac.in',
      contact_phone: '+91 98160 12001',
      report_type: 'lost',
      reporter_name: 'Aditi Sharma',
      reporter_roll_or_emp: 'HIET-ECE-2026-001'
    };

    const saved = await apiService.saveLostFoundItem(newLostReport);

    expect(saved.id).toBeDefined();
    expect(saved.reference_code).toMatch(/^LOST-\d{4}-\d{4}$/);
    expect(saved.report_type).toBe('lost');
    expect(saved.status).toBe('Open');
    expect(saved.reporter_name).toBe('Aditi Sharma');
    expect(saved.reporter_roll_or_emp).toBe('HIET-ECE-2026-001');

    // Confirm it is retrievable via apiService
    const retrieved = await apiService.getLostFoundItems({ type: 'lost' });
    expect(retrieved.some(i => i.id === saved.id)).toBe(true);
  });

  it('3. Submits a new found-item report with custody status and challenge verification question', async () => {
    const newFoundReport: Partial<LostFoundItem> = {
      title: 'Sony Wireless Headphones in Black Zip Case',
      category: 'Electronics',
      description: 'Found on table in Library study cube area.',
      location: 'Central Library Cube 4',
      item_date: '2026-03-30',
      approximate_time: '04:00 PM',
      custody_status: 'Library_Desk',
      challenge_question: 'What distinctive sticker is on the outer carrying case?',
      challenge_answer: 'HIET-CSE',
      report_type: 'found',
      founder_name: 'Library Assistant'
    };

    const saved = await apiService.saveLostFoundItem(newFoundReport);

    expect(saved.id).toBeDefined();
    expect(saved.reference_code).toMatch(/^FOUND-\d{4}-\d{4}$/);
    expect(saved.report_type).toBe('found');
    expect(saved.status).toBe('Reported');
    expect(saved.custody_status).toBe('Library_Desk');
    expect(saved.challenge_question).toBe('What distinctive sticker is on the outer carrying case?');

    // Confirm it is retrievable via apiService
    const foundList = await apiService.getLostFoundItems({ type: 'found' });
    expect(foundList.some(i => i.id === saved.id)).toBe(true);
  });

  it('4. Matches lost and found reports using intelligent algorithmic criteria', () => {
    const lostCalculator: LostFoundItem = {
      id: 'test-lost-calc',
      reference_code: 'LOST-2026-9001',
      report_type: 'lost',
      title: 'Casio Scientific Calculator fx-991EX',
      category: 'Electronics',
      description: 'Dual powered calculator misplaced after Mathematics lecture in Block B.',
      location: 'Block B Lecture Hall 201',
      item_date: '2026-03-28',
      status: 'Open',
      reporter_name: 'Test Student',
      created_at: '2026-03-28T12:00:00Z'
    };

    const foundCalculator: LostFoundItem = {
      id: 'test-found-calc',
      reference_code: 'FOUND-2026-9002',
      report_type: 'found',
      title: 'HP Scientific Calculator fx-991',
      category: 'Electronics',
      description: 'Scientific calculator found on row 4 in LH-201 Block B.',
      location: 'LH-201 (Block B, 2nd Floor)',
      found_location: 'LH-201 (Block B, 2nd Floor)',
      item_date: '2026-03-28',
      status: 'Reported',
      reporter_name: 'Library Volunteer',
      created_at: '2026-03-28T12:30:00Z'
    };

    const matchResult = calculateItemMatch(lostCalculator, foundCalculator);
    expect(matchResult.score).toBeGreaterThanOrEqual(60);
    expect(matchResult.factors.some(f => f.includes('Matching category'))).toBe(true);
    expect(matchResult.factors.some(f => f.includes('Block B') || f.includes('location'))).toBe(true);

    // Verify findPotentialMatches returns this pair
    const suggestions = findPotentialMatches(lostCalculator, [foundCalculator]);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].matchScore).toBeGreaterThanOrEqual(60);
    expect(suggestions[0].lostItem.id).toBe('test-lost-calc');
    expect(suggestions[0].foundItem.id).toBe('test-found-calc');
  });

  it('5. Rejects matches with completely different categories and disparate dates', () => {
    const lostBackpack: LostFoundItem = {
      id: 'test-lost-bag',
      reference_code: 'LOST-2026-9003',
      report_type: 'lost',
      title: 'Navy Blue Wildcraft Laptop Backpack',
      category: 'Bags',
      description: 'Backpack left at pavilion after cricket practice.',
      location: 'Campus Sports Ground Pavilion',
      item_date: '2026-03-29',
      status: 'Open',
      reporter_name: 'Test Student',
      created_at: '2026-03-29T18:00:00Z'
    };

    const foundIdCard: LostFoundItem = {
      id: 'test-found-id',
      reference_code: 'FOUND-2026-9004',
      report_type: 'found',
      title: 'College ID Card & Metro Pass Holder',
      category: 'Documents/ID',
      description: 'Student ID card and bus pass in plastic casing.',
      location: 'Central Canteen Table 12',
      item_date: '2026-03-15',
      status: 'Reported',
      reporter_name: 'Security',
      created_at: '2026-03-15T14:00:00Z'
    };

    const matchResult = calculateItemMatch(lostBackpack, foundIdCard);
    expect(matchResult.score).toBeLessThan(40);

    const suggestions = findPotentialMatches(lostBackpack, [foundIdCard]);
    expect(suggestions.length).toBe(0);
  });

  it('6. Submits an ownership verification claim and transitions found item to Claim_Pending', async () => {
    const claim = await apiService.submitLostFoundClaim({
      item_id: 'lf-found-001',
      claimant_id: 'HIET-CSE-2026-001',
      claimant_name: 'Aarav Sharma',
      claimant_roll: 'HIET-CSE-2026-001',
      claimant_phone: '+91 98160 11001',
      challenge_response: 'Inner slider has HIET ECE 2026 written on it'
    });

    expect(claim.id).toBeDefined();
    expect(claim.status).toBe('Under_Verification');

    // Check that item status was updated to Claim_Pending
    const allItems = dataStore.getLostFoundItems('all');
    const targetItem = allItems.find(i => i.id === 'lf-found-001');
    expect(targetItem?.status).toBe('Claim_Pending');
  });

  it('7. Correctly finds match suggestions for reports filed by a specific user', () => {
    const allItems = dataStore.getLostFoundItems('all');
    // Student HIET-CSE-2026-001 reported lost calculator (lf-lost-001)
    const userMatches = findUserReportMatches('HIET-CSE-2026-001', allItems);
    expect(Array.isArray(userMatches)).toBe(true);
    // Should find the calculator match in Block B LH-201
    expect(userMatches.some(m => m.lostItem.id === 'lf-lost-001' && m.foundItem.id === 'lf-found-001')).toBe(true);
  });
});
