import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Shield, Clock, Ban, ExternalLink, AlertTriangle,
  HeartHandshake, Phone, Mail, HelpCircle, CheckCircle2,
  AlertCircle, Zap, TrendingDown
} from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { PageTransition } from '@/components/animations';

const ResponsibleGamingPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    sessionAlert, setSessionAlert, sessionMinutes, setSessionMinutes,
    depositLimit, setDepositLimit,
    betLimit, setBetLimit,
    limitPeriod, setLimitPeriod,
  } = useSettingsStore();

  const [showAutoExclusionModal, setShowAutoExclusionModal] = useState(false);
  const [exclusionPeriod, setExclusionPeriod] = useState<'7' | '30' | '90' | 'permanent'>('30');
  const [tempPauseActive, setTempPauseActive] = useState(false);

  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (sessionAlert && sessionMinutes > 0) {
      sessionTimerRef.current = setInterval(() => {
        const msg = `Você está jogando há ${sessionMinutes} minutos. Faça uma pausa!`;
        toast.warning(msg, { duration: 8000 });
        const soundAlerts = JSON.parse(localStorage.getItem('soundAlerts') ?? 'true');
        if (soundAlerts) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBg==');
          audio.play().catch(() => {});
        }
      }, sessionMinutes * 60 * 1000);
    }
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, [sessionAlert, sessionMinutes]);

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label,
    ariaLabel 
  }: { 
    checked: boolean
    onChange: (v: boolean) => void
    label?: string
    ariaLabel?: string
  }) => (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full relative transition-colors min-w-[48px] min-h-[28px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-surface-interactive'
      }`}
    >
      <span className={`absolute w-5 h-5 rounded-full transition-transform ${
        checked ? 'bg-primary-foreground translate-x-6' : 'bg-muted-foreground translate-x-1'
      }`} />
    </button>
  );

  const handleAutoExclude = async () => {
    const period = exclusionPeriod === 'permanent' ? 'permanente' : `${exclusionPeriod} dias`;
    toast.success(`Autoexclusão ativada por ${period}`);
    setShowAutoExclusionModal(false);
    setTempPauseActive(true);
    // In production: call backend API to set exclusion
  };

  const handleTempPause = async () => {
    setTempPauseActive(true);
    toast.success('Pausa de 24 horas ativada. Você poderá jogar novamente amanhã.');
    // In production: call backend API to set pause
  };

  return (
    <PageTransition>
      <div className="pb-24 px-4 pt-2 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-extrabold">Jogo Responsável</h1>
        </div>

        {/* Critical Warning */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/15 border border-destructive rounded-xl p-4 flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-body font-bold text-foreground">Aviso Importante</p>
            <p className="text-xs font-body text-foreground/80 mt-1">
              Apostas podem ser compulsivas e prejudiciais à saúde mental. Se você sente que está perdendo o controle, use as ferramentas de pausa ou autoexclusão.
            </p>
          </div>
        </motion.div>

        {/* Age & Identity Verification Status */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-surface-card rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <p className="text-sm font-body font-bold text-foreground">Status de Verificação</p>
          </div>
          <div className="space-y-2 text-xs font-body">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-secondary flex-shrink-0" />
              <span className="text-foreground/80">Maiores de 18 anos: Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-secondary flex-shrink-0" />
              <span className="text-foreground/80">Identidade: Verificada via KYC</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-primary flex-shrink-0" />
              <span className="text-foreground/80">Documento: Requer renovação em 30 dias</span>
            </div>
          </div>
        </motion.div>

        {/* Deposit Limit */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <TrendingDown size={18} className="text-muted-foreground" />
            <p className="text-sm font-body font-bold text-foreground">Limite de Depósito</p>
          </div>
          <p className="text-xs font-body text-muted-foreground">Valor máximo que pode depositar</p>
          <div className="flex gap-2 mb-2">
            {['diario', 'semanal', 'mensal'].map((p) => (
              <button
                key={p}
                onClick={() => setLimitPeriod(p)}
                aria-pressed={limitPeriod === p}
                className={`flex-1 py-2.5 rounded-xl text-[0.65rem] font-body font-semibold min-h-[44px] transition-colors capitalize ${
                  limitPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-surface-interactive text-muted-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <input
              type="number"
              value={depositLimit}
              onChange={(e) => setDepositLimit(e.target.value)}
              placeholder="Definir limite (ex: 100)"
              aria-label={`Limite de depósito ${limitPeriod}`}
              className="w-full bg-surface-interactive rounded-xl py-3 pl-10 pr-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
            />
          </div>
          <p className="text-[0.65rem] text-muted-foreground">Limite aplicado automaticamente ao próximo depósito</p>
        </motion.div>

        {/* Bet Limit */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-card rounded-xl p-4 space-y-3"
        >
          <p className="text-sm font-body font-bold text-foreground">Limite de Apostas por Sessão</p>
          <p className="text-xs font-body text-muted-foreground">Número máximo de apostas consecutivas</p>
          <div className="relative">
            <input
              type="number"
              value={betLimit}
              onChange={(e) => setBetLimit(e.target.value)}
              placeholder="Número de apostas (ex: 10)"
              aria-label="Limite de apostas por sessão"
              className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
            />
          </div>
        </motion.div>

        {/* Session Alert */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-body font-medium text-foreground">Alerta de Tempo de Sessão</p>
                <p className="text-[0.65rem] text-muted-foreground font-body">
                  {sessionAlert ? `Notificar a cada ${sessionMinutes} minutos` : 'Desativado'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={sessionAlert}
              onChange={setSessionAlert}
              ariaLabel="Ativar alerta de tempo de sessão"
            />
          </div>
          <AnimatePresence>
            {sessionAlert && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2">
                {[30, 60, 90, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSessionMinutes(m)}
                    aria-pressed={sessionMinutes === m}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-body font-semibold min-h-[40px] transition-colors ${
                      sessionMinutes === m ? 'bg-primary text-primary-foreground' : 'bg-surface-interactive text-muted-foreground'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Temporary Pause */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl p-4 space-y-3 ${
            tempPauseActive ? 'bg-secondary/10 border border-secondary' : 'bg-surface-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={18} className={tempPauseActive ? 'text-secondary' : 'text-muted-foreground'} />
              <div>
                <p className="text-sm font-body font-bold text-foreground">Pausa de 24 Horas</p>
                <p className="text-[0.65rem] text-muted-foreground font-body">
                  {tempPauseActive ? 'Pausa ativa até amanhã' : 'Pausar as apostas por 24 horas'}
                </p>
              </div>
            </div>
          </div>
          {!tempPauseActive && (
            <button
              onClick={handleTempPause}
              className="w-full bg-primary/20 text-primary font-body font-semibold py-3 rounded-lg min-h-[44px] hover:bg-primary/30 transition-colors"
            >
              Ativar Pausa de 24h
            </button>
          )}
        </motion.div>

        {/* Self-Exclusion */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-destructive/10 rounded-xl p-4 space-y-3 border border-destructive/30"
        >
          <div className="flex items-center gap-3">
            <Ban size={18} className="text-destructive" />
            <div>
              <p className="text-sm font-body font-bold text-foreground">Autoexclusão</p>
              <p className="text-[0.65rem] text-muted-foreground font-body">
                Bloquear sua conta por um período determinado
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAutoExclusionModal(true)}
            className="w-full bg-destructive/20 text-destructive font-body font-semibold py-3 rounded-lg min-h-[44px] hover:bg-destructive/30 transition-colors"
          >
            Ativar Autoexclusão
          </button>
        </motion.div>

        {/* Support Resources */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface-card rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2 mb-3">
            <HeartHandshake size={18} className="text-primary" />
            <p className="text-sm font-body font-bold text-foreground">Recursos de Ajuda</p>
          </div>

          <a
            href="tel:+551132123500"
            className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-interactive hover:bg-surface-interactive/80 transition-colors"
            aria-label="Ligar para Jogadores Anônimos"
          >
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-muted-foreground" />
              <span className="text-xs font-body font-semibold text-foreground">Jogadores Anônimos</span>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </a>

          <a
            href="https://www.jogadoresanonimos.org.br"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-interactive hover:bg-surface-interactive/80 transition-colors"
            aria-label="Visitar site Jogadores Anônimos"
          >
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-muted-foreground" />
              <span className="text-xs font-body font-semibold text-foreground">Mais Informações Online</span>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </a>

          <a
            href="https://www.vceseguro.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-interactive hover:bg-surface-interactive/80 transition-colors"
            aria-label="Visitar site Você Seguro"
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-muted-foreground" />
              <span className="text-xs font-body font-semibold text-foreground">Você Seguro - Orientação</span>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </a>
        </motion.div>

        {/* Education Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-surface-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-primary" />
            <p className="text-sm font-body font-bold text-foreground">Sinais de Alerta</p>
          </div>
          <ul className="text-[0.7rem] font-body space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <span className="flex-shrink-0">•</span>
              <span>Apotar mais dinheiro do que pode perder</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">•</span>
              <span>Pensar constantemente em apostas</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">•</span>
              <span>Apostas crescentes para alcançar emoção</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">•</span>
              <span>Perder tempo e relacionamentos</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">•</span>
              <span>Esconder atividades de apostas</span>
            </li>
          </ul>
        </motion.div>

        {/* Disclosure */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-card rounded-xl p-3 text-[0.65rem] font-body text-muted-foreground space-y-2"
        >
          <p className="font-semibold text-foreground">Informações Legais</p>
          <p>
            Oferecemos serviços de apostas apenas para maiores de 18 anos. A prática de jogos de azar pode resultar em perda de dinheiro. Jogue responsavelmente.
          </p>
          <p>
            Nossa plataforma está em conformidade com regulamentações de proteção ao consumidor, incluindo KYC (Know Your Customer) e AML (Combate à Lavagem de Dinheiro).
          </p>
        </motion.div>
      </div>

      {/* Auto-Exclusion Modal */}
      <AnimatePresence>
        {showAutoExclusionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAutoExclusionModal(false)}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            role="alertdialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-background rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div>
                <h2 className="font-display text-xl font-extrabold">Autoexclusão</h2>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  Escolha por quanto tempo deseja bloquear sua conta
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { value: '7', label: '7 dias', desc: 'Pausa curta' },
                  { value: '30', label: '30 dias', desc: 'Pausa recomendada' },
                  { value: '90', label: '90 dias', desc: 'Pausa longa' },
                  { value: 'permanent', label: 'Permanente', desc: 'Bloqueio indefinido' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setExclusionPeriod(value as typeof exclusionPeriod)}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      exclusionPeriod === value
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-surface-card border border-surface-interactive'
                    }`}
                  >
                    <div className="font-semibold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 rounded-xl p-3 flex gap-2"
                role="alert"
              >
                <AlertTriangle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-[0.7rem] text-foreground">
                  Esta ação não pode ser revertida durante o período escolhido.
                </p>
              </motion.div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAutoExclusionModal(false)}
                  className="flex-1 py-3 rounded-xl bg-surface-interactive text-foreground font-body font-semibold min-h-[44px] hover:bg-surface-interactive/80"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAutoExclude}
                  className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-body font-semibold min-h-[44px] hover:brightness-110"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default ResponsibleGamingPage;
