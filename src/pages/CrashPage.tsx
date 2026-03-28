import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';

type CrashCategoryId = 'classic' | 'aviator' | 'space' | 'instant';

type CrashGame = {
  id: string;
  title: string;
  subtitle: string;
  category: CrashCategoryId;
  badge?: 'HOT' | 'POPULAR';
  multipliers: string[];
  theme: 'rocket' | 'jet' | 'orbit' | 'galaxy' | 'turbo' | 'mines' | 'plinko' | 'dice';
};

const CATEGORY_LABELS: Record<CrashCategoryId, string> = {
  classic: 'Crash Classic',
  aviator: 'Aviator Style',
  space: 'Space Crash',
  instant: 'Instant Games',
};

const CRASH_GAMES: CrashGame[] = [
  { id: 'classic-crash', title: 'Crash', subtitle: 'Rocket + Graph Multiplier', category: 'classic', badge: 'HOT', multipliers: ['2x', '5x', '20x'], theme: 'rocket' },
  { id: 'classic-turbo', title: 'Turbo Crash', subtitle: 'Fast Rounds & Exit', category: 'classic', multipliers: ['2x', '8x'], theme: 'turbo' },

  { id: 'aviator-pro', title: 'Aviator Pro', subtitle: 'Plane Takeoff Bets', category: 'aviator', badge: 'POPULAR', multipliers: ['2x', '7x', '15x'], theme: 'jet' },
  { id: 'aviator-neon', title: 'Aviator Neon', subtitle: 'Skyline Flight Mode', category: 'aviator', badge: 'HOT', multipliers: ['3x', '9x'], theme: 'jet' },

  { id: 'space-burst', title: 'Space Burst', subtitle: 'Futuristic Orbit Arena', category: 'space', badge: 'POPULAR', multipliers: ['2x', '6x', '12x'], theme: 'orbit' },
  { id: 'galaxy-crash', title: 'Galaxy Crash', subtitle: 'Deep Space Multipliers', category: 'space', multipliers: ['4x', '10x'], theme: 'galaxy' },

  { id: 'instant-mines', title: 'Mines', subtitle: 'Pick Safe Cells', category: 'instant', badge: 'HOT', multipliers: ['2x', '25x'], theme: 'mines' },
  { id: 'instant-plinko', title: 'Plinko', subtitle: 'Drop and Multiply', category: 'instant', badge: 'POPULAR', multipliers: ['2x', '16x'], theme: 'plinko' },
  { id: 'instant-dice', title: 'Dice', subtitle: 'Quick Roll Battle', category: 'instant', multipliers: ['2x', '12x'], theme: 'dice' },
];

const THEME_STYLES: Record<CrashGame['theme'], { bg: string; glow: string; accent: string }> = {
  rocket: { bg: 'linear-gradient(135deg, #001437 0%, #00348A 45%, #00A8FF 100%)', glow: 'rgba(0, 168, 255, 0.5)', accent: '#38BDF8' },
  jet: { bg: 'linear-gradient(135deg, #0b1b42 0%, #1D4ED8 45%, #7DD3FC 100%)', glow: 'rgba(59, 130, 246, 0.5)', accent: '#93C5FD' },
  orbit: { bg: 'linear-gradient(135deg, #0C1233 0%, #4338CA 45%, #22D3EE 100%)', glow: 'rgba(67, 56, 202, 0.5)', accent: '#A5B4FC' },
  galaxy: { bg: 'linear-gradient(135deg, #1E1B4B 0%, #6D28D9 45%, #00A8FF 100%)', glow: 'rgba(109, 40, 217, 0.5)', accent: '#C4B5FD' },
  turbo: { bg: 'linear-gradient(135deg, #082F49 0%, #0369A1 45%, #FFCC00 100%)', glow: 'rgba(3, 105, 161, 0.5)', accent: '#67E8F9' },
  mines: { bg: 'linear-gradient(135deg, #083344 0%, #0F766E 45%, #FFCC00 100%)', glow: 'rgba(20, 184, 166, 0.5)', accent: '#5EEAD4' },
  plinko: { bg: 'linear-gradient(135deg, #3B0764 0%, #7E22CE 45%, #FFCC00 100%)', glow: 'rgba(168, 85, 247, 0.5)', accent: '#D8B4FE' },
  dice: { bg: 'linear-gradient(135deg, #312E81 0%, #1D4ED8 45%, #FFCC00 100%)', glow: 'rgba(29, 78, 216, 0.5)', accent: '#93C5FD' },
};

const CrashPage = () => {
  const [activeCategory, setActiveCategory] = useState<CrashCategoryId>('classic');

  const filteredGames = useMemo(
    () => CRASH_GAMES.filter((game) => game.category === activeCategory),
    [activeCategory]
  );

  return (
    <PageTransition>
      <div
        className="min-h-screen pb-24"
        style={{ background: 'radial-gradient(1100px 500px at 14% -8%, hsl(var(--accent) / 0.35), transparent 62%), radial-gradient(780px 420px at 88% 4%, hsl(var(--glow-primary) / 0.12), transparent 62%), hsl(var(--background))' }}
      >
        <div className="px-4 pt-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(Object.keys(CATEGORY_LABELS) as CrashCategoryId[]).map((category) => {
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
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
                        <p className="text-sm font-display brand-title font-extrabold text-foreground">{game.title}</p>
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

export default CrashPage;
