import { motion, AnimatePresence } from 'framer-motion';
import { Receipt } from 'lucide-react';
import { useBetSlipStore } from '@/store/betSlipStore';

interface BetSlipFabProps {
  onClick: () => void;
}

const BetSlipFab = ({ onClick }: BetSlipFabProps) => {
  const betCount = useBetSlipStore((s) => s.bets.length);

  if (betCount === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 lg:hidden"
    >
      <Receipt size={22} />
      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[0.6rem] font-display font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {betCount}
      </span>
    </motion.button>
  );
};

export default BetSlipFab;
