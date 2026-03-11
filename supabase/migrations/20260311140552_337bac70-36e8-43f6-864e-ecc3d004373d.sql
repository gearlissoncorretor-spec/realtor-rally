-- Clean up related data for broker Jéssica Gontijo
DELETE FROM broker_notes WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM broker_activities WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM broker_tasks WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM broker_weekly_activities WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM follow_up_contacts WHERE follow_up_id IN (SELECT id FROM follow_ups WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f');
DELETE FROM follow_ups WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM negotiations WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM commissions WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM column_targets WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM goal_progress WHERE goal_id IN (SELECT id FROM goals WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f');
DELETE FROM goal_tasks WHERE goal_id IN (SELECT id FROM goals WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f');
DELETE FROM goals WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
DELETE FROM targets WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
-- Preserve sales but nullify broker reference
UPDATE sales SET broker_id = NULL WHERE broker_id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';
-- Delete the broker
DELETE FROM brokers WHERE id = '4d902d8d-a8ac-45f6-95d6-c334c967a23f';