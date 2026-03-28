import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import bannerBrasil from '@/assets/banner-brasil.jpg';
import bannerHexa from '@/assets/banner-hexa.jpg';
import bannerOdds from '@/assets/banner-odds.jpg';
import bannerBonus from '@/assets/banner-bonus.jpg';
import bannerLiga from '@/assets/banner-liga.jpg';
import MatchCard from '@/components/MatchCard';
import SportFilter from '@/components/SportFilter';
import VisitorBanner from '@/components/VisitorBanner';
import { liveMatches, boostedMatches, upcomingMatches, popularMultiples, playerProps, heroBanners, competitions, specials, oddsByCategory } from '@/data/mockData';
import { useBetSlipStore } from '@/store/betSlipStore';
import { useAuthStore } from '@/store/authStore';
import { Flame, ChevronRight, Trophy, Gift, Zap, User, Calendar, Target, Scale, CreditCard, CornerDownRight, Award, Star, LayoutGrid } from 'lucide-react';
import { PageTransition, SectionReveal, staggerContainer, staggerItem } from '@/components/animations';
import QuickAccessRow from '@/components/home/QuickAccessRow';
import BettingTipsSection from '@/components/home/BettingTipsSection';
import PopularTournamentsSection from '@/components/home/PopularTournamentsSection';
import GoalReplaysSection from '@/components/home/GoalReplaysSection';
import MultiCreatorBanner from '@/components/home/MultiCreatorBanner';
import LiveInPlaySection from '@/components/home/LiveInPlaySection';
import NewsSection from '@/components/home/NewsSection';
import SuperSocialCTA from '@/components/home/SuperSocialCTA';

const SectionTitle = ({ children, icon, action, actionRoute }: { children: React.ReactNode; icon?: React.ReactNode; action?: string; actionRoute?: string }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      className="flex items-center justify-between mb-3"
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="font-display text-lg font-bold flex items-center gap-2">
        {icon}
        {children}
      </h2>
      {action && (
        <button
          onClick={() => actionRoute && navigate(actionRoute)}
          className="text-xs text-primary font-body font-semibold flex items-center gap-0.5 min-h-[44px]"
        >
          {action} <ChevronRight size={14} />
        </button>
      )}
    </motion.div>
  );
};

