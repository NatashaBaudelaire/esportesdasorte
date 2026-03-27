import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Video, TrendingUp, Gift, Headphones, Zap, Crown, Star, Lock, Unlock, ExternalLink, Play, X } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '',
    highlight: false,
    features: [
      { icon: Video, text: 'Streaming limitado', included: true },
      { icon: TrendingUp, text: 'Odds padrão', included: true },
      { icon: Headphones, text: 'Suporte normal', included: true },
      { icon: Zap, text: 'Boost de odds', included: false },
      { icon: Gift, text: 'Bônus exclusivos', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 29,90',
    period: '/mês',
    highlight: true,
    badge: 'Mais Popular',
    features: [
      { icon: Video, text: 'Streaming ilimitado', included: true },
      { icon: TrendingUp, text: '+5% Boost de odds', included: true },
      { icon: Headphones, text: 'Suporte prioritário', included: true },
      { icon: Gift, text: 'Bônus mensais', included: true },
      { icon: Zap, text: 'Cash Out antecipado', included: true },
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 'R$ 79,90',
    period: '/mês',
    highlight: false,
    features: [
      { icon: Video, text: 'Streaming ilimitado + 4K', included: true },
      { icon: TrendingUp, text: '+15% Boost de odds', included: true },
      { icon: Headphones, text: 'Suporte dedicado 24/7', included: true },
      { icon: Gift, text: 'Bônus VIP exclusivos', included: true },
      { icon: Zap, text: 'Todos os recursos Premium', included: true },
    ],
  },
];

interface StreamingPlatform {
  name: string;
  type: 'paid' | 'free';
  color: string;
  description: string;
  url: string;
}

const streamingPlatforms: StreamingPlatform[] = [
  { name: 'HBO Max', type: 'paid', color: 'hsl(var(--primary))', description: 'Esportes, séries e filmes premium', url: 'https://www.hbomax.com/br/pt/sports' },
  { name: 'Premiere', type: 'paid', color: 'hsl(var(--primary))', description: 'Futebol ao vivo e exclusivos', url: 'https://www.hbomax.com/br/pt/sports' },
  { name: 'Disney+', type: 'paid', color: 'hsl(var(--primary))', description: 'Conteúdo Disney + esportes', url: 'https://www.disneyplus.com/pt-br?gclsrc=aw.ds&cid=DSS-Search-Google-11533092612-&s_kwcid=AL!8468!3!798582264428!b!!g!!174457321395-10102181&gad_source=1&gad_campaignid=11533092612&gclid=Cj0KCQjw1ZjOBhCmARIsADDuFTB0kngezc6FrKUvKw7vRACkDLIURO2Nzp9VrZ_5ZCZ98R0c32UGwFcaArnPEALw_wcB' },
  { name: 'CazeTV', type: 'free', color: 'hsl(var(--secondary))', description: 'Esports e gaming ao vivo', url: 'https://www.youtube.com/@CazeTV' },
  { name: 'Goat', type: 'free', color: 'hsl(var(--secondary))', description: 'Análises e conteúdo de esportes', url: 'https://www.youtube.com/@canalgoatbr' },
  { name: 'TV Aberta', type: 'free', color: 'hsl(var(--secondary))', description: 'SBT, Globo, Record e Band', url: '#' },
];

const PlansPage = () => {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="pb-20 px-4 pt-2 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-2xl font-extrabold">Planos & Assinatura</h1>
        <p className="text-sm font-body text-muted-foreground">Desbloqueie recursos exclusivos e turbine suas apostas</p>
      </div>

      {/* Comparison table toggle */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowTable(!showTable)}
        className="w-full flex items-center justify-center gap-2 bg-surface-card rounded-xl py-3 text-sm font-display font-bold text-foreground min-h-[44px]"
      >
        {showTable ? <X size={16} /> : <Star size={16} className="text-primary" />}
        {showTable ? 'Fechar Comparação' : 'Ver Tabela Comparativa'}
      </motion.button>

      {/* Comparison table */}
      <AnimatePresence>
        {showTable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-card rounded-2xl overflow-hidden">
              <table className="w-full text-xs font-body">
                <thead>
                  <tr className="border-b border-muted/20">
                    <th className="text-left p-3 text-muted-foreground font-semibold">Recurso</th>
                    <th className="p-3 text-muted-foreground font-semibold">Grátis</th>
                    <th className="p-3 text-primary font-bold">Premium</th>
                    <th className="p-3 text-muted-foreground font-semibold">VIP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted/10">
                    <td className="p-3 flex items-center gap-1.5"><Video size={12} className="text-primary" /> Streaming</td>
                    <td className="p-3 text-center text-muted-foreground">Limitado</td>
                    <td className="p-3 text-center text-primary font-semibold">Ilimitado</td>
                    <td className="p-3 text-center font-semibold">4K</td>
                  </tr>
                  <tr className="border-b border-muted/10">
                    <td className="p-3 flex items-center gap-1.5"><TrendingUp size={12} className="text-primary" /> Boost Odds</td>
                    <td className="p-3 text-center text-muted-foreground">—</td>
                    <td className="p-3 text-center text-primary font-semibold">+5%</td>
                    <td className="p-3 text-center font-semibold">+15%</td>
                  </tr>
                  <tr className="border-b border-muted/10">
                    <td className="p-3 flex items-center gap-1.5"><Headphones size={12} className="text-primary" /> Suporte</td>
                    <td className="p-3 text-center text-muted-foreground">Normal</td>
                    <td className="p-3 text-center text-primary font-semibold">Prioritário</td>
                    <td className="p-3 text-center font-semibold">24/7</td>
                  </tr>
                  <tr className="border-b border-muted/10">
                    <td className="p-3 flex items-center gap-1.5"><Gift size={12} className="text-primary" /> Bônus</td>
                    <td className="p-3 text-center text-muted-foreground">—</td>
                    <td className="p-3 text-center text-primary font-semibold">Mensais</td>
                    <td className="p-3 text-center font-semibold">Exclusivos</td>
                  </tr>
                  <tr>
                    <td className="p-3 flex items-center gap-1.5"><Zap size={12} className="text-primary" /> Cash Out</td>
                    <td className="p-3 text-center text-muted-foreground">—</td>
                    <td className="p-3 text-center"><Check size={14} className="text-secondary mx-auto" /></td>
                    <td className="p-3 text-center"><Check size={14} className="text-secondary mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan cards */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.01 }}
            className={`rounded-2xl p-5 space-y-4 relative ${
              plan.highlight ? 'bg-accent ring-2 ring-primary' : 'bg-surface-card'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[0.65rem] font-display font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Crown size={10} />
                {plan.badge}
              </span>
            )}
            <div className="text-center pt-1">
              <h3 className="font-display text-lg font-bold">{plan.name}</h3>
              <div className="mt-1">
                <span className="font-display text-3xl font-extrabold text-gradient-gold">{plan.price}</span>
                <span className="text-sm font-body text-muted-foreground">{plan.period}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {plan.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    feat.included ? 'bg-secondary/20' : 'bg-surface-interactive'
                  }`}>
                    {feat.included ? (
                      <Check size={12} className="text-secondary" />
                    ) : (
                      <span className="text-[0.5rem] text-muted-foreground">—</span>
                    )}
                  </div>
                  <feat.icon size={16} className={feat.included ? 'text-primary' : 'text-muted-foreground/40'} />
                  <span className={`text-sm font-body ${feat.included ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              className={`w-full font-display font-bold text-sm py-3 rounded-xl min-h-[44px] transition-all ${
                plan.highlight
                  ? 'bg-primary text-primary-foreground hover:brightness-110'
                  : 'bg-surface-interactive text-foreground hover:bg-muted'
              }`}
            >
              {plan.id === 'free' ? 'Plano Atual' : 'Assinar Agora'}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Streaming Platforms */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold">Plataformas de Streaming</h2>
        <p className="text-xs font-body text-muted-foreground">Assista aos melhores jogos nas plataformas parceiras</p>

        <div className="space-y-2">
          {streamingPlatforms.map((platform) => (
            <a key={platform.name} href={platform.url} target="_blank" rel="noopener noreferrer" className="bg-surface-card rounded-xl p-4 flex items-center gap-3 active:opacity-80 transition-opacity">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                platform.type === 'free' ? 'bg-secondary/15' : 'bg-primary/15'
              }`}>
                <Play size={18} className={platform.type === 'free' ? 'text-secondary' : 'text-primary'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm">{platform.name}</span>
                  {platform.type === 'free' ? (
                    <span className="flex items-center gap-0.5 text-[0.6rem] font-display font-bold text-secondary bg-secondary/15 px-1.5 py-0.5 rounded-full">
                      <Unlock size={8} />
                      GRÁTIS
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[0.6rem] font-display font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
                      <Lock size={8} />
                      PAGO
                    </span>
                  )}
                </div>
                
              </div>
              <ExternalLink size={16} className="text-muted-foreground shrink-0" />
            </a>
          ))}
        </div>
      </div>

      <p className="text-[0.6rem] text-muted-foreground font-body text-center">
        Renovação automática. Cancele a qualquer momento nas configurações da conta.
      </p>
    </div>
  );
};

export default PlansPage;
