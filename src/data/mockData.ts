export const liveMatches = [
  {
    id: 'live-1',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    homeScore: 2,
    awayScore: 1,
    time: "2ºT 67'",
    league: 'Brasileirão Série A',
    isLive: true,
    oddsHome: 1.55,
    oddsDraw: 4.20,
    oddsAway: 5.10,
  },
  {
    id: 'live-2',
    homeTeam: 'Corinthians',
    awayTeam: 'São Paulo',
    homeScore: 0,
    awayScore: 0,
    time: "1ºT 23'",
    league: 'Brasileirão Série A',
    isLive: true,
    oddsHome: 2.80,
    oddsDraw: 3.10,
    oddsAway: 2.60,
  },
  {
    id: 'live-3',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 1,
    awayScore: 2,
    time: "2ºT 82'",
    league: 'La Liga',
    isLive: true,
    oddsHome: 3.90,
    oddsDraw: 4.50,
    oddsAway: 1.40,
  },
];

export const boostedMatches = [
  {
    id: 'boost-1',
    homeTeam: 'Fluminense',
    awayTeam: 'Botafogo',
    homeScore: 0,
    awayScore: 0,
    league: 'Brasileirão Série A',
    time: 'Hoje, 21:30',
    oddsHome: 2.90,
    oddsDraw: 3.50,
    oddsAway: 2.45,
    originalOddsHome: 2.40,
    originalOddsDraw: 3.10,
    originalOddsAway: 2.10,
    boosted: true,
  },
  {
    id: 'boost-2',
    homeTeam: 'Liverpool',
    awayTeam: 'Man City',
    homeScore: 0,
    awayScore: 0,
    league: 'Premier League',
    time: 'Hoje, 16:00',
    oddsHome: 2.60,
    oddsDraw: 3.80,
    oddsAway: 2.70,
    originalOddsHome: 2.20,
    originalOddsDraw: 3.40,
    originalOddsAway: 2.30,
    boosted: true,
  },
];

export const upcomingMatches = [
  {
    id: 'up-1',
    homeTeam: 'Grêmio',
    awayTeam: 'Internacional',
    homeScore: 0,
    awayScore: 0,
    league: 'Brasileirão Série A',
    time: 'Amanhã, 16:00',
    oddsHome: 2.30,
    oddsDraw: 3.20,
    oddsAway: 3.10,
  },
  {
    id: 'up-2',
    homeTeam: 'Atlético-MG',
    awayTeam: 'Cruzeiro',
    homeScore: 0,
    awayScore: 0,
    league: 'Copa do Brasil',
    time: 'Amanhã, 19:00',
    oddsHome: 2.10,
    oddsDraw: 3.40,
    oddsAway: 3.50,
  },
  {
    id: 'up-3',
    homeTeam: 'PSG',
    awayTeam: 'Bayern Munich',
    homeScore: 0,
    awayScore: 0,
    league: 'Champions League',
    time: 'Qua, 16:00',
    oddsHome: 2.40,
    oddsDraw: 3.60,
    oddsAway: 2.80,
  },
  {
    id: 'up-4',
    homeTeam: 'Santos',
    awayTeam: 'Vasco',
    homeScore: 0,
    awayScore: 0,
    league: 'Brasileirão Série A',
    time: 'Qui, 20:00',
    oddsHome: 1.95,
    oddsDraw: 3.30,
    oddsAway: 4.00,
  },
];

export const popularMultiples = [
  {
    id: 'multi-1',
    title: 'Super Acumulador BR',
    bonus: '+15%',
    picks: [
      { match: 'Flamengo vs Palmeiras', selection: 'Flamengo', odds: 1.55 },
      { match: 'Grêmio vs Internacional', selection: 'Grêmio', odds: 2.30 },
      { match: 'Atlético-MG vs Cruzeiro', selection: 'Atlético-MG', odds: 2.10 },
    ],
    totalOdds: 7.50,
  },
  {
    id: 'multi-2',
    title: 'Europa League Special',
    bonus: '+10%',
    picks: [
      { match: 'Liverpool vs Man City', selection: 'Liverpool', odds: 2.60 },
      { match: 'PSG vs Bayern', selection: 'Ambos Marcam', odds: 1.65 },
    ],
    totalOdds: 4.29,
  },
];

