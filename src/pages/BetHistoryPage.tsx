import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Clock, ChevronDown, ChevronUp, Trophy, Calendar, Loader2, Share2 } from 'lucide-react';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

type BetStatus = 'won' | 'lost' | 'pending' | 'cashout';

interface BetSelection {
  match: string;
  market: string;
  selection: string;
  odds: number;
}

interface Bet {
  id: string;
  created_at: string;
  selections: BetSelection[];
  total_odds: number;
  stake: number;
  potential_return: number;
  status: BetStatus;
  payout: number;
  settled_at: string | null;
  shared?: boolean;
}

const statusConfig: Record<BetStatus, { label: string; color: string; icon: typeof Check }> = {
  won: { label: 'Ganhou', color: 'text-secondary bg-secondary/15', icon: Check },
  lost: { label: 'Perdeu', color: 'text-destructive bg-destructive/15', icon: X },
  pending: { label: 'Pendente', color: 'text-primary bg-primary/15', icon: Clock },
  cashout: { label: 'Cash Out', color: 'text-primary bg-primary/15', icon: Check },
};

const filters: { id: BetStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'won', label: 'Ganhas' },
  { id: 'lost', label: 'Perdidas' },
  { id: 'pending', label: 'Pendentes' },
];

const BetHistoryPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [filter, setFilter] = useState<BetStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setLoading(false);
      return;
    }

    const fetchBets = async () => {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBets(data.map((b: any) => ({
          ...b,
          selections: Array.isArray(b.selections) ? b.selections : [],
        })));
      }
      setLoading(false);
    };

    fetchBets();
  }, [isLoggedIn, user]);

  if (!isLoggedIn) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center px-6 pt-20 pb-20 text-center space-y-4">
          <Trophy size={40} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-body">Faça login para ver seu histórico</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            className="bg-primary text-primary-foreground font-display font-bold text-sm px-6 py-3 rounded-xl min-h-[44px]"
          >
            Entrar
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  const filtered = filter === 'all' ? bets : bets.filter(b => b.status === filter);
  const settled = bets.filter(b => b.status !== 'pending');
  const totalStake = bets.reduce((sum, b) => sum + Number(b.stake), 0);
  const totalPayout = bets.filter(b => b.status === 'won').reduce((sum, b) => sum + Number(b.payout || 0), 0);
  const winRate = settled.length > 0 ? Math.round((bets.filter(b => b.status === 'won').length / settled.length) * 100) : 0;

  return (
    <PageTransition>
      <div className="pb-20 px-4 pt-2 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-extrabold">Histórico de Apostas</h1>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-3 gap-2">
          <motion.div variants={staggerItem} className="bg-surface-card rounded-xl p-3 text-center">
            <p className="font-display text-base font-bold text-primary">R$ {totalStake.toFixed(0)}</p>
            <p className="text-[0.6rem] text-muted-foreground font-body mt-0.5">Apostado</p>
          </motion.div>
          <motion.div variants={staggerItem} className="bg-surface-card rounded-xl p-3 text-center">
            <p className="font-display text-base font-bold text-secondary">R$ {totalPayout.toFixed(0)}</p>
            <p className="text-[0.6rem] text-muted-foreground font-body mt-0.5">Retorno</p>
          </motion.div>
          <motion.div variants={staggerItem} className="bg-surface-card rounded-xl p-3 text-center">
            <p className="font-display text-base font-bold text-foreground">{winRate}%</p>
            <p className="text-[0.6rem] text-muted-foreground font-body mt-0.5">Taxa Acerto</p>
          </motion.div>
        </motion.div>

        <div className="flex gap-2">
          {filters.map(f => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-body font-semibold min-h-[40px] transition-colors ${
                filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-surface-card text-muted-foreground'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((bet) => {
                const config = statusConfig[bet.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const isExpanded = expandedId === bet.id;
                const selections = bet.selections as BetSelection[];
                const mainSelection = selections[0];
                const profit = bet.status === 'won' ? Number(bet.payout) - Number(bet.stake) : 0;

                return (
                  <motion.div
                    key={bet.id}
                    variants={staggerItem}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface-card rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : bet.id)}
                      className="w-full p-4 flex items-center justify-between min-h-[60px]"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                          <StatusIcon size={14} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-body font-medium text-foreground truncate">
                            {mainSelection?.match || 'Aposta'}
                            {selections.length > 1 && ` +${selections.length - 1}`}
                          </p>
                          <p className="text-[0.65rem] text-muted-foreground font-body truncate">
                            {mainSelection?.selection}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="text-right">
                          <p className={`text-sm font-display font-bold ${bet.status === 'won' ? 'text-secondary' : bet.status === 'lost' ? 'text-destructive' : 'text-foreground'}`}>
                            {bet.status === 'won' ? `+R$ ${profit.toFixed(0)}` : bet.status === 'lost' ? `-R$ ${Number(bet.stake).toFixed(0)}` : `R$ ${Number(bet.stake).toFixed(0)}`}
                          </p>
                          <p className="text-[0.6rem] text-muted-foreground font-body">@{Number(bet.total_odds).toFixed(2)}</p>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-foreground/5 space-y-3">
                            {/* All selections */}
                            {selections.length > 1 && (
                              <div className="space-y-1.5">
                                <p className="text-[0.6rem] text-muted-foreground font-body font-semibold uppercase tracking-wider">Seleções ({selections.length})</p>
                                {selections.map((sel, i) => (
                                  <div key={i} className="bg-surface-interactive rounded-lg p-2.5 space-y-0.5">
                                    <p className="text-xs font-body text-foreground">{sel.match}</p>
                                    <div className="flex justify-between">
                                      <p className="text-[0.6rem] text-muted-foreground font-body">{sel.selection}</p>
                                      <p className="text-[0.6rem] font-display font-bold text-primary">{sel.odds.toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-between text-xs font-body">
                              <span className="text-muted-foreground flex items-center gap-1"><Calendar size={12} /> Data</span>
                              <span className="text-foreground">{new Date(bet.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between text-xs font-body">
                              <span className="text-muted-foreground">Valor Apostado</span>
                              <span className="text-foreground">R$ {Number(bet.stake).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-body">
                              <span className="text-muted-foreground">Odds Totais</span>
                              <span className="text-primary font-display font-bold">{Number(bet.total_odds).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-body">
                              <span className="text-muted-foreground">Retorno Potencial</span>
                              <span className="text-foreground">R$ {Number(bet.potential_return).toFixed(2)}</span>
                            </div>
                            {bet.status === 'won' && (
                              <div className="flex justify-between text-xs font-body">
                                <span className="text-muted-foreground">Pago</span>
                                <span className="text-secondary font-display font-bold">R$ {Number(bet.payout).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-body">
                              <span className="text-muted-foreground">Status</span>
                              <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-semibold ${config.color}`}>
                                {config.label}
                              </span>
                            </div>

                            {/* Share to Social */}
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={async () => {
                                const { error } = await supabase
                                  .from('bets')
                                  .update({ shared: !(bet as any).shared })
                                  .eq('id', bet.id);
                                if (!error) {
                                  setBets(prev => prev.map(b => b.id === bet.id ? { ...b, shared: !(bet as any).shared } : b));
                                  toast((bet as any).shared ? 'Aposta removida do Social' : 'Aposta compartilhada no Social!', {
                                    description: (bet as any).shared ? 'Sua aposta não aparece mais no feed' : 'Outros usuários podem ver sua aposta agora'
                                  });
                                }
                              }}
                              className={`w-full py-2.5 rounded-xl font-display font-bold text-xs min-h-[44px] flex items-center justify-center gap-2 transition-all ${
                                (bet as any).shared
                                  ? 'bg-secondary/15 text-secondary'
                                  : 'bg-primary/15 text-primary'
                              }`}
                            >
                              <Share2 size={14} />
                              {(bet as any).shared ? 'Compartilhado no Social' : 'Compartilhar no Social'}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Trophy size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-body">
              {bets.length === 0 ? 'Você ainda não fez nenhuma aposta' : 'Nenhuma aposta encontrada'}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default BetHistoryPage;
