import { motion } from 'framer-motion';
import { Plus, Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionReveal } from '@/components/animations';

const MultiCreatorBanner = () => {
  const navigate = useNavigate();

  return (
    <SectionReveal>
      <section className="px-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/esportes')}
          className="w-full rounded-xl bg-gradient-to-br from-primary/30 via-primary/15 to-secondary/20 p-5 text-left relative overflow-hidden"
        >
          {/* Decorative icons */}
          <div className="absolute top-4 right-4 opacity-20 space-y-3">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-foreground" />
              <Trophy size={18} className="text-foreground" />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Plus size={18} className="text-foreground" />
              <Trophy size={18} className="text-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-foreground" />
              <Trophy size={18} className="text-foreground" />
            </div>
          </div>

          <h3 className="font-display text-xl font-extrabold italic text-foreground leading-tight">
            MULTI CRIAR<br />APOSTA
          </h3>
          <p className="font-body text-sm text-foreground/70 mt-2 max-w-[200px]">
            Fácil e rápido: crie apostas com os melhores eventos do dia!
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm font-display font-bold text-foreground/80">
              15 eventos em 9 esportes
            </span>
            <span className="font-display font-extrabold text-primary flex items-center gap-1">
              APOSTAR <ChevronRight size={16} />
            </span>
          </div>
        </motion.button>
      </section>
    </SectionReveal>
  );
};

export default MultiCreatorBanner;
