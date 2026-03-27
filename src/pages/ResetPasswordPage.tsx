import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Check, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Detect and validate token from URL hash
  useEffect(() => {
    const { hash } = window.location;
    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      // Set the session with the token received from email link
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Will be provided by Supabase if needed
      }).then(({ data }) => {
        if (data.session) {
          setTokenValid(true);
        } else {
          setError('Token de recuperação inválido ou expirado. Solicite um novo link.');
        }
        setValidatingToken(false);
      }).catch(() => {
        setError('Erro ao validar token. Tente novamente.');
        setValidatingToken(false);
      });
    } else {
      setError('Link de recuperação inválido. Solicite um novo link.');
      setValidatingToken(false);
    }
  }, []);

  // Validate password requirements
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    return {
      score,
      isStrong: score >= 4,
      label: score < 2 ? 'Fraca' : score < 4 ? 'Media' : 'Forte',
    };
  };

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const newPasswordStrength = getPasswordStrength(newPassword);
  const canSubmit = passwordsMatch && newPasswordStrength.isStrong && !loading;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Erro ao atualizar senha. Tente novamente.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-surface-card flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-body text-muted-foreground">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface-card flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                  <CheckCircle2 size={48} className="text-secondary" />
                </div>
              </div>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-foreground">
                  Senha Atualizada!
                </h2>
                <p className="text-sm font-body text-muted-foreground mt-2">
                  Sua senha foi redefinida com sucesso. Redirecionando para login...
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-display text-2xl font-extrabold text-foreground">
                  Redefinir Senha
                </h1>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  Digite uma nova senha para sua conta.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive rounded-xl p-3 flex gap-3"
                >
                  <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-body text-destructive">{error}</p>
                </motion.div>
              )}

              {!tokenValid ? (
                <div className="space-y-4">
                  <p className="text-sm font-body text-destructive text-center">
                    {error || 'Link de recuperação inválido.'}
                  </p>
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] hover:brightness-110 transition-all"
                  >
                    Voltar ao Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-medium text-muted-foreground">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Crie uma senha forte"
                        className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-surface-interactive overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              newPasswordStrength.score < 2
                                ? 'w-1/3 bg-destructive'
                                : newPasswordStrength.score < 4
                                  ? 'w-2/3 bg-yellow-500'
                                  : 'w-full bg-secondary'
                            }`}
                          />
                        </div>
                        <span className="text-[0.7rem] font-body text-muted-foreground">
                          {newPasswordStrength.label}
                        </span>
                      </div>
                    )}

                    <ul className="text-[0.7rem] space-y-1 text-muted-foreground font-body">
                      <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-secondary' : 'text-muted-foreground'}`}>
                        {newPassword.length >= 8 ? (
                          <Check size={14} className="flex-shrink-0" />
                        ) : (
                          <X size={14} className="flex-shrink-0" />
                        )}
                        Mínimo 8 caracteres
                      </li>
                      <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-secondary' : 'text-muted-foreground'}`}>
                        {/[A-Z]/.test(newPassword) ? (
                          <Check size={14} className="flex-shrink-0" />
                        ) : (
                          <X size={14} className="flex-shrink-0" />
                        )}
                        Pelo menos uma letra maiúscula
                      </li>
                      <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-secondary' : 'text-muted-foreground'}`}>
                        {/[0-9]/.test(newPassword) ? (
                          <Check size={14} className="flex-shrink-0" />
                        ) : (
                          <X size={14} className="flex-shrink-0" />
                        )}
                        Pelo menos um número
                      </li>
                      <li className={`flex items-center gap-2 ${/[^a-zA-Z0-9]/.test(newPassword) ? 'text-secondary' : 'text-muted-foreground'}`}>
                        {/[^a-zA-Z0-9]/.test(newPassword) ? (
                          <Check size={14} className="flex-shrink-0" />
                        ) : (
                          <X size={14} className="flex-shrink-0" />
                        )}
                        Pelo menos um caractere especial
                      </li>
                    </ul>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-medium text-muted-foreground">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a mesma senha"
                        className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {confirmPassword && !passwordsMatch && (
                      <p className="text-[0.7rem] text-destructive font-body">
                        As senhas não coincidem.
                      </p>
                    )}

                    {confirmPassword && passwordsMatch && (
                      <p className="text-[0.7rem] text-secondary font-body">
                        ✓ Senhas coincidem
                      </p>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full font-display font-bold text-sm py-3 rounded-xl min-h-[44px] transition-all ${
                      canSubmit
                        ? 'bg-primary text-primary-foreground hover:brightness-110'
                        : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Atualizando...' : 'Atualizar Senha'}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="w-full text-center text-xs font-body text-primary hover:text-primary/80 transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    <ArrowLeft size={16} className="mr-2" /> Voltar ao Login
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
