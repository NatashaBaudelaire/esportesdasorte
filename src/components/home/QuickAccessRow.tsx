import { motion } from 'framer-motion';
import { Zap, Gift, Flame, Award, Dices, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, staggerItem } from '@/components/animations';

const quickItems = [
  { id: 'bonus', label: 'Bonus', icon: Gift, route: '/promocoes', color: 'text-primary' },
  { id: 'promo', label: 'Promocoes', icon: Award, route: '/promocoes', color: 'text-secondary' },
  { id: 'crash', label: 'Crash', icon: Zap, route: '/crash', color: 'text-primary' },
  { id: 'cassino', label: 'Cassino', icon: Dices, route: '/cassino', color: 'text-secondary' },
  { id: 'bolao', label: 'Bolão', icon: Ticket, route: '/bolao', color: 'text-primary' },
  { id: 'superodds', label: 'Super Odds', icon: Flame, route: '/', color: 'text-secondary' },
];

const QuickAccessRow = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="flex gap-3 overflow-x-auto no-scrollbar px-4"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {quickItems.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            variants={staggerItem}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.route)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[64px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-card flex items-center justify-center">
              <Icon size={24} className={item.color} />
            </div>
            <span className="text-[0.6rem] font-body font-medium text-foreground/80 text-center leading-tight">
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default QuickAccessRow;