const playerFirstNames = [
  'Lucas', 'Joao', 'Pedro', 'Gabriel', 'Rafael', 'Mateus', 'Bruno', 'Diego', 'Felipe', 'Thiago',
  'Andre', 'Carlos', 'Vinicius', 'Rodrigo', 'Marcos', 'Eduardo', 'William', 'Henrique', 'Nicolas', 'Arthur',
  'Julio', 'Leandro', 'Renato', 'Caio', 'Yuri', 'Sergio', 'Daniel', 'Luan', 'Gustavo', 'Wesley',
  'Otavio', 'Breno', 'Nathan', 'Igor', 'Alan', 'Cesar', 'Victor', 'Alex', 'Caua', 'Paulo',
];

const playerLastNames = [
  'Silva', 'Souza', 'Santos', 'Oliveira', 'Lima', 'Costa', 'Pereira', 'Mendes', 'Rocha', 'Ferreira',
  'Ramos', 'Barbosa', 'Alves', 'Teixeira', 'Gomes', 'Araujo', 'Martins', 'Nascimento', 'Carvalho', 'Batista',
  'Cardoso', 'Moreira', 'Ribeiro', 'Monteiro', 'Moura', 'Dias', 'Nogueira', 'Freitas', 'Rezende', 'Moraes',
];

const playerTeams = [
  'Flamengo', 'Palmeiras', 'Corinthians', 'Sao Paulo', 'Fluminense', 'Botafogo', 'Santos', 'Vasco',
  'Gremio', 'Internacional', 'Atletico-MG', 'Cruzeiro', 'Athletico-PR', 'Bahia', 'Fortaleza', 'Bragantino',
  'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Liverpool', 'Man City', 'Arsenal', 'Chelsea', 'Manchester United',
  'Bayern Munich', 'Borussia Dortmund', 'PSG', 'Juventus', 'Inter Milan', 'Milan',
];

const playerMarkets = [
  'Marcar a qualquer momento',
  'Mais de 0.5 chutes no gol',
  'Mais de 1.5 finalizacoes',
  'Dar assistencia',
  'Mais de 0.5 desarmes',
  'Mais de 0.5 faltas cometidas',
  'Mais de 1.5 passes chave',
  'Mais de 0.5 cartoes recebidos',
];

const playerPositions = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST', 'CF'];

export const playerProps = Array.from({ length: 3200 }, (_, index) => {
  const first = playerFirstNames[index % playerFirstNames.length];
  const last = playerLastNames[Math.floor(index / playerFirstNames.length) % playerLastNames.length];
  const team = playerTeams[index % playerTeams.length];
  const market = playerMarkets[index % playerMarkets.length];
  const position = playerPositions[index % playerPositions.length];
  const number = (index % 99) + 1;
  const odds = Number((1.6 + ((index * 37) % 520) / 100).toFixed(2));

  return {
    id: `pp-${index + 1}`,
    player: `${first} ${last}`,
    team,
    market,
    odds,
    photo: null,
    number,
    position,
  };
});

export const heroBanners = [
  {
    id: 'banner-1',
    title: 'Brasil vs Marrocos',
    subtitle: 'Estreia na Copa do Mundo em 13 Jun às 19:00!',
    cta: 'Apostar Agora',
    accent: 'Brasil',
    route: '/evento/brasil-marrocos',
  },
  {
    id: 'banner-2',
    title: 'Copa do Mundo 2026',
    subtitle: 'Mercados abertos para todos os jogos!',
    cta: 'Ver Jogos',
    accent: 'Hexa',
    route: '/esportes',
  },
  {
    id: 'banner-3',
    title: 'Odds Turbinadas',
    subtitle: 'Cotações especiais!',
    cta: 'Ver Ofertas',
    accent: 'Ofertas',
    route: '/promocoes',
  },
  {
    id: 'banner-4',
    title: 'Brasileirão Série A',
    subtitle: 'Aposte ao vivo e pré-jogo!',
    cta: 'Ver Jogos',
    accent: 'Liga',
    route: '/ao-vivo',
  },
  {
    id: 'banner-5',
    title: 'Bônus de Boas-Vindas',
    subtitle: '100% até R$500 no primeiro depósito.',
    cta: 'Cadastre-se',
    accent: 'Cadastro',
    route: '/auth',
  },
];

