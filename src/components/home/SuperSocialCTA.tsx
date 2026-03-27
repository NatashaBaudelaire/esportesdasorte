import { motion } from 'framer-motion';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionReveal } from '@/components/animations';

const SuperSocialCTA = () => {
  const navigate = useNavigate();

  return (
    <SectionReveal>
      <section className="px-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/chat')}
          className="w-full rounded-xl bg-gradient-to-br from-secondary/20 via-secondary/10 to-accent/20 p-5 text-left relative overflow-hidden"
        >
          <h3 className="font-display text-xl font-extrabold italic text-foreground leading-tight">
            JUNTE-SE AO<br />SOCIAL E ENCONTRE<br />INSPIRAÇÃO!
          </h3>
          <p className="font-body text-sm text-foreground/70 mt-2 max-w-[260px]">
            Descubra as melhores apostas e dicas de milhares de fãs de esportes!
          </p>
          <div className="flex items-center gap-2 mt-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-foreground text-background font-display font-bold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 min-h-[44px]"
            >
              <MessageSquare size={16} />
              Entrar no Social
              <ChevronRight size={14} />
            </motion.div>
          </div>
        </motion.button>
      </section>
    </SectionReveal>
  );
};

export default SuperSocialCTA;
