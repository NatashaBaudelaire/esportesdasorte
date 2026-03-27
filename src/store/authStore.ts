import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  full_name: string | null;
  username: string | null;
  level: string;
  avatar_url: string | null;
  phone: string | null;
  cpf: string | null;
  dob: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  kyc_status?: 'pending' | 'verified' | 'rejected' | null;
  kyc_verified_at?: string | null;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateKYCStatus: (status: 'verified' | 'rejected', verifiedAt?: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  // Legacy compat
  login: (user: { name: string; username: string; level: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ isLoggedIn: true, user: session.user, loading: false });
        // Defer profile fetch to avoid deadlock
        setTimeout(() => get().fetchProfile(session.user.id), 0);
      } else {
        set({ isLoggedIn: false, user: null, profile: null, loading: false });
      }
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ isLoggedIn: true, user: session.user, loading: false });
      get().fetchProfile(session.user.id);
    } else {
      set({ loading: false });
    }
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) {
      const profileData: Profile = {
        full_name: data.full_name,
        username: data.username,
        level: data.level,
        avatar_url: data.avatar_url,
        phone: data.phone,
        cpf: data.cpf,
        dob: data.dob,
        country: data.country,
        state: data.state,
        city: data.city,
        kyc_status: (data as any).kyc_status ?? null,
        kyc_verified_at: (data as any).kyc_verified_at ?? null,
      };
      set({ profile: profileData });
    }
  },

  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return;
    // Convert empty strings to null for nullable DB columns
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
    );
    await supabase.from('profiles').update(cleaned).eq('user_id', user.id);
    set((s) => ({ profile: s.profile ? { ...s.profile, ...cleaned } : null }));
  },

  signUp: async (email, password, metadata) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message || null };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ isLoggedIn: false, user: null, profile: null });
  },

  // Legacy compat for mock flows
  login: (user) => set({ isLoggedIn: true, profile: { full_name: user.name, username: user.username, level: user.level, avatar_url: null, phone: null, cpf: null, dob: null, country: null, state: null, city: null } }),
  logout: () => { get().signOut(); },

  updateKYCStatus: async (status, verifiedAt) => {
    const user = get().user;
    if (!user) return;
    const updateData: any = { kyc_status: status };
    if (status === 'verified' && verifiedAt) {
      updateData.kyc_verified_at = verifiedAt;
    }
    await supabase.from('profiles').update(updateData).eq('user_id', user.id);
    set((s) => ({ profile: s.profile ? { ...s.profile, ...updateData } : null }));
  },
}));

