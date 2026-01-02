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
  error: string | null;
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
  clearError: () => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teamHierarchy, setTeamHierarchy] = useState<TeamHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchProfile = async (userId: string): Promise<boolean> => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
        setUserRole(null);
        return false;
      }
      
      setProfile(profileData);
      
      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (!roleError && roleData) {
        setUserRole(roleData.role);
      } else {
        setUserRole('corretor'); // Default role
      }
      
      // Fetch team hierarchy
      try {
        const { data: hierarchyData, error: hierarchyError } = await supabase
          .rpc('get_team_hierarchy', { user_id: userId });

        if (!hierarchyError && hierarchyData?.[0]) {
          setTeamHierarchy(hierarchyData[0]);
        } else {
          setTeamHierarchy(null);
        }
      } catch (err) {
        console.error('Error fetching team hierarchy:', err);
        setTeamHierarchy(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setUserRole(null);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener - SYNCHRONOUS callback (Supabase recommendation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;
        
        // Update session and user synchronously
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          // Clear all auth state on sign out
          setProfile(null);
          setUserRole(null);
          setTeamHierarchy(null);
          setLoading(false);
          return;
        }
        
        if (newSession?.user) {
          // Defer profile fetch to avoid Supabase deadlock
          // Use setTimeout(0) as recommended by Supabase docs
          setTimeout(() => {
            if (!isMounted) return;
            fetchProfile(newSession.user.id).finally(() => {
              if (isMounted) {
                setLoading(false);
              }
            });
          }, 0);
        } else {
          // No user, stop loading immediately
          setLoading(false);
        }
      }
    );

    // Get initial session - this will trigger INITIAL_SESSION event
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (!isMounted) return;
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Erro ao verificar sessão');
        setLoading(false);
        return;
      }
      
      // If no session exists, onAuthStateChange might not fire, so handle it here
      if (!initialSession) {
        setLoading(false);
      }
      // If session exists, onAuthStateChange will handle it
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setLoading(false);
        return { error };
      }
      
      // onAuthStateChange will handle the rest
      return { error: null };
    } catch (error) {
      setLoading(false);
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
    setLoading(true);
    await supabase.auth.signOut();
    // onAuthStateChange will handle clearing state
  };

  const hasAccess = (screen: string): boolean => {
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
    return '/';
  };

  const canAccessUserData = (userId: string): boolean => {
    if (!userRole || !user) return false;
    
    if (userRole === 'diretor' || userRole === 'admin') return true;
    
    if (userRole === 'gerente' && teamHierarchy) {
      return teamHierarchy.team_members.includes(userId);
    }
    
    return user.id === userId;
  };

  const value = {
    user,
    session,
    profile,
    teamHierarchy,
    loading,
    error,
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
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
