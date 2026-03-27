import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import WalletPage from '@/pages/WalletPage';
import { useAuthStore } from '@/store/authStore';
import { useWallet } from '@/hooks/useWallet';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

// Mock stores and hooks
vi.mock('@/store/authStore');
vi.mock('@/hooks/useWallet');

describe('Wallet Payment Flow E2E Tests', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  const mockProfile = {
    cpf: '12345678901',
    phone: '11999999999',
  };

  const mockWallet = {
    balance: 500,
    bonus_balance: 100,
    in_bets: 50,
  };

  beforeAll(() => {
    // Setup mock implementations
    useAuthStore.mockReturnValue({
      isLoggedIn: true,
      user: mockUser,
      profile: mockProfile,
      initialize: vi.fn(),
    });

    useWallet.mockReturnValue({
      wallet: mockWallet,
      transactions: [],
      loading: false,
      fetchWallet: vi.fn(),
      createDeposit: vi.fn(),
      createWithdrawal: vi.fn(),
    });
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it('should display wallet balance correctly', async () => {
    render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/R\$ 500,00/)).toBeInTheDocument();
    });
  });

  it('should allow user to initiate deposit', async () => {
    const user = userEvent.setup();
    const { createDeposit } = useWallet();

    createDeposit.mockResolvedValue({
      type: 'checkout',
      url: 'https://checkout.stripe.com/test',
    });

    render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    const depositButton = screen.getByRole('button', { name: /Depositar/i });
    await user.click(depositButton);

    // Should show deposit view
    await waitFor(() => {
      expect(screen.getByText(/Valor do depósito/i)).toBeInTheDocument();
    });

    // Set amount
    const amountInput = screen.getByDisplayValue(/500/);
    await user.clear(amountInput);
    await user.type(amountInput, '100');

    // Click card method
    const cardButton = screen.getByRole('button', { name: /Cartão/i });
    await user.click(cardButton);

    // Verify createDeposit was called
    expect(createDeposit).toHaveBeenCalledWith(100, 'card');
  });

  it('should show PIX payment details when selected', async () => {
    const user = userEvent.setup();
    const { createDeposit } = useWallet();

    createDeposit.mockResolvedValue({
      type: 'pix',
      client_secret: '00020126580014br.gov.bcb.brcode...',
      expiry_time: 300,
    });

    render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    const depositButton = screen.getByRole('button', { name: /Depositar/i });
    await user.click(depositButton);

    // Select R$50 quick amount
    const quickAmount = screen.getByRole('button', { name: /\bR\$ 50\b/ });
    await user.click(quickAmount);

    // Select PIX
    const pixButton = screen.getByRole('button', { name: /PIX/i });
    await user.click(pixButton);

    expect(createDeposit).toHaveBeenCalledWith(50, 'pix');
  });

  it('should block PIX when KYC not verified', async () => {
    const user = userEvent.setup();

    useAuthStore.mockReturnValue({
      isLoggedIn: true,
      user: mockUser,
      profile: { cpf: '', phone: '' }, // Missing CPF/phone
      initialize: vi.fn(),
    });

    const { createDeposit } = useWallet();
    createDeposit.mockRejectedValue(
      new Error('PIX bloqueado: conclua a verificação KYC')
    );

    render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    const depositButton = screen.getByRole('button', { name: /Depositar/i });
    await user.click(depositButton);

    await waitFor(() => {
      expect(
        screen.getByText(/PIX bloqueado até verificação KYC/i)
      ).toBeInTheDocument();
    });
  });

  it('should allow user to initiate withdrawal', async () => {
    const user = userEvent.setup();
    const { createWithdrawal } = useWallet();

    createWithdrawal.mockResolvedValue({ status: 'pending' });

    render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    const withdrawButton = screen.getByRole('button', { name: /Sacar/i });
    await user.click(withdrawButton);

    await waitFor(() => {
      expect(screen.getByText(/Valor do saque/i)).toBeInTheDocument();
    });

    // Set amount
    const amountInput = screen.getByDisplayValue(/0/);
    await user.type(amountInput, '100');

    // Click withdraw button
    const confirmButton = screen.getByRole('button', { name: /Confirmar saque/i });
    await user.click(confirmButton);

    expect(createWithdrawal).toHaveBeenCalledWith(100, 'pix', undefined);
  });

  it('should not allow withdrawal exceeding balance', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    const withdrawButton = screen.getByRole('button', { name: /Sacar/i });
    await user.click(withdrawButton);

    // Try to set amount higher than balance
    const amountInput = screen.getByDisplayValue(/0/);
    await user.type(amountInput, '600'); // More than 500 balance

    const confirmButton = screen.queryByRole('button', { name: /Confirmar saque/i });
    // Button should be disabled or not present
    if (confirmButton) {
      expect(confirmButton).toBeDisabled();
    }
  });

  it('should show transaction history', async () => {
    const mockTransactions = [
      {
        id: 'tx1',
        type: 'deposit',
        method: 'card',
        amount: 100,
        status: 'confirmed',
        description: 'Depósito via Cartão',
        created_at: new Date().toISOString(),
      },
      {
        id: 'tx2',
        type: 'withdraw',
        method: 'pix',
        amount: 50,
        status: 'confirmed',
        description: 'Saque via PIX',
        created_at: new Date().toISOString(),
      },
    ];

    useWallet.mockReturnValue({
      wallet: mockWallet,
      transactions: mockTransactions,
      loading: false,
      fetchWallet: vi.fn(),
      createDeposit: vi.fn(),
      createWithdrawal: vi.fn(),
    });

    render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    // Should show last transactions
    await waitFor(() => {
      expect(screen.getByText(/Histórico de Transações/i)).toBeInTheDocument();
      expect(screen.getByText(/Depósito via Cartão/i)).toBeInTheDocument();
      expect(screen.getByText(/Saque via PIX/i)).toBeInTheDocument();
    });
  });

  it('should update balance after successful deposit', async () => {
    const user = userEvent.setup();
    const { createDeposit, fetchWallet } = useWallet();

    createDeposit.mockResolvedValue({
      type: 'checkout',
      url: 'https://checkout.stripe.com/test',
    });

    const { rerender } = render(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    const depositButton = screen.getByRole('button', { name: /Depositar/i });
    await user.click(depositButton);

    // Simulate successful deposit by updating wallet
    useWallet.mockReturnValue({
      wallet: { ...mockWallet, balance: 600 }, // Increased by 100
      transactions: [],
      loading: false,
      fetchWallet: vi.fn(),
      createDeposit: vi.fn(),
      createWithdrawal: vi.fn(),
    });

    rerender(
      <BrowserRouter>
        <WalletPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/R\$ 600,00/)).toBeInTheDocument();
    });
  });
});
