import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);
const AVATAR_BUCKET = 'avatars';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, profile_image, updated_at')
      .eq('id', userId)
      .maybeSingle();

    setProfileLoading(false);

    if (error) {
      console.error('[Supabase] profile load failed', error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);

      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (nextSession?.user) {
        loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const saveProfile = useCallback(
    async ({ nickname, avatarFile }) => {
      if (!supabase || !session?.user) {
        return { error: new Error('Supabase client is not configured.') };
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: userError || new Error('Logged-in user was not found.') };
      }

      let profileImage = profile?.profile_image ?? null;

      if (avatarFile) {
        const safeFileName = `${Date.now()}-${avatarFile.name}`.replace(/[^a-zA-Z0-9._-]/g, '-');
        const filePath = `${user.id}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(filePath, avatarFile);

        if (uploadError) {
          return { error: uploadError };
        }

        const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
        profileImage = data.publicUrl;
      }

      const profilePayload = {
        id: user.id,
        nickname: nickname.trim(),
        profile_image: profileImage,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profilePayload)
        .select('id, nickname, profile_image, updated_at')
        .single();

      if (!error) {
        setProfile(data);
      }

      return { data, error };
    },
    [profile?.profile_image, session?.user],
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      hasProfile: Boolean(profile?.nickname),
      refreshProfile: () => loadProfile(session?.user?.id),
      saveProfile,
      signUp: (email, password) => {
        if (!supabase) return { error: new Error('Supabase client is not configured.') };
        return supabase.auth.signUp({ email, password });
      },
      signIn: (email, password) => {
        if (!supabase) return { error: new Error('Supabase client is not configured.') };
        return supabase.auth.signInWithPassword({ email, password });
      },
      signOut: () => {
        if (!supabase) return { error: new Error('Supabase client is not configured.') };
        return supabase.auth.signOut();
      },
    }),
    [loadProfile, loading, profile, profileLoading, saveProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
