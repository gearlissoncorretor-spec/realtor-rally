-- Add auto_set_company_id trigger to negotiations table
CREATE TRIGGER set_company_id_on_negotiations
  BEFORE INSERT ON public.negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();
