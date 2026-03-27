import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export interface WalletData {
  balance: number;
  bonus_balance: number;
  in_bets: number;
}

export interface Transaction {
  id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { isLoggedIn } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletData) {
        setWallet({
          balance: Number(walletData.balance),
          bonus_balance: Number(walletData.bonus_balance),
          in_bets: Number(walletData.in_bets),
        });
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txData) setTransactions(txData as Transaction[]);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const createDeposit = async (amount: number, method: string) => {
    const { data, error } = await supabase.functions.invoke('create-deposit', {
      body: { amount, method },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const createWithdrawal = async (amount: number, method: string, pixKey?: string) => {
    const { data, error } = await supabase.functions.invoke('create-withdrawal', {
      body: { amount, method, pixKey },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  return { wallet, transactions, loading, fetchWallet, createDeposit, createWithdrawal };
};
