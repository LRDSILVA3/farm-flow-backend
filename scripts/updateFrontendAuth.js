const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../farm-flow-frontend');

// 1. Update useAuth.ts
const useAuthContent = `import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const initAuth = async () => {
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
        }
      } catch (err) {
        console.warn('Supabase getSession error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

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

    return () => subscription.unsubscribe();
  }, []);

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
    }

    return { data, error };
  };

  const signOut = async () => {
    localStorage.removeItem('@FarmFlow:token');
    localStorage.removeItem('@FarmFlow:user');
    setUser(null);
    setSession(null);
    setProfile(null);

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
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };
};
`;

fs.writeFileSync(path.join(frontendDir, 'src/hooks/useAuth.ts'), useAuthContent, 'utf8');
console.log('✅ useAuth.ts updated with Backend-First + Supabase Fallback');

// 2. Update Auth.tsx to call signIn / signUp from useAuth
const authFilePath = path.join(frontendDir, 'src/pages/Auth.tsx');
let authContent = fs.readFileSync(authFilePath, 'utf8');

// Ensure useAuth import
if (!authContent.includes('useAuth')) {
  authContent = authContent.replace(
    'import { useState } from "react";',
    'import { useState } from "react";\nimport { useAuth } from "@/hooks/useAuth";'
  );
}

// In Auth component, destructure signIn, signUp from useAuth()
authContent = authContent.replace(
  'const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {',
  'const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {\n  const { signIn, signUp } = useAuth();'
);

// Replace handleLogin implementation
const loginRegex = /const handleLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?finally \{[\s\S]*?setIsLoading\(false\);[\s\S]*?\}[\s\S]*?\};/;
const newLoginCode = `const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(loginData.email, loginData.password);

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message || "Email ou senha incorretos",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema FarmFlow",
        });
        onAuthSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };`;

authContent = authContent.replace(loginRegex, newLoginCode);

// Replace handleSignup implementation
const signupRegex = /const handleSignup = async \(e: React\.FormEvent\) => \{[\s\S]*?finally \{[\s\S]*?setIsLoading\(false\);[\s\S]*?\}[\s\S]*?\};/;
const newSignupCode = `const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await signUp(signupData.email, signupData.password, signupData.nome);

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Você já pode fazer login.",
        });
        onAuthSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };`;

authContent = authContent.replace(signupRegex, newSignupCode);

fs.writeFileSync(authFilePath, authContent, 'utf8');
console.log('✅ Auth.tsx updated with useAuth integration');

// 3. Update Index.tsx
const indexContent = `import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/MainLayout";
import Auth from "./Auth";

const Index = () => {
  const { session, loading } = useAuth();

  const handleAuthSuccess = () => {
    // Auth state will be updated automatically by useAuth
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

fs.writeFileSync(path.join(frontendDir, 'src/pages/Index.tsx'), indexContent, 'utf8');
console.log('✅ Index.tsx updated to use useAuth()');

// 4. Update MainLayout.tsx to use signOut from useAuth
const mainLayoutPath = path.join(frontendDir, 'src/components/MainLayout.tsx');
let mainLayoutContent = fs.readFileSync(mainLayoutPath, 'utf8');

if (!mainLayoutContent.includes('useAuth')) {
  mainLayoutContent = mainLayoutContent.replace(
    'import { useToast } from "@/hooks/use-toast";',
    'import { useToast } from "@/hooks/use-toast";\nimport { useAuth } from "@/hooks/useAuth";'
  );
}

mainLayoutContent = mainLayoutContent.replace(
  'const { toast } = useToast();',
  'const { toast } = useToast();\n  const { signOut } = useAuth();'
);

mainLayoutContent = mainLayoutContent.replace(
  'const { error } = await supabase.auth.signOut();',
  'await signOut();\n    const error = null;'
);

fs.writeFileSync(mainLayoutPath, mainLayoutContent, 'utf8');
console.log('✅ MainLayout.tsx updated with signOut from useAuth()');
