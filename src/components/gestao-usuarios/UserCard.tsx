import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/UserAvatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, ChevronRight, Pencil, KeyRound, Trash2, 
  UserX, ArrowRightLeft, ShieldAlert, Mail, Phone, Calendar, User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UserData {
  id: string;
  full_name: string;
  nickname?: string;
  email: string;
  phone?: string;
  birth_date?: string;
  avatar_url?: string;
  status: string;
  approved: boolean;
  team_id?: string;
  team_name?: string;
  role: string;
  created_at?: string;
  last_login_at?: string;
  broker_id?: string;
  broker_email?: string;
}

interface UserCardProps {
  user: UserData;
  isCurrentUser: boolean;
  canManage: boolean;
  isAdmin: boolean;
  onEdit: (user: UserData) => void;
  onResetPassword: (user: UserData) => void;
  onToggleStatus: (user: UserData) => void;
  onDelete: (user: UserData) => void;
  onTransferTeam: (user: UserData) => void;
}

const roleBadgeStyles: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  diretor: 'bg-warning/10 text-warning border-warning/20',
  gerente: 'bg-primary/10 text-primary border-primary/20',
  corretor: 'bg-success/10 text-success border-success/20',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  diretor: 'Diretor',
  gerente: 'Gerente',
  corretor: 'Corretor',
};

const UserCard: React.FC<UserCardProps> = ({
  user, isCurrentUser, canManage, isAdmin,
  onEdit, onResetPassword, onToggleStatus, onDelete, onTransferTeam
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "overflow-hidden transition-all",
        user.status === 'inativo' && "opacity-60",
        !user.approved && "border-warning/40"
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left">
            <UserAvatar name={user.full_name} avatarUrl={user.avatar_url} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground truncate">{user.full_name}</span>
                {user.nickname && (
                  <span className="text-xs text-muted-foreground">({user.nickname})</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", roleBadgeStyles[user.role])}>
                  {roleLabels[user.role] || user.role}
                </Badge>
                {user.team_name && (
                  <span className="text-[10px] text-muted-foreground">{user.team_name}</span>
                )}
                {user.status === 'inativo' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">
                    Inativo
                  </Badge>
                )}
                {!user.approved && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-warning/10 text-warning border-warning/20">
                    Pendente
                  </Badge>
                )}
              </div>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            <Separator className="mb-4" />

            {/* Dados Básicos */}
            <div className="space-y-3 mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" /> Dados Básicos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Email de login:</span>
                  <span className="truncate font-medium">{user.email}</span>
                </div>
                {user.broker_email && user.broker_email.toLowerCase() !== user.email.toLowerCase() && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Email pessoal:</span>
                    <span className="truncate">{user.broker_email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Telefone:</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.birth_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Nascimento:</span>
                    <span>{new Date(user.birth_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Perfil:</span>
                  <span>{roleLabels[user.role] || user.role}</span>
                </div>
                {user.team_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Equipe:</span>
                    <span>{user.team_name}</span>
                  </div>
                )}
                {user.last_login_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Último login:</span>
                    <span>{new Date(user.last_login_at).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            {canManage && !isCurrentUser && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onResetPassword(user)}>
                    <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Resetar Senha
                  </Button>
                  <Button 
                    variant="outline" size="sm" 
                    onClick={() => onToggleStatus(user)}
                    className={user.status === 'inativo' ? 'text-success' : 'text-warning'}
                  >
                    <UserX className="h-3.5 w-3.5 mr-1.5" />
                    {user.status === 'inativo' ? 'Ativar' : 'Inativar'}
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onTransferTeam(user)}>
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" /> Transferir Equipe
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => onDelete(user)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default UserCard;
