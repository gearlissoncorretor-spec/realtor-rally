import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Clock } from 'lucide-react';
import { CreateUserForm } from './user-management/CreateUserForm';
import { UsersList } from './user-management/UsersList';
import { PendingApprovals } from './user-management/PendingApprovals';

export const UserManagementHub = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription>
          Central de controle para criação, edição e aprovação de usuários do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Criar Usuário
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendências
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <UsersList refreshTrigger={refreshTrigger} />
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
            <CreateUserForm onUserCreated={() => {
              triggerRefresh();
              setActiveTab("users");
            }} />
          </TabsContent>
          
          <TabsContent value="pending" className="mt-6">
            <PendingApprovals onApprovalChange={triggerRefresh} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};