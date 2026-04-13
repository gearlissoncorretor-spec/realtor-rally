-- Fix search path for security
ALTER FUNCTION public.is_manager_of_user(UUID, UUID) SET search_path = public;