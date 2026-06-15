import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from '../../api/axios';

describe('maintenancePlans API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMaintenancePlans fetches calendar with no params', async () => {
    const { getMaintenancePlans } = await import('../../api/maintenancePlans');
    await getMaintenancePlans();
    expect(api.get).toHaveBeenCalledWith('/maintenance-plans/calendar');
  });

  it('getMaintenancePlans filters null/undefined/empty params', async () => {
    const { getMaintenancePlans } = await import('../../api/maintenancePlans');
    await getMaintenancePlans({ status: 'ACTIVE', year: undefined, month: null, q: '' });
    expect(api.get).toHaveBeenCalledWith('/maintenance-plans/calendar?status=ACTIVE');
  });

  it('createMaintenancePlan posts data', async () => {
    const { createMaintenancePlan } = await import('../../api/maintenancePlans');
    const data = { deviceId: 1, frequency: 'monthly' };
    await createMaintenancePlan(data);
    expect(api.post).toHaveBeenCalledWith('/maintenance-plans/generate', data);
  });

  it('getMaintenancePlan fetches by id', async () => {
    const { getMaintenancePlan } = await import('../../api/maintenancePlans');
    await getMaintenancePlan(42);
    expect(api.get).toHaveBeenCalledWith('/maintenance-plans/42');
  });

  it('rescheduleOccurrence patches occurrence', async () => {
    const { rescheduleOccurrence } = await import('../../api/maintenancePlans');
    const data = { newDate: '2025-06-01' };
    await rescheduleOccurrence(10, data);
    expect(api.patch).toHaveBeenCalledWith('/maintenance-plans/occurrence/10/reschedule', data);
  });

  it('downloadFormular5 fetches blob', async () => {
    const { downloadFormular5 } = await import('../../api/maintenancePlans');
    await downloadFormular5(2025);
    expect(api.get).toHaveBeenCalledWith('/maintenance-plans/2025/formular5-pdf', { responseType: 'blob' });
  });
});

describe('mppExecutions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executeMpp posts data', async () => {
    const { executeMpp } = await import('../../api/mppExecutions');
    const data = { planId: 1, result: 'ok' };
    await executeMpp(data);
    expect(api.post).toHaveBeenCalledWith('/mpp-executions', data);
  });

  it('getMppExecution fetches by id', async () => {
    const { getMppExecution } = await import('../../api/mppExecutions');
    await getMppExecution(5);
    expect(api.get).toHaveBeenCalledWith('/mpp-executions/5');
  });

  it('downloadFormular6 fetches blob', async () => {
    const { downloadFormular6 } = await import('../../api/mppExecutions');
    await downloadFormular6(5);
    expect(api.get).toHaveBeenCalledWith('/mpp-executions/5/formular6-pdf', { responseType: 'blob' });
  });
});

describe('repairTickets API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRepairTickets fetches list', async () => {
    const { getRepairTickets } = await import('../../api/repairTickets');
    await getRepairTickets();
    expect(api.get).toHaveBeenCalledWith('/repair-tickets');
  });

  it('getRepairTickets filters params', async () => {
    const { getRepairTickets } = await import('../../api/repairTickets');
    await getRepairTickets({ status: 'DESCHIS', priority: null, q: '' });
    expect(api.get).toHaveBeenCalledWith('/repair-tickets?status=DESCHIS');
  });

  it('getRepairTicket fetches by id', async () => {
    const { getRepairTicket } = await import('../../api/repairTickets');
    await getRepairTicket(7);
    expect(api.get).toHaveBeenCalledWith('/repair-tickets/7');
  });

  it('createRepairTicket posts data', async () => {
    const { createRepairTicket } = await import('../../api/repairTickets');
    const data = { deviceId: 1, faultDescription: 'Broken' };
    await createRepairTicket(data);
    expect(api.post).toHaveBeenCalledWith('/repair-tickets', data);
  });

  it('updateTicketStatus patches status', async () => {
    const { updateTicketStatus } = await import('../../api/repairTickets');
    await updateTicketStatus(3, 'IN_LUCRU');
    expect(api.patch).toHaveBeenCalledWith('/repair-tickets/3/status', { newStatus: 'IN_LUCRU' });
  });

  it('triageTicket patches triage data', async () => {
    const { triageTicket } = await import('../../api/repairTickets');
    const data = { repairType: 'INTERN', defectCause: 'Wear' };
    await triageTicket(3, data);
    expect(api.patch).toHaveBeenCalledWith('/repair-tickets/3/triage', data);
  });

  it('submitRepair puts data', async () => {
    const { submitRepair } = await import('../../api/repairTickets');
    const data = { repairReport: 'Fixed' };
    await submitRepair(3, data);
    expect(api.put).toHaveBeenCalledWith('/repair-tickets/3/repair', data);
  });

  it('downloadFormular7Pdf fetches blob with params', async () => {
    const { downloadFormular7Pdf } = await import('../../api/repairTickets');
    await downloadFormular7Pdf({ status: 'INCHIS' });
    expect(api.get).toHaveBeenCalledWith('/repair-tickets/formular7-pdf?status=INCHIS', { responseType: 'blob' });
  });

  it('downloadFormular7Pdf with empty params', async () => {
    const { downloadFormular7Pdf } = await import('../../api/repairTickets');
    await downloadFormular7Pdf();
    expect(api.get).toHaveBeenCalledWith('/repair-tickets/formular7-pdf', { responseType: 'blob' });
  });

  it('downloadFormular8Pdf fetches blob by id', async () => {
    const { downloadFormular8Pdf } = await import('../../api/repairTickets');
    await downloadFormular8Pdf(3);
    expect(api.get).toHaveBeenCalledWith('/repair-tickets/3/formular8-pdf', { responseType: 'blob' });
  });

  it('downloadFormular9Pdf fetches blob by id', async () => {
    const { downloadFormular9Pdf } = await import('../../api/repairTickets');
    await downloadFormular9Pdf(3);
    expect(api.get).toHaveBeenCalledWith('/repair-tickets/3/handover-pdf', { responseType: 'blob' });
  });
});

