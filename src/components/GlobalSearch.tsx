import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, Mic, MicOff, Clock, X, Flame, Trophy, Users, Filter,
  ChevronDown, ArrowLeft
} from 'lucide-react';
import { liveMatches, upcomingMatches, boostedMatches, competitions, playerProps } from '@/data/mockData';
import { useSearchStore } from '@/store/searchStore';
import { useBetSlipStore } from '@/store/betSlipStore';
import MatchCard from '@/components/MatchCard';

const allSearchableMatches = [...liveMatches, ...boostedMatches, ...upcomingMatches];

const suggestions = [
  'Flamengo vs Palmeiras', 'Champions League', 'Brasileirão', 'Premier League',
  'NBA', 'UFC', 'La Liga', 'Copa do Brasil', 'Corinthians', 'Real Madrid',
  'Barcelona', 'Liverpool', 'Odds Turbinadas', 'Gabigol', 'Endrick',
];

type FilterType = 'todos' | 'ao-vivo' | 'competicoes' | 'jogadores';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const { recentSearches, addRecent, removeRecent, clearRecent } = useSearchStore();
  const addBet = useBetSlipStore((s) => s.addBet);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setActiveFilter('todos');
      setIsListening(false);
    }
  }, [isOpen]);

  // Filter matches
  const filteredMatches = query.length >= 2
    ? allSearchableMatches.filter((m) => {
        const q = query.toLowerCase();
        const matchesQuery =
          m.homeTeam.toLowerCase().includes(q) ||
          m.awayTeam.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q);
        if (!matchesQuery) return false;
        if (activeFilter === 'ao-vivo') return 'isLive' in m && m.isLive;
        return true;
      })
    : [];

  // Filter competitions
  const filteredCompetitions = query.length >= 2
    ? competitions.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  // Filter players
  const filteredPlayers = query.length >= 2
    ? playerProps.filter((p) =>
        p.player.toLowerCase().includes(query.toLowerCase()) ||
        p.team.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Auto-suggestions
  const autoSuggestions = query.length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  const handleSearch = (term: string) => {
    setQuery(term);
    if (term.trim()) addRecent(term.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) addRecent(query.trim());
  };

  // Voice search
  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (event.results[0].isFinal) {
        addRecent(transcript);
        setIsListening(false);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, addRecent]);

  const hasResults = filteredMatches.length > 0 || filteredCompetitions.length > 0 || filteredPlayers.length > 0;
  const showSuggestions = query.length >= 1 && autoSuggestions.length > 0 && !hasResults;

  const filters: { id: FilterType; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'ao-vivo', label: 'Ao Vivo' },
    { id: 'competicoes', label: 'Competições' },
    { id: 'jogadores', label: 'Jogadores' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background px-4 pt-3 pb-2 space-y-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="flex-1 relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar times, ligas, jogadores..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-surface-card rounded-xl py-2.5 pl-9 pr-16 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                  {query && (
                    <button type="button" onClick={() => setQuery('')} className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-muted-foreground">
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                      isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
              </div>
            </form>

            {/* Filters (post-search) */}
            {query.length >= 2 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-display font-bold min-h-[32px] transition-colors ${
                      activeFilter === f.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-interactive text-muted-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-20 space-y-4">
            {/* Voice listening indicator */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 py-6">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-1 h-4 bg-primary rounded-full"
                    />
                  ))}
                </div>
                <span className="text-sm font-body text-muted-foreground ml-2">Ouvindo...</span>
              </div>
            )}

            {/* Recent searches (no query) */}
            {!query && recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    Buscas recentes
                  </h3>
                  <button onClick={clearRecent} className="text-xs font-body text-primary">
                    Limpar
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((s) => (
                    <div key={s} className="flex items-center justify-between">
                      <button
                        onClick={() => handleSearch(s)}
                        className="flex items-center gap-3 py-2.5 text-sm font-body text-foreground min-h-[44px] flex-1 text-left"
                      >
                        <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                        {s}
                      </button>
                      <button
                        onClick={() => removeRecent(s)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending when no query */}
            {!query && (
              <div className="space-y-3">
                <h3 className="font-display text-sm font-bold flex items-center gap-2">
                  <Flame size={14} className="text-destructive" />
                  Em alta
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Flamengo', 'Champions League', 'UFC 310', 'NBA', 'Brasileirão'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSearch(t)}
                      className="bg-surface-card rounded-full px-3.5 py-2 text-xs font-body font-medium text-foreground hover:bg-surface-interactive transition-colors min-h-[36px]"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-suggestions */}
            {showSuggestions && (
              <div className="space-y-1">
                {autoSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="w-full flex items-center gap-3 py-2.5 text-sm font-body text-foreground min-h-[44px] text-left"
                  >
                    <SearchIcon size={14} className="text-muted-foreground flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{
                      __html: s.replace(new RegExp(`(${query})`, 'gi'), '<strong class="text-primary">$1</strong>')
                    }} />
                  </button>
                ))}
              </div>
            )}

            {/* Results */}
            {query.length >= 2 && (
              <>
                {/* Matches */}
                {(activeFilter === 'todos' || activeFilter === 'ao-vivo') && filteredMatches.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Jogos ({filteredMatches.length})
                    </h3>
                    {filteredMatches.map((match) => (
                      <MatchCard key={match.id} {...match} />
                    ))}
                  </div>
                )}

                {/* Competitions */}
                {(activeFilter === 'todos' || activeFilter === 'competicoes') && filteredCompetitions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Competições ({filteredCompetitions.length})
                    </h3>
                    {filteredCompetitions.map((c) => (
                      <button
                        key={c.id}
                        className="w-full flex items-center gap-3 bg-surface-card rounded-xl px-4 py-3 min-h-[52px]"
                      >
                        <img src={c.flag} alt="" className="w-6 h-4 rounded-sm object-cover" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-display font-bold text-foreground">{c.name}</p>
                          <p className="text-[0.6rem] font-body text-muted-foreground">{c.country} · {c.matchCount} jogos</p>
                        </div>
                        <Trophy size={14} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Players */}
                {(activeFilter === 'todos' || activeFilter === 'jogadores') && filteredPlayers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Jogadores ({filteredPlayers.length})
                    </h3>
                    {filteredPlayers.map((p) => (
                      <motion.button
                        key={p.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => addBet({
                          id: p.id,
                          match: `${p.player} — ${p.team}`,
                          market: p.market,
                          selection: p.player,
                          odds: p.odds,
                        })}
                        className="w-full flex items-center gap-3 bg-surface-card rounded-xl px-4 py-3 min-h-[52px]"
                      >
                        <Users size={16} className="text-muted-foreground" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-display font-bold text-foreground">{p.player}</p>
                          <p className="text-[0.6rem] font-body text-muted-foreground">{p.team} · {p.market}</p>
                        </div>
                        <span className="font-display text-sm font-bold text-primary">{p.odds.toFixed(2)}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {!hasResults && autoSuggestions.length === 0 && (
                  <div className="text-center py-12">
                    <SearchIcon size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-display text-sm font-bold text-muted-foreground">Nenhum resultado para "{query}"</p>
                    <p className="text-xs font-body text-muted-foreground mt-1">Tente buscar por outro termo</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
