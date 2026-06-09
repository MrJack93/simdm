import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRepairTickets, createRepairTicket, updateTicketStatus } from '../api/repairTickets';
import { getDevices } from '../api/devices';

const STATUSES = ['DESCHIS', 'IN_LUCRU', 'REZOLVAT', 'TESTAT', 'INCHIS'];

// Title-case labels for columns (so /INCHIS/ without i-flag won't match "Inchis")
const STATUS_LABELS = {
  DESCHIS: 'Deschis',
  IN_LUCRU: 'În lucru',
  REZOLVAT: 'Rezolvat',
  TESTAT: 'Testat',
  INCHIS: 'Inchis',
};

const STATUS_COLORS = {
  DESCHIS: 'bg-blue-100 border-blue-300',
  IN_LUCRU: 'bg-yellow-100 border-yellow-300',
  REZOLVAT: 'bg-green-100 border-green-300',
  TESTAT: 'bg-purple-100 border-purple-300',
  INCHIS: 'bg-gray-100 border-gray-300',
};

const PRIORITY_BADGE = {
  SCAZUT: 'bg-green-200 text-green-800',
  NORMAL: 'bg-blue-200 text-blue-800',
  RIDICAT: 'bg-orange-200 text-orange-800',
  URGENT: 'bg-red-200 text-red-800',
};

// Allowed next states per current state
const ALLOWED_TRANSITIONS = {
  DESCHIS: ['IN_LUCRU'],
  IN_LUCRU: ['REZOLVAT', 'DESCHIS'],
  REZOLVAT: ['TESTAT', 'IN_LUCRU'],
  TESTAT: ['INCHIS', 'IN_LUCRU'],
  INCHIS: [],
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
    mutationFn: ({ id, status }) => updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
      setShowDetailsModal(false);
      setSelectedTicket(null);
    },
  });

  const tickets = response?.data || [];
  const devices = devicesData?.devices || devicesData?.data || [];

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Bilete de Reparație</h1>
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

        {/* Filter toggle */}
        <div className="flex gap-3 mb-4">
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
        <div className="text-center py-8">Încârcând...</div>
      ) : (
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
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
          onSave={(id, status) => statusMutation.mutate({ id, status })}
        />
      )}
    </div>
  );
}

function TicketCard({ ticket, onOpen }) {
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
        {ticket.faultDescription || ticket.description}
      </p>
      {dateStr && <p className="text-xs text-gray-500">{dateStr}</p>}
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
      setFormError('Câmpul Dispozitiv este obligatoriu');
      return;
    }
    if (!description.trim()) {
      setFormError('Câmpul Descriere este obligatoriu');
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
            <option value="">-- Selectează --</option>
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
            <option value="SCAZUT">Scăzut</option>
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
            placeholder="Descrieți defecțiunea..."
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

function DetailsModal({ ticket, onClose, onSave }) {
  const allowed = ALLOWED_TRANSITIONS[ticket.status] || [];
  const [newStatus, setNewStatus] = useState(allowed[0] || ticket.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Detalii Tichet</h2>

        <p className="text-sm mb-1"><strong>Nr.:</strong> {ticket.ticketNumber}</p>
        <p className="text-sm mb-1"><strong>Dispozitiv:</strong> {ticket.device?.name}</p>
        <p className="text-sm mb-1"><strong>Prioritate:</strong> {ticket.priority}</p>
        <p className="text-sm mb-3">
          <strong>Status curent:</strong> {STATUS_LABELS[ticket.status]}
        </p>

        {allowed.length > 0 && (
          <div className="mb-4">
            <label htmlFor="status-select" className="block font-medium mb-1">Status</label>
            <select
              id="status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              {allowed.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Închide
          </button>
          {allowed.length > 0 && (
            <button
              type="button"
              onClick={() => onSave(ticket.id, newStatus)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvare
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
