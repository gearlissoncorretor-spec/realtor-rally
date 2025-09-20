-- Re-enable RLS and create admin user
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- Create admin user with email admin@canedo.com and password "Canedo"
-- First, we need to insert into auth.users (this is handled by Supabase Auth)
-- We'll create a profile for the admin user
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE email = 'admin@canedo.com';
    
    -- If admin doesn't exist, create a placeholder profile
    -- The actual user will be created when they sign up through the auth system
    IF admin_user_id IS NULL THEN
        INSERT INTO public.profiles (
            id,
            full_name,
            email,
            is_admin,
            role,
            allowed_screens,
            approved,
            dev_password
        ) VALUES (
            gen_random_uuid(), -- Temporary UUID, will be replaced when user signs up
            'Administrador Canedo',
            'admin@canedo.com',
            true,
            'admin',
            ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes'],
            true,
            'Canedo'
        );
    END IF;
END $$;