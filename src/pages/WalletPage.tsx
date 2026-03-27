import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, Bitcoin, Clock,
  QrCode, Copy, Check, ChevronLeft, ChevronRight, Shield, AlertTriangle,
  Gift, Banknote, X, CheckCircle2, Timer, Eye, EyeOff, Loader2
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type View = 'main' | 'deposit' | 'deposit-pix' | 'deposit-card' | 'deposit-boleto' | 'deposit-crypto' | 'withdraw' | 'withdraw-confirm';

const WalletPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user, profile } = useAuthStore();
  const { wallet, transactions, loading, fetchWallet, createDeposit, createWithdrawal } = useWallet();
  const { toast } = useToast();

  const [view, setView] = useState<View>('main');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('pix');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');
  const [pixCopied, setPixCopied] = useState(false);
  const [pixTimer, setPixTimer] = useState(300);
  const [showBalance, setShowBalance] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code?: string; code?: string } | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [pixKycVerified, setPixKycVerified] = useState(false);

  const isPixMethodBlocked = !pixKycVerified;

  useEffect(() => {
    const cpfDigits = (profile?.cpf || '').replace(/\D/g, '');
    const phoneDigits = (profile?.phone || '').replace(/\D/g, '');
    const profileBasedVerification = cpfDigits.length === 11 && phoneDigits.length >= 10;
    setPixKycVerified(profileBasedVerification);
  }, [profile?.cpf, profile?.phone]);

  useEffect(() => {
    const ensureProfileLoaded = async () => {
      if (!isLoggedIn || !user) return;
      if (profile) return;

      await supabase
        .from('profiles')
        .select('cpf, phone')
        .eq('user_id', user.id)
        .single();
    };

    ensureProfileLoaded();
  }, [isLoggedIn, user, profile]);

  // Check for deposit success from URL params
  useEffect(() => {
    if (searchParams.get('deposit') === 'success') {
      setDepositSuccess(true);
      fetchWallet();
      setTimeout(() => setDepositSuccess(false), 5000);
    }
  }, [searchParams, fetchWallet]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !isLoggedIn) navigate('/auth');
  }, [loading, isLoggedIn, navigate]);

  // PIX countdown timer
  useEffect(() => {
    if (view !== 'deposit-pix') return;
    if (pixTimer <= 0) return;
    const interval = setInterval(() => setPixTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [view, pixTimer]);

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleCopyPix = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const maskCard = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  const maskExpiry = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').slice(0, 5);

  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  const handleDeposit = async (method: string) => {
    const amount = Number(depositAmount);
    if (amount < 10 || amount > 50000) return;

    if (method === 'pix' && isPixMethodBlocked) {
      toast({
        title: 'PIX bloqueado por KYC',
        description: 'Atualize CPF e telefone válidos no perfil para usar PIX.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const result = await createDeposit(amount, method);
      if (result.type === 'checkout' && result.url) {
        window.open(result.url, '_blank');
        setView('main');
      } else if (result.type === 'pix') {
        setPixData({ code: result.client_secret });
        setPixTimer(300);
        setView('deposit-pix');
      } else if (result.type === 'boleto') {
        setView('deposit-boleto');
      }
      toast({ title: 'Depósito iniciado', description: `Depósito de ${formatCurrency(amount)} via ${method.toUpperCase()} foi criado.` });
    } catch (err: any) {
      toast({ title: 'Erro no depósito', description: err.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (amount < 20 || !wallet || amount > wallet.balance) return;

    if (withdrawMethod === 'pix' && isPixMethodBlocked) {
      toast({
        title: 'Saque PIX bloqueado por KYC',
        description: 'Atualize CPF e telefone válidos no perfil para liberar PIX.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      await createWithdrawal(amount, withdrawMethod, withdrawPixKey || undefined);
      setWithdrawSuccess(true);
      fetchWallet();
    } catch (err: any) {
      toast({ title: 'Erro no saque', description: err.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const statusConfig: Record<string, { label: string; class: string }> = {
    confirmed: { label: 'Confirmado', class: 'bg-secondary/20 text-secondary' },
    pending: { label: 'Pendente', class: 'bg-primary/20 text-primary' },
    processing: { label: 'Processando', class: 'bg-accent/30 text-accent-foreground' },
    failed: { label: 'Falhou', class: 'bg-destructive/20 text-destructive' },
    cancelled: { label: 'Cancelado', class: 'bg-muted text-muted-foreground' },
    lost: { label: 'Perdido', class: 'bg-destructive/20 text-destructive' },
  };

  const SubHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onBack} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground">
        <ChevronLeft size={22} />
      </button>
      <h2 className="font-display text-lg font-bold">{title}</h2>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  const balance = wallet?.balance ?? 0;
  const bonusBalance = wallet?.bonus_balance ?? 0;
  const inBets = wallet?.in_bets ?? 0;
  const totalBalance = balance + bonusBalance + inBets;

  /* ═══ MAIN VIEW ═══ */
  if (view === 'main') return (
    <div className="space-y-6 pb-20 px-4 pt-2">
      {/* Deposit success banner */}
      <AnimatePresence>
        {depositSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-secondary/20 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-secondary" />
            <p className="text-sm font-body font-medium text-secondary">Depósito confirmado com sucesso!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Card */}
      <div className="bg-accent rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-primary" />
            <span className="text-sm font-body text-foreground/70">Saldo Disponível</span>
          </div>
          <button onClick={() => setShowBalance(!showBalance)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <p className="font-display text-4xl font-extrabold text-gradient-gold">
          {showBalance ? formatCurrency(balance) : 'R$ •••••'}
        </p>
        <div className="flex gap-6 text-sm font-body">
          <div>
            <span className="text-muted-foreground text-xs">Em apostas</span>
            <p className="font-semibold text-primary">{showBalance ? formatCurrency(inBets) : '•••'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Bônus</span>
            <p className="font-semibold text-secondary">{showBalance ? formatCurrency(bonusBalance) : '•••'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Total</span>
            <p className="font-semibold text-foreground">{showBalance ? formatCurrency(totalBalance) : '•••'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setView('deposit')}
            className="flex-1 bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
            <ArrowDownLeft size={16} /> Depositar
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setView('withdraw')}
            className="flex-1 bg-surface-interactive text-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
            <ArrowUpRight size={16} /> Sacar
          </motion.button>
        </div>
      </div>

      {!pixKycVerified && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3" role="alert">
          <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-body font-semibold text-foreground">PIX bloqueado até verificação KYC</p>
            <p className="text-[0.6rem] font-body text-muted-foreground mt-1">
              Para liberar depósitos e saques via PIX, complete CPF e telefone válidos no seu perfil.
            </p>
          </div>
        </div>
      )}

      {/* Transactions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-bold flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            Histórico de Transações
          </h3>
          <button onClick={() => navigate('/historico')} className="text-xs text-primary font-body font-semibold flex items-center gap-0.5 min-h-[44px]">
            Ver tudo <ChevronRight size={14} />
          </button>
        </div>
        {transactions.length === 0 ? (
          <div className="bg-surface-card rounded-xl p-6 text-center">
            <p className="text-sm font-body text-muted-foreground">Nenhuma transação ainda</p>
            <p className="text-xs font-body text-muted-foreground mt-1">Faça seu primeiro depósito!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 8).map((tx) => {
              const sc = statusConfig[tx.status] || statusConfig.confirmed;
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="bg-surface-card rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isPositive ? 'bg-secondary/20' : 'bg-destructive/20'}`}>
                      {tx.type === 'bonus' ? <Gift size={15} className="text-secondary" /> :
                        isPositive ? <ArrowDownLeft size={15} className="text-secondary" /> : <ArrowUpRight size={15} className="text-destructive" />}
                    </div>
                    <div>
                      <p className="text-sm font-body font-medium">{tx.description || tx.method}</p>
                      <p className="text-[0.6rem] text-muted-foreground font-body">
                        {new Date(tx.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-display font-bold ${isPositive ? 'text-secondary' : 'text-foreground'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <span className={`text-[0.5rem] font-body font-semibold px-1.5 py-0.5 rounded-full ${sc.class}`}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  /* ═══ DEPOSIT - METHOD SELECTION ═══ */
  if (view === 'deposit') return (
    <div className="px-4 pt-2 pb-20 space-y-5">
      <SubHeader title="Depositar" onBack={() => setView('main')} />
      <div className="space-y-3">
        <label className="text-xs font-body font-medium text-muted-foreground">Valor do depósito</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-display font-bold text-muted-foreground">R$</span>
          <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0,00"
            className="w-full bg-surface-card rounded-xl py-4 pl-14 pr-4 text-2xl font-display font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
            min={10} max={50000} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map((a) => (
            <button key={a} onClick={() => setDepositAmount(String(a))}
              className={`px-4 py-2 rounded-lg text-xs font-display font-bold min-h-[36px] transition-colors ${
                depositAmount === String(a) ? 'bg-primary text-primary-foreground' : 'bg-surface-interactive text-foreground/70 hover:bg-muted'
              }`}>
              R$ {a}
            </button>
          ))}
        </div>
        <p className="text-[0.6rem] text-muted-foreground font-body">Mínimo R$ 10,00 • Máximo R$ 50.000,00</p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-body font-medium text-muted-foreground">Escolha o método</label>
        <div className="space-y-2">
          {[
            { id: 'pix', icon: QrCode, label: 'PIX', desc: pixKycVerified ? 'Instantâneo • Sem taxas' : 'Bloqueado até KYC válido', tag: pixKycVerified ? 'Mais rápido' : 'KYC necessário' },
            { id: 'card', icon: CreditCard, label: 'Cartão de Crédito/Débito', desc: 'Visa, Mastercard, Elo' },
            { id: 'boleto', icon: Banknote, label: 'Boleto Bancário', desc: '1-3 dias úteis' },
            { id: 'crypto', icon: Bitcoin, label: 'Criptomoedas', desc: 'Bitcoin, Ethereum, USDT' },
          ].map((m) => (
            <button key={m.id} onClick={() => handleDeposit(m.id)}
              disabled={!depositAmount || Number(depositAmount) < 10 || processing || (m.id === 'pix' && isPixMethodBlocked)}
              className="w-full flex items-center gap-3 bg-surface-card rounded-xl p-4 min-h-[44px] hover:bg-surface-interactive transition-colors disabled:opacity-40 relative">
              <div className="w-10 h-10 rounded-full bg-surface-interactive flex items-center justify-center">
                {processing ? <Loader2 size={20} className="animate-spin text-primary" /> : <m.icon size={20} className="text-primary" />}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-body font-semibold">{m.label}</p>
                <p className="text-[0.6rem] font-body text-muted-foreground">{m.desc}</p>
              </div>
              {m.tag && (
                <span className="bg-secondary/20 text-secondary text-[0.55rem] font-display font-bold px-2 py-0.5 rounded-full">{m.tag}</span>
              )}
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══ DEPOSIT - PIX ═══ */
  if (view === 'deposit-pix') return (
    <div className="px-4 pt-2 pb-20 space-y-5">
      <SubHeader title="Depósito via PIX" onBack={() => setView('deposit')} />
      <div className="bg-surface-card rounded-2xl p-5 space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Timer size={16} className="text-primary" />
          <span className="text-xs font-body text-muted-foreground">
            Expira em <span className="font-display font-bold text-primary">{formatTimer(pixTimer)}</span>
          </span>
        </div>
        <p className="font-display text-2xl font-extrabold text-primary">
          {formatCurrency(Number(depositAmount))}
        </p>

        {/* QR Code */}
        <div className="bg-white rounded-xl p-4 mx-auto w-52 h-52 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="white"/>
            <rect x="10" y="10" width="50" height="50" fill="black" rx="4"/>
            <rect x="16" y="16" width="38" height="38" fill="white" rx="2"/>
            <rect x="22" y="22" width="26" height="26" fill="black" rx="2"/>
            <rect x="140" y="10" width="50" height="50" fill="black" rx="4"/>
            <rect x="146" y="16" width="38" height="38" fill="white" rx="2"/>
            <rect x="152" y="22" width="26" height="26" fill="black" rx="2"/>
            <rect x="10" y="140" width="50" height="50" fill="black" rx="4"/>
            <rect x="16" y="146" width="38" height="38" fill="white" rx="2"/>
            <rect x="22" y="152" width="26" height="26" fill="black" rx="2"/>
            {Array.from({ length: 12 }, (_, i) =>
              Array.from({ length: 12 }, (_, j) => {
                const show = ((i * 7 + j * 13 + 3) % 3) !== 0;
                if (!show) return null;
                const x = 70 + j * 8;
                const y = 10 + i * 8;
                if (x > 130 && y < 60) return null;
                if (x < 60 && y > 130) return null;
                if (x < 60 && y < 60) return null;
                return <rect key={`${i}-${j}`} x={x} y={y} width="6" height="6" fill="black" rx="1"/>;
              })
            )}
            {Array.from({ length: 8 }, (_, i) =>
              Array.from({ length: 8 }, (_, j) => {
                const show = ((i * 11 + j * 7 + 5) % 4) !== 0;
                if (!show) return null;
                return <rect key={`b${i}-${j}`} x={70 + j * 9} y={100 + i * 9} width="7" height="7" fill="black" rx="1"/>;
              })
            )}
            <rect x="85" y="85" width="30" height="30" fill="hsl(51,100%,50%)" rx="6"/>
            <text x="100" y="105" textAnchor="middle" fontSize="14" fontWeight="bold" fill="black">S</text>
          </svg>
        </div>

        <p className="text-xs font-body text-muted-foreground">Escaneie o QR Code com o app do seu banco</p>

        {pixData?.code && (
          <div className="w-full bg-surface-interactive rounded-lg p-3 text-[0.55rem] font-mono text-muted-foreground break-all text-left">
            {pixData.code.slice(0, 60)}...
          </div>
        )}

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => handleCopyPix(pixData?.code || 'PIX_CODE')}
          className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
          {pixCopied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código PIX</>}
        </motion.button>

        <p className="text-[0.55rem] font-body text-muted-foreground">
          Após o pagamento, o saldo será creditado <span className="text-secondary font-semibold">instantaneamente</span>
        </p>
      </div>

      <div className="bg-surface-card rounded-xl p-4 flex items-start gap-3">
        <Shield size={18} className="text-secondary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-body font-semibold">Transação segura</p>
          <p className="text-[0.55rem] font-body text-muted-foreground">
            Seus dados são protegidos com criptografia de ponta a ponta. Regulado pelo Banco Central do Brasil.
          </p>
        </div>
      </div>
    </div>
  );

  /* ═══ DEPOSIT - CARD ═══ */
  if (view === 'deposit-card') return (
    <div className="px-4 pt-2 pb-20 space-y-5">
      <SubHeader title="Depósito via Cartão" onBack={() => setView('deposit')} />
      <div className="bg-accent rounded-2xl p-5 space-y-1">
        <p className="text-xs font-body text-muted-foreground">Valor do depósito</p>
        <p className="font-display text-2xl font-extrabold text-primary">{formatCurrency(Number(depositAmount))}</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-body font-medium text-muted-foreground">Número do cartão</label>
          <div className="relative">
            <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={cardNumber} onChange={(e) => setCardNumber(maskCard(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className="w-full bg-surface-card rounded-xl py-3 pl-11 pr-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-body font-medium text-muted-foreground">Nome no cartão</label>
          <input value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())}
            placeholder="NOME COMO NO CARTÃO"
            className="w-full bg-surface-card rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Validade</label>
            <input value={cardExpiry} onChange={(e) => setCardExpiry(maskExpiry(e.target.value))}
              placeholder="MM/AA"
              className="w-full bg-surface-card rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">CVV</label>
            <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="000" type="password"
              className="w-full bg-surface-card rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
          </div>
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }}
        disabled={cardNumber.length < 19 || !cardName || cardExpiry.length < 5 || cardCvv.length < 3 || processing}
        onClick={() => handleDeposit('card')}
        className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] disabled:opacity-40 flex items-center justify-center gap-2">
        {processing ? <Loader2 size={16} className="animate-spin" /> : null}
        Confirmar Depósito
      </motion.button>
      <div className="flex items-center justify-center gap-4 text-muted-foreground">
        {['Visa', 'Master', 'Elo'].map((b) => (
          <span key={b} className="text-[0.6rem] font-body font-semibold bg-surface-card px-2.5 py-1 rounded">{b}</span>
        ))}
      </div>
    </div>
  );

  /* ═══ DEPOSIT - BOLETO ═══ */
  if (view === 'deposit-boleto') return (
    <div className="px-4 pt-2 pb-20 space-y-5">
      <SubHeader title="Depósito via Boleto" onBack={() => setView('deposit')} />
      <div className="bg-surface-card rounded-2xl p-5 space-y-4 text-center">
        <p className="font-display text-2xl font-extrabold text-primary">{formatCurrency(Number(depositAmount))}</p>
        <div className="bg-surface-interactive rounded-xl p-3">
          <p className="text-[0.55rem] font-mono text-muted-foreground break-all">
            23793.38128 60000.000003 00000.000405 1 93670000{depositAmount}00
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => handleCopyPix(`23793.38128 60000.000003 00000.000405 1 93670000${depositAmount}00`)}
          className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
          {pixCopied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código de barras</>}
        </motion.button>
        <div className="flex items-start gap-2 text-left">
          <AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[0.6rem] font-body text-muted-foreground">
            O boleto será compensado em até <span className="font-semibold text-foreground">3 dias úteis</span>. O saldo será creditado após a confirmação do pagamento.
          </p>
        </div>
      </div>
    </div>
  );

  /* ═══ DEPOSIT - CRYPTO ═══ */
  if (view === 'deposit-crypto') return (
    <div className="px-4 pt-2 pb-20 space-y-5">
      <SubHeader title="Depósito via Cripto" onBack={() => setView('deposit')} />
      <div className="space-y-3">
        {['Bitcoin (BTC)', 'Ethereum (ETH)', 'USDT (TRC-20)', 'USDT (ERC-20)'].map((crypto) => (
          <div key={crypto} className="bg-surface-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bitcoin size={18} className="text-primary" />
              <span className="text-sm font-body font-semibold">{crypto}</span>
            </div>
            <div className="bg-surface-interactive rounded-lg p-2.5">
              <p className="text-[0.5rem] font-mono text-muted-foreground break-all">
                {crypto.includes('BTC') ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' :
                  crypto.includes('ETH') || crypto.includes('ERC') ? '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' :
                    'TN2A3h9sEDkMq2P5eBJx5jb3NzXMU3gXqd'}
              </p>
            </div>
            <button onClick={() => handleCopyPix(crypto.includes('BTC') ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')}
              className="w-full bg-surface-interactive text-foreground font-body font-semibold text-xs py-2 rounded-lg min-h-[36px] flex items-center justify-center gap-1.5">
              <Copy size={14} /> Copiar endereço
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  /* ═══ WITHDRAW ═══ */
  if (view === 'withdraw') return (
    <div className="px-4 pt-2 pb-20 space-y-5">
      <SubHeader title="Sacar" onBack={() => setView('main')} />
      <div className="bg-accent rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-body text-muted-foreground">Disponível para saque</p>
          <p className="font-display text-xl font-extrabold text-primary">{formatCurrency(balance)}</p>
        </div>
        <Shield size={20} className="text-secondary" />
      </div>

      <div className="space-y-3">
        <label className="text-xs font-body font-medium text-muted-foreground">Valor do saque</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-display font-bold text-muted-foreground">R$</span>
          <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0,00"
            className="w-full bg-surface-card rounded-xl py-4 pl-14 pr-4 text-2xl font-display font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
            min={20} max={balance} />
        </div>
        <div className="flex gap-2">
          {[50, 100, 200, 500].map((a) => (
            <button key={a} onClick={() => setWithdrawAmount(String(a))}
              disabled={a > balance}
              className={`flex-1 py-2 rounded-lg text-xs font-display font-bold min-h-[36px] transition-colors disabled:opacity-30 ${
                withdrawAmount === String(a) ? 'bg-primary text-primary-foreground' : 'bg-surface-interactive text-foreground/70'
              }`}>
              R$ {a}
            </button>
          ))}
        </div>
        <p className="text-[0.6rem] text-muted-foreground font-body">Mínimo R$ 20,00</p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-body font-medium text-muted-foreground">Método de saque</label>
        {[
            { id: 'pix', icon: QrCode, label: 'PIX', desc: pixKycVerified ? 'Instantâneo' : 'Bloqueado até KYC válido', time: pixKycVerified ? 'Até 1 hora' : '-' },
          { id: 'bank', icon: Banknote, label: 'Transferência Bancária', desc: 'TED/DOC', time: '1-2 dias úteis' },
        ].map((m) => (
          <button key={m.id} onClick={() => setWithdrawMethod(m.id)}
              disabled={m.id === 'pix' && isPixMethodBlocked}
            className={`w-full flex items-center gap-3 rounded-xl p-4 min-h-[44px] transition-colors ${
              withdrawMethod === m.id ? 'bg-primary/10 ring-1 ring-primary' : 'bg-surface-card hover:bg-surface-interactive'
              } disabled:opacity-40`}>
            <m.icon size={20} className="text-primary" />
            <div className="text-left flex-1">
              <p className="text-sm font-body font-semibold">{m.label}</p>
              <p className="text-[0.6rem] font-body text-muted-foreground">{m.desc}</p>
            </div>
            <span className="text-[0.55rem] font-body text-muted-foreground">{m.time}</span>
          </button>
        ))}
      </div>

      {withdrawMethod === 'pix' && (
        <div className="space-y-1.5">
          <label className="text-xs font-body font-medium text-muted-foreground">Chave PIX para recebimento</label>
          <input value={withdrawPixKey} onChange={(e) => setWithdrawPixKey(e.target.value)}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            className="w-full bg-surface-card rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
        </div>
      )}

      <div className="bg-surface-card rounded-xl p-4 flex items-start gap-3">
        <Shield size={18} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-body font-semibold">Verificação necessária</p>
          <p className="text-[0.55rem] font-body text-muted-foreground">
            Para saques acima de R$ 500, é necessário ter a verificação de identidade (KYC) aprovada.
          </p>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => { setView('withdraw-confirm'); setWithdrawSuccess(false); }}
        disabled={!withdrawAmount || Number(withdrawAmount) < 20 || Number(withdrawAmount) > balance || (withdrawMethod === 'pix' && (!withdrawPixKey || isPixMethodBlocked)) || processing}
        className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] disabled:opacity-40">
        Solicitar Saque
      </motion.button>
    </div>
  );

  /* ═══ WITHDRAW - CONFIRMATION ═══ */
  if (view === 'withdraw-confirm') return (
    <div className="px-4 pt-2 pb-20 space-y-5">
      <SubHeader title="Confirmar Saque" onBack={() => setView('withdraw')} />
      {!withdrawSuccess ? (
        <div className="bg-surface-card rounded-2xl p-5 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-xs font-body text-muted-foreground">Valor do saque</p>
            <p className="font-display text-3xl font-extrabold text-primary">{formatCurrency(Number(withdrawAmount))}</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Método', value: withdrawMethod === 'pix' ? 'PIX' : 'Transferência Bancária' },
              { label: 'Prazo estimado', value: withdrawMethod === 'pix' ? 'Até 1 hora' : '1-2 dias úteis' },
              { label: 'Taxa', value: 'Grátis' },
              ...(withdrawMethod === 'pix' ? [{ label: 'Chave PIX', value: withdrawPixKey.length > 15 ? `${withdrawPixKey.slice(0, 6)}***${withdrawPixKey.slice(-4)}` : withdrawPixKey }] : []),
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <span className="text-xs font-body text-muted-foreground">{item.label}</span>
                <span className="text-xs font-body font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleWithdraw}
            disabled={processing}
            className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] disabled:opacity-40 flex items-center justify-center gap-2">
            {processing ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirmar Saque
          </motion.button>
        </div>
      ) : (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-surface-card rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-secondary" />
          </div>
          <h3 className="font-display text-xl font-extrabold">Saque Solicitado!</h3>
          <p className="text-sm font-body text-muted-foreground">
            Seu saque de <span className="text-primary font-bold">{formatCurrency(Number(withdrawAmount))}</span> foi processado.
            {withdrawMethod === 'pix' ? ' O valor será creditado na sua conta em até 1 hora.' : ' O valor será creditado em 1-2 dias úteis.'}
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setView('main'); fetchWallet(); }}
            className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px]">
            Voltar à Carteira
          </motion.button>
        </motion.div>
      )}
    </div>
  );

  return null;
};

export default WalletPage;
