
CREATE TABLE public.social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON public.social_comments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can insert own comments"
ON public.social_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.social_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);
