
-- First, set all sales process_stage_id to NULL so we can delete old stages
UPDATE sales SET process_stage_id = NULL;

-- Delete all existing process stages  
DELETE FROM process_stages;

-- Insert new stages with the requested names
INSERT INTO process_stages (title, color, order_index, is_default) VALUES
  ('Aguardando Aprovação', '#f97316', 0, true),
  ('Aprovado', '#22c55e', 1, true),
  ('Contrato Imob', '#3b82f6', 2, true),
  ('Contrato Caixa', '#8b5cf6', 3, true),
  ('Cartório', '#ec4899', 4, true),
  ('Conformidade', '#06b6d4', 5, true),
  ('Distrato', '#ef4444', 6, true);
