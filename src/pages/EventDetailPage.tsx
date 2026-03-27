import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Clock, ChevronDown, ChevronUp, Shield, Radio } from 'lucide-react';
import OddsChip from '@/components/OddsChip';
import LiveBadge from '@/components/LiveBadge';
import { liveMatches, boostedMatches, upcomingMatches } from '@/data/mockData';

const teamFlags: Record<string, string> = {
  'Flamengo': 'https://flagcdn.com/w80/br.png',
  'Palmeiras': 'https://flagcdn.com/w80/br.png',
  'Corinthians': 'https://flagcdn.com/w80/br.png',
  'São Paulo': 'https://flagcdn.com/w80/br.png',
  'Real Madrid': 'https://flagcdn.com/w80/es.png',
  'Barcelona': 'https://flagcdn.com/w80/es.png',
  'Juventus': 'https://flagcdn.com/w80/it.png',
  'Inter Milan': 'https://flagcdn.com/w80/it.png',
  'Liverpool': 'https://flagcdn.com/w80/gb-eng.png',
  'Man City': 'https://flagcdn.com/w80/gb-eng.png',
  'PSG': 'https://flagcdn.com/w80/fr.png',
  'Bayern Munich': 'https://flagcdn.com/w80/de.png',
  'Athletico-PR': 'https://flagcdn.com/w80/br.png',
  'Coritiba': 'https://flagcdn.com/w80/br.png',
  'Grêmio': 'https://flagcdn.com/w80/br.png',
  'Internacional': 'https://flagcdn.com/w80/br.png',
  'Atlético-MG': 'https://flagcdn.com/w80/br.png',
  'Cruzeiro': 'https://flagcdn.com/w80/br.png',
  'Fluminense': 'https://flagcdn.com/w80/br.png',
  'Botafogo': 'https://flagcdn.com/w80/br.png',
  'Santos': 'https://flagcdn.com/w80/br.png',
  'Vasco': 'https://flagcdn.com/w80/br.png',
  'Brasil': 'https://flagcdn.com/w80/br.png',
  'Argentina': 'https://flagcdn.com/w80/ar.png',
  'França': 'https://flagcdn.com/w80/fr.png',
  'Arsenal': 'https://flagcdn.com/w80/gb-eng.png',
  'Chelsea': 'https://flagcdn.com/w80/gb-eng.png',
  'Imperatriz': 'https://flagcdn.com/w80/br.png',
  'Retrô': 'https://flagcdn.com/w80/br.png',
  'Rio Branco-ES': 'https://flagcdn.com/w80/br.png',
  'Vila Nova': 'https://flagcdn.com/w80/br.png',
  'Lakers': 'https://flagcdn.com/w80/us.png',
  'Warriors': 'https://flagcdn.com/w80/us.png',
};

const TeamBadge = ({ team }: { team: string }) => {
  const flag = teamFlags[team];
  return (
    <div className="w-12 h-12 rounded-full bg-surface-interactive flex items-center justify-center overflow-hidden">
      {flag ? (
        <img src={flag} alt={team} className="w-8 h-8 object-cover rounded-sm" />
      ) : (
        <Shield size={24} className="text-muted-foreground" />
      )}
    </div>
  );
};

