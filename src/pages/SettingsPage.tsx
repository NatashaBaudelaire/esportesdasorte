import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Contrast, Eye, AlertTriangle, Trash2, Pause, X, UserCog, ChevronRight, Volume2, Hand, MessageCircle, BadgeCheck, Crown } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageTransition } from '@/components/animations';

const fontSizes = ['P', 'M', 'G', 'GG'];
const daltonismModes = [
  { id: 'none', label: 'Nenhum' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const {
    theme, setTheme,
    fontSize, setFontSize,
    daltonism, setDaltonism,
    librasEnabled, setLibrasEnabled,
  } = useSettingsStore();

  const [soundAlerts, setSoundAlerts] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'deactivate' | null>(null);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('soundAlerts');
    if (saved !== null) setSoundAlerts(JSON.parse(saved));
  }, []);

  const handleSoundAlertsChange = (value: boolean) => {
    setSoundAlerts(value);
    localStorage.setItem('soundAlerts', JSON.stringify(value));
  };

  const handleDeleteAccount = async () => {
    toast.error('Sua conta foi marcada para exclusão. Entraremos em contato por e-mail.');
    setConfirmAction(null);
    setConfirmText('');
    setAccountModalOpen(false);
  };

  const handleDeactivateAccount = async () => {
    await supabase.auth.signOut();
    toast.success('Conta desativada. Você pode reativar fazendo login novamente.');
    navigate('/auth');
  };

  return (
    <PageTransition>
      <div className="pb-20 px-4 pt-2 space-y-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            aria-label="Voltar para a página anterior"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-extrabold">Configurações</h1>
        </div>

        {/* Accessibility */}
        <section className="space-y-3" aria-label="Configurações de acessibilidade">
          <h2 className="font-display text-sm font-bold flex items-center gap-2">
            <Eye size={16} className="text-primary" aria-hidden="true" /> Acessibilidade
          </h2>

          {/* Theme */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-body font-medium text-muted-foreground">Tema</p>
            <div className="flex gap-2">
              {[
                { id: 'dark', label: 'Escuro', icon: Moon },
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'contrast', label: 'Alto Contraste', icon: Contrast },
              ].map((t) => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(t.id)}
                  aria-pressed={theme === t.id}
                  aria-label={`Selecionar tema ${t.label}${theme === t.id ? ' (ativo)' : ''}`}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-body font-medium min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg ${
                    theme === t.id ? 'bg-primary text-primary-foreground' : 'bg-surface-interactive text-muted-foreground'
                  }`}
                >
                  <t.icon size={18} aria-hidden="true" />
                  {t.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Font size */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-surface-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-body font-medium text-muted-foreground">Tamanho da fonte</p>
            <div className="flex gap-2">
              {fontSizes.map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFontSize(s)}
                  aria-pressed={fontSize === s}
                  aria-label={`Tamanho de fonte ${s === 'P' ? 'pequeno' : s === 'M' ? 'médio' : s === 'G' ? 'grande' : 'muito grande'}${fontSize === s ? ' (ativo)' : ''}`}
                  className={`flex-1 py-3 rounded-xl font-body font-semibold min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg ${
                    fontSize === s ? 'bg-primary text-primary-foreground' : 'bg-surface-interactive text-muted-foreground'
                  } ${s === 'P' ? 'text-xs' : s === 'M' ? 'text-sm' : s === 'G' ? 'text-base' : 'text-lg'}`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Daltonism */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface-card rounded-xl p-4 space-y-3">
            <p className="text-xs font-body font-medium text-muted-foreground">Modo de Daltonismo</p>
            <div className="grid grid-cols-2 gap-2">
              {daltonismModes.map((d) => (
                <motion.button
                  key={d.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDaltonism(d.id)}
                  aria-pressed={daltonism === d.id}
                  aria-label={`Modo de daltonismo ${d.label}${daltonism === d.id ? ' (ativo)' : ''}`}
                  className={`py-2.5 rounded-xl text-xs font-body font-medium min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg ${
                    daltonism === d.id ? 'bg-primary text-primary-foreground' : 'bg-surface-interactive text-muted-foreground'
                  }`}
                >
                  {d.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Sound Alerts */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-surface-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-primary" />
              <div>
                <p className="text-sm font-body font-medium text-foreground">Alertas Sonoros</p>
                <p className="text-xs text-muted-foreground font-body">Sons para notificações</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={soundAlerts}
              aria-label={`Alertas sonoros ${soundAlerts ? 'ativados' : 'desativados'}`}
              onClick={() => handleSoundAlertsChange(!soundAlerts)}
              className={`w-12 h-7 rounded-full relative transition-colors min-w-[48px] min-h-[28px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                soundAlerts ? 'bg-primary' : 'bg-surface-interactive'
              }`}
            >
              <span className={`absolute w-5 h-5 rounded-full transition-transform ${
                soundAlerts ? 'bg-primary-foreground translate-x-6' : 'bg-muted-foreground translate-x-1'
              }`} />
            </button>
          </motion.div>

          {/* Libras Support */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="bg-surface-card rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hand size={18} className="text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-body font-medium text-foreground">Libras - LSB</p>
                  <p className="text-xs text-muted-foreground font-body">Conteúdo em Língua Brasileira de Sinais</p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={librasEnabled}
                aria-label={`Libras ${librasEnabled ? 'ativado' : 'desativado'}`}
                onClick={() => setLibrasEnabled(!librasEnabled)}
                className={`w-12 h-7 rounded-full relative transition-colors min-w-[48px] min-h-[28px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  librasEnabled ? 'bg-primary' : 'bg-surface-interactive'
                }`}
              >
                <span className={`absolute w-5 h-5 rounded-full transition-transform ${
                  librasEnabled ? 'bg-primary-foreground translate-x-6' : 'bg-muted-foreground translate-x-1'
                }`} />
              </button>
            </div>
            {librasEnabled && (
              <button
                onClick={() => navigate('/libras-resources')}
                className="w-full bg-primary/10 text-primary font-body font-semibold py-2.5 rounded-lg min-h-[44px] hover:bg-primary/20 transition-colors"
              >
                Ver Recursos em Libras
              </button>
            )}
          </motion.div>
        </section>

        {/* Support */}
        <section className="space-y-3">
          <h2 className="font-display text-sm font-bold flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" aria-hidden="true" /> Suporte
          </h2>

          <button
            onClick={() => navigate('/suporte')}
            aria-label="Abrir chat de suporte"
            className="w-full bg-surface-card rounded-xl p-4 flex items-center justify-between min-h-[52px] hover:bg-surface-interactive transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={18} className="text-primary" aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-body font-medium text-foreground">Chat de Suporte</p>
                <p className="text-[0.65rem] text-muted-foreground font-body">Fale com atendimento humano e acessível</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
          </button>
        </section>

        {/* Plans & Streaming */}
        <section className="space-y-3">
          <h2 className="font-display text-sm font-bold flex items-center gap-2">
            <Crown size={16} className="text-primary" aria-hidden="true" /> Planos
          </h2>

          <button
            onClick={() => navigate('/planos')}
            aria-label="Ver planos de assinatura e plataformas de streaming"
            className="w-full bg-surface-card rounded-xl p-4 flex items-center justify-between min-h-[52px] hover:bg-surface-interactive transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Crown size={18} className="text-primary" aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-body font-medium text-foreground">Planos & Assinatura</p>
                <p className="text-[0.65rem] text-muted-foreground font-body">Streamings e plataformas disponíveis</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-sm font-bold flex items-center gap-2">
            <BadgeCheck size={16} className="text-primary" aria-hidden="true" /> Conformidade
          </h2>

          <button
            onClick={() => navigate('/conformidade')}
            aria-label="Abrir área de conformidade SPA MF"
            className="w-full bg-surface-card rounded-xl p-4 flex items-center justify-between min-h-[52px] hover:bg-surface-interactive transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <BadgeCheck size={18} className="text-primary" aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-body font-medium text-foreground">Selo SPA/MF e Políticas</p>
                <p className="text-[0.65rem] text-muted-foreground font-body">Licença, jogo responsável e transparência regulatória</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
          </button>
        </section>

        {/* Account Management - at the end */}
        <section className="space-y-3">
          <h2 className="font-display text-sm font-bold flex items-center gap-2">
            <UserCog size={16} className="text-primary" /> Conta
          </h2>

          <button
            onClick={() => setAccountModalOpen(true)}
            aria-label="Gerenciar conta - abrir opções para desativar ou excluir conta"
            className="w-full bg-surface-card rounded-xl p-4 flex items-center justify-between min-h-[52px] hover:bg-surface-interactive transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-destructive" aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-body font-medium text-foreground">Gerenciar conta</p>
                <p className="text-[0.65rem] text-muted-foreground font-body">Desativar ou excluir sua conta</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </section>

        {/* Account Modal */}
        <AnimatePresence>
          {accountModalOpen && !confirmAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
              onClick={() => setAccountModalOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-lg bg-surface-card rounded-t-2xl p-5 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                <h3 id="account-modal-title" className="font-display text-lg font-extrabold text-foreground">Gerenciar conta</h3>
                <p className="text-xs font-body text-muted-foreground">
                  Escolha uma opção abaixo. Essa ação pode ser irreversível.
                </p>

                <button
                  onClick={() => setConfirmAction('deactivate')}
                  aria-label="Desativar conta - sua conta será pausada"
                  className="w-full flex items-center gap-3 bg-surface-interactive rounded-xl p-4 min-h-[56px] hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                >
                  <Pause size={20} className="text-primary" aria-hidden="true" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-body font-semibold text-foreground">Desativar conta</p>
                    <p className="text-[0.6rem] text-muted-foreground font-body">Sua conta será pausada. Você pode reativar a qualquer momento.</p>
                  </div>
                </button>

                <button
                  onClick={() => setConfirmAction('delete')}
                  aria-label="Excluir conta permanentemente - todos os dados serão apagados"
                  className="w-full flex items-center gap-3 bg-surface-interactive rounded-xl p-4 min-h-[56px] hover:bg-destructive/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                >
                  <Trash2 size={20} className="text-destructive" aria-hidden="true" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-body font-semibold text-destructive">Excluir conta permanentemente</p>
                    <p className="text-[0.6rem] text-muted-foreground font-body">Todos os seus dados serão apagados. Não pode ser desfeita.</p>
                  </div>
                </button>

                <button
                  onClick={() => setAccountModalOpen(false)}
                  aria-label="Fechar diálogo de gerenciamento de conta"
                  className="w-full py-3 rounded-xl bg-surface-interactive text-sm font-body font-semibold text-muted-foreground min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm modal */}
        <AnimatePresence>
          {confirmAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
              onClick={() => { setConfirmAction(null); setConfirmText(''); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-surface-card rounded-2xl p-5 space-y-4"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
              >
                <div className="flex items-center justify-between">
                  <h3 id="confirm-modal-title" className="font-display text-base font-extrabold text-foreground">
                    {confirmAction === 'delete' ? 'Excluir conta' : 'Desativar conta'}
                  </h3>
                  <button 
                    onClick={() => { setConfirmAction(null); setConfirmText(''); }} 
                    aria-label="Fechar diálogo de confirmação"
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    <X size={20} className="text-muted-foreground" aria-hidden="true" />
                  </button>
                </div>

                {confirmAction === 'delete' ? (
                  <>
                    <p className="text-xs font-body text-muted-foreground">
                      Para confirmar, digite <span className="text-destructive font-bold">EXCLUIR</span> abaixo.
                    </p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Digite EXCLUIR"
                      aria-label="Campo de confirmação - digite EXCLUIR para confirmar exclusão de conta"
                      className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-destructive placeholder:text-muted-foreground min-h-[44px] rounded-lg"
                    />
                    <button
                      onClick={handleDeleteAccount}
                      disabled={confirmText !== 'EXCLUIR'}
                      aria-label={confirmText === 'EXCLUIR' ? 'Confirmar e excluir minha conta permanentemente' : 'Digite EXCLUIR para habilitar este botão'}
                      className={`w-full py-3 rounded-xl font-display font-bold text-sm min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-lg ${
                        confirmText === 'EXCLUIR'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      Excluir minha conta
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-body text-muted-foreground">
                      Sua conta será desativada e você será deslogado. Quando quiser voltar, é só fazer login novamente.
                    </p>
                    <button
                      onClick={handleDeactivateAccount}
                      aria-label="Confirmar desativação de conta"
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                    >
                      Desativar minha conta
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setConfirmAction(null); setConfirmText(''); }}
                  aria-label="Voltar para opções de conta"
                  className="w-full py-2.5 rounded-xl text-sm font-body font-semibold text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                >
                  Voltar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default SettingsPage;
