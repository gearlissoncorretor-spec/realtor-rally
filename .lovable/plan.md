

## Creating the Super Admin User

There are two issues with the requested credentials:

1. **Password "Canedo"** has only 6 characters and no numbers. The edge function requires 8+ characters with both letters and numbers.
2. **Email "admin@gestãoaxis.com"** contains "ã" which is invalid for email. Use **admin@gestaoaxis.com** instead.

### Plan

**Step 1: Create the user manually in Supabase Dashboard**

Go to [Supabase Authentication > Users](https://supabase.com/dashboard/project/kwsnnwiwflsvsqiuzfja/auth/users) and click "Add User":
- Email: `admin@gestaoaxis.com`
- Password: `Canedo2026` (meets 8+ chars with letters + numbers)
- Check "Auto Confirm User"

**Step 2: Run SQL to promote to super_admin**

After the user is created, go to [SQL Editor](https://supabase.com/dashboard/project/kwsnnwiwflsvsqiuzfja/sql/new) and run:

```sql
-- Get the user ID (copy the UUID from the result)
SELECT id FROM auth.users WHERE email = 'admin@gestaoaxis.com';

-- Then use that UUID below (replace YOUR_UUID):
INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_UUID', 'super_admin');

UPDATE public.profiles 
SET approved = true, 
    allowed_screens = ARRAY['dashboard','vendas','corretores','ranking','acompanhamento','relatorios','configuracoes','equipes','metas','negociacoes','follow-up','atividades','tarefas-kanban','meta-gestao','x1','dashboard-equipes','agenda','gestao-usuarios']
WHERE id = 'YOUR_UUID';
```

**Step 3: Test the panel**

Log in with `admin@gestaoaxis.com` / `Canedo2026` and navigate to `/super-admin`.

### Alternative: Adjust password validation

If you want to keep the password "Canedo" (6 chars, no numbers), I can relax the edge function validation. However, this weakens security for all users. I recommend using `Canedo2026` instead.

