import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVerifications, uploadVerification, getComplianceReport, deleteVerification, downloadCertificate } from '../api/verifications';
import { getDevices } from '../api/devices';
import { Button } from '../components/ui/button';

const TYPES = ['LABORATOR', 'METROLOGIC'];

export default function VerificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortByExpiry, setSortByExpiry] = useState(false);

  const limit = 50;

  const { data: verificationsData } = useQuery({
    queryKey: ['verifications', page, filterType, filterStatus],
    queryFn: () =>
      getVerifications({
        page,
        limit,
        type: filterType || undefined,
        status: filterStatus || undefined,
      }),
  });

  const { data: report } = useQuery({
    queryKey: ['complianceReport'],
    queryFn: getComplianceReport,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['complianceReport'] });
      setShowUploadModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['complianceReport'] });
      setDeleteTarget(null);
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  const handleDownloadCertificate = async (id) => {
    try {
      const blob = await downloadCertificate(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Buletin-Verificare-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Eroare la descărcarea buletinului');
    }
  };

  const handleDownloadComplianceReport = () => {
    if (!report || !report.devices) return;
    const rows = [
      ['Dispozitiv', 'Nr. Inventar', 'Tip Verificare', 'Status', 'Zile Ramase', 'Data Ultima Verificare', 'Valabil Până'],
      ...report.devices.map(d => [
        d.deviceName,
        d.inventoryNumber,
        d.verificationType || '',
        d.status,
        d.daysLeft ?? '',
        d.lastVerification ? new Date(d.lastVerification.performedAt).toLocaleDateString('ro-RO') : 'Neverificat',
        d.lastVerification ? new Date(d.lastVerification.validUntil).toLocaleDateString('ro-RO') : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Raport-Conformitate.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyFilter = (filterKey, value) => {
    if (filterKey === 'type') {
      setFilterType(filterType === value ? '' : value);
    } else {
      setFilterStatus(filterStatus === value ? '' : value);
    }
    setShowFilters(false);
  };

  let verifications = verificationsData?.data || [];
  // Client-side filtering (since mock may not filter server-side)
  if (filterType) {
    verifications = verifications.filter(v => v.verificationType === filterType);
  }
  if (filterStatus) {
    verifications = verifications.filter(v => v.status === filterStatus);
  }
  if (sortByExpiry) {
    verifications = [...verifications].sort(
      (a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime()
    );
  }

  const pagination = verificationsData?.pagination || { page: 1, total: 0 };
  const totalPages = Math.ceil(pagination.total / limit) || 1;

  const devices = devicesData?.devices || devicesData?.data || [];
  const conformPct = report && report.total > 0
    ? Math.round((report.conform / report.total) * 100)
    : 0;

  const getStatusColor = (status) => {
    if (status === 'CONFORM') return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
    if (status === 'EXPIRAT') return 'bg-[var(--color-error-bg)] text-[var(--color-error)]';
    if (status === 'NEVERIFICAT') return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
    if (status === 'NECONFORM') return 'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)]';
    return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]';
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl">Verificări Periodice</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary"
        >
          Încarcă Certificat
        </button>
      </div>

      {/* Compliance Report */}
      {report && (
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Raport Conformitate</h2>
            <button
              onClick={handleDownloadComplianceReport}
              className="btn-primary text-sm"
            >
              Descarca Raport (CSV)
            </button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg shadow text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Total</p>
              <p className="text-2xl font-bold text-[var(--color-info)]">{report.total}</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg shadow text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Valide</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{report.conform}</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg shadow text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Expira curand</p>
              <p className="text-2xl font-bold text-[var(--color-warning)]">{report.expiraCurand ?? 0}</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg shadow text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Expirat</p>
              <p className="text-2xl font-bold text-[var(--color-error)]">{report.expirat}</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg shadow text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Neconforme</p>
              <p className="text-2xl font-bold text-[var(--color-error)]">{report.neconform ?? 0}</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg shadow text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Conformitate</p>
              <p className="text-2xl font-bold text-[var(--color-info)]">{conformPct}%</p>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-bg-tertiary)]"
        >
          Filtrare
        </button>
      </div>

      {showFilters && (
        <div className="bg-[var(--color-bg-secondary)] p-4 rounded border mb-4">
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-sm font-medium mb-1">Tip Verificare</p>
              {TYPES.map((t) => (
                <label key={t} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterType === t}
                    onChange={() => applyFilter('type', t)}
                  />
                  <span className="text-xs text-[var(--color-text-primary)]">{t}</span>
                </label>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              {['CONFORM', 'EXPIRAT', 'EXPIRA_CURAND', 'NECONFORM', 'NEVERIFICAT'].map((s) => (
                <label key={s} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterStatus === s}
                    onChange={() => applyFilter('status', s)}
                  />
                  <span className="text-xs text-[var(--color-text-primary)]">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow overflow-x-auto mb-4">
        <table className="w-full">
          <thead className="bg-[var(--color-bg-tertiary)] border-b">
            <tr>
              <th role="columnheader" scope="col" className="px-6 py-3 text-left text-sm font-semibold">Dispozitiv</th>
              <th role="columnheader" scope="col" className="px-6 py-3 text-left text-sm font-semibold">Tip</th>
              <th role="columnheader" scope="col" className="px-6 py-3 text-left text-sm font-semibold">Efectuat</th>
              <th
                role="columnheader"
                scope="col"
                className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[var(--color-bg-elevated)]"
                onClick={() => setSortByExpiry((v) => !v)}
              >
                Valabil Până la
              </th>
              <th role="columnheader" scope="col" className="px-6 py-3 text-center text-sm font-semibold">Status</th>
              <th role="columnheader" scope="col" className="px-6 py-3 text-center text-sm font-semibold">Buletin</th>
              <th role="columnheader" scope="col" className="px-6 py-3 text-center text-sm font-semibold">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {verifications.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-[var(--color-text-tertiary)]">
                  Nu există verificări
                </td>
              </tr>
            ) : (
              verifications.map((v) => {
                const daysLeft = v.validUntil
                  ? Math.ceil(
                      (new Date(v.validUntil) - new Date()) / (1000 * 60 * 60 * 24)
                    )
                  : null;
                return (
                  <tr key={v.id} className="hover:bg-[var(--color-bg-tertiary)]">
                    <td className="px-6 py-4 text-sm font-medium">
                      {v.device?.name || v.deviceName}
                    </td>
                    <td className="px-6 py-4 text-sm">{v.verificationType || v.type}</td>
                    <td className="px-6 py-4 text-sm">
                      {v.performedAt
                        ? new Date(v.performedAt).toLocaleDateString('ro-RO')
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {v.validUntil
                        ? new Date(v.validUntil).toLocaleDateString('ro-RO')
                        : '—'}
                      {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--color-warning)' }}>
                          Expiră în {daysLeft} zile
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(v.status)}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDownloadCertificate(v.id)}
                        className="px-2 py-1 text-xs bg-[var(--color-info-bg)] text-[var(--color-info)] rounded hover:bg-[var(--color-info-bg)]"
                      >
                        PDF
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleteTarget(v)}
                        className="px-2 py-1 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded hover:bg-[var(--color-error-bg)]"
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 items-center">
        <Button
          size="xl"
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Pagina anterioară
        </Button>
        <span className="px-3 py-2 min-h-[44px] flex items-center">
          {page} / {totalPages}
        </span>
        <Button
          size="xl"
          variant="outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Pagina următoare
        </Button>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          devices={devices}
          onClose={() => setShowUploadModal(false)}
          onUpload={(data) => uploadMutation.mutate(data)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message="Ești sigur? Verificarea va fi ștearsă definitiv."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function UploadModal({ devices, onClose, onUpload }) {
  const [deviceId, setDeviceId] = useState('');
  const [type, setType] = useState('METROLOGIC');
  const [performedAt, setPerformedAt] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [certificateNo, setCertificateNo] = useState('');
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    setFormError('');
    if (!deviceId) { setFormError('Câmpul Dispozitiv este obligatoriu'); return; }
    if (!type) { setFormError('Câmpul Tip Verificare este obligatoriu'); return; }
    if (!file) { setFormError('Fișierul certificat este obligatoriu'); return; }
    onUpload({
      deviceId: parseInt(deviceId),
      type,
      performedAt: performedAt ? new Date(performedAt).toISOString() : new Date().toISOString(),
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      certificateNo: certificateNo || undefined,
      result: 'CONFORM',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--overlay-light)' }}>
      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Încarcă Certificat</h2>

        <div className="mb-3">
          <label htmlFor="verif-device" className="block font-medium mb-1">Dispozitiv</label>
          <select id="verif-device" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="w-full border px-3 py-2 rounded">
            <option value="">-- Selectează --</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="verif-type" className="block font-medium mb-1">Tip Verificare</label>
          <select id="verif-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full border px-3 py-2 rounded">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="cert-no" className="block font-medium mb-1">Nr. Certificat</label>
          <input id="cert-no" type="text" value={certificateNo} onChange={(e) => setCertificateNo(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-3">
          <label htmlFor="verif-performed" className="block font-medium mb-1">Data Efectuării</label>
          <input id="verif-performed" type="date" value={performedAt} onChange={(e) => setPerformedAt(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-3">
          <label htmlFor="verif-valid" className="block font-medium mb-1">Valabil Până</label>
          <input id="verif-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-3">
          <label htmlFor="cert-file" className="block font-medium mb-1">Fișier Certificat</label>
          <input id="cert-file" type="file" accept=".pdf,.jpg,.png" onChange={(e) => setFile(e.target.files?.[0])} className="w-full" />
        </div>

        {formError && <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{formError}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-[var(--color-bg-tertiary)]">Anulare</button>
          <button type="button" onClick={handleSubmit} className="btn-primary">Salvare</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6 w-full max-w-sm shadow-xl">
        <p className="mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-[var(--color-bg-tertiary)]">Anulare</button>
          <button type="button" onClick={onConfirm} className="btn-danger">Confirmare</button>
        </div>
      </div>
    </div>
  );
}