describe('serviceContracts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProviders fetches list', async () => {
    const { getProviders } = await import('../../api/serviceContracts');
    await getProviders();
    expect(api.get).toHaveBeenCalledWith('/service-contracts/providers');
  });

  it('getProvider fetches by id', async () => {
    const { getProvider } = await import('../../api/serviceContracts');
    await getProvider(1);
    expect(api.get).toHaveBeenCalledWith('/service-contracts/providers/1');
  });

  it('createProvider posts data', async () => {
    const { createProvider } = await import('../../api/serviceContracts');
    const data = { name: 'Provider A' };
    await createProvider(data);
    expect(api.post).toHaveBeenCalledWith('/service-contracts/providers', data);
  });

  it('getContracts fetches with filtered params', async () => {
    const { getContracts } = await import('../../api/serviceContracts');
    await getContracts({ providerId: 1, status: null });
    expect(api.get).toHaveBeenCalledWith('/service-contracts/contracts?providerId=1');
  });

  it('createContract posts data', async () => {
    const { createContract } = await import('../../api/serviceContracts');
    const data = { providerId: 1, type: 'MAINTENANCE' };
    await createContract(data);
    expect(api.post).toHaveBeenCalledWith('/service-contracts/contracts', data);
  });

  it('rateProvider posts rating', async () => {
    const { rateProvider } = await import('../../api/serviceContracts');
    const data = { rating: 5, comment: 'Good' };
    await rateProvider(2, data);
    expect(api.post).toHaveBeenCalledWith('/service-contracts/providers/2/rate', data);
  });

  it('getCostAnalysis fetches analysis', async () => {
    const { getCostAnalysis } = await import('../../api/serviceContracts');
    await getCostAnalysis();
    expect(api.get).toHaveBeenCalledWith('/service-contracts/cost-analysis');
  });

  it('deleteContract deletes by id', async () => {
    const { deleteContract } = await import('../../api/serviceContracts');
    await deleteContract(5);
    expect(api.delete).toHaveBeenCalledWith('/service-contracts/contracts/5');
  });

  it('deleteProvider deletes by id', async () => {
    const { deleteProvider } = await import('../../api/serviceContracts');
    await deleteProvider(3);
    expect(api.delete).toHaveBeenCalledWith('/service-contracts/providers/3');
  });
});

describe('verifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getVerifications fetches list', async () => {
    const { getVerifications } = await import('../../api/verifications');
    await getVerifications();
    expect(api.get).toHaveBeenCalledWith('/verifications');
  });

  it('getVerifications filters params', async () => {
    const { getVerifications } = await import('../../api/verifications');
    await getVerifications({ status: 'CONFORM', deviceName: null, q: '' });
    expect(api.get).toHaveBeenCalledWith('/verifications?status=CONFORM');
  });

  it('getVerification fetches by id', async () => {
    const { getVerification } = await import('../../api/verifications');
    await getVerification(10);
    expect(api.get).toHaveBeenCalledWith('/verifications/10');
  });

  it('uploadVerification posts data', async () => {
    const { uploadVerification } = await import('../../api/verifications');
    const data = { deviceId: 1, result: 'CONFORM' };
    await uploadVerification(data);
    expect(api.post).toHaveBeenCalledWith('/verifications', data);
  });

  it('getComplianceReport fetches report', async () => {
    const { getComplianceReport } = await import('../../api/verifications');
    await getComplianceReport();
    expect(api.get).toHaveBeenCalledWith('/verifications/compliance-report');
  });

  it('deleteVerification deletes by id', async () => {
    const { deleteVerification } = await import('../../api/verifications');
    await deleteVerification(10);
    expect(api.delete).toHaveBeenCalledWith('/verifications/10');
  });

  it('downloadCertificate fetches blob', async () => {
    const { downloadCertificate } = await import('../../api/verifications');
    await downloadCertificate(10);
    expect(api.get).toHaveBeenCalledWith('/verifications/10/certificate', { responseType: 'blob' });
  });
});
