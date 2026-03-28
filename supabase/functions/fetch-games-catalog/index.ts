import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

type Vertical = 'casino' | 'crash';

type RawProviderGame = {
  id?: string;
  game_id?: string;
  name?: string;
  title?: string;
  category?: string;
  type?: string;
  provider?: string;
  vendor?: string;
  image_url?: string;
  thumbnail?: string;
  launch_url?: string;
  game_url?: string;
  vertical?: string;
  enabled?: boolean;
  real_money?: boolean;
  online?: boolean;
  status?: string;
};

type RealGame = {
  id: string;
  name: string;
  category: string;
  provider: string;
  imageUrl: string;
  launchUrl: string;
  isRealMoney: boolean;
  isOnline: boolean;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_IMAGE = 'https://placehold.co/640x360/111827/F9FAFB?text=Game';

const fallbackCatalog: Record<Vertical, RealGame[]> = {
  casino: [
    {
      id: 'casino-gates-olympus',
      name: 'Gates of Olympus',
      category: 'Slots',
      provider: 'Pragmatic Play',
      imageUrl: DEFAULT_IMAGE,
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'casino-sweet-bonanza',
      name: 'Sweet Bonanza',
      category: 'Slots',
      provider: 'Pragmatic Play',
      imageUrl: DEFAULT_IMAGE,
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'casino-roulette-live',
      name: 'Roulette Live',
      category: 'Roleta',
      provider: 'Evolution',
      imageUrl: DEFAULT_IMAGE,
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'casino-blackjack-live',
      name: 'Blackjack Live',
      category: 'Blackjack',
      provider: 'Evolution',
      imageUrl: DEFAULT_IMAGE,
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
      imageUrl: DEFAULT_IMAGE,
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'crash-spaceman',
      name: 'Spaceman',
      category: 'Crash',
      provider: 'Pragmatic Play',
      imageUrl: DEFAULT_IMAGE,
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'crash-mines',
      name: 'Mines',
      category: 'Instantâneo',
      provider: 'Spribe',
      imageUrl: DEFAULT_IMAGE,
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
    {
      id: 'crash-plinko',
      name: 'Plinko',
      category: 'Instantâneo',
      provider: 'Spribe',
      imageUrl: DEFAULT_IMAGE,
      launchUrl: '/auth',
      isRealMoney: true,
      isOnline: true,
    },
  ],
};

function normalizeVertical(input: string | null): Vertical {
  return input === 'crash' ? 'crash' : 'casino';
}

function toGame(raw: RawProviderGame, index: number, vertical: Vertical): RealGame | null {
  const name = raw.name || raw.title;
  const launchUrl = raw.launch_url || raw.game_url;

  if (!name || !launchUrl) {
    return null;
  }

  return {
    id: raw.id || raw.game_id || `${vertical}-${name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    name,
    category: raw.category || raw.type || 'Outros',
    provider: raw.provider || raw.vendor || 'Provider',
    imageUrl: raw.image_url || raw.thumbnail || DEFAULT_IMAGE,
    launchUrl,
    isRealMoney: raw.real_money !== false,
    isOnline: raw.online !== false && raw.status !== 'offline',
  };
}

async function fetchProviderCatalog(vertical: Vertical): Promise<RealGame[]> {
  const providerBaseUrl = Deno.env.get('GAME_PROVIDER_API_URL') || '';
  const providerApiKey = Deno.env.get('GAME_PROVIDER_API_KEY') || '';

  if (!providerBaseUrl || !providerApiKey) {
    return fallbackCatalog[vertical];
  }

  const endpoint = `${providerBaseUrl.replace(/\/$/, '')}/catalog?vertical=${vertical}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${providerApiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return fallbackCatalog[vertical];
  }

  const data = (await response.json()) as { games?: RawProviderGame[] } | RawProviderGame[];
  const rawGames = Array.isArray(data) ? data : Array.isArray(data.games) ? data.games : [];

  const games = rawGames
    .filter((game) => game.enabled !== false)
    .map((game, index) => toGame(game, index, vertical))
    .filter((game): game is RealGame => Boolean(game));

  if (games.length === 0) {
    return fallbackCatalog[vertical];
  }

  return games;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { vertical?: string };
    const vertical = normalizeVertical(body.vertical ?? null);
    const games = await fetchProviderCatalog(vertical);

    return new Response(JSON.stringify({ success: true, vertical, games }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
