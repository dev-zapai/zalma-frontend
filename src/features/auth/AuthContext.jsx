import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/shared/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pulls the current user's profile via the cookie session. Returns
  // { profile, error } where error.code is "no_profile" for 403,
  // "fetch_failed" for any other error, or null on success.
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
      return { profile: res.data, error: null };
    } catch (err) {
      setProfile(null);
      const status = err?.response?.status;
      if (status === 403) {
        return {
          profile: null,
          error: { code: 'no_profile', message: 'No Zalma account found for this email. Please register first.' },
        };
      }
      if (status === 401) {
        return { profile: null, error: { code: 'unauthenticated', message: 'Not signed in' } };
      }
      return {
        profile: null,
        error: { code: 'fetch_failed', message: err?.message || 'Failed to load profile' },
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { error } = await fetchProfile();
      // 401 just means no session yet; not an error worth logging out for.
      if (cancelled) return;
      // Stale session belonging to a Supabase user with no Zalma profile —
      // call backend logout to clear cookies, except on /change-password
      // where we need the recovery session active.
      const onChangePassword = window.location.pathname.includes('/change-password');
      if (error?.code === 'no_profile' && !onChangePassword) {
        try { await api.post('/auth/logout'); } catch {}
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchProfile]);

  // ── Auth actions ────────────────────────────────────────────────

  const signUp = useCallback(async (email, password, fullName) => {
    try {
      const res = await api.post('/auth/register', { email, password, full_name: fullName });
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: { message: err.response?.data?.detail || 'Registration failed' } };
    }
  }, []);

  const verifyOtp = useCallback(async (email, token) => {
    try {
      await api.post('/auth/verify-otp', { email, token });
      return { error: null };
    } catch (err) {
      return { error: { message: err.response?.data?.detail || 'Invalid or expired code' } };
    }
  }, []);

  const resendOtp = useCallback(async (email) => {
    try {
      await api.post('/auth/resend-otp', { email });
      return { error: null };
    } catch (err) {
      return { error: { message: err.response?.data?.detail || 'Could not resend code' } };
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      await api.post('/auth/login', { email, password });
    } catch (err) {
      return { error: { message: err.response?.data?.detail || 'Invalid email or password' } };
    }

    const { error: profileError } = await fetchProfile();
    if (profileError?.code === 'no_profile') {
      // Backend cookie set but no profile — sign them back out.
      try { await api.post('/auth/logout'); } catch {}
      return { error: { message: profileError.message, code: 'no_profile' } };
    }
    return { error: null };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    setProfile(null);
  }, []);

  const setupSalon = useCallback(async (setupData) => {
    try {
      const res = await api.post('/auth/setup-salon', setupData);
      setProfile(res.data.user);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.detail || 'Setup failed' };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      return { error: null };
    } catch (err) {
      return { error: { message: err.response?.data?.detail || 'Could not send reset email' } };
    }
  }, []);

  const resetPassword = useCallback(async (accessToken, refreshToken, newPassword) => {
    try {
      await api.post('/auth/reset-password', {
        access_token: accessToken,
        refresh_token: refreshToken,
        new_password: newPassword,
      });
      const { error: profileError } = await fetchProfile();
      return { error: profileError ? null : null };
    } catch (err) {
      return { error: { message: err.response?.data?.detail || 'Could not reset password' } };
    }
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      profile, loading,
      signUp, verifyOtp, resendOtp, signIn, signOut, setupSalon,
      forgotPassword, resetPassword, fetchProfile,
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
