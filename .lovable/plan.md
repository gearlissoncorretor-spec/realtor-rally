
# Corrigir Tela de Acesso Restrito e Botao Voltar

## Problema Identificado

Quando um corretor acessa a aplicacao e cai na tela "Acesso Restrito", ele fica preso em um loop:
1. O botao **"Ir para Inicio"** redireciona para `/` (que e a mesma rota que negou acesso), criando um ciclo infinito
2. O botao **"Voltar"** usa `window.history.back()` que nao ajuda se o usuario acabou de entrar no app - ele precisa de uma opcao para **sair e fazer login com outro usuario**

Alem disso, a funcao `getDefaultRoute()` sempre retorna `/` sem considerar quais telas o usuario realmente tem acesso.

## Solucao

### 1. Corrigir `getDefaultRoute()` no AuthContext
Alterar a funcao para que retorne a primeira rota que o usuario tem permissao de acessar, em vez de sempre retornar `/`.

Logica:
- Verificar `allowed_screens` do perfil
- Retornar a primeira tela permitida (priorizando `dashboard` > `vendas` > outras)
- Se nenhuma tela for permitida, retornar `/auth` (tela de login)

### 2. Corrigir a tela AccessDeniedMessage
- Substituir o botao "Voltar" por um botao **"Sair / Trocar conta"** que faz logout e redireciona para `/auth`
- Manter o botao "Ir para Inicio" mas agora apontando para a rota correta (via `getDefaultRoute()` corrigido)

### 3. Garantir que ProtectedRoute redirecione corretamente
- Se o usuario nao tem acesso a tela atual, em vez de mostrar Access Denied, redirecionar automaticamente para a rota padrao do usuario

---

## Detalhes Tecnicos

### Arquivo: `src/contexts/AuthContext.tsx`
Alterar `getDefaultRoute()`:
```typescript
const getDefaultRoute = (): string => {
  const screens = profile?.allowed_screens || [];
  const screenToRoute: Record<string, string> = {
    'dashboard': '/',
    'vendas': '/vendas',
    'negociacoes': '/negociacoes',
    'follow-up': '/follow-up',
    'metas': '/metas',
    'atividades': '/atividades',
    'tarefas-kanban': '/tarefas-kanban',
    'corretores': '/corretores',
    'equipes': '/equipes',
    'ranking': '/ranking',
    'acompanhamento': '/acompanhamento',
    'relatorios': '/relatorios',
    'configuracoes': '/configuracoes',
    'agenda': '/agenda',
  };
  
  const priority = ['dashboard', 'vendas', 'negociacoes', 'metas', 'atividades'];
  for (const screen of priority) {
    if (screens.includes(screen)) {
      return screenToRoute[screen] || '/';
    }
  }
  
  if (screens.length > 0 && screenToRoute[screens[0]]) {
    return screenToRoute[screens[0]];
  }
  
  return '/';
};
```

### Arquivo: `src/components/AccessDeniedMessage.tsx`
- Substituir botao "Voltar" por botao "Trocar Conta" que chama `signOut()` e navega para `/auth`
- Manter botao "Ir para Inicio" que agora usara a rota correta

### Arquivo: `src/components/ProtectedRoute.tsx`
- Quando o acesso for negado, em vez de mostrar `<AccessDenied />`, redirecionar com `<Navigate to={getDefaultRoute()} />` (apenas se a rota padrao for diferente da atual, para evitar loop infinito)
- Se a rota padrao for a mesma da atual, ai sim mostrar Access Denied com opcao de logout

---

## Arquivos Modificados
1. `src/contexts/AuthContext.tsx` - getDefaultRoute() inteligente
2. `src/components/AccessDeniedMessage.tsx` - botao "Trocar Conta" com logout
3. `src/components/ProtectedRoute.tsx` - redirecionamento automatico
