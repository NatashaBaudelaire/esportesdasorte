import { motion, AnimatePresence } from 'framer-motion';
import { Hand, X, Volume2 } from 'lucide-react';

interface LibrasAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  videoUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
  isDangerous?: boolean;
}

export const LibrasAlert = ({
  isOpen,
  onClose,
  title,
  description,
  videoUrl,
  actionLabel = 'Confirmar',
  onAction,
  isDangerous = false,
}: LibrasAlertProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={onClose}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="libras-alert-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-card rounded-2xl"
          >
            {/* Header with Libras Indicator */}
            <div className="sticky top-0 bg-surface-card border-b border-surface-interactive p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hand size={24} className="text-primary animate-bounce" aria-hidden="true" />
                <div>
                  <h2 id="libras-alert-title" className="font-display font-bold text-foreground">
                    {title}
                  </h2>
                  <p className="text-xs text-muted-foreground font-body">
                    Com interpretação em Libras
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar alerta"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-interactive rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Video Player Area */}
            {videoUrl && (
              <div className="w-full aspect-video bg-black relative flex items-center justify-center border-b border-surface-interactive">
                {/* Placeholder - Será substituído por vídeo real */}
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-black/50 to-black/80">
                  {/* Interpreter Avatar Area */}
                  <div className="w-32 h-40 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary flex items-center justify-center animate-pulse">
                    <div className="text-center">
                      <Hand size={48} className="text-primary mx-auto" aria-hidden="true" />
                      <p className="text-xs text-muted-foreground mt-2">Intérprete</p>
                    </div>
                  </div>

                  {/* Caption Area */}
                  <div className="w-full bg-black/80 px-4 py-3 text-center">
                    <p className="text-sm text-white font-body">
                      {description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Vídeo com interpretação sincronizada
                    </p>
                  </div>
                </div>

                {/* Play Button Overlay */}
                <button
                  className="absolute inset-0 flex items-center justify-center hover:bg-black/40 transition-colors group"
                  aria-label="Reproduzir vídeo"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl text-primary-foreground">▶</span>
                  </div>
                </button>
              </div>
            )}

            {/* Description */}
            <div className="p-4 space-y-3">
              
              {/* Audio Indicator */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-interactive">
                <Volume2 size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
                <span className="text-xs font-body text-muted-foreground">
                  Inclui: Áudio (português) • Legendas • Libras
                </span>
              </div>

              {/* Description Text */}
              {!videoUrl && (
                <p className="text-sm font-body text-foreground">
                  {description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg bg-surface-interactive text-foreground font-body font-semibold min-h-[44px] hover:bg-surface-interactive/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Cancelar
                </button>
                {onAction && (
                  <button
                    onClick={onAction}
                    className={`flex-1 py-3 rounded-lg font-body font-semibold min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      isDangerous
                        ? 'bg-destructive text-destructive-foreground hover:brightness-110'
                        : 'bg-primary text-primary-foreground hover:brightness-110'
                    }`}
                  >
                    {actionLabel}
                  </button>
                )}
              </div>

              {/* Warning for dangerous actions */}
              {isDangerous && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs font-body text-destructive font-semibold">
                    ⚠️ Esta ação é permanente e não pode ser desfeita
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LibrasAlert;
