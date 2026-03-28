import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';

type CasinoCategoryId = 'slots' | 'crash' | 'live' | 'table' | 'instant';

type GameCard = {
  id: string;
  title: string;
  subtitle: string;
  category: CasinoCategoryId;
  badge?: 'HOT' | 'POPULAR';
  multipliers: string[];
  theme: 'tiger' | 'dragon' | 'candy' | 'egypt' | 'rocket' | 'aviator' | 'space' | 'roulette' | 'blackjack' | 'baccarat' | 'poker' | 'mines' | 'plinko' | 'dice';
};

const CATEGORY_LABELS: Record<CasinoCategoryId, string> = {
  slots: 'Slots',
  crash: 'Crash Games',
  live: 'Live Casino',
  table: 'Table Games',
  instant: 'Instant Games',
};

const GAME_LIST: GameCard[] = [
  { id: 'slots-tiger-fortune', title: 'Tiger Fortune', subtitle: 'Tiger, Gold & Fire', category: 'slots', badge: 'HOT', multipliers: ['2x', '5x', '10x'], theme: 'tiger' },
  { id: 'slots-dragon-fortune', title: 'Dragon Fortune', subtitle: 'Dragon Glow Spins', category: 'slots', badge: 'POPULAR', multipliers: ['3x', '6x'], theme: 'dragon' },
  { id: 'slots-sweet-burst', title: 'Sweet Burst', subtitle: 'Candy Multiplier Reels', category: 'slots', badge: 'HOT', multipliers: ['2x', '8x'], theme: 'candy' },
  { id: 'slots-egypt-gold', title: 'Egypt Gold', subtitle: 'Ancient Treasure Hunt', category: 'slots', multipliers: ['4x', '9x'], theme: 'egypt' },

  { id: 'crash-classic', title: 'Crash', subtitle: 'Rocket Multiplier Graph', category: 'crash', badge: 'HOT', multipliers: ['2x', '5x', '20x'], theme: 'rocket' },
  { id: 'crash-aviator-pro', title: 'Aviator Pro', subtitle: 'Plane Takeoff Bets', category: 'crash', badge: 'POPULAR', multipliers: ['2x', '7x'], theme: 'aviator' },
  { id: 'crash-space-burst', title: 'Space Burst', subtitle: 'Futuristic Crash Arena', category: 'crash', multipliers: ['3x', '12x'], theme: 'space' },

  { id: 'live-roulette', title: 'Live Roulette', subtitle: 'Real Dealer Stream', category: 'live', badge: 'HOT', multipliers: ['2x', '5x'], theme: 'roulette' },
  { id: 'live-blackjack', title: 'Live Blackjack', subtitle: 'Live Table Action', category: 'live', badge: 'POPULAR', multipliers: ['2x', '4x'], theme: 'blackjack' },
  { id: 'live-baccarat', title: 'Live Baccarat', subtitle: 'Premium Live Room', category: 'live', multipliers: ['2x', '6x'], theme: 'baccarat' },

  { id: 'table-roulette', title: 'Roulette', subtitle: 'Classic Wheel Table', category: 'table', multipliers: ['2x', '5x'], theme: 'roulette' },
  { id: 'table-blackjack', title: 'Blackjack', subtitle: 'Fast Card Duels', category: 'table', multipliers: ['2x', '3x'], theme: 'blackjack' },
  { id: 'table-poker', title: 'Poker', subtitle: 'Texas Holdem Style', category: 'table', badge: 'POPULAR', multipliers: ['2x', '10x'], theme: 'poker' },

  { id: 'instant-mines', title: 'Mines', subtitle: 'Pick Safe Cells', category: 'instant', badge: 'HOT', multipliers: ['2x', '25x'], theme: 'mines' },
  { id: 'instant-plinko', title: 'Plinko', subtitle: 'Drop and Multiply', category: 'instant', badge: 'POPULAR', multipliers: ['2x', '16x'], theme: 'plinko' },
  { id: 'instant-dice', title: 'Dice', subtitle: 'Quick Roll Battles', category: 'instant', multipliers: ['2x', '12x'], theme: 'dice' },
];

