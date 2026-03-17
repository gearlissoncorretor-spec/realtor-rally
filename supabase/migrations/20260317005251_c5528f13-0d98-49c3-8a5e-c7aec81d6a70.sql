
-- Drop restrictive constraints
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_period_type_check;
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_target_type_check;

-- Add updated constraints matching all values used in the application
ALTER TABLE goals ADD CONSTRAINT goals_period_type_check
  CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'semester', 'yearly', 'custom'));

ALTER TABLE goals ADD CONSTRAINT goals_target_type_check
  CHECK (target_type IN ('sales_count', 'captacao', 'contratacao', 'revenue', 'vgv', 'vgc', 'commission', 'atendimentos'));
