import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionReveal } from '@/components/animations';

const tournaments = [
  { id: 't-1', sport: 'Futebol', badge: 'UEFA', name: 'Champions League', flag: 'https://flagcdn.com/w40/eu.png', color: 'from-[hsl(var(--accent))]/80 to-[hsl(var(--accent))]/40' },
  { id: 't-2', sport: 'Futebol', badge: 'BR', name: 'Brasileirão', flag: 'https://flagcdn.com/w40/br.png', color: 'from-secondary/80 to-secondary/40' },
  { id: 't-3', sport: 'Tênis', badge: 'ATP', name: 'Miami', flag: 'https://flagcdn.com/w40/us.png', color: 'from-primary/60 to-primary/30' },
  { id: 't-4', sport: 'Tênis', badge: 'WTA', name: 'Miami', flag: 'https://flagcdn.com/w40/us.png', color: 'from-secondary/60 to-secondary/30' },
  { id: 't-5', sport: 'Futebol', badge: 'ESP', name: 'La Liga', flag: 'https://flagcdn.com/w40/es.png', color: 'from-primary/60 to-primary/30' },
];

const PopularTournamentsSection = () => {
  const navigate = useNavigate();

  return (
    <SectionReveal>
      <section className="px-4">
        <motion.div
          className="flex items-center justify-between mb-3"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Trophy size={20} className="text-primary" />
            Torneios Populares
          </h2>
          <button onClick={() => navigate('/esportes')} className="text-xs text-primary font-body font-semibold flex items-center gap-0.5 min-h-[44px]">
            Ver todos <ChevronRight size={14} />
          </button>
        </motion.div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {tournaments.map((t) => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onClick={() => navigate('/esportes')}
              className={`flex-shrink-0 w-[160px] h-[90px] rounded-xl bg-gradient-to-br ${t.color} p-3 flex flex-col justify-between`}
            >
              <div className="flex items-center gap-1.5">
                <img src={t.flag} alt={t.name} className="w-5 h-4 object-cover rounded-sm" />
                <span className="text-[0.6rem] font-body text-foreground/90">{t.sport}</span>
                <span className="text-[0.55rem] font-display font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  {t.badge}
                </span>
              </div>
              <p className="font-display text-base font-bold text-foreground">{t.name}</p>
            </motion.button>
          ))}
        </div>
      </section>
    </SectionReveal>
  );
};

export default PopularTournamentsSection;
