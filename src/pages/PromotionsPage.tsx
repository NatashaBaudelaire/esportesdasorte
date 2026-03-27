import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, RotateCcw, Trophy, ChevronRight, Clock, Bell, BellOff } from 'lucide-react';
import { PageTransition, SectionReveal, staggerContainer, staggerItem } from '@/components/animations';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

type PromoCategory = 'all' | 'freebet' | 'odds' | 'cashback' | 'bolao';

interface Promo {
  id: string;
  category: PromoCategory;
  title: string;
  description: string;
  value: string;
  badge: string;
  conditions: string;
  expiry: string;
  cta: string;
  icon: typeof Gift;
  gradient: string;
}

const promos: Promo[] = [
// Free Bets
{
  id: 'fb-1',
  category: 'freebet',
  title: 'Aposta Grátis Semanal',
  description: 'Receba até R$150 em apostas grátis toda semana ao fazer apostas qualificadas. Apenas os lucros líquidos podem ser sacados.',
  value: 'R$150',
  badge: 'Free Bet',
  conditions: 'Minimo de R$50 em apostas qualificadas na semana. Odds minimas de 1.50. Lucros sacaveis apos 1x rollover.',
  expiry: 'Renovacao semanal',
  cta: 'Participar',
  icon: Gift,
  gradient: 'from-[hsl(160,50%,25%)] to-[hsl(160,60%,12%)]'
},
{
  id: 'fb-2',
  category: 'freebet',
  title: 'Aposta Sem Risco',
  description: 'Sua primeira aposta e sem risco. Se perder, receba o valor de volta em creditos de aposta ate R$200.',
  value: 'R$200',
  badge: 'Sem Risco',
  conditions: 'Valido apenas para a primeira aposta. Odds minimas de 1.80. Credito devolvido em 24h.',
  expiry: 'Primeiro uso',
  cta: 'Usar Agora',
  icon: Gift,
  gradient: 'from-[hsl(200,50%,25%)] to-[hsl(200,60%,12%)]'
},
{
  id: 'fb-3',
  category: 'freebet',
  title: 'Indique e Ganhe',
  description: 'Convide amigos e ganhe R$30 em apostas gratis para cada amigo que se cadastrar e depositar.',
  value: 'R$30',
  badge: 'Indicacao',
  conditions: 'Amigo deve fazer deposito minimo de R$20. Sem limite de indicacoes. Credito liberado apos deposito do indicado.',
  expiry: 'Permanente',
  cta: 'Convidar',
  icon: Gift,
  gradient: 'from-[hsl(280,40%,25%)] to-[hsl(280,50%,12%)]'
},

// Odds Turbinadas
{
  id: 'odds-1',
  category: 'odds',
  title: 'Odds Turbinadas - Brasileirão',
  description: 'Cotações acima do mercado para os jogos da rodada do Brasileirão. Potencial de lucro aumentado em ate 40%.',
  value: '+40%',
  badge: 'Turbinada',
  conditions: 'Aposta maxima de R$100 por selecao turbinada. Disponivel ate 2h antes do jogo. Nao combinavel com multiplas.',
  expiry: 'Valido por rodada',
  cta: 'Ver Odds',
  icon: Zap,
  gradient: 'from-[hsl(43,80%,35%)] to-[hsl(35,90%,20%)]'
},
{
  id: 'odds-2',
  category: 'odds',
  title: 'Super Odds Champions League',
  description: 'Odds especiais para os jogos da Champions League. Seleções de goleador, resultado exato e mais.',
  value: '+35%',
  badge: 'Champions',
  conditions: 'Aposta maxima de R$50. Valido apenas para mercados selecionados. Uma aposta por usuario por jogo.',
  expiry: 'Dias de jogo',
  cta: 'Apostar',
  icon: Zap,
  gradient: 'from-[hsl(220,50%,30%)] to-[hsl(220,60%,15%)]'
},
{
  id: 'odds-3',
  category: 'odds',
  title: 'Boost Diário',
  description: 'Todo dia uma seleção de odds com boost especial em futebol, basquete e tênis. Lucre mais nos seus favoritos.',
  value: '+25%',
  badge: 'Diario',
  conditions: 'Uma aposta por dia. Odds minima original de 1.40. Aposta maxima de R$75.',
  expiry: 'Diario',
  cta: 'Ver Boost',
  icon: Zap,
  gradient: 'from-[hsl(0,50%,30%)] to-[hsl(0,60%,15%)]'
},

// Cashback
{
  id: 'cb-1',
  category: 'cashback',
  title: 'Cashback Semanal 10%',
  description: 'Receba 10% de cashback sobre suas perdas líquidas da semana, creditado toda segunda-feira.',
  value: '10%',
  badge: 'Cashback',
  conditions: 'Minimo de R$100 em apostas na semana. Cashback maximo de R$500. Rollover de 1x para saque.',
  expiry: 'Toda segunda',
  cta: 'Ativar',
  icon: RotateCcw,
  gradient: 'from-[hsl(170,50%,25%)] to-[hsl(170,60%,12%)]'
},
{
  id: 'cb-2',
  category: 'cashback',
  title: 'Cashback Ao Vivo 5%',
  description: 'Apostas ao vivo com 5% de cashback automático. Sem necessidade de ativação, creditado instantaneamente.',
  value: '5%',
  badge: 'Ao Vivo',
  conditions: 'Valido apenas para apostas ao vivo. Odds minimas de 1.50. Sem limite de cashback.',
  expiry: 'Permanente',
  cta: 'Apostar Ao Vivo',
  icon: RotateCcw,
  gradient: 'from-[hsl(30,50%,28%)] to-[hsl(30,60%,14%)]'
},

// Bolões e Torneios
{
  id: 'bolao-1',
  category: 'bolao',
  title: 'Bolão Brasileirão - R$25.000',
  description: 'De seus palpites nos jogos da rodada do Brasileirão e concorra a prêmios de até R$25 mil. Participação gratuita.',
  value: 'R$25.000',
  badge: 'Gratuito',
  conditions: 'Cadastro obrigatorio. Palpites ate 1h antes do primeiro jogo. Premiacao dividida entre acertadores.',
  expiry: 'Por rodada',
  cta: 'Participar',
  icon: Trophy,
  gradient: 'from-[hsl(43,70%,30%)] to-[hsl(43,80%,15%)]'
},
{
  id: 'bolao-2',
  category: 'bolao',
  title: 'Torneio Copa do Mundo 2026',
  description: 'Torneio especial de palpites para a Copa do Mundo. Acumule pontos durante todo o torneio e concorra ao grande prêmio.',
  value: 'R$100.000',
  badge: 'Especial',
  conditions: 'Taxa de inscricao de R$10. Pontuacao cumulativa. Top 100 premiados. Premio principal para o 1o lugar.',
  expiry: 'Jun-Jul 2026',
  cta: 'Inscrever-se',
  icon: Trophy,
  gradient: 'from-[hsl(140,50%,25%)] to-[hsl(140,60%,12%)]'
},
{
  id: 'bolao-3',
  category: 'bolao',
  title: 'Desafio Semanal',
  description: 'Acerte 5 resultados seguidos e ganhe R$500 em bonus. Novo desafio toda semana com jogos selecionados.',
  value: 'R$500',
  badge: 'Desafio',
  conditions: 'Gratuito. Deve acertar os 5 resultados exatos. Bonus com rollover de 3x.',
  expiry: 'Semanal',
  cta: 'Aceitar Desafio',
  icon: Trophy,
  gradient: 'from-[hsl(260,40%,28%)] to-[hsl(260,50%,14%)]'
}];


