import React, { useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext } from './auth-context-def';

// Consistent internal password for single-user personal academic workspace
const WORKSPACE_INTERNAL_SECRET = 'academic_notebook_access_2026';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Session retrieval error:', err);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * 1-Step Email Login:
   * No password required, no email confirmation.
   * If the account exists, signs in immediately.
   * If not, creates the account and signs in automatically.
   */
  const loginWithEmail = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { error: 'Please enter a valid email address.' };
    }

    try {
      // Step 1: Try signing in directly
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: WORKSPACE_INTERNAL_SECRET,
      });

      if (!signInError && signInData.session) {
        setSession(signInData.session);
        setUser(signInData.session.user);
        return {};
      }

      // Step 2: If user not found or error, sign up automatically
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: WORKSPACE_INTERNAL_SECRET,
      });

      if (signUpError) {
        return { error: signUpError.message };
      }

      if (signUpData.session) {
        setSession(signUpData.session);
        setUser(signUpData.session.user);
        return {};
      }

      const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: WORKSPACE_INTERNAL_SECRET,
      });

      if (retryError) {
        return { error: retryError.message };
      }

      if (retrySignIn.session) {
        setSession(retrySignIn.session);
        setUser(retrySignIn.session.user);
      }

      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log in with email.';
      return { error: message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, loginWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
