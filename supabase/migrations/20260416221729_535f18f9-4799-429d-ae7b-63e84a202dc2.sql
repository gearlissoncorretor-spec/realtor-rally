-- Create broker profiles for Igor Alfenas for all his user IDs if they don't exist
-- We'll use the data from the most recent profile as a template

DO $$
DECLARE
    temp_agency_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    temp_company_id UUID := '0ce2eeec-ea19-4041-b7d3-1af69521341f';
    temp_team_id UUID := '19c49ea1-e860-4443-92f1-912473e34366';
BEGIN
    -- For alfenas@mybrokercanedo.com
    IF NOT EXISTS (SELECT 1 FROM brokers WHERE user_id = 'fff3a1f8-2d8c-4370-a3b8-c3cfe11f073e') THEN
        INSERT INTO brokers (
            name, email, user_id, agency_id, company_id, team_id, 
            status, commission_rate, hire_date, kanban_status
        ) VALUES (
            'Igor Alfenas', 'alfenas@mybrokercanedo.com', 'fff3a1f8-2d8c-4370-a3b8-c3cfe11f073e', 
            temp_agency_id, temp_company_id, temp_team_id, 
            'ativo', 5.00, CURRENT_DATE, 'agendar'
        );
    END IF;

    -- For igor@gmail.com
    IF NOT EXISTS (SELECT 1 FROM brokers WHERE user_id = '61cef9a2-80d7-48aa-a704-5eef88a68edd') THEN
        INSERT INTO brokers (
            name, email, user_id, agency_id, company_id, team_id, 
            status, commission_rate, hire_date, kanban_status
        ) VALUES (
            'Igor Alfenas', 'igor@gmail.com', '61cef9a2-80d7-48aa-a704-5eef88a68edd', 
            temp_agency_id, temp_company_id, temp_team_id, 
            'ativo', 5.00, CURRENT_DATE, 'agendar'
        );
    END IF;
END $$;