export const competitions = [
  { id: 'comp-1', name: 'Brasileirão Série A', country: 'Brasil', matchCount: 38, flag: 'https://flagcdn.com/w40/br.png' },
  { id: 'comp-2', name: 'Premier League', country: 'Inglaterra', matchCount: 24, flag: 'https://flagcdn.com/w40/gb-eng.png' },
  { id: 'comp-3', name: 'La Liga', country: 'Espanha', matchCount: 18, flag: 'https://flagcdn.com/w40/es.png' },
  { id: 'comp-4', name: 'Champions League', country: 'Europa', matchCount: 12, flag: 'https://flagcdn.com/w40/eu.png' },
  { id: 'comp-5', name: 'Copa do Brasil', country: 'Brasil', matchCount: 8, flag: 'https://flagcdn.com/w40/br.png' },
  { id: 'comp-6', name: 'Serie A', country: 'Itália', matchCount: 15, flag: 'https://flagcdn.com/w40/it.png' },
];

export const specials = [
  { id: 'spec-1', title: 'Quem será campeão do Brasileirão 2026?', market: 'Longo Prazo', topPick: 'Flamengo', topOdds: 3.50, options: 20 },
  { id: 'spec-2', title: 'Artilheiro da Champions League', market: 'Longo Prazo', topPick: 'Haaland', topOdds: 4.00, options: 30 },
  { id: 'spec-3', title: 'Brasil ganha a Copa do Mundo?', market: 'Especial', topPick: 'Sim', topOdds: 5.50, options: 8 },
  { id: 'spec-4', title: 'Próximo técnico da Seleção', market: 'Especial', topPick: 'Abel Ferreira', topOdds: 6.00, options: 12 },
];

export const oddsByCategory = [
  { id: 'cat-1', category: 'Resultado Final', icon: 'trophy', matches: 142, description: '1X2' },
  { id: 'cat-2', category: 'Gols', icon: 'target', matches: 98, description: 'Mais/Menos, Ambos Marcam' },
  { id: 'cat-3', category: 'Handicap', icon: 'scale', matches: 76, description: 'Handicap Asiático e Europeu' },
  { id: 'cat-4', category: 'Cartões', icon: 'card', matches: 54, description: 'Amarelos, Vermelhos, Total' },
  { id: 'cat-5', category: 'Escanteios', icon: 'corner', matches: 62, description: 'Mais/Menos, Asiático' },
  { id: 'cat-6', category: 'Jogadores', icon: 'user', matches: 88, description: 'Gols, Assistências, Chutes' },
];

export const allSports = [
  { id: 'futebol', label: 'Futebol' },
  { id: 'basquete', label: 'Basquete' },
  { id: 'tenis', label: 'Tênis' },
  { id: 'mma', label: 'MMA/UFC' },
  { id: 'volei', label: 'Vôlei' },
  { id: 'boxe', label: 'Boxe' },
  { id: 'esports', label: 'Esports' },
  { id: 'futebol-americano', label: 'Futebol Americano' },
  { id: 'beisebol', label: 'Beisebol' },
  { id: 'hockey', label: 'Hockey' },
  { id: 'handball', label: 'Handebol' },
  { id: 'rugby', label: 'Rugby' },
  { id: 'ciclismo', label: 'Ciclismo' },
  { id: 'natacao', label: 'Natação' },
  { id: 'atletismo', label: 'Atletismo' },
  { id: 'formula1', label: 'Fórmula 1' },
  { id: 'corrida-cavalos', label: 'Corrida de Cavalos' },
  { id: 'sinuca', label: 'Sinuca' },
  { id: 'dardos', label: 'Dardos' },
  { id: 'cricket', label: 'Cricket' },
];
