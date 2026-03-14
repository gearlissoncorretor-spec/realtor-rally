
-- Check if follow_up_notes exists, if not create it
CREATE TABLE IF NOT EXISTS public.follow_up_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id uuid NOT NULL REFERENCES public.follow_ups(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-set company_id (only if trigger doesn't exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_id_follow_up_notes') THEN
    CREATE TRIGGER set_company_id_follow_up_notes
      BEFORE INSERT ON public.follow_up_notes
      FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
  END IF;
END $$;

ALTER TABLE public.follow_up_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any then recreate
DROP POLICY IF EXISTS "Users can view follow_up notes" ON public.follow_up_notes;
DROP POLICY IF EXISTS "Users can insert follow_up notes" ON public.follow_up_notes;
DROP POLICY IF EXISTS "Users can delete follow_up notes" ON public.follow_up_notes;
DROP POLICY IF EXISTS "company_isolation_follow_up_notes" ON public.follow_up_notes;

CREATE POLICY "Users can view follow_up notes"
  ON public.follow_up_notes FOR SELECT TO authenticated
  USING (follow_up_id IN (SELECT id FROM public.follow_ups));

CREATE POLICY "Users can insert follow_up notes"
  ON public.follow_up_notes FOR INSERT TO authenticated
  WITH CHECK (follow_up_id IN (SELECT id FROM public.follow_ups));

CREATE POLICY "Users can delete follow_up notes"
  ON public.follow_up_notes FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'diretor')
  );

CREATE POLICY "company_isolation_follow_up_notes"
  ON public.follow_up_notes
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));
