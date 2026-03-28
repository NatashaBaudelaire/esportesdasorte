import { supabase } from '@/integrations/supabase/client';
import aviatorCover from '@/assets/game-covers/aviator.svg';
import spacemanCover from '@/assets/game-covers/spaceman.svg';
import minesCover from '@/assets/game-covers/mines.svg';
import plinkoCover from '@/assets/game-covers/plinko.svg';
import gatesOfOlympusCover from '@/assets/game-covers/gates-of-olympus.svg';
import sweetBonanzaCover from '@/assets/game-covers/sweet-bonanza.svg';
import rouletteLiveCover from '@/assets/game-covers/roulette-live.svg';
import blackjackLiveCover from '@/assets/game-covers/blackjack-live.svg';
import defaultGameCover from '@/assets/game-covers/default-game.svg';

export type GameVertical = 'casino' | 'crash';

export type RealGame = {
  id: string;
  name: string;
  category: string;
  provider: string;
  imageUrl: string;
  launchUrl: string;
  isRealMoney: boolean;
  isOnline: boolean;
};

type FetchGamesResponse = {
  success: boolean;
  games?: RealGame[];
  error?: string;
};

type CoverTheme = {
  accent: string;
  label: string;
  motif: 'crash' | 'slots' | 'roulette' | 'table' | 'instant' | 'default';
};

const CATEGORY_THEMES: Record<string, CoverTheme> = {
  crash: { accent: '#38bdf8', label: 'CRASH', motif: 'crash' },
  slots: { accent: '#ec4899', label: 'SLOTS', motif: 'slots' },
  roleta: { accent: '#22c55e', label: 'ROLETA', motif: 'roulette' },
  mesa: { accent: '#f97316', label: 'MESA', motif: 'table' },
  instantaneo: { accent: '#14b8a6', label: 'INSTANTANEO', motif: 'instant' },
  outros: { accent: '#818cf8', label: 'CASINO', motif: 'default' },
};

