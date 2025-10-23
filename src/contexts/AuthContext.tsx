import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  allowed_screens: string[];
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  avatar_url?: string;
  team_id?: string;
  manager_id?: string;
}

interface UserRole {
  role: string;
}

interface TeamHierarchy {
  team_id: string | null;
  team_name: string | null;
  is_manager: boolean;
  team_members: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  teamHierarchy: TeamHierarchy | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasAccess: (screen: string) => boolean;
  isAdmin: () => boolean;
  isDiretor: () => boolean;
  isGerente: () => boolean;
  isCorretor: () => boolean;
  getUserRole: () => string;
  getDefaultRoute: () => string;
  canAccessUserData: (userId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Authentication state - restored to use actual Supabase auth
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teamHierarchy, setTeamHierarchy] = useState<TeamHierarchy | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      
      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!roleError && roleData) {
        setUserRole(roleData.role);
      }
      
      // Fetch team hierarchy after profile
      if (profileData) {
        fetchTeamHierarchy(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setUserRole(null);
    }
  };

  const fetchTeamHierarchy = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_team_hierarchy', { user_id: userId });

      if (error) throw error;
      setTeamHierarchy(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching team hierarchy:', error);
      setTeamHierarchy(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching to avoid callback issues
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasAccess = (screen: string): boolean => {
    // Check if user profile has access to the screen
    return profile?.allowed_screens?.includes(screen) ?? false;
  };

  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  const isDiretor = (): boolean => {
    return userRole === 'diretor' || userRole === 'admin';
  };

  const isGerente = (): boolean => {
    return userRole === 'gerente';
  };

  const isCorretor = (): boolean => {
    return userRole === 'corretor';
  };

  const getUserRole = (): string => {
    return userRole ?? 'corretor';
  };

  const getDefaultRoute = (): string => {
    if (!userRole) return '/';
    
    switch (userRole) {
      case 'diretor':
        return '/'; // Dashboard geral do diretor
      case 'gerente':
        return '/'; // Dashboard da equipe do gerente
      case 'corretor':
        return '/'; // Dashboard individual do corretor
      default:
        return '/';
    }
  };

  const canAccessUserData = (userId: string): boolean => {
    if (!userRole || !user) return false;
    
    // Diretor e Admin podem acessar dados de todos
    if (userRole === 'diretor' || userRole === 'admin') return true;
    
    // Gerente pode acessar dados da sua equipe
    if (userRole === 'gerente' && teamHierarchy) {
      return teamHierarchy.team_members.includes(userId);
    }
    
    // Corretor só pode acessar seus próprios dados
    return user.id === userId;
  };

  const value = {
    user,
    session,
    profile,
    teamHierarchy,
    loading,
    signIn,
    signUp,
    resetPassword,
    signOut,
    hasAccess,
    isAdmin,
    isDiretor,
    isGerente,
    isCorretor,
    getUserRole,
    getDefaultRoute,
    canAccessUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};