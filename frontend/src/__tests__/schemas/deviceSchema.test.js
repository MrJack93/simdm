import { describe, it, expect } from 'vitest';
import { deviceSchema } from '../../schemas/deviceSchema';

describe('deviceSchema', () => {
  describe('valid device', () => {
    it('accepts a complete valid device', () => {
      const valid = {
        inventoryNumber: 'DM-001',
        name: 'USG Laptop',
        riskClass: 'IIa',
        status: 'FUNCTIONAL',
        sectionId: 1,
      };
      const result = deviceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts device with optional fields', () => {
      const valid = {
        inventoryNumber: 'DM-002',
        name: 'Ventilator',
        model: 'Hamilton C6',
        serialNumber: 'SN-12345',
        manufacturer: 'Hamilton',
        yearMade: 2020,
        riskClass: 'IIb',
        status: 'IN_REPARATIE',
        sectionId: 2,
        location: 'Terapie Intensivă',
        countryOfOrigin: 'Elveția',
        purchasePrice: 15000,
        currency: 'MDL',
        ceMarking: 'CE-123',
        cndCode: 'CND-01',
        maintenanceSchedule: 12,
        notes: 'Dispozitiv critical',
      };
      const result = deviceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid device', () => {
    it('rejects missing inventoryNumber', () => {
      const result = deviceSchema.safeParse({ name: 'Test', status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects empty inventoryNumber', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: '', name: 'Test', status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid inventoryNumber format', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'dm-001', name: 'Test', status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects name shorter than 3 chars', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'AB', status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid riskClass', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', riskClass: 'IV', status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', status: 'UNKNOWN', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects missing sectionId', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', status: 'FUNCTIONAL' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid yearMade (too old)', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', yearMade: 1800, status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects negative purchasePrice', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', purchasePrice: -100, status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects maintenanceSchedule < 1', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', maintenanceSchedule: 0, status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(false);
    });
  });

  describe('optional field handling', () => {
    const base = { inventoryNumber: 'DM-001', name: 'Test', status: 'FUNCTIONAL', sectionId: 1, riskClass: 'IIa' };

    it('defaults currency to MDL', () => {
      const result = deviceSchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.currency).toBe('MDL');
    });

    it('converts empty strings to undefined for optional fields', () => {
      const result = deviceSchema.safeParse({
        ...base, model: '', serialNumber: '', manufacturer: '', location: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBeUndefined();
        expect(result.data.serialNumber).toBeUndefined();
      }
    });

    it('accepts null for optional date fields', () => {
      const result = deviceSchema.safeParse({
        ...base, acquisitionDate: null, installationDate: null, warrantyExpiry: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('all risk classes', () => {
    ['I', 'IIa', 'IIb', 'III'].forEach((rc) => {
      it(`accepts riskClass "${rc}"`, () => {
        const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', riskClass: rc, status: 'FUNCTIONAL', sectionId: 1 });
        expect(result.success).toBe(true);
      });
    });

    it('accepts empty riskClass', () => {
      const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', riskClass: '', status: 'FUNCTIONAL', sectionId: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe('all statuses', () => {
    ['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA'].forEach((s) => {
      it(`accepts status "${s}"`, () => {
        const result = deviceSchema.safeParse({ inventoryNumber: 'DM-001', name: 'Test', riskClass: 'IIa', status: s, sectionId: 1 });
        expect(result.success).toBe(true);
      });
    });
  });
});
