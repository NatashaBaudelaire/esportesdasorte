import { motion } from 'framer-motion';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';

const CasinoPage = () => {
  return (
    <PageTransition>
    <div className="px-4 pt-4 pb-20 space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Cassino</h1>
      <p className="text-sm font-body text-muted-foreground">Em breve! Os melhores jogos de cassino online.</p>
      <motion.div className="grid grid-cols-2 gap-3" variants={staggerContainer} initial="hidden" animate="show">
        {['Slots', 'Roleta', 'Blackjack', 'Baccarat', 'Poker', 'Game Shows'].map((game) => (
          <motion.div
            key={game}
            variants={staggerItem}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-surface-card rounded-xl p-6 flex items-center justify-center cursor-pointer"
          >
            <span className="font-display font-bold text-sm text-muted-foreground">{game}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
    </PageTransition>
  );
};

export default CasinoPage;
