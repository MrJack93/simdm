import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProviders, getContracts, getCostAnalysis, createContract, rateProvider, deleteContract } from '../api/serviceContracts';
import { getDevices } from '../api/devices';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';

export default function ServiceContractsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ratingProvider, setRatingProvider] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [sortExpiry, setSortExpiry] = useState(null);

  const { data: providers = [], isLoading: loadingProviders } = useQuery({ queryKey: ['serviceProviders'], queryFn: getProviders });
  const { data: contractsData, isLoading: loadingContracts } = useQuery({ queryKey: ['serviceContracts'], queryFn: () => getContracts() });
  const { data: costAnalysis } = useQuery({ queryKey: ['costAnalysis'], queryFn: getCostAnalysis });
  const { data: _devicesData } = useQuery({ queryKey: ['devices'], queryFn: getDevices });

  const createMutation = useMutation({ mutationFn: createContract, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['serviceContracts'] }); queryClient.invalidateQueries({ queryKey: ['costAnalysis'] }); setShowCreateModal(false); } });
  const rateMutation = useMutation({ mutationFn: ({ id, data }) => rateProvider(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['serviceProviders'] }); setRatingProvider(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteContract, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['serviceContracts'] }); queryClient.invalidateQueries({ queryKey: ['costAnalysis'] }); setDeleteTarget(null); } });

  let contracts = contractsData?.data || [];
  if (filterActive) contracts = contracts.filter((c) => !c.isExpired);
  if (sortExpiry === 'asc') contracts = [...contracts].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  if (sortExpiry === 'desc') contracts = [...contracts].sort((a, b) => b.daysUntilExpiry - a.daysUntilExpiry);
  const devices = _devicesData?.devices || _devicesData?.data || [];

  if (loadingProviders || loadingContracts) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="mb-6">
          <Skeleton variant="line" width="w-1/3" height="h-8" className="mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl">Contracte Mentenanță Externă</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">Contract Nou</button>
      </div>

      <section className="mb-8">
        <h2 className="text-xl mb-4">Furnizori</h2>
        {(Array.isArray(providers) ? providers : []).length === 0 ? (
          <div className="p-8 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Nu sunt furnizori înregistrați</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(providers) ? providers : []).map((provider) => (
            <ProviderCard key={provider.id} provider={provider} onRate={() => setRatingProvider(provider)} />
          ))}
        </div>
        )}
      </section>

      {costAnalysis && (
        <section className="mb-8">
          <h2 className="text-xl mb-4">Analiză Costuri & Status Contracte</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Cost Mentenanță Internă', value: costAnalysis.internal?.totalCost, sub: `${costAnalysis.internal?.count} tichete`, avg: costAnalysis.comparison?.internalAvgPerRepair, border: 'var(--color-accent)' },
              { label: 'Cost Contracte Externe', value: costAnalysis.external?.totalValue, sub: `${costAnalysis.external?.contractCount} contracte`, avg: costAnalysis.comparison?.externalAvgPerContract, border: 'var(--color-info)' },
              { label: 'Diferență Cost', value: costAnalysis.comparison?.savings, sub: 'Economii vs intern', avg: null, border: 'var(--color-success)' },
            ].map((card) => (
              <div key={card.label} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', borderLeft: `4px solid ${card.border}` }}>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{card.label}</p>
                <p className="text-2xl font-medium" style={{ color: 'var(--color-text-primary)' }}>{card.value?.toLocaleString('ro-RO')} MDL</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{card.sub}</p>
                {card.avg && <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Medie: {parseFloat(card.avg)?.toLocaleString('ro-RO')} MDL</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Contracte</h2>
          <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary text-sm">Filtrare</button>
        </div>
        {showFilters && (
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
              <input type="checkbox" checked={filterActive} onChange={(e) => setFilterActive(e.target.checked)} className="w-4 h-4" />
              Active (neexpirate)
            </label>
          </div>
        )}
        <div className="rounded-xl overflow-auto" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Furnizor</th>
                <th className="px-6 py-3 text-left text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Contract</th>
                <th className="px-6 py-3 text-right text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Valoare</th>
                <th className="px-6 py-3 text-center text-xs uppercase cursor-pointer" style={{ color: 'var(--color-text-secondary)' }} onClick={() => setSortExpiry(sortExpiry === 'asc' ? 'desc' : 'asc')}>Expiră</th>
                <th className="px-6 py-3 text-center text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>Nu există contracte</td></tr>
              ) : contracts.map((contract) => (
                <tr key={contract.id} style={{ borderTop: '1px solid var(--color-border)', backgroundColor: contract.isExpired ? 'var(--color-error-bg)' : 'transparent' }}>
                  <td className="px-6 py-4" style={{ color: 'var(--color-text-primary)' }}>{contract.provider?.name}</td>
                  <td className="px-6 py-4" style={{ color: 'var(--color-text-primary)' }}>{contract.contractNo}</td>
                  <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-primary)' }}>{contract.value ? `${contract.value} MDL` : 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    {contract.isExpired ? <span style={{ color: 'var(--color-error)' }}>Expirat</span> : <span style={{ color: 'var(--color-success)' }}>{contract.daysUntilExpiry}z</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => setDeleteTarget(contract)}
                    >
                      Șterge
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showCreateModal && <CreateContractModal providers={Array.isArray(providers) ? providers : []} devices={devices} onClose={() => setShowCreateModal(false)} onCreate={(data) => createMutation.mutate(data)} />}
      {ratingProvider && <RateProviderModal provider={ratingProvider} onClose={() => setRatingProvider(null)} onRate={(data) => rateMutation.mutate({ id: ratingProvider.id, data })} />}
      {deleteTarget && <ConfirmModal message={`Ștergi contractul ${deleteTarget.contractNo}?`} onConfirm={() => deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

function ProviderCard({ provider, onRate }) {
  const ratingAvg = provider.ratingAvg ? Number(provider.ratingAvg) : null;
  return (
    <div className="p-4 rounded-xl transition-all" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>{provider.name}</h3>
      {provider.contact && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Contact: {provider.contact}</p>}
      {provider.email && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Email: {provider.email}</p>}
      {ratingAvg !== null && <p className="text-sm font-medium my-2" style={{ color: 'var(--color-warning)' }}>Rating: {ratingAvg.toFixed(1)} / 5</p>}
      <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>{provider._count?.contracts ?? 0} contracte · {provider._count?.ratings ?? 0} evaluări</p>
      <button onClick={onRate} className="w-full btn-secondary text-sm py-1">Evaluare</button>
    </div>
  );
}

function CreateContractModal({ providers, devices: _devices, onClose, onCreate }) {
  const [providerId, setProviderId] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    setFormError('');
    if (!providerId) { setFormError('Furnizorul este obligatoriu'); return; }
    if (!contractNo.trim()) { setFormError('Nr. contractului este obligatoriu'); return; }
    if (!startDate || !endDate) { setFormError('Datele sunt obligatorii'); return; }
    onCreate({ providerId: parseInt(providerId), contractNo, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), value: value ? parseFloat(value) : undefined, coveredDeviceIds: [] });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-modal-overlay">
      <div className="rounded-xl p-6 w-full max-w-md animate-modal-content" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-xl mb-4">Creare Contract</h2>
        <div className="space-y-3">
          <div><label htmlFor="provider-select" className="label-base">Furnizor</label><select id="provider-select" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="input-base"><option value="">-- Selectează --</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label htmlFor="contract-no" className="label-base">Contract Nr.</label><input id="contract-no" type="text" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className="input-base" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label htmlFor="start-date" className="label-base">Data Începere</label><input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-base" /></div><div><label htmlFor="end-date" className="label-base">Data Încheiere</label><input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-base" /></div></div>
          <div><label htmlFor="contract-value" className="label-base">Valoare (MDL)</label><input id="contract-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} className="input-base" /></div>
        </div>
        {formError && <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>{formError}</p>}
        <div className="flex gap-2 justify-end mt-4"><button onClick={onClose} className="btn-secondary">Anulare</button><button onClick={handleSubmit} className="btn-primary">Salvare</button></div>
      </div>
    </div>
  );
}

function RateProviderModal({ provider, onClose, onRate }) {
  const [score, setScore] = useState('5');
  const [comment, setComment] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-modal-overlay">
      <div className="rounded-xl p-6 w-full max-w-sm animate-modal-content" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-xl mb-4">Evaluare: {provider.name}</h2>
        <div className="space-y-3">
          <div><label htmlFor="score-select" className="label-base">Scor</label><select id="score-select" value={score} onChange={(e) => setScore(e.target.value)} className="input-base">{[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label htmlFor="comment-input" className="label-base">Comentariu</label><textarea id="comment-input" value={comment} onChange={(e) => setComment(e.target.value)} className="input-base h-20 resize-none" /></div>
        </div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={onClose} className="btn-secondary">Anulare</button><button onClick={() => { onRate({ score: parseInt(score), comment: comment || undefined }); onClose(); }} className="btn-primary">Salvare</button></div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-modal-overlay">
      <div className="rounded-xl p-6 w-full max-w-sm animate-modal-content" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <p className="mb-4" style={{ color: 'var(--color-text-primary)' }}>{message}</p>
        <div className="flex gap-2 justify-end"><button onClick={onCancel} className="btn-secondary">Anulare</button><button onClick={onConfirm} className="btn-danger">Confirmare</button></div>
      </div>
    </div>
  );
}
