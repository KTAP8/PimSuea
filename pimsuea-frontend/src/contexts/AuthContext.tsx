import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { type AuthChangeEvent, type User, type Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  design_purpose: string | null;
  referral_source: string | null;
  onboarding_completed: boolean;
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
      .select('id, first_name, last_name, age, design_purpose, referral_source, onboarding_completed')
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
        // Token refresh on tab focus must not refetch profile — that unmounts the whole app.
        if (event !== 'TOKEN_REFRESHED') {
          fetchProfile(session.user.id);
        }
      } else {
        profileUserIdRef.current = null;
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, profile, profileLoading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
