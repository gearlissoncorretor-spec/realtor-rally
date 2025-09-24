import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2,
  Target,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/useTeams";
import { useSales } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";

const Equipes = () => {
  const { toast } = useToast();
  const { isDiretor } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  const { teams, teamMembers, loading, createTeam, updateTeam, deleteTeam } = useTeams();
  const { sales } = useSales();

  // Only directors can access this page
  if (!isDiretor()) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedTeam) {
        await updateTeam(selectedTeam.id, formData);
        setIsEditDialogOpen(false);
      } else {
        await createTeam(formData);
        setIsCreateDialogOpen(false);
      }
      setFormData({ name: '', description: '' });
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error submitting team:', error);
    }
  };

  const handleEdit = (team: any) => {
    setSelectedTeam(team);
    setFormData({ name: team.name, description: team.description || '' });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const getTeamMemberCount = (teamId: string) => {
    return teamMembers.filter(member => member.team_id === teamId).length;
  };

  const getTeamStats = (teamId: string) => {
    const teamMemberIds = teamMembers
      .filter(member => member.team_id === teamId)
      .map(member => member.id);
    
    const teamSales = sales.filter(sale => 
      sale.broker_id && teamMemberIds.includes(sale.broker_id)
    );
    
    const confirmedSales = teamSales.filter(sale => sale.status === 'confirmada');
    const totalRevenue = confirmedSales.reduce((sum, sale) => sum + Number(sale.property_value || 0), 0);
    const totalVGV = confirmedSales.reduce((sum, sale) => sum + Number(sale.vgv || 0), 0);
    
    return {
      salesCount: confirmedSales.length,
      totalRevenue,
      totalVGV,
      averageTicket: confirmedSales.length > 0 ? totalRevenue / confirmedSales.length : 0
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
              Equipes
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Gerencie as equipes de vendas da sua empresa
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Equipe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Equipe</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Equipe</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome da equipe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a equipe..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Equipe</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Carregando equipes...</p>
          </Card>
        ) : teams.length === 0 ? (
          <Card className="p-6">
            <div className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma equipe encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira equipe para começar a organizar seus corretores.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Equipe
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {teams.map((team, index) => {
              const memberCount = getTeamMemberCount(team.id);
              const stats = getTeamStats(team.id);
              
              return (
                <Card key={team.id} className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{team.name}</h3>
                          <p className="text-muted-foreground">{team.description || 'Sem descrição'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <Badge variant="secondary" className="gap-1">
                          <Users className="w-3 h-3" />
                          {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(team)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a equipe "{team.name}"? 
                              Os membros da equipe não serão excluídos, apenas desvinculados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(team.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Team Performance Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Vendas</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stats.salesCount}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="text-sm text-muted-foreground">VGV</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        R$ {stats.totalVGV > 1000000 
                          ? `${(stats.totalVGV / 1000000).toFixed(1)}M` 
                          : `${(stats.totalVGV / 1000).toFixed(0)}K`}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-info" />
                        <span className="text-sm text-muted-foreground">Ticket Médio</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        R$ {stats.averageTicket > 0 ? (stats.averageTicket / 1000).toFixed(0) : '0'}K
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-warning" />
                        <span className="text-sm text-muted-foreground">Membros</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{memberCount}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Equipe</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome da equipe"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição (Opcional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a equipe..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipes;