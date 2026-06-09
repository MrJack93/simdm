import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProviders,
  getContracts,
  getCostAnalysis,
  createContract,
  rateProvider,
} from '../api/serviceContracts';
import { getDevices } from '../api/devices';

export default function ServiceContractsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ratingProvider, setRatingProvider] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [sortExpiry, setSortExpiry] = useState(null); // 'asc' | 'desc' | null

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['serviceProviders'],
    queryFn: getProviders,
  });

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['serviceContracts'],
    queryFn: () => getContracts(),
  });

  const { data: costAnalysis } = useQuery({
    queryKey: ['costAnalysis'],
    queryFn: getCostAnalysis,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceContracts'] });
      setShowCreateModal(false);
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, data }) => rateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] });
      setRatingProvider(null);
    },
  });

  let contracts = contractsData?.data || [];
  if (filterActive) contracts = contracts.filter((c) => !c.isExpired);
  if (sortExpiry === 'asc') contracts = [...contracts].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  if (sortExpiry === 'desc') contracts = [...contracts].sort((a, b) => b.daysUntilExpiry - a.daysUntilExpiry);

  const devices = devicesData?.devices || devicesData?.data || [];

  if (loadingProviders || loadingContracts) {
    return <div className="p-6 text-center">Încârcând...</div>;
  }

  const handleDeleteConfirm = () => setDeleteTarget(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contracte Mentenanță Externă</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Contract Nou
        </button>
      </div>

      {/* Providers */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Furnizori</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(providers) ? providers : []).map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onRate={() => setRatingProvider(provider)}
            />
          ))}
        </div>
      </section>

      {/* Cost Analysis */}
      {costAnalysis && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Cost Analysis</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Cost Intern</p>
              <p className="text-2xl font-bold">{costAnalysis.internal?.totalCost}</p>
              <p className="text-xs text-gray-500">{costAnalysis.internal?.count} reparații</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Cost Extern</p>
              <p className="text-2xl font-bold">{costAnalysis.external?.totalValue}</p>
              <p className="text-xs text-gray-500">{costAnalysis.external?.contractCount} contracte</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Economii</p>
              <p className="text-2xl font-bold">{costAnalysis.comparison?.savings}</p>
              <p className="text-xs text-gray-500">
                Economii totale
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Contracts table */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Contracte</h2>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Filtrare
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded border mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filterActive}
                onChange={(e) => setFilterActive(e.target.checked)}
              />
              Active (neexpirate)
            </label>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Furnizor</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold">Contract</th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-semibold">Valoare</th>
                <th
                  scope="col"
                  role="columnheader"
                  className="px-6 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-gray-200"
                  onClick={() => setSortExpiry(sortExpiry === 'asc' ? 'desc' : 'asc')}
                >
                  Expiră
                </th>
                <th scope="col" className="px-6 py-3 text-center text-sm font-semibold">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Nu există contracte
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className={`hover:bg-gray-50 ${contract.isExpired ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">Furnizor: {contract.provider?.name}</td>
                    <td className="px-6 py-4 text-sm">{contract.contractNo}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      {contract.value ? `${contract.value} MDL` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {contract.isExpired ? (
                        <span className="text-red-600 font-semibold">Expirat</span>
                      ) : (
                        <span className="text-green-700">{contract.daysUntilExpiry}z</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleteTarget(contract)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      {showCreateModal && (
        <CreateContractModal
          providers={Array.isArray(providers) ? providers : []}
          devices={devices}
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}

      {ratingProvider && (
        <RateProviderModal
          provider={ratingProvider}
          onClose={() => setRatingProvider(null)}
          onRate={(data) => rateMutation.mutate({ id: ratingProvider.id, data })}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Ești sigur? Contractul ${deleteTarget.contractNo} va fi șters.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function ProviderCard({ provider, onRate }) {
  const ratingAvg = provider.ratingAvg ? Number(provider.ratingAvg) : null;
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-lg transition">
      <h3 className="font-bold text-gray-900 mb-2">{provider.name}</h3>
      {provider.contact && <p className="text-xs text-gray-600">Contact: {provider.contact}</p>}
      {provider.email && <p className="text-xs text-gray-600">Email: {provider.email}</p>}
      {ratingAvg !== null && (
        <p className="text-sm font-semibold text-yellow-600 my-2">
          Rating: {ratingAvg.toFixed(1)} / 5
        </p>
      )}
      <div className="text-xs text-gray-500 mb-3">
        {provider._count?.contracts ?? 0} contracte · {provider._count?.ratings ?? 0} evaluări
      </div>
      <button
        onClick={onRate}
        className="w-full px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
      >
        Evaluare
      </button>
    </div>
  );
}

function CreateContractModal({ providers, devices, onClose, onCreate }) {
  const [providerId, setProviderId] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    setFormError('');
    if (!providerId) { setFormError('Câmpul Furnizor este obligatoriu'); return; }
    if (!contractNo.trim()) { setFormError('Câmpul Contract Nr. este obligatoriu'); return; }
    if (!startDate) { setFormError('Câmpul Data Începere este obligatoriu'); return; }
    if (!endDate) { setFormError('Câmpul Data Încheiere este obligatoriu'); return; }
    onCreate({
      providerId: parseInt(providerId),
      contractNo,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      value: value ? parseFloat(value) : undefined,
      coveredDeviceIds: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Creare Contract</h2>

        <div className="mb-3">
          <label htmlFor="provider-select" className="block font-medium mb-1">Furnizor</label>
          <select id="provider-select" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-full border px-3 py-2 rounded">
            <option value="">-- Selectează furnizor --</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="contract-no" className="block font-medium mb-1">Contract Nr.</label>
          <input id="contract-no" type="text" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-3">
          <label htmlFor="start-date" className="block font-medium mb-1">Data Începere</label>
          <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-3">
          <label htmlFor="end-date" className="block font-medium mb-1">Data Încheiere</label>
          <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-3">
          <label htmlFor="contract-value" className="block font-medium mb-1">Valoare</label>
          <input id="contract-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>

        {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Anulare</button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvare Contract</button>
        </div>
      </div>
    </div>
  );
}

function RateProviderModal({ provider, onClose, onRate }) {
  const [score, setScore] = useState('5');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    onRate({ score: parseInt(score), comment: comment || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-xl font-bold mb-4">Evaluare Furnizor: {provider.name}</h2>

        <div className="mb-3">
          <label htmlFor="score-select" className="block font-medium mb-1">Scor</label>
          <select id="score-select" value={score} onChange={(e) => setScore(e.target.value)} className="w-full border px-3 py-2 rounded">
            {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="comment-input" className="block font-medium mb-1">Comentariu</label>
          <textarea id="comment-input" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border px-3 py-2 rounded h-20" />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Anulare</button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Salvare Evaluare</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
        <p className="mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-100">Anulare</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirmare</button>
        </div>
      </div>
    </div>
  );
}
