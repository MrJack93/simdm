import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../helpers/renderWithProviders.jsx';
import api from '../../api/axios';

const mockNavigate = vi.fn();
let mockParams = {};
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

import DeviceForm from '../../pages/DeviceForm';

const SECTIONS = [
  { id: 1, name: 'ATI' },
  { id: 2, name: 'Bloc Operator' },
];

function mockApiRouter() {
  api.get.mockImplementation((url) => {
    if (url === '/sections') return Promise.resolve({ data: SECTIONS });
    return Promise.resolve({ data: {} });
  });
  api.post.mockResolvedValue({ data: { id: 1 } });
  api.put.mockResolvedValue({ data: { id: 1 } });
}

async function next(user) {
  await user.click(screen.getByRole('button', { name: /Înainte/ }));
}

async function prev(user) {
  await user.click(screen.getByRole('button', { name: /Înapoi/ }));
}

describe('DeviceForm — wizard: navigare înapoi și persistența stării', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    mockApiRouter();
  });

  it('butonul Înapoi este dezactivat la primul pas', async () => {
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);
    expect(screen.getByRole('button', { name: /Înapoi/ })).toBeDisabled();
  });

  it('păstrează valorile introduse când utilizatorul navighează Înainte apoi Înapoi', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);

    // Pasul 0: completează câmpurile obligatorii.
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-PERSIST-1');
    await user.type(screen.getByLabelText('Denumire *'), 'Pompă infuzie');

    // Înainte la pasul 1, apoi Înapoi la pasul 0.
    await next(user);
    await screen.findByTestId('select-sectionId');
    await prev(user);

    // Valorile din pasul 0 trebuie să fie încă acolo (stare persistentă).
    expect(await screen.findByLabelText(/Numărul inventarului/)).toHaveValue('DM-PERSIST-1');
    expect(screen.getByLabelText('Denumire *')).toHaveValue('Pompă infuzie');
  });

  it('indicatorul de pas reflectă mișcarea înainte și înapoi prin wizard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);

    expect(screen.getByText(/Pasul 1 din/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-TEST');
    await user.type(screen.getByLabelText('Denumire *'), 'Test Device');
    await next(user);
    expect(await screen.findByText(/Pasul 2 din/)).toBeInTheDocument();
    await prev(user);
    expect(await screen.findByText(/Pasul 1 din/)).toBeInTheDocument();
  });

  it('selecția secției persistă după navigare Înainte/Înapoi între pași', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeviceForm />);
    await screen.findByLabelText(/Numărul inventarului/);

    await user.type(screen.getByLabelText(/Numărul inventarului/), 'DM-TEST');
    await user.type(screen.getByLabelText('Denumire *'), 'Test Device');
    await next(user); // pas 1: clasificare
    await user.selectOptions(await screen.findByTestId('select-sectionId'), '2');
    await next(user); // pas 2
    await prev(user); // înapoi la pas 1

    expect(await screen.findByTestId('select-sectionId')).toHaveValue('2');
  });
});
