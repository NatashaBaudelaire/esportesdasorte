import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Users, TrendingUp, MessageCircle, Crown, Flame, ThumbsUp,
  Plus, Clock, Target, Zap, UserCircle, Star, Copy,
  MessageSquare, CheckCircle2, Share2, Bookmark, Link2, X,
  Flag, Radio, BarChart3, CreditCard, Swords, Award, CircleDot
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedPost {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    level: string;
    verified: boolean;
  };
  timeAgo: string;
  text?: string;
  bet: {
    match: string;
    league: string;
    market: string;
    odd: number;
    stake?: number;
    result?: 'green' | 'red' | 'pending';
  };
  likes: number;
  comments: Comment[];
  copies: number;
  liked?: boolean;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  verified: boolean;
  text: string;
  timeAgo: string;
  likes: number;
}

type Tab = 'popular' | 'apostas' | 'criar' | 'recentes' | 'odds100' | 'gols' | 'jogadores';

const tabsList: { id: Tab; label: string; icon: typeof Flame }[] = [
  { id: 'popular', label: 'Popular', icon: Flame },
  { id: 'apostas', label: 'Apostas', icon: TrendingUp },
  { id: 'recentes', label: 'Recentes', icon: Clock },
  { id: 'odds100', label: 'Odds > 100', icon: Zap },
  { id: 'gols', label: 'Gols', icon: Target },
  { id: 'jogadores', label: 'Jogadores', icon: UserCircle },
  { id: 'criar', label: 'Criar', icon: Plus },
];

const avatars = [
  'https://i.pravatar.cc/80?img=1',
  'https://i.pravatar.cc/80?img=2',
  'https://i.pravatar.cc/80?img=3',
  'https://i.pravatar.cc/80?img=4',
  'https://i.pravatar.cc/80?img=5',
  'https://i.pravatar.cc/80?img=6',
  'https://i.pravatar.cc/80?img=7',
  'https://i.pravatar.cc/80?img=8',
  'https://i.pravatar.cc/80?img=9',
  'https://i.pravatar.cc/80?img=10',
  'https://i.pravatar.cc/80?img=11',
  'https://i.pravatar.cc/80?img=12',
];

const makeComments = (texts: string[]): Comment[] =>
  texts.map((t, i) => ({
    id: `c${i}`,
    user: ['Lucas M.', 'Bruna S.', 'Felipe R.', 'Camila D.', 'Andre L.', 'Tatiana P.'][i % 6],
    avatar: `https://i.pravatar.cc/40?img=${20 + i}`,
    verified: i === 0,
    text: t,
    timeAgo: `${i + 1}h`,
    likes: Math.floor(Math.random() * 50),
  }));

