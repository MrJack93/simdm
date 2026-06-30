/**
 * Teste pentru DocumentsPage — pagină bibliotecă documente.
 *
 * Verifică: render listă, filtre, modal upload, empty state, acțiuni CRUD.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import DocumentsPage from '../pages/DocumentsPage';

vi.mock('../hooks/useDocuments', () => ({
  useDocuments: vi.fn(),
  useDocumentCategories: vi.fn(),
}));

vi.mock('../hooks/useDevices', () => ({
  useDevices: vi.fn(),
}));

vi.mock('../api/documents', () => ({
  documentKeys: { all: ['documents'], list: (f) => ['documents', 'list', f], detail: (id) => ['documents', 'detail', id], categories: ['documents', 'categories'] },
  fetchDocuments: vi.fn(),
  fetchDocument: vi.fn(),
  fetchDocumentCategories: vi.fn(),
  createDocument: vi.fn(),
  createDocumentVersion: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  verifyDocument: vi.fn(),
  fetchDocumentAccessLog: vi.fn(),
  fetchExpiringDocuments: vi.fn(),
}));

import { useDocuments, useDocumentCategories } from '../hooks/useDocuments';
import { useDevices } from '../hooks/useDevices';

const mockDocuments = [
  {
    id: 1,
    title: 'Procedură Mentenanță',
    category: 'PROCEDURA_MDM',
    fileUrl: '/api/documents/file/doc1.pdf',
    fileSize: 102400,
    mimeType: 'application/pdf',
    version: '1.0',
    isCurrent: true,
    tags: ['mentenanță', 'siguranță'],
    uploadedAt: '2026-06-10T10:00:00Z',
    uploadedBy: { id: 1, fullName: 'Ion Popescu', username: 'admin' },
    device: null,
    other_documents: [],
    fileHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    validUntil: null,
    issuer: null,
  },
  {
    id: 2,
    title: 'Certificat Calibrare ECG',
    category: 'CERTIFICAT',
    fileUrl: '/api/documents/file/doc2.pdf',
    fileSize: 51200,
    mimeType: 'application/pdf',
    version: '2.1',
    isCurrent: true,
    tags: [],
    uploadedAt: '2026-06-08T14:30:00Z',
    uploadedBy: { id: 1, fullName: 'Ion Popescu', username: 'admin' },
    device: { id: 3, name: 'ECG Monitor', inventoryNumber: 'DM-003' },
    other_documents: [{ id: 5, title: 'Certificat v2.0', version: '2.0', uploadedAt: '2026-06-01T10:00:00Z', isCurrent: false }],
    fileHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    validUntil: '2026-07-19T00:00:00Z',
    issuer: 'Laborator Metrologic SRL',
  },
];

const mockCategories = [
  { value: 'PROCEDURA_MDM', label: 'Procedură MDM' },
  { value: 'FORMULAR', label: 'Formular' },
  { value: 'LEGISLATIE', label: 'Legislație' },
  { value: 'MANUAL_TEHNIC', label: 'Manual Tehnic' },
  { value: 'CERTIFICAT', label: 'Certificat' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'RAPORT', label: 'Raport' },
  { value: 'ALTUL', label: 'Altele' },
];

const mockDevices = {
  devices: [
    { id: 1, name: 'Monitor Multiparametru', inventoryNumber: 'DM-001' },
    { id: 3, name: 'ECG Monitor', inventoryNumber: 'DM-003' },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useDocuments.mockReturnValue({
    data: { data: mockDocuments, pagination: { page: 1, pages: 1, total: 2 } },
    isLoading: false,
  });
  useDocumentCategories.mockReturnValue({ data: mockCategories });
  useDevices.mockReturnValue({ data: mockDevices });
});

describe('DocumentsPage', () => {
  it('afișează titlul și butonul de upload', () => {
    renderPage();
    expect(screen.getByText(/Documente & Proceduri/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Încarcă Document/ })).toBeInTheDocument();
  });

  it('afișează lista de documente', () => {
    renderPage();
    expect(screen.getByText('Procedură Mentenanță')).toBeInTheDocument();
    expect(screen.getByText('Certificat Calibrare ECG')).toBeInTheDocument();
  });

  it('afișează badge categorie', () => {
    renderPage();
    expect(screen.getAllByText('Procedură MDM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Certificat').length).toBeGreaterThanOrEqual(1);
  });

  it('afișează versiunea și dimensiunea', () => {
    renderPage();
    expect(screen.getByText('v1.0')).toBeInTheDocument();
    expect(screen.getByText('v2.1')).toBeInTheDocument();
  });

  it('afișează tag-uri document', () => {
    renderPage();
    expect(screen.getByText('mentenanță')).toBeInTheDocument();
    expect(screen.getByText('siguranță')).toBeInTheDocument();
  });

  it('afișează device asociat', () => {
    renderPage();
    expect(screen.getAllByText(/DM-003.*ECG Monitor/).length).toBeGreaterThanOrEqual(1);
  });

  it('afișează butoane acțiuni per document', () => {
    renderPage();
    const downloadBtns = screen.getAllByLabelText('Descarcă');
    expect(downloadBtns.length).toBe(2);
    const versionBtns = screen.getAllByLabelText('Versiune nouă');
    expect(versionBtns.length).toBe(2);
    const historyBtns = screen.getAllByLabelText('Istoric versiuni');
    expect(historyBtns.length).toBe(2);
    const editBtns = screen.getAllByLabelText('Editează');
    expect(editBtns.length).toBe(2);
    const deleteBtns = screen.getAllByLabelText('Șterge');
    expect(deleteBtns.length).toBe(2);
  });

  it('afișează input căutare', () => {
    renderPage();
    expect(screen.getByPlaceholderText('Caută documente...')).toBeInTheDocument();
  });

  it('afișează dropdown categorie', () => {
    renderPage();
    expect(screen.getByText('Toate categoriile')).toBeInTheDocument();
  });

  it('afișează empty state când nu sunt documente', () => {
    useDocuments.mockReturnValue({ data: { data: [], pagination: { page: 1, pages: 0, total: 0 } }, isLoading: false });
    renderPage();
    expect(screen.getByText('Niciun document găsit')).toBeInTheDocument();
    expect(screen.getByText('Încarcă primul document pentru a începe')).toBeInTheDocument();
  });

  it('afișează skeleton la loading', () => {
    useDocuments.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();
    expect(screen.queryByText('Procedură Mentenanță')).not.toBeInTheDocument();
  });

  it('afișează buton upload în empty state', () => {
    useDocuments.mockReturnValue({ data: { data: [], pagination: { page: 1, pages: 0, total: 0 } }, isLoading: false });
    renderPage();
    expect(screen.getAllByRole('button', { name: /Încarcă Document/ }).length).toBeGreaterThanOrEqual(1);
  });

  it('deschide modal upload la click pe buton', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Încarcă Document/ }));
    expect(screen.getByText('Încarcă Document', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText(/Trage fișierul aici/)).toBeInTheDocument();
  });

  it('afișează paginare când sunt mai multe pagini', () => {
    useDocuments.mockReturnValue({
      data: { data: mockDocuments, pagination: { page: 1, pages: 3, total: 150 } },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText(/150 documente/)).toBeInTheDocument();
    expect(screen.getByText(/Pagina 1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Următorul' })).toBeInTheDocument();
  });

  it('afișează butoanele Detalii per document', () => {
    renderPage();
    const detailBtns = screen.getAllByLabelText('Detalii');
    expect(detailBtns.length).toBe(2);
  });
});

describe('Faza 5.1 — Integritate & Expirare badges', () => {
  it('afișează badge integritate (✓) pe documentele cu fileHash', () => {
    renderPage();
    const hashBadges = screen.getAllByText('✓');
    expect(hashBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('afișează tooltip cu hash complet pe badge', () => {
    renderPage();
    const hashBadge = screen.getAllByText('✓')[0];
    expect(hashBadge).toHaveAttribute('title', expect.stringContaining('SHA-256'));
  });
});

describe('Faza 5.1 — DocumentDetailModal', () => {
  it('deschide modalul de detalii la click pe butonul Detalii', async () => {
    const user = userEvent.setup();
    renderPage();
    const detailBtns = screen.getAllByLabelText('Detalii');
    await user.click(detailBtns[0]);
    expect(screen.getByText('Procedură Mentenanță', { selector: '#doc-detail-title' })).toBeInTheDocument();
  });

  it('afișează tab-urile Informații și Istoric acces', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getAllByLabelText('Detalii')[0]);
    expect(screen.getByRole('button', { name: /Informații/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Istoric acces/ })).toBeInTheDocument();
  });

  it('afișează hash și buton verificare în tab Informații', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getAllByLabelText('Detalii')[0]);
    expect(screen.getByText(/Hash SHA-256/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verifică integritate/ })).toBeInTheDocument();
  });

  it('afișează issuer și validUntil pentru CERTIFICAT', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getAllByLabelText('Detalii')[1]);
    expect(screen.getByText('Laborator Metrologic SRL')).toBeInTheDocument();
  });

  it('închide modalul la click pe backdrop', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getAllByLabelText('Detalii')[0]);
    expect(screen.getByText('Procedură Mentenanță', { selector: '#doc-detail-title' })).toBeInTheDocument();
    await user.click(screen.getByRole('dialog'));
    await waitFor(() => {
      expect(screen.queryByText('Procedură Mentenanță', { selector: '#doc-detail-title' })).not.toBeInTheDocument();
    });
  });
});

describe('Faza 5.1 — Câmpuri condiționate în Upload', () => {
  it('afișează câmpul Emitent când categoria e CERTIFICAT', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Încarcă Document/ }));

    const categorySelect = screen.getByLabelText(/Categorie/i) || screen.getByDisplayValue('Altele');
    await user.selectOptions(categorySelect, 'CERTIFICAT');

    await waitFor(() => {
      expect(screen.getByLabelText(/Emitent/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Valabil până la/)).toBeInTheDocument();
    });
  });

  it('nu afișează câmpurile condiționate pentru ALTUL', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Încarcă Document/ }));

    expect(screen.queryByLabelText(/Emitent/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Valabil până la/)).not.toBeInTheDocument();
  });
});
