import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Radio, Tv, Bell, BellOff, X, Play, ChevronRight, Timer, Trophy } from 'lucide-react';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';
import OddsChip from '@/components/OddsChip';
import { toast } from 'sonner';

/* ────────────── Types ────────────── */
type SportTab = 'futebol' | 'nba' | 'tenis' | 'copa2026' | 'outros';
type PlatformFilter = 'all' | 'free' | 'subscription';

interface LiveEvent {
  id: string;
  sport: SportTab;
  home: string;
  away: string;
  homeScore: number | string;
  awayScore: number | string;
  league: string;
  minute: string;
  platform: string;
  platformType: 'free' | 'subscription';
  platformColor: string;
  oddsHome?: number;
  oddsDraw?: number;
  oddsAway?: number;
  hasStream: boolean;
}

interface CopaEvent {
  id: string;
  home: string;
  away: string;
  date: string;
  time: string;
  stadium: string;
  broadcast: string;
  broadcastType: 'free' | 'subscription';
  label?: string;
}

/* ────────────── Platform Colors ────────────── */
const platformColors: Record<string, string> = {
  'YouTube': 'hsl(0 72% 51%)',
  'YouTube (CazéTV)': 'hsl(0 72% 51%)',
  'YouTube (GOAT)': 'hsl(0 72% 51%)',
  'CazéTV': 'hsl(0 72% 51%)',
  'SBT': 'hsl(45 90% 50%)',
  'Disney+': 'hsl(220 80% 55%)',
  'ESPN': 'hsl(0 80% 45%)',
  'Premiere': 'hsl(140 60% 40%)',
  'Globoplay': 'hsl(0 70% 50%)',
  'SporTV': 'hsl(200 70% 45%)',
  'Amazon Prime': 'hsl(195 80% 45%)',
  'Max': 'hsl(260 70% 55%)',
  'FIFA+': 'hsl(220 60% 50%)',
  'TV Globo': 'hsl(210 70% 45%)',
  'Band': 'hsl(120 50% 40%)',
};

const getPlatformColor = (platform: string) => platformColors[platform] || 'hsl(0 0% 50%)';

const getPlatformButtonClass = (platform: string) => {
  if (platform.includes('YouTube') || platform.includes('CazéTV') || platform.includes('ESPN')) return 'bg-[hsl(0,72%,51%)] hover:bg-[hsl(0,72%,45%)]';
  if (platform.includes('Disney')) return 'bg-[hsl(220,80%,55%)] hover:bg-[hsl(220,80%,48%)]';
  if (platform.includes('Premiere') || platform.includes('Band')) return 'bg-[hsl(140,60%,40%)] hover:bg-[hsl(140,60%,34%)]';
  if (platform.includes('Amazon')) return 'bg-[hsl(195,80%,45%)] hover:bg-[hsl(195,80%,38%)]';
  if (platform.includes('Max')) return 'bg-[hsl(260,70%,55%)] hover:bg-[hsl(260,70%,48%)]';
  if (platform.includes('Globoplay') || platform.includes('SporTV') || platform.includes('Globo')) return 'bg-[hsl(0,70%,50%)] hover:bg-[hsl(0,70%,43%)]';
  return 'bg-muted hover:bg-muted/80';
};

