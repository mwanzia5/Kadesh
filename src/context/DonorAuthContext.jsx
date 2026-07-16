import { createContext, useContext, useState, useEffect, useCallback } from "react";
import supabase from "@/supabase/client";

const DonorAuthContext = createContext(null);

export function DonorAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("donor_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async ({ email, password, firstName, lastName, phone, location }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from("donor_profiles").insert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        location,
        email,
      });
      if (profileError) throw profileError;
      setProfile({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        location,
        email,
      });
    }
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await fetchProfile(data.user.id);
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  return (
    <DonorAuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </DonorAuthContext.Provider>
  );
}

export function useDonorAuth() {
  const context = useContext(DonorAuthContext);
  if (!context) {
    throw new Error("useDonorAuth must be used within a DonorAuthProvider");
  }
  return context;
}