/* ───────── Hero Carousel ───────── */
const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  const bannerImages: Record<string, string> = {
    Brasil: bannerBrasil,
    Hexa: bannerHexa,
    Ofertas: bannerOdds,
    Cadastro: bannerBonus,
    Liga: bannerLiga,
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mx-4">
      <div className="relative h-48 sm:h-56">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroBanners[current].id}
            initial={{ opacity: 0, scale: 1.05, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -40 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <img
              src={bannerImages[heroBanners[current].accent] || bannerBrasil}
              alt={heroBanners[current].title}
              className="w-full h-full object-cover"
              width={960}
              height={512}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[0.6rem] font-body font-semibold text-primary uppercase tracking-widest"
              >
                {heroBanners[current].accent}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-2xl font-extrabold leading-tight mt-1"
              >
                {heroBanners[current].title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs font-body text-foreground/80 mt-1"
              >
                {heroBanners[current].subtitle}
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate((heroBanners[current] as any).route || '/esportes')}
                className="mt-3 bg-primary text-primary-foreground font-display font-bold text-sm px-5 py-2.5 rounded-lg min-h-[44px] hover:brightness-110 transition-all animate-glow-pulse"
              >
                {heroBanners[current].cta}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground/10">
        <motion.div
          key={current}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 4, ease: 'linear' }}
          className="h-full bg-primary origin-left"
        />
      </div>
      {/* Dots */}
      <div className="absolute bottom-2 right-4 flex gap-1.5">
        {heroBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-primary w-5' : 'bg-foreground/30 w-2'}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ───────── Player Props Carousel ───────── */
const cardGradients = [
  'from-[hsl(345,40%,25%)] to-[hsl(345,50%,15%)]',
  'from-[hsl(220,50%,30%)] to-[hsl(220,60%,18%)]',
  'from-[hsl(280,40%,25%)] to-[hsl(280,50%,15%)]',
  'from-[hsl(30,50%,25%)] to-[hsl(30,60%,15%)]',
  'from-[hsl(160,40%,22%)] to-[hsl(160,50%,12%)]',
];

const PlayerPropsCarousel = () => {
  const addBet = useBetSlipStore((s) => s.addBet);

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
      {playerProps.map((p, i) => (
        <motion.button
          key={p.id}
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -4 }}
          onClick={() =>
            addBet({ id: p.id, match: p.team, market: p.market, selection: p.player, odds: p.odds })
          }
          className={`flex-shrink-0 w-[130px] rounded-xl overflow-hidden bg-gradient-to-b ${cardGradients[i % cardGradients.length]} relative card-shine`}
        >
          {/* Card top - number & position */}
          <div className="relative pt-2 px-3">
            <div className="flex justify-between items-start">
              <div className="text-left">
                <p className="font-display text-2xl font-extrabold text-primary leading-none">{p.number}</p>
                <p className="text-[0.55rem] font-display font-bold text-foreground/60 uppercase">{p.position}</p>
              </div>
              <p className="text-[0.5rem] font-body text-foreground/40 uppercase text-right leading-tight mt-1">{p.team}</p>
            </div>
          </div>

          {/* Player silhouette */}
          <div className="flex items-center justify-center py-3">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
              <User size={28} className="text-foreground/20" />
            </div>
          </div>

          {/* Player name bar */}
          <div className="bg-background/40 px-2 py-1.5">
            <p className="font-display text-[0.65rem] font-bold text-foreground truncate text-center uppercase tracking-wide">
              {p.player}
            </p>
          </div>

          {/* Market + Odds */}
          <div className="px-2 pt-1.5 pb-2 space-y-1.5">
            <p className="text-[0.5rem] font-body text-foreground/50 text-center leading-tight">{p.market}</p>
            <div className="bg-primary/15 rounded-lg py-1.5 text-center">
              <span className="font-display text-primary font-extrabold text-base">{p.odds.toFixed(2)}</span>
            </div>
          </div>

          {/* Shield border effect */}
          <div className="absolute inset-0 rounded-xl border border-foreground/10 pointer-events-none" />
        </motion.button>
      ))}
    </div>
  );
};

