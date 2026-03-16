-- Fix process_stages with NULL company_id by setting them to the existing company
UPDATE process_stages 
SET company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c' 
WHERE company_id IS NULL;

-- Also fix any other system tables that might have the same issue
UPDATE follow_up_statuses 
SET company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c' 
WHERE company_id IS NULL;

UPDATE negotiation_statuses 
SET company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c' 
WHERE company_id IS NULL;

UPDATE goal_types 
SET company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c' 
WHERE company_id IS NULL;