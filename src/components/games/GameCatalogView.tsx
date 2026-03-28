import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';
import type { RealGame } from '@/services/GameCatalogService';

type GameCatalogViewProps = {
  title: string;
  games: RealGame[];
  loading: boolean;
  error: string;
};

const GameCatalogView = ({ title, games, loading, error }: GameCatalogViewProps) => {
  const [selectedGame, setSelectedGame] = useState<RealGame | null>(null);

  return (
    <PageTransition>
      <div className="px-4 pt-4 pb-20 space-y-4">
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>

        {loading && <p className="text-xs font-body text-muted-foreground">Carregando jogos...</p>}
        {error && <p className="text-xs font-body text-destructive">{error}</p>}

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" variants={staggerContainer} initial="hidden" animate="show">
          {games.map((game) => (
            <motion.button
              key={game.id}
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGame(game)}
              className="bg-surface-card rounded-xl text-left cursor-pointer border border-border/40 overflow-hidden"
              type="button"
            >
              <img src={game.imageUrl} alt={game.name} className="w-full h-28 object-cover" loading="lazy" />
              <div className="p-3">
                <p className="font-display font-bold text-sm text-foreground leading-tight">{game.name}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <Dialog open={Boolean(selectedGame)} onOpenChange={(open) => !open && setSelectedGame(null)}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            {selectedGame && (
              <div className="bg-background">
                <div className="w-full h-[70vh] bg-black">
                  <iframe
                    src={selectedGame.launchUrl}
                    title={selectedGame.name}
                    className="w-full h-full border-0"
                    allow="fullscreen; autoplay; clipboard-read; clipboard-write"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default GameCatalogView;
