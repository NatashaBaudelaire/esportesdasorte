import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Loader2, ExternalLink } from 'lucide-react';
import { SectionReveal } from '@/components/animations';
import { supabase } from '@/integrations/supabase/client';

interface FifaArticle {
  title: string;
  url: string;
  image: string;
  tag: string;
}

const NewsSection = () => {
  const [articles, setArticles] = useState<FifaArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-fifa-news');
        if (!error && data?.articles) {
          setArticles(data.articles);
          setLastUpdated(data.updated_at);
        }
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const duplicatedArticles = [...articles, ...articles];
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  return (
    <SectionReveal>
      <section className="px-4">
        <motion.div
          className="flex items-center justify-between mb-3"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Newspaper size={20} className="text-primary" />
              Notícias Copa 2026
            </h2>
            {lastUpdated && (
              <p className="text-[0.55rem] font-body text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                Ao vivo · Atualizado {timeAgo(lastUpdated)}
              </p>
            )}
          </div>
          <a
            href="https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-body font-semibold flex items-center gap-0.5 min-h-[44px]"
          >
            FIFA.com <ExternalLink size={12} />
          </a>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-hidden -mx-4">
            <motion.div
              className="flex gap-3 px-4 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ x: { duration: 35, repeat: Infinity, ease: 'linear' } }}
            >
            {duplicatedArticles.map((article, i) => (
              <motion.a
                key={`news-${i}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-[200px] bg-surface-card rounded-xl overflow-hidden group"
              >
                <div className="relative">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-[120px] object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[0.5rem] font-display font-bold px-1.5 py-0.5 rounded">
                    {article.tag}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-[0.6rem] font-body text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    FIFA.com
                  </p>
                  <p className="font-display text-xs font-bold mt-1 leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                </div>
              </motion.a>
            ))}
            </motion.div>
          </div>
        )}
      </section>
    </SectionReveal>
  );
};

export default NewsSection;
