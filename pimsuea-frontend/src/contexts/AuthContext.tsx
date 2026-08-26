import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { type AuthChangeEvent, type User, type Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { recordTermsAcceptance } from "@/services/api";
import { shouldRecordSignupConsent, clearPendingTermsAcceptance } from "@/lib/legal";
import { identifyUser, resetAnalytics } from "@/lib/analytics";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  design_purpose: string | null;
  referral_source: string | null;
  referral_detail: string | null;
  onboarding_completed: boolean;
  terms_accepted_at: string | null;
  terms_version: number | null;
  privacy_accepted_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  profileLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const profileUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, { showLoading = true } = {}) => {
    const isInitialLoad = profileUserIdRef.current !== userId;
    if (showLoading && isInitialLoad) {
      setProfileLoading(true);
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, age, design_purpose, referral_source, referral_detail, onboarding_completed, terms_accepted_at, terms_version, privacy_accepted_at')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
    profileUserIdRef.current = userId;
    setProfileLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        identifyUser(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setProfileLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        identifyUser(session.user.id);
        // Token refresh on tab focus must not refetch profile — that unmounts the whole app.
        if (event !== 'TOKEN_REFRESHED') {
          fetchProfile(session.user.id);
        }
        if (event !== 'TOKEN_REFRESHED' && shouldRecordSignupConsent(event)) {
          recordTermsAcceptance()
            .then(() => {
              clearPendingTermsAcceptance();
              const url = new URL(window.location.href);
              if (url.searchParams.has('terms_accepted')) {
                url.searchParams.delete('terms_accepted');
                window.history.replaceState({}, '', url.pathname + url.search + url.hash);
              }
              fetchProfile(session.user.id, { showLoading: false });
            })
            .catch((err) => {
              console.error('Failed to record pending terms acceptance:', err);
            });
        }
      } else {
        resetAnalytics();
        profileUserIdRef.current = null;
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    resetAnalytics();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, profile, profileLoading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
