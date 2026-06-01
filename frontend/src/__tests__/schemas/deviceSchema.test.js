import { describe, it, expect } from 'vitest';
import { deviceSchema } from '../../schemas/deviceSchema';

// Obiect de bază valid — fiecare test pornește de la el și schimbă un singur câmp.
const validDevice = {
  inventoryNumber: 'DM-2024-001',
  name: 'Defibrilator',
  riskClass: 'IIb',
  status: 'FUNCTIONAL',
  sectionId: 3,
};

describe('deviceSchema', () => {
  it('acceptă un dispozitiv valid complet', () => {
    const result = deviceSchema.safeParse(validDevice);
    expect(result.success).toBe(true);
  });

  it('respinge inventoryNumber cu litere mici (regex /^[A-Z0-9\\-]+$/)', () => {
    const result = deviceSchema.safeParse({
      ...validDevice,
      inventoryNumber: 'dm-2024-001',
    });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === 'inventoryNumber');
    expect(issue.message).toMatch(/Doar litere majuscule, cifre și liniuțe/);
  });

  it('respinge name cu doar 2 caractere (min 3)', () => {
    const result = deviceSchema.safeParse({ ...validDevice, name: 'AB' });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === 'name');
    expect(issue.message).toMatch(/cel puțin 3 caractere/);
  });

  it('respinge o clasă de risc invalidă (enum I/IIa/IIb/III)', () => {
    const result = deviceSchema.safeParse({ ...validDevice, riskClass: 'IV' });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === 'riskClass');
    expect(issue).toBeDefined();
  });

  it('respinge sectionId null / lipsă (obligatoriu, min 1)', () => {
    const result = deviceSchema.safeParse({ ...validDevice, sectionId: null });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === 'sectionId');
    expect(issue).toBeDefined();
  });

  it('respinge yearMade din viitor (max anul curent + 1)', () => {
    const futureYear = new Date().getFullYear() + 5;
    const result = deviceSchema.safeParse({ ...validDevice, yearMade: futureYear });
    expect(result.success).toBe(false);
    const issue = result.error.issues.find((i) => i.path[0] === 'yearMade');
    expect(issue).toBeDefined();
  });
});
