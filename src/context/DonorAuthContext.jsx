import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import supabase, { authReady, getInitialAuthError } from "@/supabase/client";
import { identifyDonor } from "@/lib/analytics";
import { createDonorAuthActions, loadDonorProfile } from "@/lib/donorAuth";

const DonorAuthContext = createContext(null);
const authActions = createDonorAuthActions(supabase);

export function DonorAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(() => !getInitialAuthError());
  const [authError, setAuthError] = useState(getInitialAuthError);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileRevision, setProfileRevision] = useState(0);
  const mounted = useRef(false);
  const currentUser = useRef(null);
  const profileRequest = useRef(0);
  const userRevision = useRef(0);
  const profileMutation = useRef(0);

  const applyUser = useCallback((nextUser) => {
    if (!mounted.current) return;
    if (currentUser.current?.id !== nextUser?.id) {
      userRevision.current += 1;
      profileRequest.current += 1;
      setProfile(null);
      setProfileError(null);
      setProfileLoading(Boolean(nextUser));
    }
    currentUser.current = nextUser;
    setUser(nextUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    let authRevision = 0;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      authRevision += 1;
      // Supabase holds its auth lock here. Keep this callback synchronous;
      // profile requests run in the separate effect below.
      if (event === "SIGNED_IN" && session?.user) setAuthError(null);
      applyUser(session?.user ?? null);
    });
    const initialRevision = authRevision;
    authReady
      .then(({ error }) => {
        if (!active) return null;
        if (error) {
          setAuthError(error);
          setLoading(false);
        }
        return supabase.auth.getSession();
      })
      .then((result) => {
        if (!result) return;
        const { data, error } = result;
        if (active && authRevision === initialRevision)
          applyUser(error ? null : (data?.session?.user ?? null));
      })
      .catch(() => {
        if (active && authRevision === initialRevision) applyUser(null);
      });
    return () => {
      active = false;
      mounted.current = false;
      profileRequest.current += 1;
      subscription.unsubscribe();
    };
  }, [applyUser]);

  useEffect(() => {
    if (!user) return;
    const request = ++profileRequest.current;
    let active = true;
    const isCurrent = () =>
      active &&
      mounted.current &&
      request === profileRequest.current &&
      currentUser.current?.id === user.id;
    setProfileLoading(true);
    setProfileError(null);
    loadDonorProfile(supabase, user)
      .then((data) => {
        if (!isCurrent()) return;
        setProfile(data);
        identifyDonor(
          data.id,
          data.email,
          `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        );
      })
      .catch(() => {
        if (isCurrent())
          setProfileError(
            "We couldn’t load your profile. Please try again before updating your details.",
          );
      })
      .finally(() => {
        if (isCurrent()) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, profileRevision]);

  const retryProfile = useCallback(() => {
    setProfileRevision((previous) => previous + 1);
  }, []);

  const updateProfile = async (updates) => {
    const account = currentUser.current;
    if (!account) throw new Error("Please sign in to update your profile.");
    if (!profile || profile.id !== account.id || profileLoading)
      throw new Error(
        "Your profile is not ready. Please retry loading it first.",
      );
    const editable = Object.fromEntries(
      ["first_name", "last_name", "phone", "location"]
        .filter((key) => Object.prototype.hasOwnProperty.call(updates, key))
        .map((key) => [key, updates[key]]),
    );
    if (!Object.keys(editable).length) return;
    const mutation = ++profileMutation.current;
    const accountRevision = userRevision.current;
    const { data, error } = await supabase
      .from("donor_profiles")
      .update(editable)
      .eq("id", account.id)
      .select("*")
      .single();
    if (error) throw error;
    if (!data) throw new Error("Your profile was not saved. Please try again.");
    if (
      mounted.current &&
      currentUser.current?.id === account.id &&
      accountRevision === userRevision.current &&
      mutation === profileMutation.current
    ) {
      // A token refresh may have started an older read while this save was in
      // flight. The successful mutation is now the authoritative profile.
      profileRequest.current += 1;
      setProfile(data);
      setProfileError(null);
      setProfileLoading(false);
    }
  };

  const signOut = async () => {
    const accountId = currentUser.current?.id;
    const accountRevision = userRevision.current;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (
      currentUser.current?.id === accountId &&
      accountRevision === userRevision.current
    )
      applyUser(null);
  };

  return (
    <DonorAuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        profileLoading,
        profileError,
        retryProfile,
        ...authActions,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </DonorAuthContext.Provider>
  );
}

export function useDonorAuth() {
  const context = useContext(DonorAuthContext);
  if (!context)
    throw new Error("useDonorAuth must be used within a DonorAuthProvider");
  return context;
}
