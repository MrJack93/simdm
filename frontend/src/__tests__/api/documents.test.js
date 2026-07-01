import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from '../../api/axios';

beforeEach(() => {
  vi.clearAllMocks();
});

async function importDocs() {
  return await import('../../api/documents');
}

describe('documents API', () => {
  it('documentKeys.all returns correct key', async () => {
    const { documentKeys } = await importDocs();
    expect(documentKeys.all).toEqual(['documents']);
  });

  it('documentKeys.list returns correct key with filters', async () => {
    const { documentKeys } = await importDocs();
    expect(documentKeys.list({ search: 'test' })).toEqual(['documents', 'list', { search: 'test' }]);
  });

  it('documentKeys.detail returns correct key with id', async () => {
    const { documentKeys } = await importDocs();
    expect(documentKeys.detail(42)).toEqual(['documents', 'detail', 42]);
  });

  it('documentKeys.categories is a static key', async () => {
    const { documentKeys } = await importDocs();
    expect(documentKeys.categories).toEqual(['documents', 'categories']);
  });

  it('fetchDocuments with no args', async () => {
    const { fetchDocuments } = await importDocs();
    await fetchDocuments();
    expect(api.get).toHaveBeenCalledWith('/documents?page=1&limit=50');
  });

  it('fetchDocuments with search', async () => {
    const { fetchDocuments } = await importDocs();
    await fetchDocuments('test-query');
    expect(api.get).toHaveBeenCalledWith('/documents?search=test-query&page=1&limit=50');
  });

  it('fetchDocuments with filters skips null/undefined/empty', async () => {
    const { fetchDocuments } = await importDocs();
    await fetchDocuments('', { status: 'ACTIVE', year: null, month: undefined, q: '' });
    expect(api.get).toHaveBeenCalledWith('/documents?status=ACTIVE&page=1&limit=50');
  });

  it('fetchDocuments with all params', async () => {
    const { fetchDocuments } = await importDocs();
    await fetchDocuments('search', { type: 'DOC' }, 2, 10);
    expect(api.get).toHaveBeenCalledWith('/documents?search=search&type=DOC&page=2&limit=10');
  });

  it('fetchDocument by id', async () => {
    const { fetchDocument } = await importDocs();
    await fetchDocument(5);
    expect(api.get).toHaveBeenCalledWith('/documents/5');
  });

  it('fetchDocumentCategories', async () => {
    const { fetchDocumentCategories } = await importDocs();
    await fetchDocumentCategories();
    expect(api.get).toHaveBeenCalledWith('/documents/categories');
  });

  it('createDocument posts formData', async () => {
    const { createDocument } = await importDocs();
    const formData = new FormData();
    formData.append('file', 'test');
    await createDocument(formData);
    expect(api.post).toHaveBeenCalledWith('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('createDocumentVersion posts version', async () => {
    const { createDocumentVersion } = await importDocs();
    const formData = new FormData();
    await createDocumentVersion(3, formData);
    expect(api.post).toHaveBeenCalledWith('/documents/3/version', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('updateDocument puts updates', async () => {
    const { updateDocument } = await importDocs();
    await updateDocument(7, { title: 'Updated' });
    expect(api.put).toHaveBeenCalledWith('/documents/7', { title: 'Updated' });
  });

  it('deleteDocument deletes by id', async () => {
    const { deleteDocument } = await importDocs();
    await deleteDocument(10);
    expect(api.delete).toHaveBeenCalledWith('/documents/10');
  });

  it('verifyDocument gets verify endpoint', async () => {
    const { verifyDocument } = await importDocs();
    await verifyDocument(15);
    expect(api.get).toHaveBeenCalledWith('/documents/15/verify');
  });

  it('fetchDocumentAccessLog with defaults', async () => {
    const { fetchDocumentAccessLog } = await importDocs();
    await fetchDocumentAccessLog(5);
    expect(api.get).toHaveBeenCalledWith('/documents/5/access-log?page=1&limit=50');
  });

  it('fetchDocumentAccessLog with custom pagination', async () => {
    const { fetchDocumentAccessLog } = await importDocs();
    await fetchDocumentAccessLog(5, 3, 25);
    expect(api.get).toHaveBeenCalledWith('/documents/5/access-log?page=3&limit=25');
  });

  it('fetchExpiringDocuments with default days', async () => {
    const { fetchExpiringDocuments } = await importDocs();
    await fetchExpiringDocuments();
    expect(api.get).toHaveBeenCalledWith('/documents/expiring?days=60');
  });

  it('fetchExpiringDocuments with custom days', async () => {
    const { fetchExpiringDocuments } = await importDocs();
    await fetchExpiringDocuments(30);
    expect(api.get).toHaveBeenCalledWith('/documents/expiring?days=30');
  });
});
