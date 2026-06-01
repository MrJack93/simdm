import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Wrapper reutilizabil: TanStack Query + React Router în memorie.
// Retry dezactivat ca testele să nu reîncerce request-urile eșuate.
export function renderWithProviders(ui, { route = '/', client } = {}) {
  const queryClient =
    client ||
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );

  return { ...result, queryClient };
}