const buildMarkets = (home: string, away: string, oddsHome: number, oddsDraw: number, oddsAway: number) => [
  {
    name: 'Resultado Final (1X2)',
    options: [
      { label: home, odds: oddsHome, id: 'ev-1x2-1' },
      { label: 'Empate', odds: oddsDraw, id: 'ev-1x2-x' },
      { label: away, odds: oddsAway, id: 'ev-1x2-2' },
    ],
  },
  {
    name: 'Ambos Marcam',
    options: [
      { label: 'Sim', odds: +(1 + Math.random()).toFixed(2), id: 'ev-btts-y' },
      { label: 'Não', odds: +(1.5 + Math.random()).toFixed(2), id: 'ev-btts-n' },
    ],
  },
  {
    name: 'Total de Gols (Mais/Menos)',
    options: [
      { label: 'Mais 1.5', odds: 1.30, id: 'ev-ou-o15' },
      { label: 'Menos 1.5', odds: 3.40, id: 'ev-ou-u15' },
      { label: 'Mais 2.5', odds: 1.75, id: 'ev-ou-o25' },
      { label: 'Menos 2.5', odds: 2.05, id: 'ev-ou-u25' },
      { label: 'Mais 3.5', odds: 2.60, id: 'ev-ou-o35' },
      { label: 'Menos 3.5', odds: 1.45, id: 'ev-ou-u35' },
    ],
  },
  {
    name: 'Handicap Asiático',
    options: [
      { label: `${home} -0.5`, odds: 1.80, id: 'ev-ah-h1' },
      { label: `${away} +0.5`, odds: 2.00, id: 'ev-ah-h2' },
      { label: `${home} -1.5`, odds: 3.10, id: 'ev-ah-h3' },
      { label: `${away} +1.5`, odds: 1.35, id: 'ev-ah-h4' },
    ],
  },
  {
    name: 'Próximo Gol',
    options: [
      { label: home, odds: 1.65, id: 'ev-ng-1' },
      { label: 'Nenhum', odds: 5.50, id: 'ev-ng-n' },
      { label: away, odds: 3.40, id: 'ev-ng-2' },
    ],
  },
  {
    name: 'Escanteios (Mais/Menos)',
    options: [
      { label: 'Mais 8.5', odds: 1.85, id: 'ev-co-o' },
      { label: 'Menos 8.5', odds: 1.95, id: 'ev-co-u' },
    ],
  },
  {
    name: 'Cartões (Mais/Menos)',
    options: [
      { label: 'Mais 3.5', odds: 1.70, id: 'ev-ca-o' },
      { label: 'Menos 3.5', odds: 2.10, id: 'ev-ca-u' },
    ],
  },
];

// Streaming matches from the StreamingSection component
const streamingMatches = [
  {
    id: 'str-1', homeTeam: 'Arsenal', awayTeam: 'Chelsea',
    homeScore: 1, awayScore: 1, time: "72'", league: 'Champions Feminina',
    isLive: true, oddsHome: 2.10, oddsDraw: 3.20, oddsAway: 3.50,
    channel: 'Disney+',
  },
  {
    id: 'str-2', homeTeam: 'Imperatriz', awayTeam: 'Retrô',
    homeScore: 0, awayScore: 0, time: "20'", league: 'Copa do Nordeste',
    isLive: true, oddsHome: 1.90, oddsDraw: 3.40, oddsAway: 4.20,
    channel: 'YouTube (CazéTV)',
  },
  {
    id: 'str-3', homeTeam: 'Rio Branco-ES', awayTeam: 'Vila Nova',
    homeScore: 1, awayScore: 0, time: "10'", league: 'Copa Verde',
    isLive: true, oddsHome: 1.75, oddsDraw: 3.60, oddsAway: 4.80,
    channel: 'YouTube (GOAT)',
  },
];