const feedPosts: FeedPost[] = [
  {
    id: '1',
    user: { name: 'Carlos Mendes', username: '@carlosm', avatar: avatars[0], level: 'VIP', verified: true },
    timeAgo: '2 min',
    text: 'Confia nessa, galera! Fla vai destruir hoje',
    bet: { match: 'Flamengo x Palmeiras', league: 'Brasileirao Serie A', market: 'Resultado Final - Flamengo', odd: 2.10, stake: 50, result: 'pending' },
    likes: 124, comments: makeComments(['Bora Mengao!', 'Vou copiar essa', 'Arriscado hein']), copies: 18,
  },
  {
    id: '2',
    user: { name: 'Neymar Jr', username: '@neymarjr', avatar: avatars[1], level: 'VIP', verified: true },
    timeAgo: '15 min',
    text: 'Bora Brasil! Sem medo',
    bet: { match: 'Brasil x Franca', league: 'Amistoso Internacional', market: 'Resultado Final - Brasil', odd: 3.20, stake: 1000, result: 'pending' },
    likes: 8943, comments: makeComments(['O cara apostou 1000 reais', 'Se o Ney ta confiante eu to tambem', 'Vamo selecao!', 'Copiado!', 'Odd boa demais']), copies: 3421,
  },
  {
    id: '3',
    user: { name: 'Ana Paula', username: '@anapbet', avatar: avatars[2], level: 'Ouro', verified: false },
    timeAgo: '28 min',
    bet: { match: 'Real Madrid x Barcelona', league: 'La Liga', market: 'Ambos Marcam - Sim', odd: 1.72, stake: 30, result: 'green' },
    likes: 89, comments: makeComments(['Green bonito', 'Essa sempre paga']), copies: 45,
  },
  {
    id: '4',
    user: { name: 'Rafael Koch', username: '@rafaelk', avatar: avatars[3], level: 'VIP', verified: true },
    timeAgo: '1h',
    text: 'Tip do dia. Confiem no pai',
    bet: { match: 'Liverpool x Arsenal', league: 'Premier League', market: 'Over 2.5 Gols', odd: 1.85, stake: 100, result: 'green' },
    likes: 567, comments: makeComments(['Monstro demais', 'Sempre acerta', 'Melhor tipster da plataforma', 'Green!']), copies: 234,
  },
  {
    id: '5',
    user: { name: 'Thiago Fernandes', username: '@thifern', avatar: avatars[4], level: 'Prata', verified: false },
    timeAgo: '1h',
    bet: { match: 'Corinthians x Sao Paulo', league: 'Brasileirao Serie A', market: 'Empate', odd: 3.40, stake: 20, result: 'red' },
    likes: 12, comments: makeComments(['Nao deu dessa vez']), copies: 2,
  },
  {
    id: '6',
    user: { name: 'Ronaldo Fenomeno', username: '@ronaldo', avatar: avatars[5], level: 'VIP', verified: true },
    timeAgo: '2h',
    text: 'Multipla insana, quem tem coragem?',
    bet: { match: 'Multipla 5 jogos', league: 'Varias ligas', market: 'Combo especial', odd: 145.00, stake: 10, result: 'pending' },
    likes: 4521, comments: makeComments(['Loucura total', 'Se pagar eu te sigo pra sempre', 'Copiado na fe', 'All in!']), copies: 1567,
  },
  {
    id: '7',
    user: { name: 'Juliana Costa', username: '@julibet', avatar: avatars[6], level: 'Ouro', verified: false },
    timeAgo: '2h',
    text: 'GREEN! Obrigada @rafaelk pela dica',
    bet: { match: 'Manchester City x Chelsea', league: 'Premier League', market: 'Vit. Man City + Over 1.5', odd: 2.45, stake: 40, result: 'green' },
    likes: 234, comments: makeComments(['Parabens!', 'Quanto ganhou?', 'Vou seguir ele tambem']), copies: 67,
  },
  {
    id: '8',
    user: { name: 'Diego Silva', username: '@diegosil', avatar: avatars[7], level: 'VIP', verified: true },
    timeAgo: '3h',
    bet: { match: 'Boca Juniors x River Plate', league: 'Libertadores', market: 'Ambos Marcam + Over 2.5', odd: 3.80, stake: 25, result: 'pending' },
    likes: 345, comments: makeComments(['Superclassico!', 'Odd linda']), copies: 89,
  },
  {
    id: '9',
    user: { name: 'Fernanda Lima', username: '@ferbet', avatar: avatars[8], level: 'Ouro', verified: false },
    timeAgo: '4h',
    text: 'Vini Jr vai marcar, pode printar',
    bet: { match: 'Real Madrid x Barcelona', league: 'La Liga', market: 'Vini Jr - Marca a qualquer momento', odd: 2.10, stake: 50, result: 'green' },
    likes: 456, comments: makeComments(['Craque demais', 'Printei e deu green!', 'Vou copiar na proxima']), copies: 123,
  },
  {
    id: '10',
    user: { name: 'Pedro Henrique', username: '@pedroh99', avatar: avatars[9], level: 'Bronze', verified: false },
    timeAgo: '5h',
    bet: { match: 'Gremio x Internacional', league: 'Brasileirao Serie A', market: 'Resultado Final - Gremio', odd: 2.30, stake: 15, result: 'red' },
    likes: 18, comments: makeComments(['Grenal e sempre imprevisivel']), copies: 1,
  },
  {
    id: '11',
    user: { name: 'Casimiro', username: '@casimiro', avatar: avatars[10], level: 'VIP', verified: true },
    timeAgo: '6h',
    text: 'METEU ESSA? Odd absurda pagou!',
    bet: { match: 'Multipla 8 jogos', league: 'Varias ligas', market: 'Super Combo', odd: 320.00, stake: 5, result: 'green' },
    likes: 12400, comments: makeComments(['IMPOSSIVEL', 'Quanto esse maluco ganhou?', 'R$ 1600 com 5 reais???', 'Lenda', 'Casimiro eh outro nivel']), copies: 5600,
  },
  {
    id: '12',
    user: { name: 'Mariana Santos', username: '@marisantos', avatar: avatars[11], level: 'Ouro', verified: false },
    timeAgo: '7h',
    bet: { match: 'Bayern x Dortmund', league: 'Bundesliga', market: 'Over 3.5 Gols', odd: 2.00, stake: 35, result: 'green' },
    likes: 156, comments: makeComments(['Bundesliga sempre da gol', 'Boa!']), copies: 45,
  },
];

