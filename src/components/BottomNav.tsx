import { motion } from 'framer-motion';
import { Home, Radio, Trophy, Receipt, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBetSlipStore } from '@/store/betSlipStore';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onBetSlipToggle: () => void;
}

const tabs = [
{ id: '/', icon: Home, label: 'Página ...' },
{ id: '/ao-vivo', icon: Radio, label: 'Ao vivo' },
{ id: '/esportes', icon: Trophy, label: 'Esportes' },
{ id: 'betslip', icon: Receipt, label: 'Apostas' },
];


const BottomNav = ({ onBetSlipToggle }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const betCount = useBetSlipStore((s) => s.bets.length);

  const handleTap = (id: string) => {
    if (id === 'betslip') {
      onBetSlipToggle();
    } else {
      navigate(id);
    }
  };

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-30 glass lg:hidden safe-area-bottom">
      
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.id !== 'betslip' && location.pathname === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTap(tab.id)}
              whileTap={{ scale: 0.85 }}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
              
              <motion.div
                animate={isActive ? { y: -2 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="relative">
                
                <Icon size={22} />
                {tab.id === '/ao-vivo' &&
                <span className="absolute -top-1 -right-2.5 flex items-center justify-center">
                    <span className="absolute w-4 h-4 rounded-full bg-destructive/40 animate-ping" />
                    <span className="relative bg-destructive text-destructive-foreground text-[0.5rem] font-display font-bold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center">
                      8
                    </span>
                  </span>
                }
              </motion.div>
              <span className="text-[0.6rem] font-body font-medium">{tab.label}</span>
              {tab.id === 'betslip' && betCount > 0 &&
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
                className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[0.55rem] font-display font-bold w-4 h-4 rounded-full flex items-center justify-center">
                
                  {betCount}
                </motion.span>
              }
            </motion.button>);

        })}
      </div>
    </motion.nav>);

};

export default BottomNav;