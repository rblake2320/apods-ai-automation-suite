import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials } from '@/types';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  checkAuth: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

/**
 * Authentication store using Zustand
 * Handles user authentication state and actions
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Login user with credentials
       */
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });

        try {
          // TODO: Replace with actual API call
          // const response = await authAPI.login(credentials);

          // Mock response for now
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const mockUser: User = {
            id: '1',
            email: credentials.email,
            name: 'John Doe',
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const mockToken = 'mock-jwt-token-' + Date.now();

          // Store token in localStorage
          localStorage.setItem('auth-token', mockToken);

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      /**
       * Logout user and clear auth state
       */
      logout: () => {
        // Clear token from localStorage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');

        set(initialState);
      },

      /**
       * Update user information
       */
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
        }
      },

      /**
       * Set authentication token
       */
      setToken: (token: string) => {
        localStorage.setItem('auth-token', token);
        set({ token, isAuthenticated: true });
      },

      /**
       * Clear all authentication data
       */
      clearAuth: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        set(initialState);
      },

      /**
       * Check if user is authenticated (on app load)
       */
      checkAuth: () => {
        const token = localStorage.getItem('auth-token');
        const userStr = localStorage.getItem('auth-user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr) as User;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to parse stored user data:', error);
            get().clearAuth();
          }
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
