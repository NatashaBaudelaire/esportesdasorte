import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Target, Percent, DollarSign, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

const periods = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: 'all', label: 'Tudo' },
];

type BetRow = {
  id: string;
  stake: number;
  payout: number | null;
  potential_return: number;
  status: string;
  created_at: string;
};

type TxRow = {
  id: string;
  type: string;
  amount: number;
  created_at: string;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PerformancePage = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const { isLoggedIn, user } = useAuthStore();
  const { depositLimit, betLimit, limitPeriod } = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [{ data: betsData }, { data: txData }] = await Promise.all([
        supabase
          .from('bets')
          .select('id, stake, payout, potential_return, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('id, type, amount, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      setBets((betsData || []).map((b) => ({ ...b, stake: Number(b.stake), potential_return: Number(b.potential_return), payout: b.payout ? Number(b.payout) : null })));
      setTransactions((txData || []).map((t) => ({ ...t, amount: Number(t.amount) })));
      setLoading(false);
    };

    fetchData();
  }, [isLoggedIn, user]);

  const daysFilter = useMemo(() => {
    if (period === '7d') return 7;
    if (period === '30d') return 30;
    if (period === '90d') return 90;
    return null;
  }, [period]);

  const filteredBets = useMemo(() => {
    if (!daysFilter) return bets;
    const minDate = Date.now() - daysFilter * 24 * 60 * 60 * 1000;
    return bets.filter((bet) => new Date(bet.created_at).getTime() >= minDate);
  }, [bets, daysFilter]);

  const settledBets = filteredBets.filter((bet) => bet.status === 'won' || bet.status === 'lost');
  const wonBets = settledBets.filter((bet) => bet.status === 'won');
  const lostBets = settledBets.filter((bet) => bet.status === 'lost');

  const grossWins = wonBets.reduce((sum, bet) => sum + (bet.payout && bet.payout > 0 ? bet.payout : bet.potential_return), 0);
  const grossLosses = lostBets.reduce((sum, bet) => sum + bet.stake, 0);
  const netProfit = grossWins - grossLosses;
  const invested = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
  const roi = invested > 0 ? (netProfit / invested) * 100 : 0;
  const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        gains: 0,
        losses: 0,
      };
    });

    settledBets.forEach((bet) => {
      const d = new Date(bet.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((item) => item.key === key);
      if (!bucket) return;

      if (bet.status === 'won') {
        bucket.gains += bet.payout && bet.payout > 0 ? bet.payout : bet.potential_return;
      } else if (bet.status === 'lost') {
        bucket.losses += bet.stake;
      }
    });

    return months.map((item) => ({
      ...item,
      profit: item.gains - item.losses,
    }));
  }, [settledBets]);

  const maxProfit = Math.max(1, ...monthlyData.map((d) => Math.abs(d.profit)));

  const alerts = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const monthlyDeposits = transactions
      .filter((tx) => tx.type === 'deposit' && new Date(tx.created_at).getTime() >= monthStart)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const monthBetCount = bets.filter((bet) => new Date(bet.created_at).getTime() >= monthStart).length;

    const configuredDepositLimit = Number(depositLimit || 0);
    const configuredBetLimit = Number(betLimit || 0);

    if (limitPeriod === 'mensal' && configuredDepositLimit > 0 && monthlyDeposits > configuredDepositLimit) {
      list.push(`Depósitos do mês (${formatCurrency(monthlyDeposits)}) acima do limite mensal configurado (${formatCurrency(configuredDepositLimit)}).`);
    }

    if (configuredBetLimit > 0 && monthBetCount > configuredBetLimit) {
      list.push(`Quantidade de apostas no mês (${monthBetCount}) acima do limite configurado (${configuredBetLimit}).`);
    }

    if (grossLosses > grossWins && settledBets.length >= 5) {
      list.push('Perdas acumuladas acima dos ganhos no período. Considere reduzir exposição ou ativar pausa.');
    }

    return list;
  }, [transactions, bets, depositLimit, betLimit, limitPeriod, grossLosses, grossWins, settledBets.length]);

  return (
    <PageTransition>
      <div className="pb-20 px-4 pt-2 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-extrabold">Relatório de Desempenho</h1>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {periods.map(p => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-body font-semibold min-h-[40px] transition-colors ${
                period === p.id ? 'bg-primary text-primary-foreground' : 'bg-surface-card text-muted-foreground'
              }`}
            >
              {p.label}
            </motion.button>
          ))}
        </div>

        {/* KPIs */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-2">
          {[
            { label: 'Ganhos', value: formatCurrency(grossWins), icon: TrendingUp, positive: grossWins >= grossLosses },
            { label: 'Perdas', value: formatCurrency(grossLosses), icon: TrendingDown, positive: false },
            { label: 'Resultado Líquido', value: `${netProfit >= 0 ? '+' : '-'}${formatCurrency(Math.abs(netProfit))}`, icon: DollarSign, positive: netProfit >= 0 },
            { label: 'ROI', value: `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`, icon: Percent, positive: roi >= 0 },
            { label: 'Taxa de Acerto', value: `${winRate.toFixed(1)}%`, icon: Target, positive: winRate >= 50 },
            { label: 'Total de Apostas', value: String(filteredBets.length), icon: BarChart3, positive: true },
          ].map(kpi => (
            <motion.div key={kpi.label} variants={staggerItem} className="bg-surface-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={14} className="text-muted-foreground" />
                <span className="text-[0.65rem] text-muted-foreground font-body">{kpi.label}</span>
              </div>
              <p className={`font-display text-lg font-bold ${kpi.positive ? 'text-secondary' : 'text-destructive'}`}>
                {kpi.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface-card rounded-xl p-4 space-y-2"
        >
          <h3 className="text-xs font-body font-medium text-muted-foreground flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" /> Limites Configurados
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-body">
            <div className="bg-surface-interactive rounded-lg p-3">
              <p className="text-muted-foreground">Limite de depósito ({limitPeriod})</p>
              <p className="font-semibold text-foreground">{Number(depositLimit || 0) > 0 ? formatCurrency(Number(depositLimit)) : 'Não definido'}</p>
            </div>
            <div className="bg-surface-interactive rounded-lg p-3">
              <p className="text-muted-foreground">Limite de apostas</p>
              <p className="font-semibold text-foreground">{Number(betLimit || 0) > 0 ? `${betLimit} apostas` : 'Não definido'}</p>
            </div>
          </div>
        </motion.div>

        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-2"
            role="alert"
          >
            <h3 className="text-xs font-body font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle size={14} /> Alertas Financeiros
            </h3>
            <ul className="space-y-1">
              {alerts.map((alert) => (
                <li key={alert} className="text-[0.7rem] font-body text-foreground">{alert}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Mini Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-card rounded-xl p-4 space-y-3"
        >
          <h3 className="text-xs font-body font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" /> Lucro Mensal
          </h3>
          <div className="flex items-end gap-2 h-28">
            {monthlyData.map((d, i) => {
              const height = (Math.abs(d.profit) / maxProfit) * 100;
              return (
                <motion.div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-1"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 200 }}
                  style={{ originY: 1 }}
                >
                  <span className={`text-[0.55rem] font-display font-bold ${d.profit >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {d.profit > 0 ? '+' : ''}{d.profit.toFixed(0)}
                  </span>
                  <div
                    className={`w-full rounded-lg ${d.profit >= 0 ? 'bg-secondary/30' : 'bg-destructive/30'}`}
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                  <span className="text-[0.55rem] text-muted-foreground font-body capitalize">{d.month}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-card rounded-xl p-4"
        >
          <p className="text-xs font-body text-muted-foreground">
            {loading
              ? 'Carregando dados financeiros...'
              : settledBets.length === 0
                ? 'Ainda não há apostas liquidadas suficientes para análise completa neste período.'
                : `Resumo do período: ${wonBets.length} apostas ganhas, ${lostBets.length} perdidas e ${filteredBets.length} apostas totais.`}
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default PerformancePage;
