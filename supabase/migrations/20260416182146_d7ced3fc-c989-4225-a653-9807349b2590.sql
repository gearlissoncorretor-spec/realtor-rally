-- Fix search path for the trigger function
ALTER FUNCTION public.set_company_and_agency_ids() SET search_path TO public;
