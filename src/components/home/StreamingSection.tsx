import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Radio, Tv, Bell, BellOff, Filter, X } from 'lucide-react';
import { SectionReveal, staggerContainer, staggerItem } from '@/components/animations';
import { toast } from 'sonner';

type TabId = 'live' | 'copa2026';
type FilterId = 'all' | 'free' | 'subscription';

interface LiveMatch {
  id: string;
  home: string;
  away: string;
  league: string;
  minute: string;
  homeScore: number;
  awayScore: number;
  channel: string;
  channelType: 'free' | 'subscription';
  channelColor: string;
}

interface CopaMatch {
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

const liveNow: LiveMatch[] = [
  {
    id: 'str-1',
    home: 'Arsenal',
    away: 'Chelsea',
    league: 'Champions Feminina',
    minute: "72'",
    homeScore: 1,
    awayScore: 1,
    channel: 'Disney+',
    channelType: 'subscription',
    channelColor: 'hsl(220 80% 55%)',
  },
  {
    id: 'str-2',
    home: 'Imperatriz',
    away: 'Retro',
    league: 'Copa do Nordeste',
    minute: "20'",
    homeScore: 0,
    awayScore: 0,
    channel: 'YouTube (CazeTV)',
    channelType: 'free',
    channelColor: 'hsl(0 72% 51%)',
  },
  {
    id: 'str-3',
    home: 'Rio Branco-ES',
    away: 'Vila Nova',
    league: 'Copa Verde',
    minute: "10'",
    homeScore: 1,
    awayScore: 0,
    channel: 'YouTube (GOAT)',
    channelType: 'free',
    channelColor: 'hsl(0 72% 51%)',
  },
];

const copaMatches: CopaMatch[] = [
  {
    id: 'copa-1',
    home: 'Mexico',
    away: 'Africa do Sul',
    date: '11 de Junho',
    time: 'Abertura',
    stadium: 'Estadio Azteca',
    broadcast: 'TV Globo / SporTV',
    broadcastType: 'free',
    label: 'Abertura',
  },
  {
    id: 'copa-2',
    home: 'Brasil',
    away: 'Marrocos',
    date: '13 de Junho',
    time: '19:00 BRT',
    stadium: 'MetLife Stadium (NY)',
    broadcast: 'Globoplay / FIFA+',
    broadcastType: 'subscription',
    label: 'Estreia do Brasil',
  },
  {
    id: 'copa-3',
    home: 'Brasil',
    away: 'Haiti',
    date: '19 de Junho',
    time: '22:00 BRT',
    stadium: 'Filadelfia',
    broadcast: 'Globoplay / SporTV',
    broadcastType: 'subscription',
    label: '2a Rodada',
  },
  {
    id: 'copa-4',
    home: 'Escocia',
    away: 'Brasil',
    date: '24 de Junho',
    time: '19:00 BRT',
    stadium: 'Miami',
    broadcast: 'TV Globo / CazeTV',
    broadcastType: 'free',
    label: '3a Rodada',
  },
];

const StreamingSection = () => {
  const [tab, setTab] = useState<TabId>('live');
  const [filter, setFilter] = useState<FilterId>('all');
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
        toast('Lembrete adicionado!', { description: `Voce sera notificado antes de ${label}` });
      }
      return next;
    });
  };

  const filteredLive = liveNow.filter((m) => {
    if (filter === 'free' && m.channelType !== 'free') return false;
    if (filter === 'subscription' && m.channelType !== 'subscription') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.home.toLowerCase().includes(q) ||
        m.away.toLowerCase().includes(q) ||
        m.league.toLowerCase().includes(q) ||
        m.channel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredCopa = copaMatches.filter((m) => {
    if (filter === 'free' && m.broadcastType !== 'free') return false;
    if (filter === 'subscription' && m.broadcastType !== 'subscription') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.home.toLowerCase().includes(q) ||
        m.away.toLowerCase().includes(q) ||
        m.stadium.toLowerCase().includes(q) ||
        m.broadcast.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SectionReveal>
      <section className="px-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Tv size={20} className="text-secondary" />
          <h2 className="font-display text-lg font-bold">Streaming Esportivo</h2>
          <span className="ml-auto text-[0.6rem] font-body text-muted-foreground">24/03/2026</span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogo, liga ou canal..."
            className="w-full bg-surface-card rounded-xl pl-9 pr-9 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[44px]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-card rounded-xl p-1">
          {[
            { id: 'live' as TabId, label: 'Ao Vivo Agora', icon: Radio },
            { id: 'copa2026' as TabId, label: 'Copa do Mundo 2026', icon: Tv },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-display font-bold min-h-[40px] transition-all ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {[
            { id: 'all' as FilterId, label: 'Todos' },
            { id: 'free' as FilterId, label: 'Gratuito' },
            { id: 'subscription' as FilterId, label: 'Assinatura' },
          ].map((f) => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-body font-semibold min-h-[32px] transition-colors ${
                filter === f.id
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-surface-card text-muted-foreground'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'live' ? (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {filteredLive.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8 font-body">Nenhum resultado encontrado</p>
              )}
              {filteredLive.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 space-y-3 relative overflow-hidden"
                  style={{
                    background: 'rgba(var(--glass-bg-raw, 26,26,26), 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid hsl(0 0% 100% / 0.06)',
                  }}
                >
                  {/* Live badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[0.6rem] font-display font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-live" />
                        LIVE
                      </span>
                      <span className="text-[0.6rem] font-body text-muted-foreground">{m.league}</span>
                    </div>
                    <span
                      className="text-[0.6rem] font-display font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${m.channelColor}20`,
                        color: m.channelColor,
                      }}
                    >
                      {m.channel}
                    </span>
                  </div>

                  {/* Scoreboard */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold">{m.home}</span>
                        <span className="font-display text-lg font-extrabold text-foreground">{m.homeScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold text-foreground/70">{m.away}</span>
                        <span className="font-display text-lg font-extrabold text-foreground/70">{m.awayScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Time + progress */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-display font-bold text-destructive">{m.minute}</span>
                    <div className="flex-1 h-1 rounded-full bg-destructive/20">
                      <motion.div
                        className="h-full rounded-full bg-destructive"
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min(parseInt(m.minute) / 90 * 100, 100)}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <span className="text-[0.55rem] font-body text-muted-foreground">
                      {m.channelType === 'free' ? 'Gratuito' : 'Assinatura'}
                    </span>
                  </div>

                  {/* Watch button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive font-display font-bold text-sm min-h-[44px] flex items-center justify-center gap-2 transition-colors hover:bg-destructive/20"
                  >
                    <Radio size={14} className="animate-pulse" />
                    Assistir Agora
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="copa"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {filteredCopa.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8 font-body">Nenhum resultado encontrado</p>
              )}
              {filteredCopa.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 space-y-3 relative overflow-hidden"
                  style={{
                    background: 'rgba(var(--glass-bg-raw, 26,26,26), 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid hsl(0 0% 100% / 0.06)',
                  }}
                >
                  {/* Label */}
                  {m.label && (
                    <span className="inline-block text-[0.6rem] font-display font-bold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {m.label}
                    </span>
                  )}

                  {/* Teams */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-base font-extrabold">{m.home}</span>
                      <span className="text-xs font-display text-muted-foreground">vs</span>
                      <span className="font-display text-base font-extrabold">{m.away}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleReminder(m.id, `${m.home} vs ${m.away}`)}
                      className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm min-h-[44px] flex items-center justify-center gap-2 transition-all ${
                        reminders.has(m.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface-interactive text-foreground'
                      }`}
                    >
                      {reminders.has(m.id) ? <BellOff size={14} /> : <Bell size={14} />}
                      {reminders.has(m.id) ? 'Lembrete Ativo' : 'Adicionar Lembrete'}
                    </motion.button>
                    <span
                      className={`px-3 py-2.5 rounded-xl text-[0.6rem] font-display font-bold min-h-[44px] flex items-center ${
                        m.broadcastType === 'free'
                          ? 'bg-secondary/15 text-secondary'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {m.broadcastType === 'free' ? 'Gratuito' : 'Assinatura'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </SectionReveal>
  );
};

export default StreamingSection;
