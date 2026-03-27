import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Hand, Play, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { PageTransition } from '@/components/animations';
import { LibrasVideoPlayer } from '@/components/LibrasVideoPlayer';

const LibrasResourcesPage = () => {
  const navigate = useNavigate();
  const [selectedResource, setSelectedResource] = useState<'tutorials' | 'rules' | 'terms' | null>(null);
  const [showLibrasVideo, setShowLibrasVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ title: string; url: string } | null>(null);

  const resources = [
    {
      id: 'tutorials',
      title: 'Tutoriais do App',
      description: 'Aprenda como usar o app com interpretação em Libras',
      icon: BookOpen,
      videos: [
        { id: 1, title: 'Como fazer uma aposta', duration: '3:45', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 2, title: 'Ver histórico de apostas', duration: '2:30', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 3, title: 'Gerenciar configurações', duration: '2:15', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 4, title: 'Recarregar carteira', duration: '3:00', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
      ]
    },
    {
      id: 'rules',
      title: 'Regras de Apostas',
      description: 'Entenda as regras e odds das apostas',
      icon: HelpCircle,
      videos: [
        { id: 1, title: 'Tipos de apostas', duration: '4:30', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 2, title: 'O que é odd (cotação)', duration: '3:15', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 3, title: 'Apostas ao vivo', duration: '3:45', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 4, title: 'Bônus e promoções', duration: '2:50', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
      ]
    },
    {
      id: 'terms',
      title: 'Termos de Uso & Privacidade',
      description: 'Documentos importantes em Libras',
      icon: FileText,
      videos: [
        { id: 1, title: 'Termos de Uso', duration: '6:20', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 2, title: 'Política de Privacidade', duration: '5:45', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 3, title: 'Responsabilidade Social', duration: '4:10', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
        { id: 4, title: 'Dados Pessoais e Segurança', duration: '5:00', url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4' },
      ]
    }
  ];

  const handlePlayVideo = (videoTitle: string, videoUrl: string) => {
    setSelectedVideo({ title: videoTitle, url: videoUrl });
  };


  return (
    <PageTransition>
      <div className="pb-20 px-4 pt-2 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <div>
            <h1 className="font-display text-xl font-extrabold flex items-center gap-2">
              <Hand size={24} className="text-primary" aria-hidden="true" />
              Libras - Língua Brasileira de Sinais
            </h1>
            <p className="text-xs text-muted-foreground font-body mt-1">
              Conteúdo acessível em Libras com legendas sincronizadas
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary rounded-xl p-4 space-y-2"
          role="alert"
        >
          <p className="text-sm font-body font-semibold text-foreground">
            Todos os vídeos incluem:
          </p>
          <ul className="text-xs font-body text-foreground/80 space-y-1">
            <li>Interpretação em Libras</li>
            <li>Legendas em português sincronizadas</li>
            <li>Áudio em português claro</li>
            <li>Avatar ou intérprete humano</li>
          </ul>
        </motion.div>

        {/* Resources Grid */}
        {!selectedResource && (
          <div className="grid grid-cols-1 gap-3">
            {resources.map((resource, idx) => {
              const Icon = resource.icon;
              return (
                <motion.button
                  key={resource.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedResource(resource.id as any)}
                  className="bg-surface-card rounded-xl p-4 flex items-start gap-4 hover:bg-surface-interactive transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={`${resource.title}: ${resource.description}`}
                >
                  <Icon size={24} className="text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-sm text-foreground">
                      {resource.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {resource.description}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground font-body mt-2">
                      {resource.videos.length} vídeos disponíveis
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Resource Videos */}
        <AnimatePresence>
          {selectedResource && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <button
                onClick={() => setSelectedResource(null)}
                className="flex items-center gap-2 text-primary font-body font-semibold text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary rounded"
              >
                ← Voltar
              </button>

              {resources
                .find(r => r.id === selectedResource)
                ?.videos.map((video, idx) => (
                  <motion.button
                    key={video.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handlePlayVideo(video.title, video.url)}
                    className="w-full bg-surface-card rounded-xl p-4 flex items-center gap-4 hover:bg-surface-interactive transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    role="button"
                    aria-label={`Reproduzir: ${video.title} (${video.duration})`}
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20">
                      <Play size={20} className="text-primary ml-1" aria-hidden="true" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-body font-semibold text-sm text-foreground">
                        {video.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duração: {video.duration}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded">
                      COM LIBRAS
                    </span>
                  </motion.button>
                ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Libras Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <LibrasVideoPlayer
            videoTitle={selectedVideo.title}
            videoUrl={selectedVideo.url}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default LibrasResourcesPage;
