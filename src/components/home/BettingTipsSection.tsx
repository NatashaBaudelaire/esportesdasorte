import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBetSlipStore } from '@/store/betSlipStore';
import { SectionReveal } from '@/components/animations';

const tips = [
  {
    id: 'tip-1',
    time: 'Hoje, 14:45',
    match: 'Wolfsburg (F) - Olympique Lyon (F)',
    picks: [
      'Wolfsburg (F) - Marca gols nos dois tempos',
      'Wolfsburg (F) - Vencer a partida',
    ],
    totalOdds: 9.0,
  },
  {
    id: 'tip-2',
    time: 'Hoje, 21:30',
    match: 'Flamengo - Palmeiras',
    picks: [
      'Ambas as equipes marcam',
      'Mais de 2.5 gols na partida',
    ],
    totalOdds: 4.50,
  },
  {
    id: 'tip-3',
    time: 'Amanhã, 16:00',
    match: 'Arsenal - Chelsea',
    picks: [
      'Arsenal - Vencer a partida',
      'Mais de 1.5 gols no 1º tempo',
    ],
    totalOdds: 6.80,
  },
];

const BettingTipsSection = () => {
  const navigate = useNavigate();
  const addBet = useBetSlipStore((s) => s.addBet);

  const duplicatedTips = [...tips, ...tips];

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
            <TrendingUp size={20} className="text-secondary" />
            Dicas de Aposta
          </h2>
          <button onClick={() => navigate('/esportes')} className="text-xs text-primary font-body font-semibold flex items-center gap-0.5 min-h-[44px]">
            Ver tudo <ChevronRight size={14} />
          </button>
        </motion.div>

        <div className="overflow-hidden -mx-4">
          <motion.div
            className="flex gap-3 px-4 w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ x: { duration: 40, repeat: Infinity, ease: 'linear' } }}
          >
          {duplicatedTips.map((tip, idx) => (
            <motion.div
              key={`${tip.id}-${idx}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-[280px] bg-surface-card rounded-xl p-4 space-y-3"
            >
              <p className="text-[0.65rem] font-body text-muted-foreground">{tip.time}</p>
              <p className="font-display text-sm font-bold leading-snug">{tip.match}</p>
              <div className="space-y-1.5">
                {tip.picks.map((pick, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                    <p className="text-xs font-body text-foreground/80">{pick}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[0.6rem] font-body text-muted-foreground">Odds totais @</span>
                  <span className="font-display text-lg font-bold text-primary ml-1">{tip.totalOdds.toFixed(2)}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    addBet({
                      id: tip.id,
                      match: tip.match,
                      market: 'Dica',
                      selection: tip.picks.join(' + '),
                      odds: tip.totalOdds,
                    })
                  }
                  className="flex items-center gap-1.5 bg-surface-interactive text-foreground font-display font-bold text-xs px-3 py-2 rounded-lg min-h-[44px]"
                >
                  <Receipt size={14} />
                  Apostar
                </motion.button>
              </div>
            </motion.div>
          ))}
          </motion.div>
        </div>
      </section>
    </SectionReveal>
  );
};

export default BettingTipsSection;