/* ────────────── Real Data 24/03/2026 ────────────── */
const liveEvents: LiveEvent[] = [
  {
    id: 'lv-1', sport: 'futebol',
    home: 'Flamengo', away: 'Palmeiras',
    homeScore: 2, awayScore: 1,
    league: 'Brasileirão Série A', minute: "80'",
    platform: 'Premiere', platformType: 'subscription',
    platformColor: getPlatformColor('Premiere'),
    oddsHome: 1.55, oddsDraw: 4.20, oddsAway: 5.10,
    hasStream: true,
  },
  {
    id: 'lv-2', sport: 'futebol',
    home: 'Real Madrid', away: 'Barcelona',
    homeScore: 1, awayScore: 2,
    league: 'La Liga', minute: "65'",
    platform: 'Disney+', platformType: 'subscription',
    platformColor: getPlatformColor('Disney+'),
    oddsHome: 3.90, oddsDraw: 4.50, oddsAway: 1.40,
    hasStream: true,
  },
  {
    id: 'lv-3', sport: 'futebol',
    home: 'Arsenal', away: 'Chelsea',
    homeScore: 1, awayScore: 1,
    league: 'Champions Feminina', minute: "72'",
    platform: 'Disney+', platformType: 'subscription',
    platformColor: getPlatformColor('Disney+'),
    oddsHome: 2.40, oddsDraw: 3.30, oddsAway: 2.80,
    hasStream: true,
  },
  {
    id: 'lv-4', sport: 'futebol',
    home: 'Imperatriz', away: 'Retrô',
    homeScore: 0, awayScore: 0,
    league: 'Copa do Nordeste', minute: "20'",
    platform: 'YouTube (CazéTV)', platformType: 'free',
    platformColor: getPlatformColor('YouTube (CazéTV)'),
    oddsHome: 2.10, oddsDraw: 3.20, oddsAway: 3.40,
    hasStream: true,
  },
  {
    id: 'lv-5', sport: 'futebol',
    home: 'Rio Branco-ES', away: 'Vila Nova',
    homeScore: 1, awayScore: 0,
    league: 'Copa Verde', minute: "10'",
    platform: 'YouTube (GOAT)', platformType: 'free',
    platformColor: getPlatformColor('YouTube (GOAT)'),
    oddsHome: 1.90, oddsDraw: 3.50, oddsAway: 3.80,
    hasStream: true,
  },
  {
    id: 'lv-6', sport: 'futebol',
    home: 'Corinthians', away: 'São Paulo',
    homeScore: 0, awayScore: 0,
    league: 'Brasileirão Série A', minute: "23'",
    platform: 'Premiere', platformType: 'subscription',
    platformColor: getPlatformColor('Premiere'),
    oddsHome: 2.80, oddsDraw: 3.10, oddsAway: 2.60,
    hasStream: true,
  },
  {
    id: 'lv-7', sport: 'futebol',
    home: 'Juventus', away: 'Inter Milan',
    homeScore: 2, awayScore: 2,
    league: 'Serie A', minute: "71'",
    platform: 'ESPN', platformType: 'subscription',
    platformColor: getPlatformColor('ESPN'),
    oddsHome: 3.20, oddsDraw: 2.90, oddsAway: 2.50,
    hasStream: true,
  },
  {
    id: 'lv-8', sport: 'futebol',
    home: 'Athletico-PR', away: 'Coritiba',
    homeScore: 1, awayScore: 0,
    league: 'Brasileirão Série A', minute: "45'+2",
    platform: 'Premiere', platformType: 'subscription',
    platformColor: getPlatformColor('Premiere'),
    oddsHome: 1.70, oddsDraw: 3.80, oddsAway: 4.60,
    hasStream: true,
  },
  {
    id: 'lv-9', sport: 'nba',
    home: 'Lakers', away: 'Warriors',
    homeScore: 89, awayScore: 94,
    league: 'NBA', minute: '4Q 4:22',
    platform: 'Amazon Prime', platformType: 'subscription',
    platformColor: getPlatformColor('Amazon Prime'),
    oddsHome: 2.10, oddsAway: 1.75,
    hasStream: true,
  },
  {
    id: 'lv-10', sport: 'tenis',
    home: 'Daniel M. Aguilar', away: 'Max Houkes',
    homeScore: 1, awayScore: 1,
    league: 'ATP Challenger', minute: 'Set 3',
    platform: 'ESPN', platformType: 'subscription',
    platformColor: getPlatformColor('ESPN'),
    oddsHome: 1.78, oddsAway: 1.97,
    hasStream: true,
  },
];

