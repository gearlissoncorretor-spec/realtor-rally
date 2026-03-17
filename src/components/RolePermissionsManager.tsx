import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRolePermissions, ALL_SCREENS, CONFIGURABLE_ROLES } from '@/hooks/useRolePermissions';
import { ScrollArea } from '@/components/ui/scroll-area';

const PERMISSION_TYPES = [
  { key: 'can_view' as const, label: 'Ver', short: 'V' },
  { key: 'can_create' as const, label: 'Criar', short: 'C' },
  { key: 'can_edit' as const, label: 'Editar', short: 'E' },
  { key: 'can_delete' as const, label: 'Excluir', short: 'X' },
];

export const RolePermissionsManager = () => {
  const { permissions, loading, getPermission, upsertPermission } = useRolePermissions();
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (role: string, screen: string, permType: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') => {
    const current = getPermission(role, screen);
    const key = `${role}-${screen}-${permType}`;
    setSaving(key);

    try {
      const updated = { ...current, [permType]: !current[permType] };

      // If disabling view, disable all others
      if (permType === 'can_view' && current.can_view) {
        updated.can_create = false;
        updated.can_edit = false;
        updated.can_delete = false;
      }

      // If enabling create/edit/delete, auto-enable view
      if (permType !== 'can_view' && !current[permType]) {
        updated.can_view = true;
      }

      await upsertPermission(updated);
    } catch (err: any) {
      toast.error('Erro ao salvar permissão: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleAllScreen = async (role: string, screen: string) => {
    const current = getPermission(role, screen);
    const allEnabled = current.can_view && current.can_create && current.can_edit && current.can_delete;
    setSaving(`${role}-${screen}-all`);

    try {
      await upsertPermission({
        role,
        screen,
        can_view: !allEnabled,
        can_create: !allEnabled,
        can_edit: !allEnabled,
        can_delete: !allEnabled,
      });
    } catch (err: any) {
      toast.error('Erro ao salvar permissão: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gestão de Permissões por Perfil
        </CardTitle>
        <CardDescription>
          Configure quais ações cada perfil de usuário pode realizar em cada tela do sistema.
          Diretores e Administradores possuem acesso total automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[700px]">
            {CONFIGURABLE_ROLES.map((role) => (
              <div key={role.value} className="mb-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">{role.label}</Badge>
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Tela</th>
                        {PERMISSION_TYPES.map(pt => (
                          <th key={pt.key} className="text-center p-3 font-medium w-20">{pt.label}</th>
                        ))}
                        <th className="text-center p-3 font-medium w-20">Tudo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_SCREENS.map((screen, idx) => {
                        const perm = getPermission(role.value, screen.value);
                        const allEnabled = perm.can_view && perm.can_create && perm.can_edit && perm.can_delete;

                        return (
                          <tr key={screen.value} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="p-3 font-medium">{screen.label}</td>
                            {PERMISSION_TYPES.map(pt => {
                              const key = `${role.value}-${screen.value}-${pt.key}`;
                              const isSaving = saving === key || saving === `${role.value}-${screen.value}-all`;

                              return (
                                <td key={pt.key} className="text-center p-3">
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                  ) : (
                                    <Checkbox
                                      checked={perm[pt.key]}
                                      onCheckedChange={() => handleToggle(role.value, screen.value, pt.key)}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center p-3">
                              {saving === `${role.value}-${screen.value}-all` ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                              ) : (
                                <Checkbox
                                  checked={allEnabled}
                                  onCheckedChange={() => handleToggleAllScreen(role.value, screen.value)}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
