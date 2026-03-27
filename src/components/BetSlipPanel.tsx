import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Sparkles, Check, GraduationCap, ShieldAlert } from 'lucide-react';
import { useBetSlipStore } from '@/store/betSlipStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface BetSlipPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type BetCoachEntry = {
  at: string;
  amount: number;
  mode: 'real' | 'training';
};

const COACH_HISTORY_KEY = 'esportesdasorte-coach-history-v1';
const LEARNING_MODE_KEY = 'esportesdasorte-learning-mode';
const TRAINING_MODE_KEY = 'esportesdasorte-training-mode';

const safeStorageGet = (key: string) => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

const readCoachHistory = (): BetCoachEntry[] => {
  try {
    const raw = safeStorageGet(COACH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BetCoachEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => typeof entry?.at === 'string' && typeof entry?.amount === 'number');
  } catch {
    return [];
  }
};

const writeCoachHistory = (entries: BetCoachEntry[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COACH_HISTORY_KEY, JSON.stringify(entries.slice(-250)));
};

const registerCoachEntry = (amount: number, mode: 'real' | 'training') => {
  const history = readCoachHistory();
  history.push({ at: new Date().toISOString(), amount, mode });
  writeCoachHistory(history);
};

const sameDay = (isoA: string, isoB: string) => isoA.slice(0, 10) === isoB.slice(0, 10);

