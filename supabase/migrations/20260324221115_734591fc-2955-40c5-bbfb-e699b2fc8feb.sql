
-- Bolão predictions table
CREATE TABLE public.bolao_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  round_number int NOT NULL DEFAULT 28,
  match_id text NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_score int NOT NULL,
  away_score int NOT NULL,
  points_earned int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, round_number, match_id)
);

ALTER TABLE public.bolao_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own predictions"
ON public.bolao_predictions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions"
ON public.bolao_predictions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions"
ON public.bolao_predictions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view all predictions for leaderboard"
ON public.bolao_predictions FOR SELECT TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_bolao_predictions_updated_at
  BEFORE UPDATE ON public.bolao_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
