import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: string;
  fontSize: string;
  daltonism: string;
  librasEnabled: boolean;
  sessionAlert: boolean;
  sessionMinutes: number;
  depositLimit: string;
  betLimit: string;
  limitPeriod: string;
  setTheme: (t: string) => void;
  setFontSize: (s: string) => void;
  setDaltonism: (d: string) => void;
  setLibrasEnabled: (v: boolean) => void;
  setSessionAlert: (v: boolean) => void;
  setSessionMinutes: (m: number) => void;
  setDepositLimit: (v: string) => void;
  setBetLimit: (v: string) => void;
  setLimitPeriod: (p: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 'M',
      daltonism: 'none',
      librasEnabled: false,
      sessionAlert: false,
      sessionMinutes: 60,
      depositLimit: '',
      betLimit: '',
      limitPeriod: 'diario',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      setFontSize: (fontSize) => {
        document.documentElement.setAttribute('data-fontsize', fontSize);
        set({ fontSize });
      },
      setDaltonism: (daltonism) => {
        document.documentElement.setAttribute('data-daltonism', daltonism);
        set({ daltonism });
      },
      setLibrasEnabled: (librasEnabled) => {
        document.documentElement.setAttribute('data-libras', librasEnabled ? 'enabled' : 'disabled');
        set({ librasEnabled });
      },
      setSessionAlert: (sessionAlert) => set({ sessionAlert }),
      setSessionMinutes: (sessionMinutes) => set({ sessionMinutes }),
      setDepositLimit: (depositLimit) => set({ depositLimit }),
      setBetLimit: (betLimit) => set({ betLimit }),
      setLimitPeriod: (limitPeriod) => set({ limitPeriod }),
    }),
    {
      name: 'selecaobet-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme);
          document.documentElement.setAttribute('data-fontsize', state.fontSize);
          document.documentElement.setAttribute('data-daltonism', state.daltonism);
          document.documentElement.setAttribute('data-libras', state.librasEnabled ? 'enabled' : 'disabled');
        }
      },
    }
  )
);
