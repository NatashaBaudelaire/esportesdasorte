import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface LibrasVideoPlayerProps {
  videoTitle: string;
  videoUrl: string;
  subtitleUrl?: string;
  onClose: () => void;
}

export const LibrasVideoPlayer = ({
  videoTitle,
  videoUrl,
  subtitleUrl,
  onClose,
}: LibrasVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentCaption, setCurrentCaption] = useState('');

  // Format time for display
  const formatTime = (time: number) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Update current time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Update duration
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, duration);
        }
      } else if (e.key === 'ArrowLeft') {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-surface-card rounded-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-title"
      >
        {/* Video Container */}
        <div className="w-full aspect-video bg-black relative group">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            {subtitleUrl && (
              <track
                kind="subtitles"
                src={subtitleUrl}
                srcLang="pt"
                label="Português"
              />
            )}
          </video>

          {/* Play Overlay Button - Shows when not playing */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all"
              aria-label="Reproduzir vídeo"
            >
              <div className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center pointer-events-none">
                <Play size={40} className="text-white ml-1" fill="white" />
              </div>
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-destructive text-destructive-foreground p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Fechar vídeo"
          >
            ✕
          </button>

          {/* Title overlay - Shows at the bottom on hover */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <p id="video-title" className="text-white font-body font-semibold text-sm">
              {videoTitle}
            </p>
            <p className="text-white/70 text-xs mt-1">Espaço = Play/Pause | M = Mute | Seta = ±5s | ESC = Fechar</p>
          </div>
        </div>

        {/* Video Info & Captions */}
        <div className="p-4 space-y-3 bg-surface-card">
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">{videoTitle}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Conteúdo com interpretação em Libras, legendas sincronizadas e áudio em português
            </p>
          </div>

          {/* Accessibility Info */}
          <div className="bg-primary/10 border border-primary rounded-lg p-3 flex items-center gap-2">
            <Volume2 size={16} className="text-primary flex-shrink-0" />
            <span className="text-xs text-foreground font-body">
              Áudio português + Legendas PT + Libras (avatar em breve)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div
              onClick={handleProgressClick}
              className="w-full h-2 bg-muted-foreground/30 rounded-full cursor-pointer hover:h-3 transition-all group"
            >
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="h-full w-4 bg-primary rounded-full ml-auto opacity-0 group-hover:opacity-100 transition-opacity -mr-2"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-body">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Video Controls */}
          <div className="flex gap-2 items-center">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex-1 bg-primary text-primary-foreground font-body font-semibold py-2.5 rounded-lg min-h-[44px] hover:brightness-110 transition-all flex items-center justify-center gap-2"
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? (
                <>
                  <Pause size={18} />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>Reproduzir</span>
                </>
              )}
            </button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="bg-surface-interactive text-foreground font-body font-semibold py-2.5 px-3 rounded-lg min-h-[44px] hover:bg-surface-interactive/80 transition-colors flex items-center justify-center"
              aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Volume Slider */}
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-muted-foreground/30 rounded-full cursor-pointer accent-primary"
                aria-label="Controle de volume"
              />
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-foreground hover:bg-surface-interactive transition-colors font-body font-semibold min-h-[44px]"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
