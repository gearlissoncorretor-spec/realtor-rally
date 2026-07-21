UPDATE auth.users
SET encrypted_password = crypt('Teste2026', gen_salt('bf')),
    updated_at = now()
WHERE id = 'a166cc5f-db93-4ab2-8d4d-5db652549415';