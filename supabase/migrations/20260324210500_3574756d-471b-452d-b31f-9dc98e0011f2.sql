
-- Add shared flag to bets so users can publish their bets to the social feed
ALTER TABLE public.bets ADD COLUMN shared boolean NOT NULL DEFAULT false;
ALTER TABLE public.bets ADD COLUMN shared_text text;

-- Allow anyone authenticated to read shared bets (for social feed)
CREATE POLICY "Anyone can view shared bets"
  ON public.bets FOR SELECT
  TO authenticated
  USING (shared = true);

-- Allow users to update their own bets (to toggle shared)
CREATE POLICY "Users can update own bets"
  ON public.bets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
