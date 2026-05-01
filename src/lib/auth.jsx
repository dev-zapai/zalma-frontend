import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = useRef(null);

  // Returns { profile, error } where error.code is "no_profile" for 403,
  // "fetch_failed" for anything else, or null on success.
  const fetchProfile = useCallback(async (accessToken) => {
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfile(res.data);
      return { profile: res.data, error: null };
    } catch (err) {
      setProfile(null);
      const status = err?.response?.status;
      if (status === 403) {
        return {
          profile: null,
          error: {
            code: 'no_profile',
            message: 'No Zalma account found for this email. Please register first.',
          },
        };
      }
      return {
        profile: null,
        error: {
          code: 'fetch_failed',
          message: err?.message || 'Failed to load profile',
        },
      };
    }
  }, []);

  // Sign the user fully out of Supabase + clear local state.
  // Used when the user has a valid Supabase token but no profile in this service.
  const clearSession = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    loadedUserIdRef.current = null;
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s) {
        setSession(s);
        setUser(s.user);
        loadedUserIdRef.current = s.user.id;
        const { error: profileError } = await fetchProfile(s.access_token);
        // Stale session belonging to a service the user isn't registered for —
        // sign them fully out so the app starts in a clean unauthenticated state.
        // Exception: on the change-password page we need the recovery session alive.
        const onChangePassword = window.location.pathname.includes('/change-password');
        if (profileError?.code === 'no_profile' && !onChangePassword) {
          await clearSession();
        }
      }
      setLoading(false);
    };
    init();

    // Listener handles token refreshes and external sign-outs only.
    // Profile fetching is owned by the explicit signIn / init flows so we can
    // react to the 403-no-profile case without racing against this listener.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        setUser(s.user);
      } else {
        loadedUserIdRef.current = null;
        setUser(null);
        setProfile(null);
      }
      // When Supabase processes a recovery link, it fires PASSWORD_RECOVERY.
      // Redirect to the change-password page so the user can set a new password
      // while the recovery session is still active.
      if (event === 'PASSWORD_RECOVERY') {
        window.location.replace('/zalma/change-password');
      }
    });

    return () => subscription?.unsubscribe();
  }, [fetchProfile, clearSession]);

  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    // Immediately store session so setupClinic has it. We deliberately do NOT
    // call fetchProfile here — a freshly-signed-up user has no profile yet,
    // and the RegisterPage will advance to step 2 to create one.
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      loadedUserIdRef.current = data.session.user.id;
    } else if (data?.user) {
      setUser(data.user);
    }
    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data, error };

    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      loadedUserIdRef.current = data.session.user.id;

      const { error: profileError } = await fetchProfile(data.session.access_token);

      // If Supabase auth succeeded but the user has no profile in THIS service,
      // sign them back out and bubble up a friendly error so the LoginPage can
      // surface a "register first" message instead of teleporting to /register.
      if (profileError?.code === 'no_profile') {
        await clearSession();
        return {
          data: null,
          error: {
            message: profileError.message,
            code: 'no_profile',
          },
        };
      }
    }
    return { data, error };
  }, [fetchProfile, clearSession]);

  const signOut = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const setupClinic = useCallback(async (setupData) => {
    if (!session) return { error: 'No session' };
    try {
      const res = await api.post('/auth/setup-clinic', setupData, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setProfile(res.data.user);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.detail || 'Setup failed' };
    }
  }, [session]);

  const getToken = useCallback(() => session?.access_token, [session]);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signUp, signIn, signOut, setupClinic, getToken, fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
