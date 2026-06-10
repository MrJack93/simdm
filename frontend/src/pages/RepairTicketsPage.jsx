import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRepairTickets,
  createRepairTicket,
  updateTicketStatus,
  triageTicket,
  submitRepair,
  downloadFormular7Pdf,
  downloadFormular8Pdf,
  downloadFormular9Pdf,
} from '../api/repairTickets';
import { getDevices } from '../api/devices';

const STATUSES = ['DESCHIS', 'IN_LUCRU', 'REZOLVAT', 'TESTAT', 'INCHIS'];

const STATUS_LABELS = {
  DESCHIS: 'Deschis',
  IN_LUCRU: 'In lucru',
  REZOLVAT: 'Rezolvat',
  TESTAT: 'Testat',
  INCHIS: 'Inchis',
  ESCALADAT: 'Escaladat extern',
};

const STATUS_COLORS = {
  DESCHIS: 'bg-blue-100 border-blue-300',
  IN_LUCRU: 'bg-yellow-100 border-yellow-300',
  REZOLVAT: 'bg-green-100 border-green-300',
  TESTAT: 'bg-purple-100 border-purple-300',
  INCHIS: 'bg-gray-100 border-gray-300',
  ESCALADAT: 'bg-red-100 border-red-300',
};

const PRIORITY_BADGE = {
  SCAZUT: 'bg-green-200 text-green-800',
  NORMAL: 'bg-blue-200 text-blue-800',
  RIDICAT: 'bg-orange-200 text-orange-800',
  URGENT: 'bg-red-200 text-red-800',
};

const ALLOWED_TRANSITIONS = {
  DESCHIS: ['IN_LUCRU', 'ESCALADAT'],
  IN_LUCRU: ['REZOLVAT', 'DESCHIS', 'ESCALADAT'],
  REZOLVAT: ['TESTAT', 'IN_LUCRU', 'ESCALADAT'],
  TESTAT: ['INCHIS', 'IN_LUCRU', 'ESCALADAT'],
  INCHIS: [],
  ESCALADAT: ['IN_LUCRU', 'DESCHIS'],
};

