import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Trophy, Sparkles, BarChart3, Target, Users, MessageCircle, Settings, HelpCircle, Dice5, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuSections = [
  {
    title: 'Apostas',
    items: [
      { icon: Calendar, label: 'Próximos Jogos', route: '/' },
      { icon: Trophy, label: 'Competições', route: '/' },
      { icon: Sparkles, label: 'Especiais', route: '/' },
      { icon: BarChart3, label: 'Odds por Categoria', route: '/' },
    ],
  },
  {
    title: 'Jogos',
    items: [
      { icon: Dice5, label: 'Cassino', route: '/cassino' },
      { icon: Rocket, label: 'Jogos Crash', route: '/crash' },
    ],
  },
  {
    title: 'Comunidade',
    items: [
      { icon: Target, label: 'Missões', route: '/' },
      { icon: Users, label: 'Bolão', route: '/bolao' },
      { icon: MessageCircle, label: 'Chat Social', route: '/chat' },
    ],
  },
  {
    title: 'Mais',
    items: [
      { icon: Settings, label: 'Configurações', route: '/configuracoes' },
      { icon: HelpCircle, label: 'Ajuda & Suporte', route: '/suporte' },
    ],
  },
];

const DrawerMenu = ({ isOpen, onClose }: DrawerMenuProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] z-50 bg-surface-section overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-display text-xl text-primary font-extrabold">Esportes da</span>
                  <span className="font-display text-xl text-foreground font-extrabold">Sorte</span>
                </div>
                <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-6">
                {menuSections.map((section) => (
                  <div key={section.title}>
                    <p className="text-[0.65rem] font-body font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-2">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => { navigate(item.route); onClose(); }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-body font-medium text-foreground/80 hover:bg-surface-interactive hover:text-foreground transition-colors min-h-[44px]"
                        >
                          <item.icon size={20} className="text-muted-foreground" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DrawerMenu;
