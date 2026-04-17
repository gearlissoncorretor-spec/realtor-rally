import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2, Copy, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateUserDialogProps {
  teams: { id: string; name: string }[];
  onCreated: () => void;
  allowedRoles?: string[];
  forcedTeamId?: string;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ teams, onCreated, allowedRoles, forcedTeamId }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');
  const [createdName, setCreatedName] = useState('');
  const [createdRole, setCreatedRole] = useState('');
  const { toast } = useToast();

  const [form, setForm] = useState({
    full_name: '',
    nickname: '',
    email: '',
    password: '',
    phone: '',
    birth_date: '',
    role: 'corretor',
    team_id: forcedTeamId || '',
  });

  const roles = allowedRoles || ['admin', 'diretor', 'gerente', 'corretor'];

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email) return;

    if (form.password && (form.password.length < 8 || !/\d/.test(form.password) || !/[a-zA-Z]/.test(form.password))) {
      toast({ 
        title: "Senha inválida", 
        description: "A senha deve ter pelo menos 8 caracteres, incluindo letras e números.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    try {
      const password = form.password || generatePassword();
      
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          password,
          full_name: form.full_name,
          role: form.role,
          team_id: forcedTeamId || (form.team_id === 'none' ? null : form.team_id) || null,
          nickname: form.nickname || null,
          phone: form.phone || null,
          birth_date: form.birth_date || null,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedPassword(password);
      setCreatedEmail(form.email);
      setCreatedName(form.full_name);
      setCreatedRole(form.role);
      toast({ title: "Usuário criado com sucesso!" });
      onCreated();
    } catch (err: any) {
      toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendByEmail = async () => {
    if (!generatedPassword || !createdEmail) return;
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-credentials', {
        body: {
          email: createdEmail,
          password: generatedPassword,
          full_name: createdName,
          role: createdRole,
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEmailSent(true);
      toast({ title: "Credenciais enviadas!", description: `Email enviado para ${createdEmail}` });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedPassword(null);
    setCopied(false);
    setEmailSent(false);
    setSendingEmail(false);
    setCreatedEmail('');
    setCreatedName('');
    setCreatedRole('');
    setForm({ full_name: '', nickname: '', email: '', password: '', phone: '', birth_date: '', role: 'corretor', team_id: forcedTeamId || '' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-1.5" /> Criar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>

        {generatedPassword ? (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <p className="font-medium">Usuário criado com sucesso!</p>
              <p className="text-sm text-muted-foreground">Copie a senha temporária abaixo. Ela será exibida apenas uma vez.</p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono">{generatedPassword}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSendByEmail} disabled={sendingEmail || emailSent} className="flex-1 gap-1.5">
                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSent ? <CheckCircle className="h-4 w-4 text-success" /> : <Mail className="h-4 w-4" />}
                {emailSent ? 'Enviado!' : 'Enviar por email'}
              </Button>
              <Button onClick={handleClose} className="flex-1">Fechar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome Completo *</Label>
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
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Senha (deixe em branco para gerar automaticamente)</Label>
                <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 8 caracteres com letras e números" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Nascimento</Label>
                <Input type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil *</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r} value={r}>
                        {r === 'socio' ? 'Sócio Diretor' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!forcedTeamId && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Equipe</Label>
                  <Select value={form.team_id} onValueChange={v => setForm(p => ({ ...p, team_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar equipe" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem equipe</SelectItem>
                      {teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Criar Usuário
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
