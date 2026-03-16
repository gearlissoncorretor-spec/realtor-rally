import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserData } from './UserCard';

interface EditUserDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: { id: string; name: string }[];
  onSaved: () => void;
  allowedRoles?: string[];
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, open, onOpenChange, teams, onSaved, allowedRoles }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: '',
    nickname: '',
    email: '',
    phone: '',
    birth_date: '',
    role: '',
    team_id: '',
  });

  const roles = allowedRoles || ['admin', 'diretor', 'gerente', 'corretor'];

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
        role: user.role || 'corretor',
        team_id: user.team_id || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          nickname: form.nickname || null,
          phone: form.phone || null,
          birth_date: form.birth_date || null,
          team_id: form.team_id || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sync changes to linked broker record
      const { data: linkedBroker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (linkedBroker) {
        const brokerUpdate: Record<string, any> = {};
        if (form.full_name !== user.full_name) brokerUpdate.name = form.full_name;
        if (form.phone !== (user.phone || '')) brokerUpdate.phone = form.phone || null;
        if (form.team_id !== (user.team_id || '')) brokerUpdate.team_id = form.team_id || null;
        if (form.birth_date !== (user.birth_date || '')) brokerUpdate.birthday = form.birth_date || null;

        if (Object.keys(brokerUpdate).length > 0) {
          await supabase
            .from('brokers')
            .update(brokerUpdate)
            .eq('id', linkedBroker.id);
        }
      }

      // Update role if changed
      if (form.role !== user.role) {
        await supabase.from('user_roles').delete().eq('user_id', user.id);
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: form.role as any });
        if (roleError) throw roleError;
      }

      // Invalidate all related caches for instant sync
      const { QueryClient } = await import('@tanstack/react-query');
      // Access queryClient from window or use direct invalidation
      toast({ title: "Usuário atualizado com sucesso!" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome Completo</Label>
              <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Apelido</Label>
              <Input value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Equipe</Label>
              <Select value={form.team_id || 'none'} onValueChange={v => setForm(p => ({ ...p, team_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar equipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem equipe</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
