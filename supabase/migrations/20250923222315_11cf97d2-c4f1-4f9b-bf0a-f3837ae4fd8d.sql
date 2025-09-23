-- Add observations column to brokers table
ALTER TABLE public.brokers 
ADD COLUMN observations TEXT;