const BetSlipPanel = ({ isOpen, onClose }: BetSlipPanelProps) => {
  const { bets, stake, setStake, removeBet, clearBets, totalOdds, potentialReturn, placeBet, placing } = useBetSlipStore();
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [learningMode, setLearningMode] = useState(() => safeStorageGet(LEARNING_MODE_KEY) !== 'false');
  const [trainingMode, setTrainingMode] = useState(() => safeStorageGet(TRAINING_MODE_KEY) === 'true');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LEARNING_MODE_KEY, String(learningMode));
  }, [learningMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TRAINING_MODE_KEY, String(trainingMode));
  }, [trainingMode]);

  const totalOddsValue = totalOdds();
  const potentialReturnValue = potentialReturn();
  const winChance = totalOddsValue > 0 ? Number(Math.min(95, Math.max(1, 100 / totalOddsValue)).toFixed(1)) : 0;
  const lossChance = Number((100 - winChance).toFixed(1));

  const coachInsights = useMemo(() => {
    const now = new Date().toISOString();
    const history = readCoachHistory().filter((entry) => entry.mode === 'real');
    const todayTotal = history
      .filter((entry) => sameDay(entry.at, now))
      .reduce((sum, entry) => sum + entry.amount, 0);

    const groupedByDay = history
      .filter((entry) => !sameDay(entry.at, now))
      .reduce<Record<string, number>>((acc, entry) => {
        const day = entry.at.slice(0, 10);
        acc[day] = (acc[day] || 0) + entry.amount;
        return acc;
      }, {});

    const previousDailyTotals = Object.values(groupedByDay);
    const avgDaily = previousDailyTotals.length
      ? previousDailyTotals.reduce((sum, value) => sum + value, 0) / previousDailyTotals.length
      : 0;

    const projectedToday = todayTotal + stake;
    const aboveNormal = avgDaily > 0 && projectedToday > avgDaily * 1.5;

    return {
      todayTotal,
      avgDaily,
      projectedToday,
      aboveNormal,
    };
  }, [stake, confirmed]);

  const handleConfirm = async () => {
    if (trainingMode) {
      registerCoachEntry(stake, 'training');
      setConfirmed(true);
      clearBets();
      toast.success('Simulação concluída no modo treino. Nenhum valor foi debitado.');
      setTimeout(() => {
        setConfirmed(false);
      }, 2400);
      return;
    }

    if (!isLoggedIn) {
      toast.error('Faça login para apostar');
      navigate('/auth');
      return;
    }

    const result = await placeBet();

    if (result.success) {
      registerCoachEntry(stake, 'real');
      setConfirmed(true);
      toast.success('Aposta confirmada!');
      if (coachInsights.aboveNormal) {
        toast.warning('Você está apostando acima do seu padrão diário. Considere reduzir o valor.');
      }
      setTimeout(() => {
        setConfirmed(false);
      }, 2400);
    } else {
      toast.error(result.error || 'Erro ao confirmar aposta');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass rounded-t-2xl max-h-[80vh] overflow-y-auto lg:static lg:w-80 lg:rounded-xl lg:max-h-none"
          >
            <div className="p-4 space-y-4">
              <div className="flex justify-center lg:hidden">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Meu Bilhete</h3>
                <div className="flex items-center gap-2">
                  {bets.length > 0 && (
                    <button onClick={clearBets} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors lg:hidden">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {bets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-body text-sm">
                  {confirmed ? '' : 'Selecione odds para adicionar apostas'}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {bets.map((bet) => (
                      <div key={bet.id} className="bg-surface-interactive rounded-lg p-3 space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-body">{bet.match}</p>
                            <p className="text-sm font-body font-semibold">{bet.selection}</p>
                            <p className="text-[0.65rem] text-muted-foreground font-body">{bet.market}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-primary font-bold">{bet.odds.toFixed(2)}</span>
                            <button onClick={() => removeBet(bet.id)} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLearningMode((prev) => !prev)}
                      className={`min-h-[44px] rounded-lg text-xs font-body font-semibold transition-colors flex items-center justify-center gap-2 ${
                        learningMode ? 'bg-primary/20 text-primary' : 'bg-surface-interactive text-muted-foreground'
                      }`}
                      aria-pressed={learningMode}
                      aria-label={`Modo aprendizado ${learningMode ? 'ativado' : 'desativado'}`}
                    >
                      <GraduationCap size={14} aria-hidden="true" />
                      Modo aprendizado
                    </button>
                    <button
                      onClick={() => setTrainingMode((prev) => !prev)}
                      className={`min-h-[44px] rounded-lg text-xs font-body font-semibold transition-colors flex items-center justify-center gap-2 ${
                        trainingMode ? 'bg-secondary/20 text-secondary' : 'bg-surface-interactive text-muted-foreground'
                      }`}
                      aria-pressed={trainingMode}
                      aria-label={`Modo treino sem dinheiro ${trainingMode ? 'ativado' : 'desativado'}`}
                    >
                      <ShieldAlert size={14} aria-hidden="true" />
                      Treino sem dinheiro
                    </button>
                  </div>

                  {learningMode && (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 space-y-2" role="status" aria-live="polite">
                      <p className="text-xs font-body font-semibold text-foreground">
                        Se você apostar <span className="text-primary font-bold">R$ {stake.toFixed(2)}</span> aqui, tem <span className="text-destructive font-bold">{lossChance.toFixed(1)}%</span> de chance de perder.
                      </p>
                      <p className="text-[0.7rem] font-body text-muted-foreground">
                        Probabilidade implícita de acerto: {winChance.toFixed(1)}% com odds totais de {totalOddsValue.toFixed(2)}.
                      </p>
                      <p className="text-[0.7rem] font-body text-muted-foreground">
                        Simulação em 10 apostas iguais: cerca de {Math.round((winChance / 100) * 10)} ganhos e {10 - Math.round((winChance / 100) * 10)} perdas.
                      </p>
                    </div>
                  )}

                  {coachInsights.aboveNormal && !trainingMode && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 space-y-1" role="alert">
                      <p className="text-xs font-body font-semibold text-destructive">Alerta do coach responsável</p>
                      <p className="text-[0.7rem] font-body text-foreground/85">
                        Hoje você projetou R$ {coachInsights.projectedToday.toFixed(2)} em apostas, acima da média diária de R$ {coachInsights.avgDaily.toFixed(2)}.
                      </p>
                    </div>
                  )}

                  <div className="bg-accent/30 rounded-xl p-3 flex items-start gap-2">
                    <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs font-body text-foreground/80">
                      Para este nível de risco, recomendamos apostar <span className="text-primary font-bold">R$ {Math.max(5, Math.round(stake * 0.75))}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-body text-muted-foreground">Valor:</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <input
                          type="number"
                          value={stake}
                          onChange={(e) => setStake(Number(e.target.value))}
                          className="w-full bg-surface-interactive rounded-lg py-2.5 pl-10 pr-3 text-sm font-body font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                          min={1}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm font-body">
                      <span className="text-muted-foreground">Odds totais:</span>
                      <span className="font-display font-bold text-primary">{totalOddsValue.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-body">Retorno potencial:</span>
                      <span className="font-display text-xl font-bold text-primary">
                        R$ {potentialReturnValue.toFixed(2)}
                      </span>
                    </div>

                    {/* Confirm Button with Golden Glow */}
                    <div className="relative">
                      <AnimatePresence mode="wait">
                        {confirmed ? (
                          <motion.div
                            key="confirmed"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="w-full flex flex-col items-center justify-center py-4 gap-2"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.3, 1] }}
                              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                              className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"
                              style={{ boxShadow: '0 0 30px hsl(145 100% 30% / 0.6), 0 0 60px hsl(145 100% 30% / 0.3)' }}
                            >
                              <Check size={28} className="text-secondary-foreground" strokeWidth={3} />
                            </motion.div>
                            <motion.p
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="font-display text-sm font-bold text-secondary"
                            >
                              Aposta Confirmada!
                            </motion.p>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="button"
                            onClick={handleConfirm}
                            disabled={placing}
                            whileTap={{ scale: 0.95 }}
                            className="w-full relative overflow-hidden font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] text-primary-foreground disabled:opacity-80"
                            style={{
                              background: 'linear-gradient(135deg, hsl(51 100% 50%), hsl(40 100% 55%), hsl(51 100% 50%))',
                              backgroundSize: '200% 200%',
                            }}
                            animate={placing ? {
                              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                              boxShadow: [
                                '0 0 15px hsl(51 100% 50% / 0.4)',
                                '0 0 40px hsl(51 100% 50% / 0.8), 0 0 80px hsl(40 100% 55% / 0.4)',
                                '0 0 15px hsl(51 100% 50% / 0.4)',
                              ],
                            } : {
                              boxShadow: [
                                '0 0 8px hsl(51 100% 50% / 0.3)',
                                '0 0 20px hsl(51 100% 50% / 0.5), 0 0 40px hsl(51 100% 50% / 0.2)',
                                '0 0 8px hsl(51 100% 50% / 0.3)',
                              ],
                            }}
                            transition={placing ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)' }}
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                            />
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              {placing ? (
                                <motion.span
                                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                                />
                              ) : (
                                trainingMode ? 'Simular Aposta' : 'Confirmar Aposta'
                              )}
                            </span>
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BetSlipPanel;
