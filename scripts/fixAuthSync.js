const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../farm-flow-frontend');

// 1. Update useAuth.ts to dispatch and listen to @FarmFlow:authChange
const useAuthPath = path.join(frontendDir, 'src/hooks/useAuth.ts');
const useAuthContent = `import { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  role: string | null;
  avatar_url: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    // 1. Check local backend session in localStorage
    const localToken = localStorage.getItem('@FarmFlow:token');
    const localUserStr = localStorage.getItem('@FarmFlow:user');

    if (localToken && localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        setUser(localUser);
        setSession({ access_token: localToken, user: localUser });
        setProfile({
          id: localUser.id,
          user_id: localUser.id,
          name: localUser.name || 'Usuário',
          role: localUser.role || 'admin',
          avatar_url: localUser.avatar_url || null,
        });
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('@FarmFlow:token');
        localStorage.removeItem('@FarmFlow:user');
      }
    }

    // 2. Fallback to Supabase session
    try {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      if (sbSession) {
        setSession(sbSession);
        setUser(sbSession.user);
        fetchProfile(sbSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.warn('Supabase getSession error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    // Listen for custom auth events across different hook instances
    const handleCustomAuthChange = () => {
      initAuth();
    };
    window.addEventListener('@FarmFlow:authChange', handleCustomAuthChange);

    // Supabase auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sbSession) => {
        const localToken = localStorage.getItem('@FarmFlow:token');
        if (!localToken) {
          setSession(sbSession);
          setUser(sbSession?.user ?? null);
          if (sbSession?.user) {
            setTimeout(() => {
              fetchProfile(sbSession.user.id);
            }, 0);
          } else {
            setProfile(null);
          }
        }
      }
    );

    return () => {
      window.removeEventListener('@FarmFlow:authChange', handleCustomAuthChange);
      subscription.unsubscribe();
    };
  }, [initAuth]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
    } catch {
      // ignore
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // 1. Try backend user creation
    try {
      const created = await api.post<any>('/users', { name, email, password });
      if (created && created.id) {
        return { data: { user: created }, error: null };
      }
    } catch (backendErr: any) {
      console.warn('Backend signUp error, attempting Supabase fallback...', backendErr?.message);
    }

    // 2. Fallback to Supabase
    const redirectUrl = \`\${window.location.origin}/\`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
      }
    });

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    // 1. Try backend authentication first
    try {
      const res = await api.post<{ user: any; token: string }>('/sessions', {
        email,
        password,
      });

      if (res && res.token && res.user) {
        localStorage.setItem('@FarmFlow:token', res.token);
        localStorage.setItem('@FarmFlow:user', JSON.stringify(res.user));
        setUser(res.user);
        setSession({ access_token: res.token, user: res.user });
        setProfile({
          id: res.user.id,
          user_id: res.user.id,
          name: res.user.name,
          role: res.user.role,
          avatar_url: res.user.avatar_url || null,
        });

        // Notify all useAuth instances immediately
        window.dispatchEvent(new CustomEvent('@FarmFlow:authChange'));

        return { data: { user: res.user, session: { access_token: res.token } }, error: null };
      }
    } catch (backendErr: any) {
      console.warn('Backend login failed, attempting Supabase fallback...', backendErr?.message);
    }

    // 2. Fallback to Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
      fetchProfile(data.user.id);
      window.dispatchEvent(new CustomEvent('@FarmFlow:authChange'));
    }

    return { data, error };
  };

  const signOut = async () => {
    localStorage.removeItem('@FarmFlow:token');
    localStorage.removeItem('@FarmFlow:user');
    setUser(null);
    setSession(null);
    setProfile(null);

    // Notify all useAuth instances immediately
    window.dispatchEvent(new CustomEvent('@FarmFlow:authChange'));

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    return { error: null };
  };

  return {
    user,
    session,
    profile,
    loading,
    refreshAuth: initAuth,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };
};
`;

fs.writeFileSync(useAuthPath, useAuthContent, 'utf8');
console.log('✅ useAuth.ts updated with synchronized event bus (@FarmFlow:authChange)');

// 2. Update Index.tsx to trigger refreshAuth on handleAuthSuccess
const indexPath = path.join(frontendDir, 'src/pages/Index.tsx');
const indexContent = `import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/MainLayout";
import Auth from "./Auth";

const Index = () => {
  const { session, loading, refreshAuth } = useAuth();

  const handleAuthSuccess = () => {
    refreshAuth();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-green-700 text-lg">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return <MainLayout />;
};

export default Index;
`;

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ Index.tsx updated to immediately refresh auth on handleAuthSuccess');