const extraLiveMatches = [
  {
    id: 'live-4', homeTeam: 'Athletico-PR', awayTeam: 'Coritiba',
    homeScore: 1, awayScore: 0, time: "45'+2", league: 'Brasileirão Série A',
    isLive: true, oddsHome: 1.70, oddsDraw: 3.80, oddsAway: 4.60,
  },
  {
    id: 'live-5', homeTeam: 'Juventus', awayTeam: 'Inter Milan',
    homeScore: 2, awayScore: 2, time: "71'", league: 'Serie A',
    isLive: true, oddsHome: 3.20, oddsDraw: 2.90, oddsAway: 2.50,
  },
  {
    id: 'live-6', homeTeam: 'Lakers', awayTeam: 'Warriors',
    homeScore: 89, awayScore: 94, time: "Q3 4:22", league: 'NBA',
    isLive: true, oddsHome: 2.10, oddsDraw: 0, oddsAway: 1.75,
  },
];

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const allMatches = useMemo(() => [
    ...liveMatches,
    ...boostedMatches,
    ...upcomingMatches,
    ...streamingMatches,
    ...extraLiveMatches,
  ], []);

  const match = allMatches.find((m) => m.id === id);

  const [openMarkets, setOpenMarkets] = useState<Record<string, boolean>>({
    'Resultado Final (1X2)': true,
    'Ambos Marcam': true,
    'Total de Gols (Mais/Menos)': true,
  });

  const toggleMarket = (name: string) => {
    setOpenMarkets((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
        <Shield size={48} className="text-muted-foreground/30 mb-4" />
        <p className="font-display text-lg font-bold">Evento nao encontrado</p>
        <p className="text-sm text-muted-foreground font-body mt-1">Este evento pode ter sido encerrado.</p>
        <button onClick={() => navigate('/')} className="mt-4 bg-primary text-primary-foreground font-display font-bold text-sm px-5 py-2.5 rounded-lg min-h-[44px]">
          Voltar ao Inicio
        </button>
      </div>
    );
  }

  const home = match.homeTeam;
  const away = match.awayTeam;
  const isLive = 'isLive' in match && match.isLive;
  const homeScore = 'homeScore' in match ? (match as any).homeScore : undefined;
  const awayScore = 'awayScore' in match ? (match as any).awayScore : undefined;
  const time = 'time' in match ? match.time : undefined;
  const league = match.league;
  const channel = 'channel' in match ? (match as any).channel : null;
  const matchName = `${home} vs ${away}`;
  const markets = buildMarkets(home, away, match.oddsHome, match.oddsDraw, match.oddsAway);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-accent px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
          <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">{league}</span>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-center flex-1">
            <TeamBadge team={home} />
            <p className="font-body font-semibold text-sm mt-2">{home}</p>
          </div>
          <div className="text-center px-4">
            {isLive && homeScore !== undefined ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="font-display text-4xl font-extrabold text-primary">{homeScore}</span>
                  <span className="font-display text-2xl text-muted-foreground">:</span>
                  <span className="font-display text-4xl font-extrabold text-primary">{awayScore}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <LiveBadge />
                  <span className="text-xs font-body text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {time}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <p className="font-display text-lg font-bold text-primary">{time}</p>
                <p className="text-[0.6rem] font-body text-muted-foreground">Pre-jogo</p>
              </div>
            )}
          </div>
          <div className="text-center flex-1">
            <TeamBadge team={away} />
            <p className="font-body font-semibold text-sm mt-2">{away}</p>
          </div>
        </div>

        {/* Streaming button */}
        {isLive && (
          <button className="w-full bg-surface-interactive rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors min-h-[44px]">
            <Video size={18} className="text-destructive" />
            {channel ? `Assistir ao Vivo - ${channel}` : 'Assistir Transmissao ao Vivo'}
          </button>
        )}
      </div>

      {/* Markets accordion */}
      <div className="px-4 pt-4 space-y-2">
        {markets.map((market) => {
          if (market.options.some((o) => o.odds === 0)) return null;
          const isOpen = openMarkets[market.name] ?? false;
          return (
            <div key={market.name} className="bg-surface-card rounded-xl overflow-hidden">
              <button
                onClick={() => toggleMarket(market.name)}
                className="w-full flex items-center justify-between px-4 py-3 min-h-[44px]"
              >
                <span className="font-body font-semibold text-sm">{market.name}</span>
                {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 pb-3"
                >
                  <div className="flex flex-wrap gap-2">
                    {market.options.map((opt) => (
                      <OddsChip
                        key={opt.id}
                        odds={opt.odds}
                        label={opt.label}
                        betId={opt.id}
                        match={matchName}
                        market={market.name}
                        selection={opt.label}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventDetailPage;