export default function RepairTicketsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'jurnal'
  const [pdfDateFrom, setPdfDateFrom] = useState('');
  const [pdfDateTo, setPdfDateTo] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['repairTickets', filterStatus, filterPriority],
    queryFn: () => getRepairTickets({ status: filterStatus, priority: filterPriority }),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  const createMutation = useMutation({
    mutationFn: createRepairTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
      setShowCreateModal(false);
      setCreateSuccess('Tichet creat cu succes');
      setTimeout(() => setCreateSuccess(''), 3000);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }) => updateTicketStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
      setShowDetailsModal(false);
      setSelectedTicket(null);
    },
  });

  const tickets = response?.data || [];
  const devices = devicesData?.devices || devicesData?.data || [];

  const allTickets = tickets;
  const ticketsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tickets.filter((t) => t.status === status);
    if (filterPriority) {
      acc[status] = acc[status].filter((t) => t.priority === filterPriority);
    }
    return acc;
  }, {});

  const handleOpenDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const handleDownloadF7 = async () => {
    try {
      const blob = await downloadFormular7Pdf({ from: pdfDateFrom, to: pdfDateTo });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Formular7-JurnalChemari.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Eroare la generarea PDF-ului');
    }
  };

  const handleDownloadF8 = async (ticketId) => {
    try {
      const blob = await downloadFormular8Pdf(ticketId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Formular8-${ticketId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Eroare la generarea PDF-ului');
    }
  };

  const handleDownloadF9 = async (ticketId) => {
    try {
      const blob = await downloadFormular9Pdf(ticketId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Formular9-${ticketId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Eroare la generarea PDF-ului');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Bilete de Reparatie</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tichet Nou
          </button>
        </div>

        {createSuccess && (
          <div className="bg-green-100 text-green-700 p-3 mb-3 rounded">{createSuccess}</div>
        )}

        {/* View toggle */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${viewMode === 'kanban' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('jurnal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${viewMode === 'jurnal' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Jurnal Chemari (F7)
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Filtrare
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded border mb-4">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border px-3 py-2 rounded text-sm"
                >
                  <option value="">Toate</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Prioritate</p>
                {['URGENT', 'RIDICAT', 'NORMAL', 'SCAZUT'].map((p) => (
                  <label key={p} className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterPriority === p}
                      onChange={() => setFilterPriority(filterPriority === p ? '' : p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Incarcand...</div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-5 gap-4">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col">
              <h2 className="font-bold text-sm mb-3 p-3 bg-white rounded-lg border-2 border-gray-200">
                <span>{status}</span><br />
                <span className="text-xs text-gray-700">{STATUS_LABELS[status]}</span>
                <span className="text-gray-500 ml-2">({ticketsByStatus[status].length})</span>
              </h2>
              <div className="space-y-3 flex-1">
                {ticketsByStatus[status].map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onOpen={() => handleOpenDetails(ticket)}
                    onDownloadF8={() => handleDownloadF8(ticket.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <JurnalView
          tickets={allTickets}
          pdfDateFrom={pdfDateFrom}
          pdfDateTo={pdfDateTo}
          onDateFromChange={setPdfDateFrom}
          onDateToChange={setPdfDateTo}
          onDownloadF7={handleDownloadF7}
          onOpenDetails={handleOpenDetails}
        />
      )}

      {showCreateModal && (
        <CreateTicketModal
          devices={devices}
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}

      {showDetailsModal && selectedTicket && (
        <DetailsModal
          ticket={selectedTicket}
          onClose={() => { setShowDetailsModal(false); setSelectedTicket(null); }}
          onStatusChange={(id, newStatus) => statusMutation.mutate({ id, newStatus })}
          onRepairSubmit={(id, data) => {
            submitRepair(id, data).then(() => {
              queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
              setShowDetailsModal(false);
              setSelectedTicket(null);
            });
          }}
          onExternalize={(id) => {
            triageTicket(id, { repairType: 'EXTERN', defectCause: 'Externalizat catre service' }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
              setShowDetailsModal(false);
              setSelectedTicket(null);
            });
          }}
          onDownloadF8={() => handleDownloadF8(selectedTicket.id)}
          onDownloadF9={() => handleDownloadF9(selectedTicket.id)}
        />
      )}
    </div>
  );
}

function JurnalView({ tickets, pdfDateFrom, pdfDateTo, onDateFromChange, onDateToChange, onDownloadF7, onOpenDetails }) {
  return (
    <div>
      <div className="flex gap-3 items-end mb-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">De la</label>
          <input
            type="date"
            value={pdfDateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="border px-3 py-2 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pana la</label>
          <input
            type="date"
            value={pdfDateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="border px-3 py-2 rounded text-sm"
          />
        </div>
        <button
          onClick={onDownloadF7}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          Descarca Formular Nr. 7 (PDF)
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Nr.</th>
              <th className="px-3 py-2 text-left font-semibold">Data/ora</th>
              <th className="px-3 py-2 text-left font-semibold">Denumire DM / Cod</th>
              <th className="px-3 py-2 text-left font-semibold">Solicitant</th>
              <th className="px-3 py-2 text-left font-semibold">Solicitarea</th>
              <th className="px-3 py-2 text-left font-semibold">Prioritate</th>
              <th className="px-3 py-2 text-left font-semibold">Data rezolvare</th>
              <th className="px-3 py-2 text-left font-semibold">Inginer</th>
              <th className="px-3 py-2 text-left font-semibold">Stare</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-gray-500">Nu exista chemari inregistrate.</td>
              </tr>
            ) : (
              tickets.map((ticket, idx) => {
                const stare = ['INCHIS', 'REZOLVAT', 'TESTAT'].includes(ticket.status) ? 'F' : 'N';
                return (
                  <tr
                    key={ticket.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => onOpenDetails(ticket)}
                  >
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {ticket.reportedAt ? new Date(ticket.reportedAt).toLocaleString('ro-RO') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{ticket.device?.name || '—'}</div>
                      <div className="text-xs text-gray-500">{ticket.device?.inventoryNumber || ''}</div>
                    </td>
                    <td className="px-3 py-2">{ticket.reportedBy}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{ticket.faultDescription}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_BADGE[ticket.priority] || ''}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString('ro-RO') : '—'}
                    </td>
                    <td className="px-3 py-2">{ticket.engineerName || '—'}</td>
                    <td className="px-3 py-2 text-center font-bold">{stare}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketCard({ ticket, onOpen, onDownloadF8 }) {
  const dateStr = ticket.reportedAt
    ? new Date(ticket.reportedAt).toISOString().split('T')[0]
    : '';
  return (
    <div
      className={`ticket-card p-3 rounded-lg border-2 cursor-pointer hover:shadow-lg transition ${STATUS_COLORS[ticket.status] || ''} overflow-hidden`}
      onClick={onOpen}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-xs text-gray-700">{ticket.ticketNumber}</span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${PRIORITY_BADGE[ticket.priority] || ''}`}>
          {ticket.priority}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1 truncate">
        {ticket.device?.name || 'DM necunoscut'}
      </p>
      <p className="text-xs text-gray-600 mb-1 line-clamp-2">
        {ticket.faultDescription}
      </p>
      {dateStr && <p className="text-xs text-gray-500">{dateStr}</p>}
      {ticket.status !== 'DESCHIS' && (
        <button
          className="mt-2 text-xs text-blue-600 underline"
          onClick={(e) => { e.stopPropagation(); onDownloadF8(); }}
        >
          Formular Nr. 8 (PDF)
        </button>
      )}
    </div>
  );
}

function CreateTicketModal({ devices, onClose, onCreate }) {
  const [deviceId, setDeviceId] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    setFormError('');
    if (!deviceId) {
      setFormError('Campul Dispozitiv este obligatoriu');
      return;
    }
    if (!description.trim()) {
      setFormError('Campul Descriere este obligatoriu');
      return;
    }
    onCreate({
      deviceId: parseInt(deviceId),
      priority,
      faultDescription: description,
      reportedBy: reportedBy || 'Utilizator',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Creare Tichet Reparație</h2>

        <div className="mb-3">
          <label htmlFor="ticket-device" className="block font-medium mb-1">Dispozitiv</label>
          <select
            id="ticket-device"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Selecteaza --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="ticket-priority" className="block font-medium mb-1">Prioritate</label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="SCAZUT">Scazut</option>
            <option value="NORMAL">Normal</option>
            <option value="RIDICAT">Ridicat</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="ticket-desc" className="block font-medium mb-1">Descriere</label>
          <textarea
            id="ticket-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded h-20"
            placeholder="Descrieti defectiunea..."
          />
        </div>

        <div className="mb-3">
          <label htmlFor="ticket-reported" className="block font-medium mb-1">Raportat de</label>
          <input
            id="ticket-reported"
            type="text"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Anulare
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Creează
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailsModal({ ticket, onClose, onStatusChange, onRepairSubmit, onExternalize, onDownloadF8, onDownloadF9 }) {
  const allowed = ALLOWED_TRANSITIONS[ticket.status] || [];
  const [newStatus, setNewStatus] = useState(allowed.filter(s => s !== 'ESCALADAT')[0] || ticket.status);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'repair'

  // Repair form state
  const [repairReport, setRepairReport] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [functionalTest, setFunctionalTest] = useState('FUNCTIONAL');
  const [engineerName, setEngineerName] = useState(ticket.engineerName || '');
  const [repairError, setRepairError] = useState('');

  const transitionTargets = allowed.filter(s => s !== 'ESCALADAT');

  const handleRepairSubmit = () => {
    setRepairError('');
    if (!repairReport.trim()) { setRepairError('Raportul reparatiei este obligatoriu'); return; }
    if (!actionsTaken.trim()) { setRepairError('Actiunile intreprinse sunt obligatorii'); return; }
    if (!durationHours || isNaN(parseFloat(durationHours)) || parseFloat(durationHours) <= 0) {
      setRepairError('Durata trebuie sa fie un numar pozitiv'); return;
    }
    if (!engineerName.trim()) { setRepairError('Numele inginerului este obligatoriu'); return; }
    onRepairSubmit(ticket.id, {
      repairReport: repairReport.trim(),
      actionsTaken: actionsTaken.trim(),
      durationHours: parseFloat(durationHours),
      partsUsed: [],
      functionalTest,
      engineerName: engineerName.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-3">Detalii Tichet</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-2 text-sm font-medium ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Informatii
          </button>
          {['IN_LUCRU', 'REZOLVAT', 'TESTAT'].includes(ticket.status) && (
            <button
              onClick={() => setActiveTab('repair')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'repair' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Editare Reparatie
            </button>
          )}
        </div>

        {activeTab === 'info' && (
          <>
            <p className="text-sm mb-1"><strong>Nr.:</strong> {ticket.ticketNumber}</p>
            <p className="text-sm mb-1"><strong>Dispozitiv:</strong> {ticket.device?.name}</p>
            <p className="text-sm mb-1"><strong>Prioritate:</strong> {ticket.priority}</p>
            <p className="text-sm mb-1"><strong>Status curent:</strong> {STATUS_LABELS[ticket.status]}</p>
            <p className="text-sm mb-3"><strong>Descriere:</strong> {ticket.faultDescription}</p>
            {ticket.faultCause && (
              <p className="text-sm mb-1"><strong>Cauza:</strong> {ticket.faultCause}</p>
            )}
            {ticket.actionsTaken && (
              <p className="text-sm mb-1"><strong>Actiuni:</strong> {ticket.actionsTaken}</p>
            )}
            {ticket.engineerName && (
              <p className="text-sm mb-3"><strong>Inginer:</strong> {ticket.engineerName}</p>
            )}

            {transitionTargets.length > 0 && (
              <div className="mb-4">
                <label htmlFor="status-select" className="block font-medium mb-1">Schimba status</label>
                <select
                  id="status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                >
                  {transitionTargets.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {activeTab === 'repair' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Raport reparatie *</label>
              <textarea
                value={repairReport}
                onChange={(e) => setRepairReport(e.target.value)}
                className="w-full border px-3 py-2 rounded h-20 text-sm"
                placeholder="Descrieti reparatia efectuata..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Actiuni intreprinse *</label>
              <textarea
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                className="w-full border px-3 py-2 rounded h-16 text-sm"
                placeholder="Enumerati actiunile concrete..."
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Durata (ore) *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full border px-3 py-2 rounded text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Test functional *</label>
                <select
                  value={functionalTest}
                  onChange={(e) => setFunctionalTest(e.target.value)}
                  className="w-full border px-3 py-2 rounded text-sm"
                >
                  <option value="FUNCTIONAL">Functional</option>
                  <option value="NEFUNCTIONAL">Nefunctional</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inginer responsabil *</label>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>
            {repairError && <p className="text-red-600 text-sm">{repairError}</p>}
          </div>
        )}

        <div className="flex gap-2 justify-between mt-4">
          <div className="flex gap-2">
            {/* Externalizează button */}
            {!ticket.externalized && ticket.status !== 'INCHIS' && (
              <button
                type="button"
                onClick={() => onExternalize(ticket.id)}
                className="px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
              >
                Externalizeaza
              </button>
            )}
            <button
              type="button"
              onClick={onDownloadF8}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
            >
              Formular 8 (PDF)
            </button>
            {ticket.externalized && (
              <button
                type="button"
                onClick={onDownloadF9}
                className="px-3 py-2 bg-orange-100 text-orange-700 text-sm rounded hover:bg-orange-200 border border-orange-300"
              >
                Formular 9 (PDF)
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">
              Inchide
            </button>
            {activeTab === 'info' && transitionTargets.length > 0 && (
              <button
                type="button"
                onClick={() => onStatusChange(ticket.id, newStatus)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Salvare status
              </button>
            )}
            {activeTab === 'repair' && (
              <button
                type="button"
                onClick={handleRepairSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Salvare reparație
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
