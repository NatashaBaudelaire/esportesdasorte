import { motion } from 'framer-motion';
import { Play, ChevronRight, ExternalLink } from 'lucide-react';
import { SectionReveal } from '@/components/animations';

const replays = [
  {
    id: 'r-1',
    match: 'Nigéria x RD do Congo',
    phase: 'Final',
    image: 'https://cdn.plus.fifa.com/images/public/cms/6f/49/b8/57/6f49b857-bff4-4fb9-88e2-9479cf55cb0e.jpg',
    url: 'https://www.plus.fifa.com/pt/content/nigeria-vs-congo-dr/166c83f5-cd60-4ec4-8501-c649c51b16e5',
  },
  {
    id: 'r-2',
    match: 'Camarões x RD do Congo',
    phase: 'Semifinais',
    image: 'https://cdn.plus.fifa.com/images/public/cms/f1/ea/12/b0/f1ea12b0-00ac-41f8-9fb6-08866f57c400.jpg',
    url: 'https://www.plus.fifa.com/pt/content/cameroon-v-congo-dr-fifa-world-cup-26tm-caf-qualifiers/504d29cd-c957-4fcd-83e6-ddb1bc528006',
  },
  {
    id: 'r-3',
    match: 'Nigéria x Gabão',
    phase: 'Semifinais',
    image: 'https://cdn.plus.fifa.com/images/public/cms/11/67/7c/7c/11677c7c-6e96-48d3-a5e5-ddbc18f8390c.jpg',
    url: 'https://www.plus.fifa.com/pt/content/nigeria-v-gabon-fifa-world-cup-26tm-caf-qualifiers/eb2fdd78-58d2-4531-82ec-e21884d20f8a',
  },
  {
    id: 'r-4',
    match: 'Senegal x Mauritânia',
    phase: 'Grupo B',
    image: 'https://cdn.plus.fifa.com/images/public/cms/c3/18/a1/b6/c318a1b6-b751-469d-8ef6-09d0783a60f9.jpg',
    url: 'https://www.plus.fifa.com/pt/content/senegal-x-mauritania-eliminatorias-caf-da-copa-do-mundo-da-fifa-26tm-2025/2ac5bb95-ba2b-42ac-b72f-5b543a5f07bf',
  },
  {
    id: 'r-5',
    match: 'Marrocos x Congo',
    phase: 'Grupo E',
    image: 'https://cdn.plus.fifa.com/images/public/cms/05/b3/9c/e2/05b39ce2-29be-4e85-a535-ac801f54d3c3.jpg',
    url: 'https://www.plus.fifa.com/pt/content/marrocos-x-congo-eliminatorias-caf-da-copa-do-mundo-da-fifa-26tm-2025/80a96216-7890-483d-bdad-98e0a90d108c',
  },
  {
    id: 'r-6',
    match: 'Costa do Marfim x Quênia',
    phase: 'Grupo F',
    image: 'https://cdn.plus.fifa.com/images/public/cms/f8/b5/49/d6/f8b549d6-c1a3-45cb-9b13-ba1b91d5613b.jpg',
    url: 'https://www.plus.fifa.com/pt/content/costa-do-marfim-x-quenia-eliminatorias-caf-da-copa-do-mundo-da-fifa-26tm-2025/919f980f-e81c-401f-be98-e92cf8020771',
  },
  {
    id: 'r-7',
    match: 'Gabão x Burundi',
    phase: 'Grupo F',
    image: 'https://cdn.plus.fifa.com/images/public/cms/34/7e/da/18/347eda18-2d8e-4505-a370-aa6275aa832f.jpg',
    url: 'https://www.plus.fifa.com/pt/content/gabao-x-burundi-eliminatorias-caf-da-copa-do-mundo-da-fifa-26tm-2025/f2c0176d-6306-4836-a931-5985844f1e61',
  },
  {
    id: 'r-8',
    match: 'RD do Congo x Sudão',
    phase: 'Grupo B',
    image: 'https://cdn.plus.fifa.com/images/public/cms/98/64/a9/a1/9864a9a1-011a-4367-810a-4986d427ccec.jpg',
    url: 'https://www.plus.fifa.com/pt/content/rd-do-congo-x-sudao-eliminatorias-caf-da-copa-do-mundo-da-fifa-26tm-2025/3f604331-e478-4247-af4a-2d453681dc06',
  },
];

const GoalReplaysSection = () => {
  const duplicated = [...replays, ...replays];

  return (
    <SectionReveal>
      <section className="px-4">
        <motion.div
          className="flex items-center justify-between mb-3"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Play size={20} className="text-secondary" fill="currentColor" />
              </motion.span>
              Replays - Eliminatórias
            </h2>
            <p className="text-[0.55rem] font-body text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Ao vivo · Copa do Mundo FIFA 26 · CAF
            </p>
          </div>
          <motion.a
            href="https://www.plus.fifa.com/pt/showcase/caf-jogos-completo/0d22d573-83e7-413c-bb8a-05d8283ae491?gl=br"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 3 }}
            className="text-xs text-primary font-body font-semibold flex items-center gap-0.5 min-h-[44px]"
          >
            FIFA+ <ExternalLink size={12} />
          </motion.a>
        </motion.div>

        <div className="overflow-hidden -mx-4">
          <motion.div
            className="flex gap-3 px-4 w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ x: { duration: 50, repeat: Infinity, ease: 'linear' } }}
          >
          {duplicated.map((r, i) => (
            <motion.a
              key={`${r.id}-${i}`}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex-shrink-0 w-[240px] bg-surface-card rounded-xl overflow-hidden text-left group card-shine"
            >
              <div className="relative h-[135px] overflow-hidden">
                <motion.img
                  src={r.image}
                  alt={r.match}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-12 h-12 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary/80 transition-colors"
                    whileHover={{ scale: 1.15 }}
                    animate={{ boxShadow: ['0 0 0px hsl(var(--primary) / 0)', '0 0 20px hsl(var(--primary) / 0.4)', '0 0 0px hsl(var(--primary) / 0)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play size={20} className="text-foreground" fill="currentColor" />
                  </motion.div>
                </div>
                <motion.span
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 + 0.3 }}
                  className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[0.5rem] font-display font-bold px-1.5 py-0.5 rounded"
                >
                  REPLAY
                </motion.span>
              </div>
              <div className="p-3">
                <p className="font-display text-sm font-bold group-hover:text-primary transition-colors duration-200">{r.match}</p>
                <p className="text-[0.6rem] font-body text-muted-foreground mt-0.5">{r.phase} · Eliminatórias CAF</p>
              </div>
            </motion.a>
          ))}
          </motion.div>
        </div>
      </section>
    </SectionReveal>
  );
};

export default GoalReplaysSection;
