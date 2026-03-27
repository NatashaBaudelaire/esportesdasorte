import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, Sparkles } from 'lucide-react';

const VisitorBanner = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 bg-accent rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Sparkles size={20} className="text-primary" />
        <span className="text-xs font-body font-semibold text-primary uppercase tracking-widest">Bem-vindo</span>
      </div>

      <h2 className="font-display text-lg font-extrabold leading-snug">
        Uma experiência única em apostas te espera. Mas antes, precisamos te conhecer!
      </h2>

      <p className="text-xs font-body text-foreground/70">
        Criar conta ou faça login e seja um <span className="text-primary font-bold">Esportes da Sorte</span>!
      </p>

      <div className="flex gap-2 pt-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/auth')}
          className="flex-1 bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
        >
          <UserPlus size={16} />
          Criar Conta
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/auth')}
          className="flex-1 bg-surface-interactive text-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
        >
          <LogIn size={16} />
          Login
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VisitorBanner;
