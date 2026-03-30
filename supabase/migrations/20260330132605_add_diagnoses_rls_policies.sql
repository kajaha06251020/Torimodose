-- Enable RLS on diagnoses table
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert diagnoses
CREATE POLICY "allow_anonymous_insert" ON public.diagnoses
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous users to read diagnoses
CREATE POLICY "allow_anonymous_read" ON public.diagnoses
  FOR SELECT
  USING (true);

-- Allow authenticated users to read their own diagnoses and anonymous diagnoses
CREATE POLICY "allow_user_select" ON public.diagnoses
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow authenticated users to update their own diagnoses
CREATE POLICY "allow_user_update" ON public.diagnoses
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
