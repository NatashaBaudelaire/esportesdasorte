import { useState } from 'react';
import { Search as SearchIcon, Mic, Clock, X } from 'lucide-react';
import { liveMatches, upcomingMatches } from '@/data/mockData';
import MatchCard from '@/components/MatchCard';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const allMatches = [...liveMatches, ...upcomingMatches];
  const filtered = query
    ? allMatches.filter(
        (m) =>
          m.homeTeam.toLowerCase().includes(query.toLowerCase()) ||
          m.awayTeam.toLowerCase().includes(query.toLowerCase()) ||
          m.league.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const recentSearches = ['Flamengo', 'Premier League', 'Champions League', 'Neymar'];

  return (
    <div className="space-y-4 pb-20 px-4 pt-2">
      <div className="relative">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar times, competições, jogadores..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-surface-card rounded-xl py-3 pl-10 pr-20 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button onClick={() => setQuery('')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
              <X size={16} />
            </button>
          )}
          <button className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-primary">
            <Mic size={18} />
          </button>
        </div>
      </div>

      {!query && (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-bold flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            Buscas Recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="bg-surface-interactive rounded-full px-4 py-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-body">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
          </p>
          {filtered.map((match) => (
            <MatchCard key={match.id} {...match} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
