-- Variables:
-- OLD company: 9e32b357-729a-4394-9fe4-c435e9d98d0c (Empresa Padrão)
-- NEW company: 0ce2eeec-ea19-4041-b7d3-1af69521341f (Grupo Aparecida - Guilherme)
-- Director Jorge Henrik: 9e441a0d-a28b-4cd1-8a50-e77a8595dd03

-- 1. Create agency "Senador Canedo" under Grupo Aparecida
INSERT INTO public.agencies (id, name, company_id, status)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Senador Canedo', '0ce2eeec-ea19-4041-b7d3-1af69521341f', 'ativo');

-- 2. Transfer all profiles (except super_admins) to Grupo Aparecida + assign agency
UPDATE public.profiles
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c'
  AND id NOT IN (
    SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
  );

-- 3. Transfer teams
UPDATE public.teams
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 4. Transfer brokers
UPDATE public.brokers
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 5. Transfer sales
UPDATE public.sales
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 6. Transfer negotiations
UPDATE public.negotiations
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 7. Transfer follow_ups
UPDATE public.follow_ups
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 8. Transfer goals
UPDATE public.goals
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 9. Transfer commissions
UPDATE public.commissions
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 10. Transfer commission_installments
UPDATE public.commission_installments
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 11. Transfer broker_activities
UPDATE public.broker_activities
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 12. Transfer broker_notes
UPDATE public.broker_notes
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 13. Transfer broker_weekly_activities
UPDATE public.broker_weekly_activities
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 14. Transfer broker_tasks
UPDATE public.broker_tasks
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 15. Transfer goal_tasks
UPDATE public.goal_tasks
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 16. Transfer follow_up_contacts
UPDATE public.follow_up_contacts
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 17. Transfer follow_up_notes
UPDATE public.follow_up_notes
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 18. Transfer negotiation_notes
UPDATE public.negotiation_notes
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 19. Transfer calendar_events
UPDATE public.calendar_events
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 20. Transfer calendar_event_shares
UPDATE public.calendar_event_shares
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 21. Transfer campaigns and related
UPDATE public.campaigns
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

UPDATE public.campaign_participants
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

UPDATE public.campaign_reports
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 22. Transfer column_targets
UPDATE public.column_targets
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 23. Transfer goal_progress
UPDATE public.goal_progress
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f',
    agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 24. Transfer organization_settings
UPDATE public.organization_settings
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 25. Transfer role_permissions
UPDATE public.role_permissions
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 26. Transfer follow_up_statuses
UPDATE public.follow_up_statuses
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 27. Transfer negotiation_statuses
UPDATE public.negotiation_statuses
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 28. Transfer process_stages
UPDATE public.process_stages
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 29. Transfer goal_types
UPDATE public.goal_types
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 30. Transfer sticky_notes
UPDATE public.sticky_notes
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 31. Transfer audit_logs
UPDATE public.audit_logs
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 32. Transfer push_subscriptions
UPDATE public.push_subscriptions
SET company_id = '0ce2eeec-ea19-4041-b7d3-1af69521341f'
WHERE company_id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';

-- 33. Set Jorge Henrik as Diretor of Senador Canedo agency
UPDATE public.profiles
SET agency_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE id = '9e441a0d-a28b-4cd1-8a50-e77a8595dd03';

-- 34. Update Grupo Aparecida company max_users to 100 (large company)
UPDATE public.companies
SET max_users = 100,
    name = 'Grupo Aparecida'
WHERE id = '0ce2eeec-ea19-4041-b7d3-1af69521341f';

-- 35. Delete duplicate Grupo Aparecida companies
DELETE FROM public.companies WHERE id IN ('231da7f4-462a-4afa-bb6c-86b54c6c1ed9', 'bf350027-d76f-415f-8e9a-d6ddf2b8d920');

-- 36. Rename old company to indicate it's deactivated
UPDATE public.companies
SET status = 'inativo', name = 'Empresa Padrão (migrada)'
WHERE id = '9e32b357-729a-4394-9fe4-c435e9d98d0c';