const onlineUsers = 12847;

const getLevelStyle = (level: string) => {
  switch (level) {
    case 'VIP': return 'text-primary bg-primary/20';
    case 'Ouro': return 'text-primary bg-primary/10';
    case 'Prata': return 'text-foreground bg-surface-interactive';
    case 'Bronze': return 'text-muted-foreground bg-surface-interactive';
    default: return 'text-muted-foreground bg-surface-interactive';
  }
};

const formatNumber = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

const ChatPage = () => {
  const { isLoggedIn, user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('popular');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [createName, setCreateName] = useState('');
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<string | null>(null);
  const [realBets, setRealBets] = useState<FeedPost[]>([]);
  const [loadingReal, setLoadingReal] = useState(true);
  const [dbComments, setDbComments] = useState<Map<string, Comment[]>>(new Map());

  // Fetch comments from DB
  const fetchComments = async (betIds: string[]) => {
    if (betIds.length === 0) return;
    try {
      const { data, error } = await supabase
        .from('social_comments')
        .select('*')
        .in('bet_id', betIds)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return;

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const grouped = new Map<string, Comment[]>();
      data.forEach(c => {
        const profile = profileMap.get(c.user_id);
        const timeDiff = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 60000);
        const timeAgo = timeDiff < 1 ? 'agora' : timeDiff < 60 ? `${timeDiff} min` : `${Math.floor(timeDiff / 60)}h`;
        const comment: Comment = {
          id: c.id,
          user: profile?.full_name || profile?.username || 'Usuário',
          avatar: profile?.avatar_url || `https://i.pravatar.cc/40?img=50`,
          verified: false,
          text: c.text,
          timeAgo,
          likes: 0,
        };
        const arr = grouped.get(c.bet_id) || [];
        arr.push(comment);
        grouped.set(c.bet_id, arr);
      });
      setDbComments(grouped);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const addComment = async (betId: string, text: string) => {
    if (!user) return;
    const realBetId = betId.startsWith('real-') ? betId.replace('real-', '') : null;
    if (!realBetId) {
      // For mock posts, just add locally
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('social_comments')
        .insert({ bet_id: realBetId, user_id: user.id, text })
        .select()
        .single();
      if (error) throw error;
      // Refresh comments
      await fetchComments([realBetId]);
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Erro ao enviar comentário');
      return null;
    }
  };

  // Fetch real shared bets from database
  useEffect(() => {
    const fetchSharedBets = async () => {
      setLoadingReal(true);
      try {
        const { data: bets, error } = await supabase
          .from('bets')
          .select('*')
          .eq('shared', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (bets && bets.length > 0) {
          // Fetch profiles for these users
          const userIds = [...new Set(bets.map(b => b.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, avatar_url, level')
            .in('user_id', userIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

          // Fetch comments for these bets
          await fetchComments(bets.map(b => b.id));

          const realPosts: FeedPost[] = bets.map((bet, idx) => {
            const profile = profileMap.get(bet.user_id);
            const selections = Array.isArray(bet.selections) ? bet.selections : [];
            const firstSel = selections[0] as Record<string, unknown> | undefined;
            const timeDiff = Math.floor((Date.now() - new Date(bet.created_at).getTime()) / 60000);
            const timeAgo = timeDiff < 60 ? `${timeDiff} min` : `${Math.floor(timeDiff / 60)}h`;

            return {
              id: `real-${bet.id}`,
              user: {
                name: profile?.full_name || profile?.username || 'Apostador',
                username: `@${profile?.username || 'user'}`,
                avatar: profile?.avatar_url || `https://i.pravatar.cc/80?img=${30 + idx}`,
                level: profile?.level || 'Bronze',
                verified: false,
              },
              timeAgo,
              text: (bet as Record<string, unknown>).shared_text as string || undefined,
              bet: {
                match: (firstSel?.match as string) || 'Aposta',
                league: (firstSel?.market as string) || 'Esportes',
                market: (firstSel?.selection as string) || 'Resultado',
                odd: bet.total_odds,
                stake: bet.stake,
                result: bet.status === 'won' ? 'green' as const : bet.status === 'lost' ? 'red' as const : 'pending' as const,
              },
              likes: Math.floor(Math.random() * 50),
              comments: [],
              copies: Math.floor(Math.random() * 10),
            };
          });

          setRealBets(realPosts);
        }
      } catch (err) {
        console.error('Error fetching shared bets:', err);
      } finally {
        setLoadingReal(false);
      }
    };

    fetchSharedBets();
  }, []);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  const toggleSave = (postId: string) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  const allPosts = [...realBets, ...feedPosts];

  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'popular': return [...allPosts].sort((a, b) => b.likes - a.likes);
      case 'apostas': return allPosts.filter(p => p.bet.result === 'pending');
      case 'recentes': return [...allPosts].reverse();
      case 'odds100': return allPosts.filter(p => p.bet.odd >= 100);
      case 'gols': return allPosts.filter(p => p.bet.market.toLowerCase().includes('gol') || p.bet.market.toLowerCase().includes('marca') || p.bet.market.toLowerCase().includes('over'));
      case 'jogadores': return allPosts.filter(p => p.bet.market.includes('Vini') || p.bet.market.includes('Jr') || p.user.verified);
      default: return allPosts;
    }
  };

  const ResultBadge = ({ result }: { result?: 'green' | 'red' | 'pending' }) => {
    if (!result) return null;
    if (result === 'green') return (
      <span className="flex items-center gap-1 text-[0.6rem] font-display font-bold text-secondary bg-secondary/15 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={10} /> GREEN
      </span>
    );
    if (result === 'red') return (
      <span className="flex items-center gap-1 text-[0.6rem] font-display font-bold text-destructive bg-destructive/15 px-2 py-0.5 rounded-full">
        RED
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-[0.6rem] font-display font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
        <Clock size={10} /> AO VIVO
      </span>
    );
  };

  const PostCard = ({ post }: { post: FeedPost }) => {
    const isLiked = likedPosts.has(post.id);
    const isSaved = savedPosts.has(post.id);
    const isCommentsOpen = openComments === post.id;
    const [newComment, setNewComment] = useState('');
    const realBetId = post.id.startsWith('real-') ? post.id.replace('real-', '') : null;
    const dbCommentsForPost = realBetId ? (dbComments.get(realBetId) || []) : [];
    const [localComments, setLocalComments] = useState(post.comments);
    const allComments = realBetId ? [...dbCommentsForPost, ...localComments] : localComments;
    const commentInputRef = useRef<HTMLInputElement>(null);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-card rounded-xl overflow-hidden"
      >
        {/* User header */}
        <div className="flex items-center gap-3 p-3 pb-2">
          <div className="relative">
            <img
              src={post.user.avatar}
              alt={post.user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {post.user.level === 'VIP' && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Crown size={8} className="text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-display font-bold text-foreground truncate">{post.user.name}</span>
              {post.user.verified && (
                <CheckCircle2 size={14} className="text-primary flex-shrink-0" fill="currentColor" strokeWidth={0} />
              )}
              <span className={`text-[0.5rem] font-display font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${getLevelStyle(post.user.level)}`}>
                {post.user.level}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[0.65rem] font-body text-muted-foreground">{post.user.username}</span>
              <span className="text-[0.5rem] text-muted-foreground/50">-</span>
              <span className="text-[0.65rem] font-body text-muted-foreground">{post.timeAgo}</span>
            </div>
          </div>
          <ResultBadge result={post.bet.result} />
        </div>

        {/* Text */}
        {post.text && (
          <p className="px-3 pb-2 text-sm font-body text-foreground/90">{post.text}</p>
        )}

        {/* Bet card */}
        <div className="mx-3 mb-3 rounded-xl bg-surface-section p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center">
                <TrendingUp size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-[0.65rem] font-body text-muted-foreground uppercase tracking-wide">{post.bet.league}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-display font-bold text-foreground">{post.bet.match}</p>
            <p className="text-xs font-body text-foreground/70">{post.bet.market}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 rounded-lg px-3 py-1.5">
                <span className="text-xs font-body text-muted-foreground">Odd</span>
                <p className={`text-sm font-display font-extrabold ${post.bet.odd >= 100 ? 'text-primary' : 'text-foreground'}`}>
                  {post.bet.odd.toFixed(2)}
                </p>
              </div>
              {post.bet.stake && (
                <div>
                  <span className="text-xs font-body text-muted-foreground">Aposta</span>
                  <p className="text-sm font-display font-bold text-foreground">R$ {post.bet.stake}</p>
                </div>
              )}
              {post.bet.stake && (
                <div>
                  <span className="text-xs font-body text-muted-foreground">Retorno</span>
                  <p className="text-sm font-display font-bold text-secondary">R$ {(post.bet.stake * post.bet.odd).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleLike(post.id)}
              className="flex items-center gap-1.5 min-h-[36px] transition-colors"
            >
              <ThumbsUp size={16} className={isLiked ? 'text-primary fill-primary' : 'text-muted-foreground'} />
              <span className={`text-xs font-body ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}>
                {formatNumber(post.likes + (isLiked ? 1 : 0))}
              </span>
            </button>
            <button
              onClick={() => setOpenComments(isCommentsOpen ? null : post.id)}
              className={`flex items-center gap-1.5 min-h-[36px] transition-colors ${isCommentsOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <MessageSquare size={16} />
              <span className="text-xs font-body">{formatNumber(allComments.length)}</span>
            </button>
            <button
              onClick={() => setSharePost(post.id)}
              className="flex items-center gap-1.5 min-h-[36px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleSave(post.id)}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <Bookmark size={16} className={isSaved ? 'text-primary fill-primary' : 'text-muted-foreground'} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-1.5 rounded-lg text-xs font-display font-bold min-h-[36px] hover:bg-primary/25 transition-colors"
            >
              <Copy size={14} />
              Copiar Bilhete
            </motion.button>
          </div>
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                <div className="h-px bg-surface-interactive" />

                {/* Comment list */}
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {allComments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <img src={c.avatar} alt={c.user} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-display font-bold text-foreground">{c.user}</span>
                          {c.verified && <CheckCircle2 size={10} className="text-primary flex-shrink-0" fill="currentColor" strokeWidth={0} />}
                          <span className="text-[0.55rem] text-muted-foreground font-body">{c.timeAgo}</span>
                        </div>
                        <p className="text-xs font-body text-foreground/80 mt-0.5">{c.text}</p>
                        <button className="flex items-center gap-1 mt-1 text-muted-foreground hover:text-primary transition-colors">
                          <ThumbsUp size={10} />
                          <span className="text-[0.55rem] font-body">{c.likes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <div className="flex gap-2 pt-1">
                  <input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                        if (!isLoggedIn) { navigate('/auth'); return; }
                        const text = newComment;
                        setNewComment('');
                        if (realBetId) {
                          await addComment(post.id, text);
                        } else {
                          setLocalComments([...localComments, {
                            id: `new-${Date.now()}`, user: 'Você', avatar: 'https://i.pravatar.cc/40?img=50',
                            verified: false, text, timeAgo: 'agora', likes: 0,
                          }]);
                        }
                      }
                    }}
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-surface-interactive rounded-lg py-2 px-3 text-xs font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[36px]"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      if (!newComment.trim()) return;
                      if (!isLoggedIn) { navigate('/auth'); return; }
                      const text = newComment;
                      setNewComment('');
                      if (realBetId) {
                        await addComment(post.id, text);
                      } else {
                        setLocalComments([...localComments, {
                          id: `new-${Date.now()}`, user: 'Você', avatar: 'https://i.pravatar.cc/40?img=50',
                          verified: false, text, timeAgo: 'agora', likes: 0,
                        }]);
                      }
                    }}
                    className="bg-primary text-primary-foreground w-9 h-9 rounded-lg flex items-center justify-center min-w-[36px]"
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-16 overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-extrabold flex items-center gap-2">
            <MessageCircle size={22} className="text-primary" />
            Social
          </h1>
          <div className="flex items-center gap-1.5 bg-surface-card rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-body font-semibold">{onlineUsers.toLocaleString('pt-BR')}</span>
            <Users size={14} className="text-muted-foreground" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tabsList.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-body font-semibold min-h-[36px] transition-all ${
                  activeTab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-card text-muted-foreground'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-2">
        <AnimatePresence mode="wait">
          {/* CRIAR TAB */}
          {activeTab === 'criar' && (
            <motion.div key="criar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-surface-card rounded-xl p-4 space-y-3">
                <h3 className="font-display font-bold text-sm flex items-center gap-2">
                  <Plus size={16} className="text-primary" />
                  Compartilhar sua Aposta
                </h3>
                <p className="text-xs font-body text-muted-foreground">
                  Suas apostas confirmadas aparecem automaticamente no feed quando você compartilha. Vá em Histórico de Apostas para compartilhar!
                </p>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Adicione um comentário à sua aposta..."
                  className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
                />
                <div className="space-y-2">
                  <p className="text-xs font-body text-muted-foreground">Tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Simples', 'Múltipla', 'Tip', 'Análise', 'Resultado'].map(cat => (
                      <button key={cat} className="px-3 py-1.5 bg-surface-interactive rounded-full text-xs font-body text-foreground/70 hover:bg-primary hover:text-primary-foreground transition-colors min-h-[32px]">
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!isLoggedIn) { navigate('/auth'); return; }
                    navigate('/historico');
                    toast('Vá ao Histórico de Apostas', { description: 'Clique em "Compartilhar" em qualquer aposta para publicar no Social' });
                  }}
                  className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px]"
                >
                  Ver minhas Apostas
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* FEED */}
          {activeTab !== 'criar' && (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {activeTab === 'odds100' && (
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-4 mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={18} className="text-primary" />
                    <span className="font-display font-extrabold text-sm text-primary">ODDS INSANAS</span>
                  </div>
                  <p className="text-xs font-body text-foreground/70">Apostas com odds acima de 100x. Alto risco, alta recompensa!</p>
                </div>
              )}

              {getFilteredPosts().map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Bottom Sheet */}
      <AnimatePresence>
        {sharePost && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setSharePost(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-surface-section rounded-t-2xl p-4 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base">Compartilhar</h3>
                <button onClick={() => setSharePost(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              {(() => {
                const post = allPosts.find(p => p.id === sharePost);
                const shareText = post
                  ? `🎯 ${post.bet.match}\n📊 ${post.bet.market} | Odd: ${post.bet.odd.toFixed(2)}${post.bet.stake ? `\n💰 Aposta: R$ ${post.bet.stake}` : ''}${post.bet.result === 'green' ? '\n✅ GREEN!' : post.bet.result === 'red' ? '\n❌ RED' : '\n⏳ Pendente'}\n\n🔥 Esportes da Sorte - Apostas Esportivas`
                  : '🔥 Confira essa aposta na Esportes da Sorte!';
                const encodedText = encodeURIComponent(shareText);

                const shareActions = [
                  {
                    label: 'WhatsApp',
                    bg: 'bg-[#25D366]/20',
                    color: 'text-[#25D366]',
                    icon: MessageCircle,
                    action: () => window.open(`https://wa.me/?text=${encodedText}`, '_blank'),
                  },
                  {
                    label: 'Telegram',
                    bg: 'bg-[#0088cc]/20',
                    color: 'text-[#0088cc]',
                    icon: Send,
                    action: () => window.open(`https://t.me/share/url?text=${encodedText}`, '_blank'),
                  },
                  {
                    label: 'Twitter/X',
                    bg: 'bg-foreground/10',
                    color: 'text-foreground',
                    icon: Share2,
                    action: () => window.open(`https://x.com/intent/tweet?text=${encodedText}`, '_blank'),
                  },
                  {
                    label: 'Mais',
                    bg: 'bg-[#E4405F]/20',
                    color: 'text-[#E4405F]',
                    icon: Share2,
                    action: () => {
                      if (navigator.share) {
                        navigator.share({ text: shareText }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(shareText);
                        toast.success('Texto copiado!');
                      }
                    },
                  },
                ];

                return (
                  <>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {shareActions.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.label}
                            onClick={() => { item.action(); setSharePost(null); }}
                            className="flex flex-col items-center gap-2 min-h-[44px]"
                          >
                            <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center`}>
                              <Icon size={20} className={item.color} />
                            </div>
                            <span className="text-[0.6rem] font-body text-muted-foreground">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          navigator.clipboard.writeText(shareText);
                          toast.success('Texto da aposta copiado!');
                          setSharePost(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-surface-interactive text-foreground font-body font-semibold text-sm py-3 rounded-xl min-h-[44px]"
                      >
                        <Link2 size={16} />
                        Copiar Texto
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          navigator.clipboard.writeText(shareText);
                          toast.success('Bilhete copiado!');
                          setSharePost(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px]"
                      >
                        <Copy size={16} />
                        Copiar Bilhete
                      </motion.button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
