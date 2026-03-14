-- Insert annual goal (month=0) for 28 million (global, no team)
INSERT INTO public.targets (year, month, target_value, team_id, broker_id, company_id)
SELECT 2026, 0, 28000000, NULL, NULL, company_id 
FROM public.targets 
WHERE year = 2026 AND team_id IS NULL AND month > 0
LIMIT 1;

-- Update March (month=3) global target to 3 million
UPDATE public.targets SET target_value = 3000000 WHERE id = '611c58a7-f8ed-4042-8f5c-6da75d8045a0';
