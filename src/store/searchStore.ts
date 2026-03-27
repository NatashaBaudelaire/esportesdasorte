import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchState {
  recentSearches: string[];
  addRecent: (term: string) => void;
  removeRecent: (term: string) => void;
  clearRecent: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: ['Flamengo', 'Premier League', 'Champions League', 'Neymar', 'UFC'],
      addRecent: (term) =>
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s !== term);
          return { recentSearches: [term, ...filtered].slice(0, 10) };
        }),
      removeRecent: (term) =>
        set((state) => ({ recentSearches: state.recentSearches.filter((s) => s !== term) })),
      clearRecent: () => set({ recentSearches: [] }),
    }),
    { name: 'selecaobet-search' }
  )
);
