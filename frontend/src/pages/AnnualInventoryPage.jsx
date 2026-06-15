import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonLines } from '../components/ui/skeleton';

function ChecklistModal({ year, section, devices, onClose, onSave }) {
  const initialItemsRef = useRef(
    devices.map(d => ({
      deviceId: d.id,
      found: false,
      locationFound: '',
    }))
  );
  const [items, setItems] = useState(initialItemsRef.current);
  const [loading, setLoading] = useState(false);

  const handleToggleFound = useCallback((deviceId) => {
    setItems(prev =>
      prev.map(item =>
        item.deviceId === deviceId ? { ...item, found: !item.found } : item
      )
    );
  }, []);

  const handleLocationChange = useCallback((deviceId, value) => {
    setItems(prev =>
      prev.map(item =>
        item.deviceId === deviceId ? { ...item, locationFound: value } : item
      )
    );
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post(`/annual-inventory/${year}/section/${section.sectionId || section.id}`, { items });
      toast.success('Inventariere salvată cu succes');
      onSave();
    } catch (err) {
      console.error(err);
      toast.error('Eroare la salvare inventariere');
    } finally {
      setLoading(false);
    }
  };

  const foundCount = items.filter(i => i.found).length;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in z-50 overflow-y-auto"
      style={{ backgroundColor: 'var(--overlay-medium)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl max-w-4xl w-full p-6 animate-slide-up my-8"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">Inventariere: {section.name} ({year})</h2>
        <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Progres: {foundCount} / {devices.length} dispozitive
        </p>

        <div className="mb-6 w-full bg-[var(--color-border)] rounded-full h-2">
          <div
            className="bg-[var(--color-success)] h-2 rounded-full transition-all"
            style={{ width: `${(foundCount / devices.length) * 100}%` }}
          />
        </div>

        <div className="overflow-auto mb-6" style={{ maxHeight: '400px' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                  Nr. Inventar
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                  Denumire
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                  Nr. Serie
                </th>
                <th scope="col" className="px-3 py-2 text-center font-semibold" style={{ color: 'var(--color-accent)' }}>
                  Gasit?
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                  Localizare
                </th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, idx) => {
                const item = items[idx] || { found: false, locationFound: '' };
                return (
                  <tr
                    key={device.id}
                    className="border-b hover:opacity-70"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--color-accent)' }}>
                      {device.inventoryNumber}
                    </td>
                    <td className="px-3 py-3">{device.name}</td>
                    <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {device.serialNumber || '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.found}
                        onChange={() => handleToggleFound(device.id)}
                        className="w-6 h-6 focusable"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={item.locationFound}
                        onChange={(e) => handleLocationChange(device.id, e.target.value)}
                        placeholder="Localizare actuala..."
                        className="input-base text-xs w-full"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            Anulare
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Se salvează...' : 'Salvare'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscrepanciesModal({ year, discrepancies, onClose, onVerify }) {
  const [loading, setLoading] = useState(false);

  const handleVerify = async (id) => {
    setLoading(true);
    try {
      await api.post(`/annual-inventory/${year}/discrepancies/${id}/verify`);
      toast.success('Discrepanță marcată ca verificată');
      onVerify();
    } catch (err) {
      console.error(err);
      toast.error('Eroare la verificare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-fade-in z-50 overflow-y-auto"
      style={{ backgroundColor: 'var(--overlay-medium)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl max-w-4xl w-full p-6 animate-slide-up my-8"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Discrepanțe Identificate</h2>
        <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {discrepancies.length} dispozitive nelocalizate
        </p>

        {discrepancies.length === 0 ? (
          <p className="text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
            Nici o discrepanță! ✅
          </p>
        ) : (
          <div className="overflow-auto mb-6" style={{ maxHeight: '400px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Nr. Inventar
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Denumire
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Secție
                  </th>
                  <th scope="col" className="px-3 py-2 text-center font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((disc) => (
                  <tr
                    key={disc.id}
                    className="border-b hover:opacity-70"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--color-accent)' }}>
                      {disc.device.inventoryNumber}
                    </td>
                    <td className="px-3 py-3">{disc.device.name}</td>
                    <td className="px-3 py-3">{disc.inventory.section.name}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleVerify(disc.id)}
                        disabled={loading || disc.status === 'VERIFIED'}
                        className="px-2 py-1 rounded text-xs font-semibold focusable hover:opacity-70"
                        style={{
                          backgroundColor: disc.status === 'VERIFIED' ? 'var(--color-disabled-bg)' : 'var(--color-accent)',
                          color: 'var(--color-on-primary)',
                        }}
                      >
                        {disc.status === 'VERIFIED' ? '✓ Verificată' : 'Verifica'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-primary flex-1">
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnnualInventoryPage() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSection, setSelectedSection] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDiscrepanciesModal, setShowDiscrepanciesModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  // Fetch available years
  const { data: yearsData } = useQuery({
    queryKey: ['annual-inventory-years'],
    queryFn: () => api.get('/annual-inventory/years').then(res => res.data),
  });

  // Fetch sections and their status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['annual-inventory-status', selectedYear],
    queryFn: () =>
      api.get(`/annual-inventory/${selectedYear}/status`).then(res => res.data),
    enabled: !!selectedYear,
  });

  // Fetch all devices for a section (for checklist modal)
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices-for-inventory', selectedSection?.sectionId],
    queryFn: () =>
      api.get(`/devices?sectionId=${selectedSection?.sectionId}&limit=1000`).then(res => res.data),
    enabled: !!selectedSection,
  });

  // Fetch discrepancies
  const { data: discrepanciesData } = useQuery({
    queryKey: ['annual-inventory-discrepancies', selectedYear],
    queryFn: () =>
      api.get(`/annual-inventory/${selectedYear}/discrepancies`).then(res => res.data),
    enabled: !!selectedYear && showDiscrepanciesModal,
  });

  const years = useMemo(() => yearsData || [], [yearsData]);

  const handleSectionClick = (sectionStatus) => {
    setSelectedSection(sectionStatus);
    setShowChecklistModal(true);
  };

  const handleChecklistSave = () => {
    setShowChecklistModal(false);
    setSelectedSection(null);
    queryClient.invalidateQueries({ queryKey: ['annual-inventory-status'] });
  };

  const handleResetInventory = (sectionId) => {
    setResetTarget(sectionId);
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    try {
      await api.delete(`/annual-inventory/${selectedYear}/section/${resetTarget}`);
      toast.success('Inventarierea a fost resetată');
      queryClient.invalidateQueries({ queryKey: ['annual-inventory-status'] });
    } catch (err) {
      console.error(err);
      toast.error('Eroare la resetare inventariere');
    } finally {
      setResetTarget(null);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/annual-inventory/import-fixed-assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['annual-inventory-status'] });
    } catch (error) {
      console.error(error);
      toast.error('Eroare la import fișier');
    } finally {
      setImportLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await api.get(`/annual-inventory/${selectedYear}/report-pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Raport_Inventariere_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Raport descărcat cu succes');
    } catch (error) {
      console.error(error);
      toast.error('Eroare la download raport');
    }
  };

  const sections = statusData || [];
  const devices = useMemo(() => devicesData?.devices || [], [devicesData]);

  return (
    <main id="main" className="p-6 min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">📅 Inventariere Anuală</h1>

        {/* Year Selector & Import */}
        <div className="card-base mb-6 p-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div>
            <label htmlFor="year-select" className="label-base">
              Selectează an:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-base inline-block w-48"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              id="file-import"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              disabled={importLoading}
              className="hidden"
            />
            <label htmlFor="file-import" className="btn-primary cursor-pointer inline-block disabled:opacity-50">
              {importLoading ? '⏳ Se încarcă...' : '📥 Import din Contabilitate'}
            </label>
          </div>
        </div>

        {/* Sections Grid */}
        {statusLoading ? (
          <div className="py-12"><Skeleton variant="card" lines={3} /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {sections.map((section) => {
                const progressPercent = section.percentage || 0;
                const statusColor = {
                  NOT_STARTED: 'var(--color-error)',
                  IN_PROGRESS: 'var(--color-warning)',
                  COMPLETED: 'var(--color-success)',
                }[section.status] || 'var(--color-status-decommissioned)';

                const statusLabel = {
                  NOT_STARTED: 'Nu a început',
                  IN_PROGRESS: 'În curs',
                  COMPLETED: 'Completată',
                }[section.status] || section.status;

                return (
                  <div
                    key={section.sectionId}
                    className="card-base p-4 relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <button
                        onClick={() => handleSectionClick(section)}
                        className="text-left focusable flex-1"
                      >
                        <h3 className="font-bold text-lg">{section.sectionName}</h3>
                      </button>
                      <button
                        onClick={() => handleResetInventory(section.sectionId)}
                        className="text-xs px-2 py-1 rounded opacity-50 hover:opacity-100 transition flex-shrink-0 ml-2"
                        style={{ color: 'var(--color-error)', border: '1px solid var(--color-error)' }}
                        title="Resetare inventariere"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="mb-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold inline-block"
                        style={{
                          backgroundColor: statusColor,
                          color: 'var(--color-on-primary)',
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {section.foundCount} / {section.totalCount} dispozitive
                      </p>
                      <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                        <div
                          className="bg-[var(--color-success)] h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                      {progressPercent}%
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Show Discrepancies Button */}
            {sections.some(s => s.foundCount < s.totalCount) && (
              <div className="card-base p-4 mb-6 flex gap-2">
                <button
                  onClick={() => setShowDiscrepanciesModal(true)}
                  className="btn-danger flex-1"
                >
                  🔍 Vizualizare Discrepanțe
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="btn-primary flex-1"
                >
                  📄 Descarcă Raport PDF
                </button>
              </div>
            )}
          </>
        )}

        {/* Checklist Modal */}
        {showChecklistModal && selectedSection && (
          devicesLoading ? (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowChecklistModal(false)}
            >
              <div
                className="rounded-xl p-8 text-center"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Skeleton variant="table" lines={3} />
              </div>
            </div>
          ) : (
            <ChecklistModal
              year={selectedYear}
              section={selectedSection}
              devices={devices}
              onClose={() => setShowChecklistModal(false)}
              onSave={handleChecklistSave}
            />
          )
        )}

        {/* Discrepancies Modal */}
        {showDiscrepanciesModal && (
          <DiscrepanciesModal
            year={selectedYear}
            discrepancies={discrepanciesData || []}
            onClose={() => setShowDiscrepanciesModal(false)}
            onVerify={() => queryClient.invalidateQueries({ queryKey: ['annual-inventory-discrepancies'] })}
          />
        )}

        {/* Reset Confirmation Modal */}
        {resetTarget && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={() => setResetTarget(null)}
          >
            <div
              className="rounded-xl p-6 w-full max-w-sm animate-slide-up"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-error-bg)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-error)' }}>
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
              </div>
              <h3
                className="text-lg font-medium text-center mb-2"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-text-primary)' }}
              >
                Resetare Inventariere
              </h3>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Sigur vrei să resetezi inventarierea pentru această secțiune? Datele existente vor fi șterse.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResetTarget(null)}
                  className="flex-1 btn-secondary"
                >
                  Anulare
                </button>
                <button
                  onClick={confirmReset}
                  className="flex-1 btn-danger"
                >
                  Resetare
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
