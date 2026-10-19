import { describe, it, expect } from 'vitest';
import { campusLifeStore, INITIAL_EMERGENCY_CONTACTS } from '../lib/campusLifeData';

describe('HIET Digital Campus — Emergency Contacts & Warden Separation Verification', () => {
  it('1. Confirms no unverified/fabricated phone numbers exist in emergency contacts', () => {
    const contacts = campusLifeStore.getEmergencyContacts();

    // Ensure no legacy unverified mock numbers (+9198160541...) exist
    const unverifiedNumbers = contacts.filter(c => 
      c.phone && (c.phone.includes('98160541') || c.phone.includes('+9198160541'))
    );
    expect(unverifiedNumbers.length).toBe(0);

    // Any contact that has a phone number MUST have is_verified === true
    contacts.forEach(c => {
      if (c.phone) {
        expect(c.is_verified).toBe(true);
      } else {
        expect(c.is_verified).toBeFalsy();
      }
    });
  });

  it('2. Confirms Boys Hostel Warden and Girls Hostel Warden appear as separate independent records', () => {
    const contacts = campusLifeStore.getEmergencyContacts();

    const boysWarden = contacts.find(c => c.title === 'Boys Hostel Warden');
    const girlsWarden = contacts.find(c => c.title === 'Girls Hostel Warden');

    expect(boysWarden).toBeDefined();
    expect(girlsWarden).toBeDefined();

    // Must be distinct records with distinct IDs
    expect(boysWarden?.id).not.toBe(girlsWarden?.id);
    expect(boysWarden?.department).toBe('Hostel Administration');
    expect(girlsWarden?.department).toBe('Hostel Administration');

    // Descriptions must match prompt specifications
    expect(boysWarden?.description).toContain("boys' hostel-related emergencies");
    expect(girlsWarden?.description).toContain("girls' hostel-related emergencies");
  });

  it('3. Confirms neither Boys Hostel Warden nor Girls Hostel Warden displays a phone number', () => {
    const contacts = campusLifeStore.getEmergencyContacts();

    const boysWarden = contacts.find(c => c.title === 'Boys Hostel Warden');
    const girlsWarden = contacts.find(c => c.title === 'Girls Hostel Warden');

    expect(boysWarden?.phone).toBeUndefined();
    expect(girlsWarden?.phone).toBeUndefined();
    expect(boysWarden?.whatsapp).toBeUndefined();
    expect(girlsWarden?.whatsapp).toBeUndefined();

    expect(boysWarden?.contact_status).toBe('not_provided');
    expect(girlsWarden?.contact_status).toBe('not_provided');
    expect(boysWarden?.status_label).toBe('Contact details not yet provided');
    expect(girlsWarden?.status_label).toBe('Contact details not yet provided');
  });

  it('4. Confirms Campus Ambulance, Security Gate, and Women Safety Cell have unverified numbers removed', () => {
    const contacts = campusLifeStore.getEmergencyContacts();

    const ambulance = contacts.find(c => c.title.includes('Ambulance'));
    const security = contacts.find(c => c.title.includes('Security Gate'));
    const womenSafety = contacts.find(c => c.title.includes("Women's Safety"));

    expect(ambulance).toBeDefined();
    expect(security).toBeDefined();
    expect(womenSafety).toBeDefined();

    expect(ambulance?.phone).toBeUndefined();
    expect(security?.phone).toBeUndefined();
    expect(womenSafety?.phone).toBeUndefined();

    expect(ambulance?.whatsapp).toBeUndefined();
    expect(security?.whatsapp).toBeUndefined();
    expect(womenSafety?.whatsapp).toBeUndefined();

    expect(ambulance?.status_label).toBe('Contact details pending verification');
    expect(security?.status_label).toBe('Contact details pending verification');
    expect(womenSafety?.status_label).toBe('Contact details pending verification');
  });

  it('5. Confirms that only verified official statutory helplines have phone numbers', () => {
    const contacts = campusLifeStore.getEmergencyContacts();
    const contactsWithPhone = contacts.filter(c => c.phone);

    // Only UGC Anti-Ragging and National Emergency Helpline should have verified numbers
    expect(contactsWithPhone.length).toBeGreaterThanOrEqual(1);
    contactsWithPhone.forEach(c => {
      expect(c.is_verified).toBe(true);
      expect(['18001805522', '112']).toContain(c.phone);
    });
  });

  it('6. Confirms getEmergencyContacts automatically sanitizes and invalidates stale unverified cache', () => {
    const memory = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => memory.get(key) || null,
      setItem: (key: string, val: string) => memory.set(key, val),
      removeItem: (key: string) => memory.delete(key),
      clear: () => memory.clear()
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = mockStorage;

    // Simulate legacy corrupt localStorage item with fake phone numbers
    const fakeLegacyContacts = [
      {
        id: 'legacy-001',
        title: 'Legacy Ambulance',
        department: 'Medical Services',
        phone: '+919816054101',
        location: 'Dispensary'
      }
    ];

    mockStorage.setItem('hiet_emergency_contacts', JSON.stringify(fakeLegacyContacts));

    // getEmergencyContacts must detect unverified number and fall back to clean INITIAL_EMERGENCY_CONTACTS
    const cleaned = campusLifeStore.getEmergencyContacts();
    expect(cleaned.some(c => c.phone && c.phone.includes('+9198160541'))).toBe(false);
    expect(cleaned.some(c => c.title === 'Boys Hostel Warden')).toBe(true);
    expect(cleaned.some(c => c.title === 'Girls Hostel Warden')).toBe(true);
  });
});