const copaEvents: CopaEvent[] = [
  {
    id: 'copa-1', home: 'México', away: 'África do Sul',
    date: '11 de Junho', time: 'Abertura',
    stadium: 'Estádio Azteca', broadcast: 'TV Globo / SporTV',
    broadcastType: 'free', label: 'Abertura',
  },
  {
    id: 'copa-2', home: 'Brasil', away: 'Marrocos',
    date: '13 de Junho', time: '19:00 BRT',
    stadium: 'MetLife Stadium (NY)', broadcast: 'Globoplay / FIFA+',
    broadcastType: 'subscription', label: 'Estreia do Brasil',
  },
  {
    id: 'copa-3', home: 'Brasil', away: 'Haiti',
    date: '19 de Junho', time: '22:00 BRT',
    stadium: 'Filadélfia', broadcast: 'Globoplay / SporTV',
    broadcastType: 'subscription', label: '2a Rodada',
  },
  {
    id: 'copa-4', home: 'Escócia', away: 'Brasil',
    date: '24 de Junho', time: '19:00 BRT',
    stadium: 'Miami', broadcast: 'TV Globo / CazéTV',
    broadcastType: 'free', label: '3a Rodada',
  },
];

/* ────────────── Other Sports ────────────── */
const otherSports = [
  'Boxe', 'MMA / UFC', 'Futebol Americano', 'Hóquei no Gelo', 'Vôlei',
  'Fórmula 1', 'E-sports', 'Rugby', 'Corrida de Cavalos', 'Snooker',
  'Natação', 'Levantamento de Peso', 'Wrestling', 'Golfe', 'Surfe',
  'Dardo', 'Badminton', 'Tênis de Mesa', 'Ciclismo', 'Atletismo',
  'Ginástica', 'Esqui Alpino', 'Snowboard', 'Bobsled / Skeleton',
  'Polo Aquático', 'Esgrima', 'Tiro com Arco', 'Tiro Esportivo',
  'Remo', 'Corrida de Galgos', 'Boliche', 'Hóquei na Grama',
  'Triatlo', 'Handebol',
];

/* ────────────── Sport Tabs ────────────── */
const sportTabs: { id: SportTab; label: string; count?: number }[] = [
  { id: 'futebol', label: 'Futebol', count: 8 },
  { id: 'nba', label: 'NBA', count: 1 },
  { id: 'tenis', label: 'Tênis', count: 1 },
  { id: 'copa2026', label: 'Copa 2026' },
  { id: 'outros', label: 'Outros' },
];

const filterPills: { id: PlatformFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'free', label: 'Gratuitos' },
  { id: 'subscription', label: 'Assinatura' },
];

