import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, UserMinus, Crown, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const TeamMemberManager = () => {
  const { isGerente, isDiretor, profile, teamHierarchy } = useAuth();
  const { teams, teamMembers, loading, assignMemberToTeam } = useTeams();
  const [selectedMember, setSelectedMember] = useState<string>('');

  // Only show to managers and directors
  if (!isGerente() && !isDiretor()) {
    return null;
  }

  // Get current user's team (for managers)
  const currentUserTeam = isGerente() && teamHierarchy ? 
    teams.find(team => team.id === teamHierarchy.team_id) : null;

  // Filter members based on role
  const availableMembers = teamMembers.filter(member => {
    if (isDiretor()) {
      // Directors can manage all members
      return member.role === 'corretor' || member.role === 'gerente';
    } else if (isGerente()) {
      // Managers can only manage corretors not in any team or in their team
      return member.role === 'corretor';
    }
    return false;
  });

  const teamMembersInTeam = isGerente() && currentUserTeam ? 
    availableMembers.filter(member => member.team_id === currentUserTeam.id) :
    availableMembers.filter(member => member.team_id);

  const membersWithoutTeam = availableMembers.filter(member => !member.team_id);

  const handleAddMember = async () => {
    if (!selectedMember) return;

    const targetTeamId = isGerente() && currentUserTeam ? currentUserTeam.id : null;
    if (!targetTeamId && isGerente()) return;

    await assignMemberToTeam(selectedMember, targetTeamId);
    setSelectedMember('');
  };

  const handleRemoveMember = async (memberId: string) => {
    await assignMemberToTeam(memberId, null);
  };

  const handleAssignToTeam = async (memberId: string, teamId: string) => {
    await assignMemberToTeam(memberId, teamId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {isGerente() ? 'Minha Equipe' : 'Gerenciamento de Membros'}
        </CardTitle>
        <CardDescription>
          {isGerente() 
            ? `Gerencie os corretores da sua equipe: ${currentUserTeam?.name || 'Sem equipe'}`
            : 'Organize membros em equipes'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Add Member Section */}
          {membersWithoutTeam.length > 0 && (isGerente() ? currentUserTeam : true) && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {isGerente() ? 'Adicionar Corretor à Equipe' : 'Membros sem Equipe'}
              </h3>
              <div className="flex gap-2">
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um membro" />
                  </SelectTrigger>
                  <SelectContent>
                    {membersWithoutTeam.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {member.role === 'gerente' ? (
                              <Crown className="h-3 w-3" />
                            ) : (
                              <Briefcase className="h-3 w-3" />
                            )}
                            <span>{member.full_name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddMember} disabled={!selectedMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isGerente() ? 'Adicionar' : 'Atribuir'}
                </Button>
              </div>
            </div>
          )}

          {/* Current Team Members */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {isGerente() ? 'Membros da Equipe' : 'Membros com Equipe'}
              <span className="ml-2 text-muted-foreground">
                ({teamMembersInTeam.length})
              </span>
            </h3>
            
            {teamMembersInTeam.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isGerente() ? 'Sua equipe ainda não tem membros' : 'Nenhum membro atribuído a equipes'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembersInTeam.map((member) => {
                  const memberTeam = teams.find(team => team.id === member.team_id);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {member.role === 'gerente' ? (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Briefcase className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {member.role}
                          </Badge>
                          {memberTeam && (
                            <Badge variant="outline" className="text-xs">
                              {memberTeam.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDiretor() && (
                          <Select 
                            value={member.team_id || 'none'} 
                            onValueChange={(teamId) => handleAssignToTeam(member.id, teamId === 'none' ? '' : teamId)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Selecionar equipe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem equipe</SelectItem>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover da Equipe</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover {member.full_name} da equipe? 
                                O membro ficará sem equipe atribuída.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveMember(member.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberManager;