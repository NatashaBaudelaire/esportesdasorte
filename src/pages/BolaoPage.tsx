import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Copy, Check, ChevronRight, Crown, Medal, Award, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const roundMatches = [
  { id: 'b1', home: 'Flamengo', away: 'Palmeiras', date: 'Dom, 16:00' },
  { id: 'b2', home: 'Corinthians', away: 'São Paulo', date: 'Dom, 18:30' },
  { id: 'b3', home: 'Grêmio', away: 'Internacional', date: 'Dom, 16:00' },
  { id: 'b4', home: 'Atlético-MG', away: 'Cruzeiro', date: 'Dom, 19:00' },
  { id: 'b5', home: 'Santos', away: 'Vasco', date: 'Seg, 20:00' },
];

type BolaoTab = 'lobby' | 'palpites' | 'criar';

interface LeaderboardEntry {
  pos: number;
  name: string;
  points: number;
  isYou: boolean;
  icon?: typeof Crown;
}

const BolaoPage = () => {
  const [tab, setTab] = useState<BolaoTab>('lobby');
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [savedMatches, setSavedMatches] = useState<Set<string>>(new Set());
  const { isLoggedIn, user } = useAuthStore();
  const navigate = useNavigate();

  // Load existing predictions & leaderboard
  useEffect(() => {
    const loadData = async () => {
      if (!isLoggedIn || !user) {
        setLeaderboardLoading(false);
        return;
      }

      try {
        // Load user's existing predictions
        const { data: myPreds } = await supabase
          .from('bolao_predictions')
          .select('match_id, home_score, away_score')
          .eq('user_id', user.id)
          .eq('round_number', 28);

        if (myPreds && myPreds.length > 0) {
          const existing: Record<string, { home: string; away: string }> = {};
          const saved = new Set<string>();
          myPreds.forEach((p: any) => {
            existing[p.match_id] = { home: String(p.home_score), away: String(p.away_score) };
            saved.add(p.match_id);
          });
          setScores(existing);
          setSavedMatches(saved);
        }

        // Load leaderboard from all predictions
        const { data: allPreds } = await supabase
          .from('bolao_predictions')
          .select('user_id, points_earned')
          .eq('round_number', 28);

        if (allPreds && allPreds.length > 0) {
          // Aggregate points by user
          const pointsByUser = new Map<string, number>();
          allPreds.forEach((p: any) => {
            pointsByUser.set(p.user_id, (pointsByUser.get(p.user_id) || 0) + (p.points_earned || 0));
          });

          const userIds = Array.from(pointsByUser.keys());
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, username')
            .in('user_id', userIds);

          const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

          const entries = userIds
            .map((uid) => {
              const profile = profileMap.get(uid);
              return {
                userId: uid,
                name: profile?.full_name || profile?.username || 'Jogador',
                points: pointsByUser.get(uid) || 0,
                isYou: uid === user.id,
              };
            })
            .sort((a, b) => b.points - a.points)
            .map((entry, i) => ({
              pos: i + 1,
              name: entry.isYou ? 'Você' : entry.name,
              points: entry.points,
              isYou: entry.isYou,
              icon: i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : undefined,
            }));

          setLeaderboard(entries);
        }
      } catch (err) {
        console.error('Erro ao carregar bolão:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn, user]);

  const handleConfirmPalpites = async () => {
    if (!isLoggedIn || !user) {
      toast('Faça login para confirmar palpites');
      navigate('/auth');
      return;
    }

    // Validate all matches have scores
    const incomplete = roundMatches.filter(
      (m) => !scores[m.id]?.home || !scores[m.id]?.away || scores[m.id].home === '' || scores[m.id].away === ''
    );
    if (incomplete.length > 0) {
      toast.error('Preencha todos os palpites', {
        description: `Faltam ${incomplete.length} jogo(s) sem palpite.`,
      });
      return;
    }

    setSaving(true);
    try {
      const predictions = roundMatches.map((m) => ({
        user_id: user.id,
        round_number: 28,
        match_id: m.id,
        home_team: m.home,
        away_team: m.away,
        home_score: parseInt(scores[m.id].home),
        away_score: parseInt(scores[m.id].away),
      }));

      const { error } = await supabase
        .from('bolao_predictions')
        .upsert(predictions, { onConflict: 'user_id,round_number,match_id' });

      if (error) throw error;

      setSavedMatches(new Set(roundMatches.map((m) => m.id)));
      toast.success('Palpites confirmados!', {
        description: 'Seus palpites da rodada 28 foram salvos com sucesso.',
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar palpites', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const setScore = (id: string, side: 'home' | 'away', val: string) => {
    setScores((prev) => ({
      ...prev,
      [id]: { ...prev[id], [side]: val },
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('https://selecaobet.com/bolao/liga/abc123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: BolaoTab; label: string }[] = [
    { id: 'lobby', label: 'Classificação' },
    { id: 'palpites', label: 'Palpites' },
    { id: 'criar', label: 'Criar Liga' },
  ];

  return (
    <div className="pb-20 px-4 pt-2 space-y-4">
      <h1 className="font-display text-xl font-extrabold flex items-center gap-2">
        <Trophy size={22} className="text-primary" /> Bolão
      </h1>

      {/* Tabs */}
      <div className="flex bg-surface-section rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-body font-semibold transition-colors min-h-[44px] ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'lobby' && (
        <div className="space-y-4">
          {/* Grand Prize */}
          <div className="bg-accent rounded-2xl p-5 text-center space-y-2">
            <Trophy size={32} className="text-primary" />
            <h3 className="font-display text-lg font-bold">Grande Prêmio</h3>
            <p className="font-display text-2xl font-extrabold text-gradient-gold">SUV 0km</p>
            <p className="text-xs font-body text-muted-foreground">Para o 1º lugar da classificação geral</p>
          </div>

          {/* Scoring explanation */}
          <div className="bg-surface-card rounded-xl p-4 space-y-2">
            <h4 className="font-body font-semibold text-sm">Sistema de Pontos</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-body">
              <div className="bg-surface-interactive rounded-lg p-2 text-center">
                <p className="font-display text-lg font-bold text-primary">10</p>
                <p className="text-muted-foreground">Placar exato</p>
              </div>
              <div className="bg-surface-interactive rounded-lg p-2 text-center">
                <p className="font-display text-lg font-bold text-secondary">5</p>
                <p className="text-muted-foreground">Resultado certo</p>
              </div>
              <div className="bg-surface-interactive rounded-lg p-2 text-center">
                <p className="font-display text-lg font-bold text-muted-foreground">3</p>
                <p className="text-muted-foreground">Gols de 1 time</p>
              </div>
              <div className="bg-surface-interactive rounded-lg p-2 text-center">
                <p className="font-display text-lg font-bold text-muted-foreground">0</p>
                <p className="text-muted-foreground">Errado</p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="bg-surface-card rounded-xl p-5 text-center">
              <p className="font-display text-sm font-bold text-foreground">Nenhum participante ainda</p>
              <p className="text-xs font-body text-muted-foreground mt-1">Confirme seus palpites para aparecer na classificação!</p>
            </div>
          ) : (
          <div className="space-y-1">
            {leaderboard.map((entry) => (
              <div
                key={entry.pos}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  entry.isYou ? 'bg-primary/10' : 'bg-surface-card'
                }`}
              >
                <span className={`w-7 text-center font-display font-bold text-sm ${
                  entry.pos <= 3 ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {entry.pos}
                </span>
                {entry.icon && <entry.icon size={16} className="text-primary" />}
                <span className={`flex-1 font-body text-sm font-medium ${entry.isYou ? 'text-primary font-bold' : ''}`}>
                  {entry.name}
                </span>
                <span className="font-display font-bold text-sm">{entry.points} pts</span>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {tab === 'palpites' && (
        <div className="space-y-4">
          <p className="text-sm font-body text-muted-foreground">Rodada 28 — Brasileirão Série A</p>
          <div className="space-y-3">
            {roundMatches.map((match) => (
              <div key={match.id} className={`rounded-xl p-4 space-y-3 ${savedMatches.has(match.id) ? 'bg-secondary/10 ring-1 ring-secondary/30' : 'bg-surface-card'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] text-muted-foreground font-body uppercase tracking-wider">
                    {match.date}
                  </span>
                  {savedMatches.has(match.id) && (
                    <span className="text-[0.6rem] font-display font-bold text-secondary flex items-center gap-1">
                      <Check size={12} /> Salvo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-right">
                    <span className="font-body font-semibold text-sm">{match.home}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={scores[match.id]?.home ?? ''}
                      onChange={(e) => setScore(match.id, 'home', e.target.value)}
                      className="w-12 h-12 bg-surface-interactive rounded-lg text-center font-display text-xl font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                      placeholder="-"
                    />
                    <span className="text-muted-foreground font-display">×</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={scores[match.id]?.away ?? ''}
                      onChange={(e) => setScore(match.id, 'away', e.target.value)}
                      className="w-12 h-12 bg-surface-interactive rounded-lg text-center font-display text-xl font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                      placeholder="-"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="font-body font-semibold text-sm">{match.away}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirmPalpites}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Confirmar Palpites'}
          </motion.button>
        </div>
      )}

      {tab === 'criar' && (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Nome da Liga</label>
              <input
                type="text"
                placeholder="Ex: Liga dos Amigos"
                className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Senha (opcional)</label>
              <input
                type="password"
                placeholder="Deixe vazio para liga pública"
                className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Modo de Pontuação</label>
              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-primary-foreground font-body font-semibold text-sm py-3 rounded-xl min-h-[44px]">
                  Clássica
                </button>
                <button className="flex-1 bg-surface-interactive text-muted-foreground font-body font-semibold text-sm py-3 rounded-xl min-h-[44px]">
                  Expert
                </button>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all"
          >
            Criar Liga
          </motion.button>

          <div className="bg-surface-card rounded-xl p-4 space-y-3">
            <h4 className="font-body font-semibold text-sm flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Link de Convite
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-interactive rounded-lg py-2.5 px-3 text-xs font-body text-muted-foreground truncate">
                selecaobet.com/bolao/liga/abc123
              </div>
              <button onClick={handleCopy} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-primary-foreground rounded-lg">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BolaoPage;