/* ───────── Main Home ───────── */
const HomePage = () => {
  const navigate = useNavigate();
  const addBet = useBetSlipStore((s) => s.addBet);
  const { isLoggedIn } = useAuthStore();

  return (
    <PageTransition>
    <div className="space-y-6 pb-20">
      {/* Visitor Banner */}
      {!isLoggedIn && <VisitorBanner />}

      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* Quick Access Row */}
      <QuickAccessRow />


      <SectionReveal delay={0.1}>
      <section className="px-4 space-y-3">
        {/* Super Odds Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-5 relative overflow-hidden animate-gradient-shift"
          style={{ background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 35%), hsl(43 80% 45%))' }}
        >
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-display text-2xl font-extrabold italic text-primary-foreground tracking-tight"
            >
              SUPER ODDS
            </motion.h2>
            <p className="text-sm font-body text-primary-foreground/80 mt-1">Maximize Ganhos Hoje!</p>
          </div>
          <button
            onClick={() => navigate('/esportes')}
            className="relative z-10 mt-3 bg-primary-foreground/20 text-primary-foreground text-xs font-body font-semibold px-4 py-2 rounded-full min-h-[36px] flex items-center gap-1 backdrop-blur-sm"
          >
            Ver tudo <ChevronRight size={14} />
          </button>
        </motion.div>

        {/* Boosted match cards - Superbet style */}
        <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {boostedMatches.map((match) => (
            <motion.div
              key={match.id}
              variants={staggerItem}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/evento/${match.id}`)}
              className="bg-surface-card rounded-2xl overflow-hidden cursor-pointer card-shine"
            >
              {/* Match header */}
              <div className="px-4 pt-4 pb-2 text-center space-y-1">
                <p className="text-[0.65rem] font-body text-muted-foreground">{match.league}</p>
                <p className="font-display text-base font-bold flex items-center justify-center gap-2">
                  <span>{match.homeTeam}</span>
                  <span>—</span>
                  <span>{match.awayTeam}</span>
                </p>
                <p className="text-xs font-display font-bold text-primary">{match.homeScore ?? 0} : {match.awayScore ?? 0}</p>
                <p className="text-xs font-body text-muted-foreground">{match.time}</p>
              </div>

              {/* Super Boost badge */}
              <div className="px-4 pt-2 pb-3">
                <span
                  className="inline-block font-display text-sm font-extrabold italic px-3 py-1 rounded-md"
                  style={{ background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 35%))', color: 'hsl(0 0% 7%)' }}
                >
                  SUPER BOOST
                </span>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    <span className="text-sm font-body text-foreground/80">Ambas as equipes marcam</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    <span className="text-sm font-body text-foreground/80">Mais de 2.5 gols na partida</span>
                  </div>
                </div>
              </div>

              {/* Odds bar */}
              <div className="px-4 pb-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    addBet({
                      id: `${match.id}-boost`,
                      match: `${match.homeTeam} vs ${match.awayTeam}`,
                      market: 'Super Boost',
                      selection: 'Ambas marcam + Over 2.5',
                      odds: match.oddsHome,
                    });
                  }}
                  className="w-full py-3.5 rounded-xl text-center border border-primary/30 bg-primary/5 min-h-[48px] transition-colors hover:bg-primary/10"
                >
                  <span className="text-muted-foreground font-display text-sm line-through mr-2">
                    {match.originalOddsHome?.toFixed(2)}
                  </span>
                  <span className="text-primary font-display text-lg font-extrabold">
                    {match.oddsHome.toFixed(2)}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
      </SectionReveal>

      <SectionReveal delay={0.15}>
      <section className="px-4">
        <SectionTitle icon={<Trophy size={20} className="text-primary" />} action="Ver Mais" actionRoute="/esportes">
          Múltiplas Populares
        </SectionTitle>
        <div className="space-y-3">
          {popularMultiples.map((multi) => (
            <div key={multi.id} className="bg-surface-card rounded-xl p-4 space-y-3 card-shine">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold">{multi.title}</h3>
                <span className="bg-secondary/20 text-secondary text-[0.65rem] font-display font-bold px-2 py-0.5 rounded-full">
                  {multi.bonus} Bônus
                </span>
              </div>
              <div className="space-y-2">
                {multi.picks.map((pick, i) => (
                  <div key={i} className="flex items-center justify-between text-sm font-body">
                    <div>
                      <span className="text-muted-foreground text-xs">{pick.match}</span>
                      <p className="font-medium">{pick.selection}</p>
                    </div>
                    <span className="font-display text-primary font-bold">{pick.odds.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[0.65rem] text-muted-foreground font-body">Odds totais</span>
                  <p className="font-display text-xl font-bold text-primary">{multi.totalOdds.toFixed(2)}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    multi.picks.forEach((pick, i) => {
                      addBet({
                        id: `${multi.id}-${i}`,
                        match: pick.match,
                        market: 'Múltipla',
                        selection: pick.selection,
                        odds: pick.odds,
                      });
                    });
                  }}
                  className="bg-primary text-primary-foreground font-display font-bold text-sm px-5 py-2.5 rounded-lg min-h-[44px] hover:brightness-110 transition-all"
                >
                  Adicionar ao Cupom
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </section>
      </SectionReveal>

      <SectionReveal delay={0.1}>
      <section>
        <div className="px-4">
          <SectionTitle icon={<User size={20} className="text-primary" />} action="Ver Todos" actionRoute="/esportes">
            Player Props
          </SectionTitle>
        </div>
        <PlayerPropsCarousel />
      </section>
      </SectionReveal>

      <SectionReveal>
      <section className="px-4">
        <SectionTitle icon={<Calendar size={20} className="text-primary" />} action="Ver Todos" actionRoute="/esportes">
          Próximos Jogos
        </SectionTitle>
        <motion.div className="bg-surface-card rounded-xl overflow-hidden" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center px-4 py-2 text-[0.6rem] font-body text-muted-foreground uppercase tracking-wider">
            <span>Partida</span>
            <span className="w-12 text-center">1</span>
            <span className="w-12 text-center">X</span>
            <span className="w-12 text-center">2</span>
          </div>
          {upcomingMatches.map((m, i) => (
            <div key={m.id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center px-4 py-3 ${i > 0 ? 'bg-surface-section' : ''}`}>
              <div>
                <p className="text-sm font-body font-semibold flex items-center gap-2 flex-wrap">
                  <span>{m.homeTeam}</span>
                  <span>vs</span>
                  <span>{m.awayTeam}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[0.6rem] font-body text-muted-foreground">{m.league}</span>
                  <span className="text-[0.6rem] font-body text-muted-foreground">{m.time}</span>
                </div>
                <p className="text-[0.65rem] font-display font-bold text-primary mt-1">{m.homeScore ?? 0} : {m.awayScore ?? 0}</p>
              </div>
              {[m.oddsHome, m.oddsDraw, m.oddsAway].map((odd, j) => (
                <motion.button
                  key={j}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() =>
                    addBet({
                      id: `${m.id}-${j}`,
                      match: `${m.homeTeam} vs ${m.awayTeam}`,
                      market: 'Resultado',
                      selection: j === 0 ? m.homeTeam : j === 1 ? 'Empate' : m.awayTeam,
                      odds: odd,
                    })
                  }
                  className="w-12 py-1.5 rounded-lg bg-surface-interactive text-center font-display text-sm font-bold text-primary min-h-[44px] flex items-center justify-center hover:bg-muted transition-colors"
                >
                  {odd.toFixed(2)}
                </motion.button>
              ))}
            </div>
          ))}
        </motion.div>
      </section>
      </SectionReveal>

      {/* Super Odds / Boosted section stays */}

      {/* Dicas de Aposta Populares */}
      <BettingTipsSection />

      {/* Torneios Populares */}
      <PopularTournamentsSection />

      {/* Replays de Gols */}
      <GoalReplaysSection />

      {/* Multi Criar Aposta */}
      <MultiCreatorBanner />

      {/* Em Jogo - Ao Vivo */}
      <LiveInPlaySection />

      <SectionReveal>
      <section className="px-4">
        <SectionTitle icon={<Star size={20} className="text-primary" />} action="Ver Todos" actionRoute="/esportes">
          Especiais
        </SectionTitle>
        <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {specials.map((spec) => (
            <motion.div key={spec.id} variants={staggerItem} className="bg-surface-card rounded-xl p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[0.6rem] font-display font-bold text-secondary bg-secondary/15 px-2 py-0.5 rounded-full">
                    {spec.market}
                  </span>
                  <h3 className="font-display text-sm font-bold mt-1.5">{spec.title}</h3>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.6rem] font-body text-muted-foreground">Favorito</p>
                  <p className="font-display text-sm font-bold">{spec.topPick}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold text-primary">{spec.topOdds.toFixed(2)}</p>
                  <p className="text-[0.6rem] font-body text-muted-foreground">{spec.options} opções</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={() =>
                  addBet({
                    id: spec.id,
                    match: spec.title,
                    market: spec.market,
                    selection: spec.topPick,
                    odds: spec.topOdds,
                  })
                }
                className="w-full bg-surface-interactive text-foreground font-display font-bold text-sm py-2.5 rounded-xl min-h-[44px] hover:bg-muted transition-colors"
              >
                Apostar
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </section>
      </SectionReveal>


      {/* Notícias */}
      <NewsSection />

      {/* Social CTA */}
      <SuperSocialCTA />
    </div>
    </PageTransition>
  );
};

export default HomePage;
