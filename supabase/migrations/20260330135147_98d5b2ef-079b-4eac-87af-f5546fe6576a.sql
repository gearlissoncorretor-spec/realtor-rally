
-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_commissions_broker_id ON public.commissions (broker_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events (user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON public.calendar_events (event_date);
CREATE INDEX IF NOT EXISTS idx_sales_tipo ON public.sales (tipo);
CREATE INDEX IF NOT EXISTS idx_sales_visibilidade ON public.sales (visibilidade);
