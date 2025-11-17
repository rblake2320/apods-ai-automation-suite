import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

/**
 * Get system theme preference
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Apply theme to document
 */
const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
  }
};

/**
 * Theme store using Zustand
 * Handles theme state and toggling between light/dark modes
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      /**
       * Set theme
       */
      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(resolvedTheme);
        set({ theme, resolvedTheme });
      },

      /**
       * Toggle between light and dark themes
       */
      toggleTheme: () => {
        const { theme } = get();
        let newTheme: Theme;

        if (theme === 'system') {
          // If system, switch to opposite of current system theme
          const systemTheme = getSystemTheme();
          newTheme = systemTheme === 'dark' ? 'light' : 'dark';
        } else {
          // Toggle between light and dark
          newTheme = theme === 'dark' ? 'light' : 'dark';
        }

        get().setTheme(newTheme);
      },

      /**
       * Initialize theme on app load
       */
      initializeTheme: () => {
        const { theme } = get();
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(resolvedTheme);
        set({ resolvedTheme });

        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

          const handleChange = (e: MediaQueryListEvent) => {
            const { theme } = get();
            if (theme === 'system') {
              const newResolvedTheme = e.matches ? 'dark' : 'light';
              applyTheme(newResolvedTheme);
              set({ resolvedTheme: newResolvedTheme });
            }
          };

          // Modern browsers
          if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
          } else {
            // Older browsers
            mediaQuery.addListener(handleChange);
          }
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
