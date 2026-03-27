import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface BetItem {
  id: string;
  match: string;
  market: string;
  selection: string;
  odds: number;
}

interface BetSlipState {
  bets: BetItem[];
  stake: number;
  placing: boolean;
  addBet: (bet: BetItem) => void;
  removeBet: (id: string) => void;
  clearBets: () => void;
  setStake: (stake: number) => void;
  totalOdds: () => number;
  potentialReturn: () => number;
  placeBet: () => Promise<{ success: boolean; error?: string }>;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  bets: [],
  stake: 10,
  placing: false,
  addBet: (bet) =>
    set((state) => {
      const exists = state.bets.find((b) => b.id === bet.id);
      if (exists) {
        return { bets: state.bets.filter((b) => b.id !== bet.id) };
      }
      return { bets: [...state.bets, bet] };
    }),
  removeBet: (id) =>
    set((state) => ({ bets: state.bets.filter((b) => b.id !== id) })),
  clearBets: () => set({ bets: [] }),
  setStake: (stake) => set({ stake }),
  totalOdds: () => {
    const { bets } = get();
    if (bets.length === 0) return 0;
    return bets.reduce((acc, b) => acc * b.odds, 1);
  },
  potentialReturn: () => {
    const { stake } = get();
    const totalOdds = get().totalOdds();
    return stake * totalOdds;
  },
  placeBet: async () => {
    const { bets, stake } = get();
    if (bets.length === 0 || stake <= 0) {
      return { success: false, error: 'Adicione apostas e valor' };
    }

    set({ placing: true });

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Faça login para apostar' };

      // Check wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.balance < stake) {
        return { success: false, error: 'Saldo insuficiente. Deposite para apostar.' };
      }

      const totalOdds = get().totalOdds();
      const potentialReturn = get().potentialReturn();

      // Insert bet record
      const { error: betError } = await supabase.from('bets').insert({
        user_id: user.id,
        selections: bets.map(b => ({
          match: b.match,
          market: b.market,
          selection: b.selection,
          odds: b.odds,
        })),
        total_odds: totalOdds,
        stake,
        potential_return: potentialReturn,
        status: 'pending',
      });

      if (betError) throw betError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance - stake,
          in_bets: (wallet as any).in_bets ? (wallet as any).in_bets + stake : stake,
        })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Clear bet slip
      set({ bets: [], stake: 10 });
      return { success: true };
    } catch (err: any) {
      console.error('Error placing bet:', err);
      return { success: false, error: err.message || 'Erro ao confirmar aposta' };
    } finally {
      set({ placing: false });
    }
  },
}));
