import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Building2, Plus, User, Pencil, Trash2, Store } from 'lucide-react';
import { toast } from 'sonner';

interface Agency {
  id: string;
  name: string;
  status: string;
  company_id: string;
  created_at: string;
}

interface DirectorProfile {
  id: string;
  full_name: string;
  email: string;
  agency_id: string | null;
}

const AgencyManager = () => {
  const { profile, isSocio, isAdmin } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [directors, setDirectors] = useState<DirectorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [selectedDirector, setSelectedDirector] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editDirector, setEditDirector] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const companyId = profile?.company_id;

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [agenciesRes, directorsRes] = await Promise.all([
        supabase.from('agencies').select('*').eq('company_id', companyId).order('name'),
        supabase.from('profiles').select('id, full_name, email, agency_id')
          .eq('company_id', companyId)
          .in('id', (await supabase.from('user_roles').select('user_id').eq('role', 'diretor')).data?.map(r => r.user_id) || []),
      ]);

      if (agenciesRes.data) setAgencies(agenciesRes.data);
      if (directorsRes.data) setDirectors(directorsRes.data);
    } catch (err) {
      console.error('Error fetching agencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const getDirectorForAgency = (agencyId: string) => {
    return directors.find(d => d.agency_id === agencyId);
  };

  const getAvailableDirectors = (excludeAgencyId?: string) => {
    return directors.filter(d => !d.agency_id || d.agency_id === excludeAgencyId);
  };

  const handleCreate = async () => {
    if (!newAgencyName.trim() || !companyId) return;
    setSaving(true);
    try {
      const { data: agency, error } = await supabase
        .from('agencies')
        .insert({ name: newAgencyName.trim(), company_id: companyId })
        .select()
        .single();

      if (error) throw error;

      if (selectedDirector && agency) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ agency_id: agency.id })
          .eq('id', selectedDirector);
        if (profileError) console.error('Error assigning director:', profileError);
      }

      toast.success('Loja criada com sucesso!');
      setShowCreateDialog(false);
      setNewAgencyName('');
      setSelectedDirector('');
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao criar loja: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingAgency || !editName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ name: editName.trim() })
        .eq('id', editingAgency.id);

      if (error) throw error;

      // Remove old director assignment
      const oldDirector = getDirectorForAgency(editingAgency.id);
      if (oldDirector && oldDirector.id !== editDirector) {
        await supabase.from('profiles').update({ agency_id: null }).eq('id', oldDirector.id);
      }

      // Assign new director
      if (editDirector && editDirector !== 'none') {
        await supabase.from('profiles').update({ agency_id: editingAgency.id }).eq('id', editDirector);
      }

      toast.success('Loja atualizada com sucesso!');
      setShowEditDialog(false);
      setEditingAgency(null);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao atualizar loja: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agency: Agency) => {
    if (!confirm(`Deseja realmente excluir a loja "${agency.name}"?`)) return;
    try {
      // Unassign directors first
      await supabase.from('profiles').update({ agency_id: null }).eq('agency_id', agency.id);
      const { error } = await supabase.from('agencies').delete().eq('id', agency.id);
      if (error) throw error;
      toast.success('Loja excluída com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao excluir loja: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const openEditDialog = (agency: Agency) => {
    setEditingAgency(agency);
    setEditName(agency.name);
    const director = getDirectorForAgency(agency.id);
    setEditDirector(director?.id || 'none');
    setShowEditDialog(true);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando lojas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {agencies.length} loja{agencies.length !== 1 ? 's' : ''} cadastrada{agencies.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Loja
        </Button>
      </div>

      {agencies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma loja cadastrada ainda</p>
          <p className="text-xs">Crie a primeira loja do seu grupo</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {agencies.map((agency) => {
            const director = getDirectorForAgency(agency.id);
            return (
              <Card key={agency.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate">{agency.name}</h4>
                        {director ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">
                              Diretor: {director.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-warning">Sem diretor atribuído</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={agency.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                        {agency.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(agency)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(agency)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Loja / Imobiliária</DialogTitle>
            <DialogDescription>Adicione uma nova loja ao seu grupo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Loja</Label>
              <Input
                placeholder="Ex: Senador Canedo"
                value={newAgencyName}
                onChange={(e) => setNewAgencyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Diretor Responsável (opcional)</Label>
              <Select value={selectedDirector} onValueChange={setSelectedDirector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um diretor" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDirectors().map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newAgencyName.trim() || saving}>
              {saving ? 'Criando...' : 'Criar Loja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
            <DialogDescription>Altere o nome ou o diretor da loja</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Loja</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Diretor Responsável</Label>
              <Select value={editDirector} onValueChange={setEditDirector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um diretor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {getAvailableDirectors(editingAgency?.id).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.full_name} ({d.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={!editName.trim() || saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyManager;
