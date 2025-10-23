import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, Settings } from 'lucide-react';

const AuthButton = () => {
  const { user, profile, signOut, loading, isAdmin } = useAuth();

  if (loading) {
    return null;
  }

  if (!user || !profile) {
    return (
      <Link to="/auth">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <User className="h-4 w-4 mr-2" />
          Admin
        </Button>
      </Link>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = profile.full_name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{profile.full_name.split(' ')[0]}</span>
          {isAdmin() && (
            <span className="ml-1 text-xs text-primary font-medium">Admin</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{profile.full_name}</p>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>
        <DropdownMenuSeparator />
        {isAdmin() && (
          <DropdownMenuItem asChild>
            <Link to="/configuracoes" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthButton;