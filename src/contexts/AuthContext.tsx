import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  role: string;
  allowed_screens: string[];
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  avatar_url?: string;
  team_id?: string;
  manager_id?: string;
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
  const [teamHierarchy, setTeamHierarchy] = useState<TeamHierarchy | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Fetch team hierarchy after profile
      if (data) {
        fetchTeamHierarchy(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
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
    return profile?.is_admin ?? false;
  };

  const isDiretor = (): boolean => {
    return profile?.role === 'diretor' || profile?.role === 'admin';
  };

  const isGerente = (): boolean => {
    return profile?.role === 'gerente';
  };

  const isCorretor = (): boolean => {
    return profile?.role === 'corretor';
  };

  const getUserRole = (): string => {
    return profile?.role ?? 'corretor';
  };

  const getDefaultRoute = (): string => {
    if (!profile) return '/';
    
    switch (profile.role) {
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
    if (!profile || !user) return false;
    
    // Diretor e Admin podem acessar dados de todos
    if (profile.role === 'diretor' || profile.role === 'admin') return true;
    
    // Gerente pode acessar dados da sua equipe
    if (profile.role === 'gerente' && teamHierarchy) {
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