const categories = [
{ id: 'all' as PromoCategory, label: 'Todas', icon: Gift },
{ id: 'freebet' as PromoCategory, label: 'Apostas Gratis', icon: Gift },
{ id: 'odds' as PromoCategory, label: 'Odds Turbinadas', icon: Zap },
{ id: 'cashback' as PromoCategory, label: 'Cashback', icon: RotateCcw },
{ id: 'bolao' as PromoCategory, label: 'Boloes', icon: Trophy }];


const PromotionsPage = () => {
  const [active, setActive] = useState<PromoCategory>('all');
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const filtered = active === 'all' ? promos : promos.filter((p) => p.category === active);

  const toggleReminder = (id: string, title: string) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast('Lembrete removido', { description: title });
      } else {
        next.add(id);
        toast('Lembrete ativado!', { description: `Voce sera notificado sobre ${title}` });
      }
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else
      next.add(id);
      return next;
    });
  };

  const requireLogin = () => {
    toast('Faça login para continuar', {
      description: 'Entre na sua conta para usar promoções, participar e convidar amigos.'
    });
    navigate('/auth');
  };

  const shareInvite = async (title: string) => {
    const text = `Estou usando a SeleçãoBet! Bora participar comigo da promoção "${title}".`;
    const url = window.location.origin;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        toast('Convite aberto para compartilhar', {
          description: 'Escolha WhatsApp, Telegram, X ou outro app disponível no seu celular.'
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast('Convite copiado', {
          description: 'Cole no WhatsApp, Telegram, X ou Instagram para enviar.'
        });
        return;
      }

      toast('Não foi possível compartilhar agora', {
        description: 'Tente novamente em um navegador com suporte a compartilhamento.'
      });
    } catch {
      toast('Compartilhamento cancelado');
    }
  };

  const handlePromoCta = async (promo: Promo) => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    switch (promo.id) {
      case 'fb-1':
        toast('Como participar', {
          description: 'Faça R$50+ em apostas qualificadas na semana (odds mínimas 1.50) para liberar sua free bet.'
        });
        navigate('/esportes');
        return;
      case 'fb-2':
        toast('Como usar', {
          description: 'Faça sua 1ª aposta com odds mínimas 1.80; se perder, o crédito de volta cai em até 24h.'
        });
        navigate('/esportes');
        return;
      case 'fb-3':
        await shareInvite(promo.title);
        return;
      case 'odds-1':
      case 'odds-2':
      case 'odds-3':
        toast('Odds turbinadas abertas', {
          description: 'Escolha o mercado destacado e confirme sua aposta para usar as cotações especiais.'
        });
        navigate('/ao-vivo');
        return;
      case 'cb-1':
        toast('Cashback semanal ativo', {
          description: 'Acompanhe na carteira. O crédito é calculado e lançado na segunda-feira.'
        });
        navigate('/carteira');
        return;
      case 'cb-2':
        toast('Cashback ao vivo pronto', {
          description: 'Entre em Ao Vivo, aposte com odds mínimas de 1.50 e receba o cashback automático.'
        });
        navigate('/ao-vivo');
        return;
      case 'bolao-1':
      case 'bolao-2':
      case 'bolao-3':
        toast('Bolão liberado', {
          description: 'Abra o bolão, confirme seus palpites e finalize para entrar na rodada.'
        });
        navigate('/bolao');
        return;
      default:
        toast('Promoção selecionada', {
          description: 'Siga as regras da oferta e confirme sua participação.'
        });
    }
  };

  return (
    <PageTransition>
      <div className="pb-20">
        {/* Header */}
        <div
          className="relative px-4 pt-3 pb-5"
          style={{ background: 'linear-gradient(180deg, hsl(43 80% 20%) 0%, hsl(0 0% 7.1%) 100%)' }}>
          
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-extrabold tracking-tight">Bônus e Promoções


          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-body text-muted-foreground mt-1">
            
            Ofertas exclusivas para voce aproveitar
          </motion.p>

          {/* Category tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 mt-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            
            {categories.map((cat) => {
              const isActive = active === cat.id;
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActive(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-display font-bold min-h-[36px] transition-colors whitespace-nowrap ${
                  isActive ?
                  'bg-primary text-primary-foreground' :
                  'bg-surface-card text-muted-foreground'}`
                  }>
                  
                  <Icon size={14} />
                  {cat.label}
                </motion.button>);

            })}
          </motion.div>
        </div>

        {/* Promos list */}
        <div className="px-4 pt-4">
          <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="show">
            <AnimatePresence mode="popLayout">
              {filtered.map((promo) => {
                const Icon = promo.icon;
                const isExpanded = expanded.has(promo.id);

                return (
                  <motion.div
                    key={promo.id}
                    variants={staggerItem}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl overflow-hidden">
                    
                    {/* Card top gradient */}
                    <div className={`bg-gradient-to-br ${promo.gradient} p-4 relative card-shine`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/10 text-[0.6rem] font-display font-bold uppercase tracking-wider text-foreground/80">
                              <Icon size={10} />
                              {promo.badge}
                            </span>
                            <span className="text-[0.55rem] font-body text-foreground/50 flex items-center gap-1">
                              <Clock size={10} />
                              {promo.expiry}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-extrabold leading-tight">{promo.title}</h3>
                          <p className="text-xs font-body text-foreground/70 mt-1.5 leading-relaxed">{promo.description}</p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="font-display text-2xl font-extrabold text-primary">{promo.value}</p>
                        </div>
                      </div>
                    </div>

                    {/* Card bottom */}
                    <div className="bg-surface-card p-4 space-y-3">
                      {/* Conditions toggle */}
                      <button
                        onClick={() => toggleExpand(promo.id)}
                        className="flex items-center gap-1 text-[0.65rem] font-body text-muted-foreground hover:text-foreground transition-colors">
                        
                        {isExpanded ? 'Ocultar condições' : 'Ver condições'}
                        <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isExpanded &&
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          
                            <p className="text-[0.65rem] font-body text-muted-foreground leading-relaxed bg-surface-section rounded-lg p-3">
                              {promo.conditions}
                            </p>
                          </motion.div>
                        }
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => void handlePromoCta(promo)}
                          className="flex-1 bg-primary text-primary-foreground font-display font-bold text-sm py-2.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all">
                          
                          {promo.cta}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleReminder(promo.id, promo.title)}
                          className={`px-3 rounded-xl min-h-[44px] flex items-center justify-center transition-colors ${
                          reminders.has(promo.id) ?
                          'bg-primary/20 text-primary' :
                          'bg-surface-interactive text-muted-foreground'}`
                          }>
                          
                          {reminders.has(promo.id) ? <BellOff size={18} /> : <Bell size={18} />}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>);

              })}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 &&
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Gift size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-body">Nenhuma promocao nesta categoria</p>
            </motion.div>
          }
        </div>
      </div>
    </PageTransition>);

};

export default PromotionsPage;