/* ────────────── Copa Countdown ────────────── */
const getDaysUntilCopa = () => {
  const target = new Date('2026-06-13T19:00:00-03:00');
  const now = new Date('2026-03-24T12:00:00-03:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/* ────────────── Component ────────────── */
const LivePage = () => {
  const [activeTab, setActiveTab] = useState<SportTab>('futebol');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [search, setSearch] = useState('');
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleReminder = (id: string, label: string) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast('Lembrete removido', { description: label });
      } else {
        next.add(id);
        toast('Lembrete adicionado!', { description: `Você será notificado antes de ${label}` });
      }
      return next;
    });
  };

  const filteredEvents = liveEvents.filter((e) => {
    if (activeTab !== 'outros' && e.sport !== activeTab) return false;
    if (platformFilter === 'free' && e.platformType !== 'free') return false;
    if (platformFilter === 'subscription' && e.platformType !== 'subscription') return false;
    if (search) {
      const q = search.toLowerCase();
      return e.home.toLowerCase().includes(q) || e.away.toLowerCase().includes(q) ||
        e.league.toLowerCase().includes(q) || e.platform.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredCopa = copaEvents.filter((m) => {
    if (platformFilter === 'free' && m.broadcastType !== 'free') return false;
    if (platformFilter === 'subscription' && m.broadcastType !== 'subscription') return false;
    if (search) {
      const q = search.toLowerCase();
      return m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q) ||
        m.broadcast.toLowerCase().includes(q);
    }
    return true;
  });

  const daysUntil = getDaysUntilCopa();

  return (
    <PageTransition>
      <div className="pb-20">
        {/* ── Hero Header ── */}
        <div className="relative px-4 pt-3 pb-4" style={{ background: 'linear-gradient(180deg, hsl(0 70% 20%) 0%, hsl(0 0% 7.1%) 100%)' }}>
          <div className="flex items-center justify-between">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-xl font-extrabold tracking-tight"
            >
              AO VIVO
            </motion.h1>
            <span className="text-[0.6rem] font-body text-muted-foreground">24/03/2026</span>
          </div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jogo, liga ou plataforma..."
              className="w-full bg-surface-card rounded-xl pl-9 pr-9 py-2.5 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[44px]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={16} />
              </button>
            )}
          </motion.div>

          {/* Sport Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-0.5 mt-3 overflow-x-auto scrollbar-none -mx-4 px-4"
          >
            {sportTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-4 py-2.5 text-xs font-display font-bold min-h-[40px] transition-colors relative flex items-center gap-1.5 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.count && (
                    <span className={`text-[0.55rem] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-destructive/20 text-destructive' : 'bg-surface-card text-muted-foreground'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="live-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Platform Filter Pills */}
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-2 mt-3">
            {filterPills.map((pill) => (
              <motion.button
                key={pill.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPlatformFilter(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-[0.65rem] font-display font-bold min-h-[32px] transition-colors ${
                  platformFilter === pill.id
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-surface-card text-muted-foreground'
                }`}
              >
                {pill.label}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* ── Copa 2026 Countdown Banner ── */}
        {activeTab !== 'outros' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-4 mt-4 rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(140 60% 15%) 0%, hsl(50 80% 20%) 50%, hsl(210 60% 15%) 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, hsl(50 100% 60%) 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={16} className="text-primary" />
                <span className="text-[0.6rem] font-display font-bold text-primary uppercase tracking-widest">Copa do Mundo 2026</span>
              </div>
              <p className="font-display text-base font-extrabold leading-tight">
                Faltam <span className="text-primary">{daysUntil} dias</span> para Brasil x Marrocos
              </p>
              <p className="text-xs font-body text-foreground/60 mt-1">MetLife Stadium, Nova York</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => window.open('https://www.plus.fifa.com/pt/?gl=br', '_blank')}
                className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display font-bold text-xs min-h-[40px] flex items-center gap-2"
              >
                <Play size={12} />
                Acompanhar no FIFA+
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Content ── */}
        <div className="px-4 mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'copa2026' ? (
              /* ── Copa 2026 Tab ── */
              <motion.div
                key="copa"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-primary" />
                  <h2 className="font-display text-sm font-extrabold uppercase tracking-wide">Jogos do Brasil</h2>
                </div>

                {filteredCopa.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8 font-body">Nenhum resultado</p>
                )}

                {filteredCopa.map((m) => (
                  <motion.div
                    key={m.id}
                    variants={staggerItem}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(26,26,26,0.75)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="p-4 space-y-3">
                      {m.label && (
                        <span className="inline-block text-[0.6rem] font-display font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {m.label}
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <span className="font-display text-base font-extrabold">{m.home}</span>
                        <span className="text-xs font-display text-muted-foreground">vs</span>
                        <span className="font-display text-base font-extrabold">{m.away}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                          <span>{m.date}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          <span>{m.time}</span>
                        </div>
                        <p className="text-xs font-body text-foreground/60">{m.stadium}</p>
                        <div className="flex items-center gap-2">
                          <Tv size={12} className="text-secondary" />
                          <span className="text-xs font-display font-semibold text-secondary">{m.broadcast}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleReminder(m.id, `${m.home} vs ${m.away}`)}
                          className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs min-h-[44px] flex items-center justify-center gap-2 transition-all ${
                            reminders.has(m.id)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface-interactive text-foreground'
                          }`}
                        >
                          {reminders.has(m.id) ? <BellOff size={14} /> : <Bell size={14} />}
                          {reminders.has(m.id) ? 'Lembrete Ativo' : 'Lembrete'}
                        </motion.button>
                        <span className={`px-3 py-2.5 rounded-xl text-[0.6rem] font-display font-bold min-h-[44px] flex items-center ${
                          m.broadcastType === 'free' ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                        }`}>
                          {m.broadcastType === 'free' ? 'Gratuito' : 'Assinatura'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : activeTab === 'outros' ? (
              /* ── Other Sports Tab ── */
              <motion.div
                key="outros"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2"
              >
                <h2 className="font-display text-sm font-extrabold uppercase tracking-wide mb-3">Todos os Esportes</h2>
                <div className="grid grid-cols-2 gap-2">
                  {otherSports.map((sport) => (
                    <motion.div
                      key={sport}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-xl p-3 flex items-center justify-between min-h-[44px] cursor-pointer transition-colors bg-surface-card hover:bg-surface-interactive"
                    >
                      <span className="text-xs font-display font-bold">{sport}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* ── Live Events ── */
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Radio size={16} className="text-destructive" />
                  <h2 className="font-display text-sm font-extrabold uppercase tracking-wide">Ao Vivo Popular</h2>
                  <span className="bg-destructive/15 text-destructive text-[0.55rem] font-display font-bold px-2 py-0.5 rounded-full">
                    {filteredEvents.length}
                  </span>
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Radio size={28} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground font-body">Nenhum evento ao vivo</p>
                  </div>
                )}

                <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
                  {filteredEvents.map((ev) => (
                    <LiveEventCard key={ev.id} event={ev} />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

/* ────────────── Live Event Card ────────────── */
const LiveEventCard = ({ event: ev }: { event: LiveEvent }) => {
  const matchName = `${ev.home} vs ${ev.away}`;
  const progressPercent = (() => {
    const m = parseInt(String(ev.minute));
    if (isNaN(m)) return 60;
    return Math.min((m / 90) * 100, 100);
  })();

  return (
    <motion.div
      variants={staggerItem}
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(26,26,26,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Header: League + LIVE */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[0.6rem] font-body text-muted-foreground uppercase tracking-wider">{ev.league}</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[0.55rem] font-display font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-live" />
          LIVE
        </span>
      </div>

      {/* Body: Teams + Score + Watch Button */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3">
          {/* Teams & Score */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold">{ev.home}</span>
              <span className="font-display text-xl font-extrabold">{ev.homeScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-foreground/70">{ev.away}</span>
              <span className="font-display text-xl font-extrabold text-foreground/70">{ev.awayScore}</span>
            </div>
          </div>

          {/* Watch Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl text-white font-display font-bold text-[0.55rem] min-h-[60px] min-w-[72px] transition-colors ${getPlatformButtonClass(ev.platform)}`}
          >
            <Play size={16} fill="white" />
            <span className="leading-none">ASSISTIR</span>
          </motion.button>
        </div>

        {/* Time + Progress */}
        <div className="flex items-center gap-2 mt-2">
          <Timer size={12} className="text-destructive" />
          <span className="text-[0.65rem] font-display font-bold text-destructive">{ev.minute}</span>
          <div className="flex-1 h-0.5 rounded-full bg-destructive/20">
            <motion.div
              className="h-full rounded-full bg-destructive"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <span
            className="text-[0.5rem] font-display font-bold px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `${ev.platformColor}20`,
              color: ev.platformColor,
            }}
          >
            {ev.platform}
          </span>
        </div>
      </div>

      {/* Footer: Discrete Odds */}
      {(ev.oddsHome || ev.oddsAway) && (
        <div className="px-4 py-2 flex items-center gap-3 border-t border-foreground/5">
          <span className="text-[0.5rem] font-body text-muted-foreground/60 uppercase tracking-wider">Odds</span>
          <div className="flex gap-2 flex-1">
            {ev.oddsHome && (
              <span className="text-[0.6rem] font-display font-semibold text-muted-foreground">
                1: {ev.oddsHome.toFixed(2)}
              </span>
            )}
            {ev.oddsDraw !== undefined && ev.oddsDraw > 0 && (
              <span className="text-[0.6rem] font-display font-semibold text-muted-foreground">
                X: {ev.oddsDraw.toFixed(2)}
              </span>
            )}
            {ev.oddsAway && (
              <span className="text-[0.6rem] font-display font-semibold text-muted-foreground">
                2: {ev.oddsAway.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LivePage;