function normalizeCategory(category?: string): string {
  return (category || 'outros')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getThemeByCategory(category?: string): CoverTheme {
  const key = normalizeCategory(category);
  return CATEGORY_THEMES[key] || CATEGORY_THEMES.outros;
}

function motifMarkup(motif: CoverTheme['motif'], accent: string): string {
  if (motif === 'crash') {
    return `<path d="M90 500 C 260 460, 420 380, 570 230" stroke="${accent}" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="570" cy="230" r="16" fill="${accent}"/>`;
  }

  if (motif === 'slots') {
    return `<rect x="860" y="300" width="280" height="180" rx="24" fill="#0b1220" stroke="${accent}" stroke-width="4"/><circle cx="930" cy="390" r="24" fill="${accent}"/><circle cx="1000" cy="390" r="24" fill="${accent}"/><circle cx="1070" cy="390" r="24" fill="${accent}"/>`;
  }

  if (motif === 'roulette') {
    return `<circle cx="1010" cy="380" r="110" fill="none" stroke="${accent}" stroke-width="10"/><circle cx="1010" cy="380" r="62" fill="none" stroke="${accent}" stroke-width="8"/><circle cx="1010" cy="380" r="12" fill="${accent}"/>`;
  }

  if (motif === 'table') {
    return `<rect x="835" y="290" width="350" height="220" rx="110" fill="#052e22" stroke="${accent}" stroke-width="6"/><circle cx="1008" cy="400" r="18" fill="${accent}"/>`;
  }

  if (motif === 'instant') {
    return `<polygon points="980,250 910,390 1005,390 955,530 1110,350 1015,350 1080,250" fill="${accent}"/>`;
  }

  return `<circle cx="1010" cy="380" r="118" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-width="6"/>`;
}

function createGameCover(title: string, theme: CoverTheme): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const subtitle = theme.label === 'CRASH' ? 'AO VIVO' : theme.label;

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#081036"/><stop offset="60%" stop-color="#0d1b44"/><stop offset="100%" stop-color="#060b24"/></linearGradient><radialGradient id="glow" cx="70%" cy="20%" r="70%"><stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.42"/><stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient><filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#020617" flood-opacity="0.8"/></filter></defs><rect width="1280" height="720" fill="url(#bg)"/><rect width="1280" height="720" fill="url(#glow)"/><circle cx="220" cy="610" r="210" fill="#ef4444" fill-opacity="0.1"/>${motifMarkup(theme.motif, theme.accent)}<rect x="56" y="40" width="160" height="50" rx="10" fill="#16a34a"/><text x="92" y="74" fill="#f0fdf4" font-family="Verdana,Arial,sans-serif" font-size="26" font-weight="700">NOVO</text><rect x="56" y="94" width="220" height="50" rx="10" fill="#15803d"/><text x="88" y="128" fill="#ecfdf5" font-family="Verdana,Arial,sans-serif" font-size="24" font-weight="700">POPULARES</text><g filter="url(#shadow)"><text x="70" y="442" fill="#ffffff" font-family="Verdana,Arial,sans-serif" font-size="84" font-weight="800" letter-spacing="1">${safeTitle}</text></g><text x="70" y="492" fill="#bfdbfe" font-family="Verdana,Arial,sans-serif" font-size="34" font-weight="700">${subtitle}</text><rect x="0" y="580" width="1280" height="140" fill="#030712" fill-opacity="0.78"/><text x="70" y="648" fill="#ffffff" font-family="Verdana,Arial,sans-serif" font-size="44" font-weight="700">${safeTitle}</text><text x="70" y="692" fill="#94a3b8" font-family="Verdana,Arial,sans-serif" font-size="24">ESPORTES DA SORTE</text></svg>`
  )}`;
}

const GAME_COVER_PALETTE = ['#38bdf8', '#22c55e', '#f59e0b', '#ec4899', '#818cf8', '#14b8a6', '#f97316', '#ef4444'];
const FORCE_GENERATED_COVERS = true;

const STATIC_GAME_COVERS: Record<string, string> = {
  aviator: aviatorCover,
  spaceman: spacemanCover,
  mines: minesCover,
  plinko: plinkoCover,
  'gates of olympus': gatesOfOlympusCover,
  'sweet bonanza': sweetBonanzaCover,
  'roulette live': rouletteLiveCover,
  'blackjack live': blackjackLiveCover,
};

function normalizeGameName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getAccentFromName(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(index);
    hash |= 0;
  }

  return GAME_COVER_PALETTE[Math.abs(hash) % GAME_COVER_PALETTE.length];
}

function getGameImage(name: string, category?: string, imageUrl?: string): string {
  const title = (name || 'GAME').toUpperCase();
  const theme = getThemeByCategory(category);
  const deterministicTheme = { ...theme, accent: getAccentFromName(title) };

  if (FORCE_GENERATED_COVERS) {
    return createGameCover(title, deterministicTheme);
  }

  const normalizedImageUrl = imageUrl?.trim() || '';
  const hasOfficialImage =
    normalizedImageUrl.length > 0 &&
    !normalizedImageUrl.startsWith('data:image/svg+xml') &&
    !normalizedImageUrl.includes('placehold.co');

  if (hasOfficialImage) {
    return normalizedImageUrl;
  }

  const staticCover = STATIC_GAME_COVERS[normalizeGameName(name || '')];

  if (staticCover) {
    return staticCover;
  }

  if (normalizedImageUrl.length > 0) {
    return normalizedImageUrl;
  }

  return createGameCover(title, deterministicTheme);
}

const DEFAULT_GAME_IMAGE = defaultGameCover;

const localFallbackCatalog: Record<GameVertical, RealGame[]> = {
  casino: [
    {
      id: 'casino-gates-olympus',
      name: 'Gates of Olympus',
      category: 'Slots',
      provider: 'Pragmatic Play',
      imageUrl: getGameImage('Gates of Olympus', 'Slots'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'casino-sweet-bonanza',
      name: 'Sweet Bonanza',
      category: 'Slots',
      provider: 'Pragmatic Play',
      imageUrl: getGameImage('Sweet Bonanza', 'Slots'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'casino-roulette-live',
      name: 'Roulette Live',
      category: 'Roleta',
      provider: 'Evolution',
      imageUrl: getGameImage('Roulette Live', 'Roleta'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'casino-blackjack-live',
      name: 'Blackjack Live',
      category: 'Mesa',
      provider: 'Evolution',
      imageUrl: getGameImage('Blackjack Live', 'Mesa'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
  ],
  crash: [
    {
      id: 'crash-aviator',
      name: 'Aviator',
      category: 'Crash',
      provider: 'Spribe',
      imageUrl: getGameImage('Aviator', 'Crash'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'crash-spaceman',
      name: 'Spaceman',
      category: 'Crash',
      provider: 'Pragmatic Play',
      imageUrl: getGameImage('Spaceman', 'Crash'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'crash-mines',
      name: 'Mines',
      category: 'Instantaneo',
      provider: 'Spribe',
      imageUrl: getGameImage('Mines', 'Instantaneo'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'crash-plinko',
      name: 'Plinko',
      category: 'Instantaneo',
      provider: 'Spribe',
      imageUrl: getGameImage('Plinko', 'Instantaneo'),
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
  ],
};

function sanitizeGames(games: RealGame[] | undefined): RealGame[] {
  if (!Array.isArray(games)) {
    return [];
  }

  return games
    .filter((game) => game && game.name && game.launchUrl)
    .map((game, index) => ({
      id: game.id || `${game.provider || 'provider'}-${game.name}-${index}`,
      name: game.name,
      category: game.category || 'Outros',
      provider: game.provider || 'Provider',
      imageUrl: getGameImage(game.name, game.category, game.imageUrl || DEFAULT_GAME_IMAGE),
      launchUrl: game.launchUrl,
      isRealMoney: game.isRealMoney !== false,
      isOnline: game.isOnline !== false,
    }));
}

export async function fetchRealGames(vertical: GameVertical): Promise<RealGame[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-games-catalog', {
      body: { vertical },
    });

    if (error) {
      return localFallbackCatalog[vertical];
    }

    const payload = data as FetchGamesResponse | null;
    if (!payload?.success) {
      return localFallbackCatalog[vertical];
    }

    const sanitizedGames = sanitizeGames(payload.games);
    return sanitizedGames.length > 0 ? sanitizedGames : localFallbackCatalog[vertical];
  } catch {
    return localFallbackCatalog[vertical];
  }
}