const THEME_STYLES: Record<GameCard['theme'], { bg: string; glow: string; accent: string }> = {
  tiger: { bg: 'linear-gradient(135deg, #3d1d00 0%, #a44400 45%, #ffd166 100%)', glow: 'rgba(255, 204, 0, 0.45)', accent: '#ffcc00' },
  dragon: { bg: 'linear-gradient(135deg, #1e1b4b 0%, #2563eb 45%, #38bdf8 100%)', glow: 'rgba(56, 189, 248, 0.45)', accent: '#60a5fa' },
  candy: { bg: 'linear-gradient(135deg, #7e22ce 0%, #ec4899 50%, #facc15 100%)', glow: 'rgba(236, 72, 153, 0.45)', accent: '#facc15' },
  egypt: { bg: 'linear-gradient(135deg, #3f2f00 0%, #8b5a00 50%, #ffcc00 100%)', glow: 'rgba(255, 204, 0, 0.45)', accent: '#ffcc00' },
  rocket: { bg: 'linear-gradient(135deg, #001a4d 0%, #003f9a 45%, #00a6ff 100%)', glow: 'rgba(0, 166, 255, 0.45)', accent: '#38bdf8' },
  aviator: { bg: 'linear-gradient(135deg, #0b2244 0%, #0053cc 50%, #7dd3fc 100%)', glow: 'rgba(125, 211, 252, 0.45)', accent: '#7dd3fc' },
  space: { bg: 'linear-gradient(135deg, #090b2f 0%, #4f46e5 50%, #0ea5e9 100%)', glow: 'rgba(79, 70, 229, 0.45)', accent: '#a78bfa' },
  roulette: { bg: 'linear-gradient(135deg, #052e16 0%, #166534 45%, #ffcc00 100%)', glow: 'rgba(34, 197, 94, 0.45)', accent: '#86efac' },
  blackjack: { bg: 'linear-gradient(135deg, #0f172a 0%, #1f2937 45%, #f59e0b 100%)', glow: 'rgba(245, 158, 11, 0.45)', accent: '#facc15' },
  baccarat: { bg: 'linear-gradient(135deg, #2e1065 0%, #581c87 45%, #f59e0b 100%)', glow: 'rgba(168, 85, 247, 0.45)', accent: '#d8b4fe' },
  poker: { bg: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 45%, #f59e0b 100%)', glow: 'rgba(239, 68, 68, 0.45)', accent: '#fca5a5' },
  mines: { bg: 'linear-gradient(135deg, #083344 0%, #0f766e 45%, #facc15 100%)', glow: 'rgba(20, 184, 166, 0.45)', accent: '#5eead4' },
  plinko: { bg: 'linear-gradient(135deg, #3b0764 0%, #7e22ce 45%, #ffcc00 100%)', glow: 'rgba(168, 85, 247, 0.45)', accent: '#d8b4fe' },
  dice: { bg: 'linear-gradient(135deg, #312e81 0%, #1d4ed8 45%, #ffcc00 100%)', glow: 'rgba(29, 78, 216, 0.45)', accent: '#93c5fd' },
};

const CasinoPage = () => {
  const [activeCategory, setActiveCategory] = useState<CasinoCategoryId>('slots');

  const filteredGames = useMemo(
    () => GAME_LIST.filter((game) => game.category === activeCategory),
    [activeCategory]
  );

  return (
    <PageTransition>
      <div
        className="min-h-screen pb-24"
        style={{ background: 'radial-gradient(1200px 520px at 18% -8%, hsl(var(--accent) / 0.35), transparent 60%), radial-gradient(840px 420px at 88% 8%, hsl(var(--glow-primary) / 0.12), transparent 60%), hsl(var(--background))' }}
      >
        <div className="px-4 pt-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(Object.keys(CATEGORY_LABELS) as CasinoCategoryId[]).map((category) => {
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-display font-bold transition-all border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary glow-neon'
                      : 'bg-surface-card text-muted-foreground border-border/50'
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>

          <motion.div
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            key={activeCategory}
          >
            {filteredGames.map((game) => {
              const theme = THEME_STYLES[game.theme];

              return (
                <motion.button
                  key={game.id}
                  type="button"
                  variants={staggerItem}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl overflow-hidden border border-border/40 text-left bg-surface-card shadow-ambient"
                  style={{ boxShadow: `0 10px 24px hsl(var(--background) / 0.55), 0 0 0 1px hsl(var(--border) / 0.25), 0 0 22px ${theme.glow}` }}
                >
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-display font-extrabold text-foreground">{game.title}</p>
                        <p className="text-[11px] font-body text-muted-foreground">{game.subtitle}</p>
                      </div>
                      {game.badge && (
                        <span className="rounded-md bg-secondary text-secondary-foreground text-[10px] font-extrabold px-2 py-1 shadow-[0_0_14px_hsl(var(--secondary)/0.42)]">
                          {game.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {game.multipliers.map((multiplier) => (
                        <span
                          key={multiplier}
                          className="rounded-md border border-border/70 bg-background/45 px-1.5 py-1 text-[10px] font-bold text-foreground"
                        >
                          {multiplier}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-body text-muted-foreground uppercase tracking-wider">
                      <span>{CATEGORY_LABELS[game.category]}</span>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 14px ${theme.accent}` }} />
                    </div>
                  </div>

                  <div className="px-3 py-2 bg-surface-section border-t border-border/40">
                    <p className="text-[11px] tracking-[0.12em] font-semibold text-primary">PLAY NOW</p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default CasinoPage;
