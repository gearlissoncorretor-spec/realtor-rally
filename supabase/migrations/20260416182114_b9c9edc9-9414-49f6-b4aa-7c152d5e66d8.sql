-- Create the trigger function to automatically set company_id and agency_id
CREATE OR REPLACE FUNCTION public.set_company_and_agency_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if they are NULL
  IF NEW.company_id IS NULL THEN
    NEW.company_id := get_user_company_id(auth.uid());
  END IF;
  
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := get_user_agency_id(auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to relevant tables
DO $$
DECLARE
    t text;
    tables_to_fix text[] := ARRAY[
        'broker_activities', 'broker_notes', 'broker_tasks', 'broker_weekly_activities', 
        'calendar_event_shares', 'calendar_events', 'campaign_participants', 
        'campaign_reports', 'campaigns', 'column_targets', 'commission_installments', 
        'commissions', 'follow_up_contacts', 'follow_up_notes', 'follow_up_statuses', 
        'follow_ups', 'goal_progress', 'goal_tasks', 'goals', 'google_calendar_tokens', 
        'negotiation_notes', 'negotiation_statuses', 'negotiations', 'organization_settings', 
        'process_stages', 'role_permissions', 'sales', 'sticky_notes', 'targets', 
        'task_attachments', 'task_comments', 'task_history', 'teams'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        -- Drop if exists to be idempotent
        EXECUTE format('DROP TRIGGER IF EXISTS tr_set_company_and_agency_ids ON public.%I', t);
        -- Create the trigger
        EXECUTE format('CREATE TRIGGER tr_set_company_and_agency_ids 
                        BEFORE INSERT ON public.%I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION public.set_company_and_agency_ids()', t);
    END LOOP;
END;
$$;
