import { useQuery } from '@tanstack/react-query';
import { fetchDocuments, fetchDocument, fetchDocumentCategories, documentKeys } from '../api/documents';

export const useDocuments = (search = '', filters = {}, page = 1, limit = 50, options = {}) =>
  useQuery({
    queryKey: documentKeys.list({ search, filters, page, limit }),
    queryFn: () => fetchDocuments(search, filters, page, limit),
    staleTime: 60_000,
    keepPreviousData: true,
    ...options,
  });

export const useDocument = (id, options = {}) =>
  useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => fetchDocument(id),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });

export const useDocumentCategories = (options = {}) =>
  useQuery({
    queryKey: documentKeys.categories,
    queryFn: fetchDocumentCategories,
    staleTime: 300_000,
    ...options,
  });
