import { motion } from 'framer-motion';
import { Radio, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBetSlipStore } from '@/store/betSlipStore';
import LiveBadge from '@/components/LiveBadge';
import { SectionReveal, staggerContainer, staggerItem } from '@/components/animations';

const inPlayMatches = [
  {
    id: 'ip-1',
    sport: 'Futebol',
    country: 'Brasil',
    league: 'Brasileirão Série A',
    time: "80'",
    period: '1ºT',
    home: 'Flamengo',
    away: 'Palmeiras',
    homeScore: 2,
    awayScore: 1,
    oddsHome: 1.55,
    oddsDraw: 4.20,
    oddsAway: 5.10,
    extraMarkets: 120,
  },
  {
    id: 'ip-2',
    sport: 'Futebol',
    country: 'Espanha',
    league: 'La Liga',
    time: "65'",
    period: '2ºT',
    home: 'Real Madrid',
    away: 'Barcelona',
    homeScore: 1,
    awayScore: 2,
    oddsHome: 3.90,
    oddsDraw: 4.50,
    oddsAway: 1.40,
    extraMarkets: 145,
  },
  {
    id: 'ip-3',
    sport: 'Futebol',
    country: 'Europa',
    league: 'Champions Feminina',
    time: "72'",
    period: '2ºT',
    home: 'Arsenal',
    away: 'Chelsea',
    homeScore: 1,
    awayScore: 1,
    oddsHome: 2.40,
    oddsDraw: 3.30,
    oddsAway: 2.80,
    extraMarkets: 68,
  },
  {
    id: 'ip-4',
    sport: 'Futebol',
    country: 'Brasil',
    league: 'Copa do Nordeste',
    time: "20'",
    period: '1ºT',
    home: 'Imperatriz',
    away: 'Retrô',
    homeScore: 0,
    awayScore: 0,
    oddsHome: 2.10,
    oddsDraw: 3.20,
    oddsAway: 3.40,
    extraMarkets: 42,
  },
  {
    id: 'ip-5',
    sport: 'Futebol',
    country: 'Brasil',
    league: 'Brasileirão Série A',
    time: "23'",
    period: '1ºT',
    home: 'Corinthians',
    away: 'São Paulo',
    homeScore: 0,
    awayScore: 0,
    oddsHome: 2.80,
    oddsDraw: 3.10,
    oddsAway: 2.60,
    extraMarkets: 110,
  },
  {
    id: 'ip-6',
    sport: 'Futebol',
    country: 'Itália',
    league: 'Serie A',
    time: "71'",
    period: '2ºT',
    home: 'Juventus',
    away: 'Inter Milan',
    homeScore: 2,
    awayScore: 2,
    oddsHome: 3.20,
    oddsDraw: 2.90,
    oddsAway: 2.50,
    extraMarkets: 95,
  },
  {
    id: 'ip-7',
    sport: 'Futebol',
    country: 'Brasil',
    league: 'Brasileirão Série A',
    time: "45'+2",
    period: 'INT',
    home: 'Athletico-PR',
    away: 'Coritiba',
    homeScore: 1,
    awayScore: 0,
    oddsHome: 1.70,
    oddsDraw: 3.80,
    oddsAway: 4.60,
    extraMarkets: 78,
  },
  {
    id: 'ip-8',
    sport: 'Futebol',
    country: 'Brasil',
    league: 'Copa Verde',
    time: "10'",
    period: '1ºT',
    home: 'Rio Branco-ES',
    away: 'Vila Nova',
    homeScore: 1,
    awayScore: 0,
    oddsHome: 1.90,
    oddsDraw: 3.50,
    oddsAway: 3.80,
    extraMarkets: 35,
  },
];

const LiveInPlaySection = () => {
  const navigate = useNavigate();
  const addBet = useBetSlipStore((s) => s.addBet);

  return (
    <SectionReveal>
      <section className="px-4">
        <motion.div
          className="flex items-center gap-2 mb-3"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Radio size={20} className="text-secondary" />
          <h2 className="font-display text-lg font-bold">EM JOGO</h2>
          <LiveBadge />
          <button
            onClick={() => navigate('/ao-vivo')}
            className="ml-auto text-xs text-secondary font-display font-bold min-h-[44px] flex items-center"
          >
            {inPlayMatches.length * 70} Eventos
          </button>
        </motion.div>

        <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {inPlayMatches.map((m) => (
            <motion.div
              key={m.id}
              variants={staggerItem}
              className="bg-surface-card rounded-xl p-4 space-y-3"
            >
              <p className="text-[0.6rem] font-body text-muted-foreground">
                {m.sport} • {m.country} • {m.league}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-display font-bold text-secondary">{m.time}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-[0.6rem] font-body text-secondary">{m.period}</span>
                <span className="ml-auto text-[0.6rem] font-body text-muted-foreground">{m.period}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold">{m.home}</span>
                  <span className="font-display text-sm font-bold">{m.homeScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-foreground/80">{m.away}</span>
                  <span className="font-body text-sm text-foreground/80">{m.awayScore}</span>
                </div>
                <div className="h-0.5 rounded-full bg-secondary/30 mt-1">
                  <div className="h-full rounded-full bg-secondary" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { label: '1', odds: m.oddsHome },
                  { label: 'X', odds: m.oddsDraw },
                  { label: '2', odds: m.oddsAway },
                ].map((o) => (
                  <motion.button
                    key={o.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      addBet({
                        id: `${m.id}-${o.label}`,
                        match: `${m.home} vs ${m.away}`,
                        market: 'Resultado',
                        selection: o.label === '1' ? m.home : o.label === 'X' ? 'Empate' : m.away,
                        odds: o.odds,
                      })
                    }
                    className="flex-1 bg-surface-interactive rounded-lg py-2.5 flex items-center justify-between px-3 min-h-[44px]"
                  >
                    <span className="text-xs font-body text-muted-foreground">{o.label}</span>
                    <span className="font-display text-sm font-bold text-primary">{o.odds.toFixed(2)}</span>
                  </motion.button>
                ))}
                <span className="text-[0.6rem] font-body text-muted-foreground">+{m.extraMarkets}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </SectionReveal>
  );
};

export default LiveInPlaySection;
