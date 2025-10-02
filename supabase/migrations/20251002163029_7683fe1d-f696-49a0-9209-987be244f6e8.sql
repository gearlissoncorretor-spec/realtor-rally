-- Add kanban_status column to brokers table
ALTER TABLE public.brokers 
ADD COLUMN kanban_status TEXT DEFAULT 'agendar' CHECK (kanban_status IN ('agendar', 'em_andamento', 'concluido'));

-- Create broker_notes table for individual notes
CREATE TABLE public.broker_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on broker_notes
ALTER TABLE public.broker_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broker_notes
CREATE POLICY "Admins can view all notes"
ON public.broker_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can create notes"
ON public.broker_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update notes"
ON public.broker_notes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete notes"
ON public.broker_notes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Brokers can view notes about themselves
CREATE POLICY "Brokers can view their own notes"
ON public.broker_notes
FOR SELECT
USING (
  broker_id IN (
    SELECT id FROM public.brokers
    WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_broker_notes_updated_at
BEFORE UPDATE ON public.broker_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();