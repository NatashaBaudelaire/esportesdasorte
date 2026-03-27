
CREATE TABLE public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  selections jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_odds numeric NOT NULL,
  stake numeric NOT NULL,
  potential_return numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payout numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  settled_at timestamp with time zone
);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bets" ON public.bets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets" ON public.bets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
