import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/axios';
import {
  FileText, Upload, Download, Trash2, Edit3, History,
  Search, Plus, X, Paperclip,
  Shield, ShieldAlert, Clock, Eye,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { Field, FieldLabel, FieldError } from '../components/ui/field';
import { useDocuments, useDocumentCategories } from '../hooks/useDocuments';
import { documentKeys, createDocument, createDocumentVersion, updateDocument, deleteDocument, verifyDocument, fetchDocumentAccessLog } from '../api/documents';
import { useDevices } from '../hooks/useDevices';

const CATEGORY_LABELS = {
  PROCEDURA_MDM: 'Procedură MDM',
  FORMULAR: 'Formular',
  LEGISLATIE: 'Legislație',
  MANUAL_TEHNIC: 'Manual Tehnic',
  CERTIFICAT: 'Certificat',
  CONTRACT: 'Contract',
  RAPORT: 'Raport',
  ALTUL: 'Altele',
};

const CATEGORY_COLORS = {
  PROCEDURA_MDM: { bg: 'var(--color-info-bg)', text: 'var(--color-info)' },
  FORMULAR: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
  LEGISLATIE: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
  MANUAL_TEHNIC: { bg: 'var(--color-accent-bg, #f5e6e0)', text: 'var(--color-accent)' },
  CERTIFICAT: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
  CONTRACT: { bg: 'var(--color-info-bg)', text: 'var(--color-info)' },
  RAPORT: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
  ALTUL: { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' },
};

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getExpiryStatus(validUntil) {
  if (!validUntil) return null;
  const now = new Date();
  const diff = new Date(validUntil).getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Expirat', color: 'var(--color-error)', bg: 'var(--color-error-bg)' };
  if (days <= 30) return { label: `Expiră în ${days}z`, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' };
  if (days <= 60) return { label: `Expiră în ${days}z`, color: 'var(--color-info)', bg: 'var(--color-info-bg)' };
  return null;
}

function DocumentDetailModal({ document: doc, onClose }) {
  const [activeTab, setActiveTab] = useState('info');

  if (!doc) return null;

  const expiry = getExpiryStatus(doc.validUntil);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
      style={{ backgroundColor: 'var(--overlay-medium)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-detail-title"
    >
      <div
        className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 id="doc-detail-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
            {doc.title}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide">
            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { id: 'info', label: 'Informații', icon: FileText },
            { id: 'access', label: 'Istoric acces', icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors focusable"
              style={{
                color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === id ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <InfoTab doc={doc} expiry={expiry} />
          )}
          {activeTab === 'access' && (
            <AccessLogTab docId={doc.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTab({ doc, expiry }) {
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyDocument(doc.id);
      setVerifyResult(result);
    } catch {
      toast.error('Eroare la verificarea integrității');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Categorie</span>
          <p style={{ color: 'var(--color-text-primary)' }}>{CATEGORY_LABELS[doc.category] || doc.category}</p>
        </div>
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Versiune</span>
          <p style={{ color: 'var(--color-text-primary)' }}>v{doc.version}</p>
        </div>
        {doc.issuer && (
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Emitent</span>
            <p style={{ color: 'var(--color-text-primary)' }}>{doc.issuer}</p>
          </div>
        )}
        {doc.validUntil && (
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Valabil până la</span>
            <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(doc.validUntil)}</p>
          </div>
        )}
        {doc.validFrom && (
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Valabil de la</span>
            <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(doc.validFrom)}</p>
          </div>
        )}
        {doc.reviewAt && (
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Dată revizuire</span>
            <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(doc.reviewAt)}</p>
          </div>
        )}
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Dimensiune</span>
          <p style={{ color: 'var(--color-text-primary)' }}>{formatFileSize(doc.fileSize)}</p>
        </div>
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Încărcat la</span>
          <p style={{ color: 'var(--color-text-primary)' }}>{formatDate(doc.uploadedAt)}</p>
        </div>
      </div>

      {expiry && (
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: expiry.bg }}>
          <span className="text-sm font-medium" style={{ color: expiry.color }}>{expiry.label}</span>
        </div>
      )}

      {doc.fileHash && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Hash SHA-256</span>
              <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                {doc.fileHash.substring(0, 16)}...
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(doc.fileHash);
                toast.success('Hash copiat');
              }}
              className="text-xs px-2 py-1 rounded focusable"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
            >
              Copiază
            </button>
          </div>
        </div>
      )}

      {/* Integrity check */}
      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Integritate fișier</span>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="text-xs px-3 py-1.5 rounded font-medium focusable flex items-center gap-1"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
          >
            <Shield size={12} />
            {verifying ? 'Se verifică...' : 'Verifică integritate'}
          </button>
        </div>
        {verifyResult && (
          <div className="mt-2 flex items-center gap-2">
            {verifyResult.valid === true ? (
              <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                <Shield size={14} /> Integritate ✓
              </span>
            ) : verifyResult.valid === false ? (
              <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                <ShieldAlert size={14} /> ⚠ Modificat
              </span>
            ) : (
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Neconfirmat (fără hash stocat)</span>
            )}
          </div>
        )}
      </div>

      {doc.description && (
        <div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Descriere</span>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-primary)' }}>{doc.description}</p>
        </div>
      )}

      {doc.tags && doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.map((tag, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AccessLogTab({ docId }) {
  const [logPage, setLogPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', 'accessLog', docId, logPage],
    queryFn: () => fetchDocumentAccessLog(docId, logPage),
    enabled: !!docId,
  });

  const logs = data?.data || [];
  const logPagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} lines={1} variant="text" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Eye size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nicio acțiune înregistrată</p>
      </div>
    );
  }

  const ACTION_LABELS = {
    CREATE: 'Creare',
    UPDATE: 'Actualizare',
    DELETE: 'Ștergere',
    FILE_ACCESS: 'Descărcare',
    FILE_UPLOAD: 'Încărcare fișier',
    VERIFY: 'Verificare integritate',
  };

  return (
    <div>
      <table className="w-full text-sm" role="table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Acțiune</th>
            <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Utilizator</th>
            <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Data/ora</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="py-2 px-2">
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: log.action === 'DELETE' ? 'var(--color-error-bg)' : log.action === 'CREATE' ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
                    color: log.action === 'DELETE' ? 'var(--color-error)' : log.action === 'CREATE' ? 'var(--color-success)' : 'var(--color-info)',
                  }}
                >
                  {ACTION_LABELS[log.action] || log.action}
                </span>
              </td>
              <td className="py-2 px-2" style={{ color: 'var(--color-text-primary)' }}>
                {log.users?.fullName || log.users?.username || '—'}
              </td>
              <td className="py-2 px-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                {new Date(log.timestamp).toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logPagination.pages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {logPagination.total} intrări
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setLogPage(p => Math.max(1, p - 1))}
              disabled={logPage <= 1}
              className="btn-secondary px-2 py-1 text-xs disabled:opacity-50"
            >
              ‹
            </button>
            <button
              onClick={() => setLogPage(p => Math.min(logPagination.pages, p + 1))}
              disabled={logPage >= logPagination.pages}
              className="btn-secondary px-2 py-1 text-xs disabled:opacity-50"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadModal({ onClose, onSave, devices }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ALTUL');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [reviewAt, setReviewAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const isCertOrContract = category === 'CERTIFICAT' || category === 'CONTRACT';
  const isProcedureOrForm = category === 'PROCEDURA_MDM' || category === 'FORMULAR';

  const validateForm = () => {
    const errs = {};
    if (!file) errs.file = 'Selectează un fișier';
    if (!title || title.trim().length < 2) errs.title = 'Titlul trebuie să aibă minim 2 caractere';
    if (isCertOrContract) {
      if (!validUntil) errs.validUntil = 'Data de expirare este obligatorie';
      if (!issuer || issuer.trim().length < 2) errs.issuer = 'Emitentul este obligatoriu';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('category', category);
      if (description) formData.append('description', description);
      if (tags) {
        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tagList));
      }
      if (deviceId) formData.append('deviceId', deviceId);
      if (issuer) formData.append('issuer', issuer);
      if (validFrom) formData.append('validFrom', validFrom);
      if (validUntil) formData.append('validUntil', validUntil);
      if (reviewAt) formData.append('reviewAt', reviewAt);

      await createDocument(formData);
      toast.success('Document încărcat cu succes');
      onSave();
    } catch (err) {
      const msg = err.response?.data?.error || 'Eroare la încărcare';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
      style={{ backgroundColor: 'var(--overlay-medium)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-doc-title"
    >
      <div
        className="rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="upload-doc-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Încarcă Document
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide">
            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-[var(--color-accent)]"
            style={{
              borderColor: errors.file ? 'var(--color-error)' : 'var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.txt"
              onChange={(e) => {
                setFile(e.target.files[0]);
                if (!title && e.target.files[0]) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
              }}
            />
            {file ? (
              <div className="flex items-center gap-2 justify-center">
                <Paperclip size={16} style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>{file.name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>({formatFileSize(file.size)})</span>
              </div>
            ) : (
              <div>
                <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Trage fișierul aici sau click pentru a selecta</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  PDF, Word, Excel, imagini — max 25MB
                </p>
              </div>
            )}
          </div>
          {errors.file && <FieldError>{errors.file}</FieldError>}

          <Field>
            <FieldLabel htmlFor="doc-title" required>Titlu</FieldLabel>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })); }}
              className="input-base w-full"
              placeholder="Numele documentului"
            />
            <FieldError>{errors.title}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="doc-category">Categorie</FieldLabel>
            <select
              id="doc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-base w-full"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="doc-description">Descriere</FieldLabel>
            <textarea
              id="doc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base w-full"
              rows={3}
              placeholder="Descriere opțională"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="doc-tags">Etichete (separate prin virgulă)</FieldLabel>
            <input
              id="doc-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-base w-full"
              placeholder="ex. siguranță, mentenanță, 2024"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="doc-device">Dispozitiv asociat (opțional)</FieldLabel>
            <select
              id="doc-device"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="input-base w-full"
            >
              <option value="">— Fără dispozitiv —</option>
              {(devices || []).map(d => (
                <option key={d.id} value={d.id}>{d.inventoryNumber} — {d.name}</option>
              ))}
            </select>
          </Field>

          {isCertOrContract && (
            <>
              <Field>
                <FieldLabel htmlFor="doc-issuer" required>Emitent</FieldLabel>
                <input
                  id="doc-issuer"
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className="input-base w-full"
                  placeholder="Ex. Laborator Metrologic SRL"
                />
                <FieldError>{errors.issuer}</FieldError>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="doc-validFrom">Valabil de la</FieldLabel>
                  <input
                    id="doc-validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="input-base w-full"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="doc-validUntil" required>Valabil până la</FieldLabel>
                  <input
                    id="doc-validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="input-base w-full"
                  />
                  <FieldError>{errors.validUntil}</FieldError>
                </Field>
              </div>
            </>
          )}

          {isProcedureOrForm && (
            <Field>
              <FieldLabel htmlFor="doc-reviewAt">Dată revizuire</FieldLabel>
              <input
                id="doc-reviewAt"
                type="date"
                value={reviewAt}
                onChange={(e) => setReviewAt(e.target.value)}
                className="input-base w-full"
              />
            </Field>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Anulare
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Se încarcă...' : 'Încarcă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VersionModal({ document: doc, onClose }) {
  if (!doc) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
      style={{ backgroundColor: 'var(--overlay-medium)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-title"
    >
      <div
        className="rounded-xl max-w-md w-full p-6 animate-slide-up"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="version-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Istoric Versiuni
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide">
            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                v{doc.version} — Curent
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                activ
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {formatDate(doc.uploadedAt)} · {doc.uploadedBy?.fullName || doc.uploadedBy?.username || '—'}
            </p>
          </div>

          {(doc.other_documents || []).map((v) => (
            <div key={v.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  v{v.version}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatDate(v.uploadedAt)}
                </span>
              </div>
            </div>
          ))}

          {(!doc.other_documents || doc.other_documents.length === 0) && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              Doar o singură versiune disponibilă
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditMetaModal({ document: doc, onClose, onSave, devices }) {
  const [title, setTitle] = useState(doc?.title || '');
  const [category, setCategory] = useState(doc?.category || 'ALTUL');
  const [description, setDescription] = useState(doc?.description || '');
  const [tags, setTags] = useState((doc?.tags || []).join(', '));
  const [deviceId, setDeviceId] = useState(doc?.deviceId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || title.trim().length < 2) {
      toast.error('Titlul trebuie să aibă minim 2 caractere');
      return;
    }

    setLoading(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      await updateDocument(doc.id, {
        title: title.trim(),
        category,
        description: description || null,
        tags: tagList,
        deviceId: deviceId || null,
      });
      toast.success('Metadate actualizate');
      onSave();
    } catch {
      toast.error('Eroare la actualizare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
      style={{ backgroundColor: 'var(--overlay-medium)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-doc-title"
    >
      <div
        className="rounded-xl max-w-lg w-full p-6 animate-slide-up"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="edit-doc-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Editează Metadate
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide">
            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="edit-title" required>Titlu</FieldLabel>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base w-full"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-category">Categorie</FieldLabel>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-base w-full"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-description">Descriere</FieldLabel>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base w-full"
              rows={3}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-tags">Etichete</FieldLabel>
            <input
              id="edit-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-base w-full"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-device">Dispozitiv</FieldLabel>
            <select
              id="edit-device"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="input-base w-full"
            >
              <option value="">— Fără —</option>
              {(devices || []).map(d => (
                <option key={d.id} value={d.id}>{d.inventoryNumber} — {d.name}</option>
              ))}
            </select>
          </Field>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Anulare
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VersionUploadModal({ document: doc, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selectează un fișier');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (version) formData.append('version', version);
      await createDocumentVersion(doc.id, formData);
      toast.success('Versiune nouă încărcată');
      onSave();
    } catch {
      toast.error('Eroare la încărcarea versiunii');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
      style={{ backgroundColor: 'var(--overlay-medium)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-upload-title"
    >
      <div
        className="rounded-xl max-w-md w-full p-6 animate-slide-up"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="version-upload-title" className="text-xl font-bold" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Încarcă Versiune Nouă
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70 focusable" aria-label="Închide">
            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Versiunea curentă: <strong>v{doc.version}</strong> — {doc.title}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.txt"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{file.name}</span>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)' }}>Selectează fișierul nou</span>
            )}
          </div>

          <Field>
            <FieldLabel htmlFor="new-version">Versiune (opțional)</FieldLabel>
            <input
              id="new-version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="input-base w-full"
              placeholder="ex. 2.0"
            />
          </Field>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Anulare
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Se încarcă...' : 'Încarcă Versiunea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [versionDoc, setVersionDoc] = useState(null);
  const [versionUploadDoc, setVersionUploadDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [detailDoc, setDetailDoc] = useState(null);

  const filters = {};
  if (categoryFilter) filters.category = categoryFilter;
  if (deviceFilter) filters.deviceId = deviceFilter;

  const { data, isLoading } = useDocuments(search, filters, page);
  const documents = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const { data: devicesData } = useDevices();
  const devices = devicesData?.devices || [];

  const { data: _categories } = useDocumentCategories();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: documentKeys.all });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDocument(id),
    onSuccess: () => {
      toast.success('Document șters');
      invalidateAll();
      setDeleteDoc(null);
    },
    onError: () => toast.error('Eroare la ștergere'),
  });

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/documents/file/${doc.fileUrl.split('/').pop()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.title + (doc.mimeType === 'application/pdf' ? '.pdf' : ''));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Eroare la descărcare');
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 400 }}>
            Documente & Proceduri
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Biblioteca centralizată de documente — proceduri, formulare, manuale, certificate
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
          <Upload size={16} /> Încarcă Document
        </button>
      </div>

      {/* Filtre */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Caută documente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-base w-full pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input-base"
        >
          <option value="">Toate categoriile</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={deviceFilter}
          onChange={(e) => { setDeviceFilter(e.target.value); setPage(1); }}
          className="input-base"
        >
          <option value="">Toate dispozitivele</option>
          {devices.map(d => (
            <option key={d.id} value={d.id}>{d.inventoryNumber} — {d.name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setCategoryFilter('');
            setDeviceFilter('');
            setSearch('');
            setPage(1);
          }}
          className="btn-secondary text-sm px-3"
          style={{ display: (search || categoryFilter || deviceFilter) ? 'block' : 'none' }}
        >
          Resetează filtre
        </button>
      </div>

      {/* Conținut */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} lines={2} variant="card" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Niciun document găsit
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {search || categoryFilter || deviceFilter
              ? 'Încearcă să modifici filtrele de căutare'
              : 'Încarcă primul document pentru a începe'}
          </p>
          {!search && !categoryFilter && !deviceFilter && (
            <button onClick={() => setShowUpload(true)} className="btn-primary">
              <Upload size={16} className="inline mr-2" /> Încarcă Document
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Document</th>
                  <th className="text-left py-3 px-3 font-medium hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Categorie</th>
                  <th className="text-left py-3 px-3 font-medium hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Versiune</th>
                  <th className="text-left py-3 px-3 font-medium hidden lg:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Data</th>
                  <th className="text-left py-3 px-3 font-medium hidden xl:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Dimensiune</th>
                  <th className="text-right py-3 px-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const catColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.ALTUL;
                  return (
                    <tr
                      key={doc.id}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                          <div className="min-w-0">
                            <div className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {doc.title}
                            </div>
                            {doc.device && (
                              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                                📎 {doc.device.inventoryNumber} — {doc.device.name}
                              </div>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.tags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                                    {tag}
                                  </span>
                                ))}
                                {doc.tags.length > 3 && (
                                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>+{doc.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ backgroundColor: catColor.bg, color: catColor.text }}
                          >
                            {CATEGORY_LABELS[doc.category] || doc.category}
                          </span>
                          {getExpiryStatus(doc.validUntil) && (
                            <span
                              className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{ backgroundColor: getExpiryStatus(doc.validUntil).bg, color: getExpiryStatus(doc.validUntil).color }}
                            >
                              {getExpiryStatus(doc.validUntil).label}
                            </span>
                          )}
                          {doc.fileHash && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-mono"
                              title={`SHA-256: ${doc.fileHash}`}
                              style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span style={{ color: 'var(--color-text-primary)' }}>v{doc.version}</span>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span style={{ color: 'var(--color-text-secondary)' }}>{formatDate(doc.uploadedAt)}</span>
                      </td>
                      <td className="py-3 px-3 hidden xl:table-cell">
                        <span style={{ color: 'var(--color-text-secondary)' }}>{formatFileSize(doc.fileSize)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailDoc(doc)}
                            className="p-2 rounded hover:opacity-70 focusable"
                            aria-label="Detalii"
                            title="Detalii document"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-2 rounded hover:opacity-70 focusable"
                            aria-label="Descarcă"
                            title="Descarcă"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => setVersionUploadDoc(doc)}
                            className="p-2 rounded hover:opacity-70 focusable"
                            aria-label="Versiune nouă"
                            title="Versiune nouă"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => setVersionDoc(doc)}
                            className="p-2 rounded hover:opacity-70 focusable"
                            aria-label="Istoric versiuni"
                            title="Istoric versiuni"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => setEditDoc(doc)}
                            className="p-2 rounded hover:opacity-70 focusable"
                            aria-label="Editează"
                            title="Editează metadate"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteDoc(doc)}
                            className="p-2 rounded hover:opacity-70 focusable"
                            aria-label="Șterge"
                            title="Șterge document"
                            style={{ color: 'var(--color-error)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginare */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {pagination.total} documente · Pagina {pagination.page} din {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Următorul
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal
          devices={devices}
          onClose={() => setShowUpload(false)}
          onSave={() => { setShowUpload(false); invalidateAll(); }}
        />
      )}
      {editDoc && (
        <EditMetaModal
          document={editDoc}
          devices={devices}
          onClose={() => setEditDoc(null)}
          onSave={() => { setEditDoc(null); invalidateAll(); }}
        />
      )}
      {versionDoc && (
        <VersionModal
          document={versionDoc}
          onClose={() => setVersionDoc(null)}
        />
      )}
      {versionUploadDoc && (
        <VersionUploadModal
          document={versionUploadDoc}
          onClose={() => setVersionUploadDoc(null)}
          onSave={() => { setVersionUploadDoc(null); invalidateAll(); }}
        />
      )}
      {deleteDoc && (
        <DeleteConfirmDialog
          title="Șterge Document"
          message={`Ești sigur că vrei să ștergi „${deleteDoc.title}"?`}
          onConfirm={() => deleteMutation.mutate(deleteDoc.id)}
          onCancel={() => setDeleteDoc(null)}
          loading={deleteMutation.isPending}
        />
      )}
      {detailDoc && (
        <DocumentDetailModal
          document={detailDoc}
          onClose={() => setDetailDoc(null)}
        />
      )}
    </div>
  );
}
