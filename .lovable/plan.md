# Reestruturação de Usuários, Permissões e Telas

Objetivo: simplificar a administração, centralizar a gestão de usuários numa única tela e clarificar a matriz de permissões por perfil.

## 1. Matriz de perfis (hierarquia)

| Perfil | Acesso |
|---|---|
| **Admin Dev** (`admin` / `super_admin`) | Tudo, sem restrições — incluindo logs, configurações avançadas, todas as lojas |
| **Diretor da Loja** (`socio` + `diretor` unificados como "Diretor da Loja") | Tudo da loja: usuários, equipes, permissões, relatórios, configurações da loja |
| **Gerente** | Sua equipe: visualizar e editar dados básicos dos corretores, solicitar reset de senha. Sem configurações críticas |
| **Corretor** | Apenas dados operacionais próprios |

> Nota: hoje o sistema tem 5 níveis (`super_admin > socio > admin > diretor > gerente > corretor`). A nova estrutura colapsa para 4 níveis lógicos. `super_admin` continua como Admin Dev global; `socio` e `diretor` passam a ter as mesmas permissões dentro da loja (rótulo unificado "Diretor da Loja"); papel `admin` fica reservado a equipe interna.

## 2. Tela única "Gestão de Usuários" (`/gestao-usuarios`)

Consolidar em **uma única página com abas**, substituindo as telas hoje espalhadas (`UserManagementHub`, `RolePermissionsManager` em Configurações, formulários soltos):

```text
┌─ Gestão de Usuários ──────────────────────────────┐
│ [Lista] [Criar] [Pendências] [Permissões] [Logs]  │
├───────────────────────────────────────────────────┤
│ Busca: nome | email | perfil | loja | equipe |    │
│        status                                     │
│                                                   │
│ Linha do usuário → ações inline:                  │
│   ✎ Editar  🔑 Senha  🔄 Perfil  🏪 Loja/Equipe   │
│   ⏸ Ativar/Desativar  🗑 Excluir                  │
└───────────────────────────────────────────────────┘
```

Abas:
- **Lista** — busca + filtros (nome, email, perfil, loja, equipe, status), ações inline
- **Criar** — formulário de cadastro
- **Pendências** — aprovações de signup
- **Permissões** — matriz por perfil (atual `RolePermissionsManager`)
- **Logs** — audit_logs filtrado por usuários (Admin Dev e Diretor)

## 3. Consolidação de menus

Reorganizar a navegação para reduzir cliques:

**Antes** (menus separados): Configurações · Gestão de Usuários · Equipes · Corretores · Permissões (dentro de Config)

**Depois**:
- **Administração** (novo grupo no menu, só para Diretor+/Admin)
  - Gestão de Usuários (tudo de pessoas)
  - Equipes & Lojas (agencies + teams numa só tela com abas)
  - Configurações da Loja (branding, parâmetros, integrações)
- Cadastros operacionais (Vendas, Negociações, etc.) permanecem como estão

## 4. Matriz de permissões revisada

Atualizar `src/lib/roleScreens.ts` para refletir os 4 níveis:

| Tela | Admin Dev | Diretor Loja | Gerente | Corretor |
|---|---|---|---|---|
| Dashboard, Vendas, Negociações, Follow-up, Metas, Atividades, Agenda, Comissões | ✓ | ✓ | ✓ | ✓ |
| Equipes, Corretores, Ranking, X1, Acompanhamento, Meta-Gestão, Dashboard Equipes | ✓ | ✓ | ✓ | — |
| Central Gestor, Relatórios | ✓ | ✓ | — | — |
| Gestão de Usuários, Permissões, Equipes & Lojas, Configurações da Loja | ✓ | ✓ | — | — |
| Logs, Super Admin, Parâmetros do Sistema | ✓ | — | — | — |

Botões CRUD (criar/editar/excluir/exportar) controlados pela matriz `role_permissions` já existente — Diretor pode customizar para Gerente/Corretor.

## 5. Implementação técnica

### Backend (1 migração)
- Garantir que policies em `profiles` permitam Diretor da Loja gerenciar usuários da própria `company_id` (criar/editar/excluir/promover entre corretor↔gerente↔diretor, exceto promover a admin/super_admin)
- Trigger `prevent_privilege_escalation` continua bloqueando escalada para admin/super_admin
- Função `can_manage_user(target_id)` SECURITY DEFINER para uso em policies e no frontend

### Frontend
- `src/pages/GestaoUsuarios.tsx` — refatorar para abas Lista/Criar/Pendências/Permissões/Logs
- `src/components/gestao-usuarios/UsersList.tsx` — ações inline (ativar, desativar, excluir, mudar perfil, reset senha, mudar loja/equipe)
- `src/components/gestao-usuarios/EditUserDialog.tsx` — campos perfil, loja, equipe, status
- `src/components/Navigation.tsx` — novo grupo "Administração" para Diretor+
- `src/lib/roleScreens.ts` — nova matriz
- `src/contexts/AuthContext.tsx` — helper `isDiretor()` passa a cobrir socio+diretor
- Remover/redirecionar telas duplicadas: `UserManagementHub`, aba de permissões dentro de Configurações

### Edge functions
- `create-user` e `update-user-*` já existem — adicionar verificação de "pode promover até nível X" baseado no perfil do chamador

## 6. Entregáveis

1. Migração SQL com policies revisadas + função `can_manage_user`
2. Tela `/gestao-usuarios` unificada com 5 abas
3. Navegação reagrupada com seção "Administração"
4. Matriz de permissões atualizada em `roleScreens.ts`
5. Edge functions com guard de hierarquia
6. Documento `docs/permissoes.md` com a matriz final

## Fora de escopo

- Mudanças visuais profundas (mantém o design system atual)
- Mudar nomes de papéis no banco (`socio`/`diretor` continuam existindo — só o rótulo na UI vira "Diretor da Loja")
- Multi-loja por usuário (1 usuário continua em 1 company_id)
