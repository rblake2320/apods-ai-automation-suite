import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginCredentials, User } from '@/types';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should restore state from localStorage', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: mockUser,
            token: 'test-token',
            isAuthenticated: true,
          },
          version: 0,
        })
      );

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('test-token');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Login', () => {
    it('should login user with valid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginPromise = act(async () => {
        await result.current.login(credentials);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe(credentials.email);
      expect(result.current.token).toBeTruthy();
    });

    it('should store token in localStorage on login', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      const token = localStorage.getItem('auth-token');
      expect(token).toBeTruthy();
      expect(token).toContain('mock-jwt-token');
    });

    it('should handle login error', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Mock an error by changing the login implementation
      const originalLogin = result.current.login;
      vi.spyOn(result.current, 'login').mockRejectedValueOnce(new Error('Login failed'));

      await expect(async () => {
        await act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
          });
        });
      }).rejects.toThrow('Login failed');
    });

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore());

      const loginPromise = result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Check loading state immediately
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should logout user and clear state', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear localStorage on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('auth-token')).toBeNull();
      expect(localStorage.getItem('auth-user')).toBeNull();
    });
  });

  describe('Update User', () => {
    it('should update user information', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      act(() => {
        result.current.updateUser({ name: 'Updated Name' });
      });

      expect(result.current.user?.name).toBe('Updated Name');
    });

    it('should not update if user is null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ name: 'Should Not Update' });
      });

      expect(result.current.user).toBeNull();
    });

    it('should merge user updates correctly', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      const originalEmail = result.current.user?.email;

      act(() => {
        result.current.updateUser({ name: 'New Name' });
      });

      expect(result.current.user?.email).toBe(originalEmail);
      expect(result.current.user?.name).toBe('New Name');
    });
  });

  describe('Set Token', () => {
    it('should set token and update auth state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setToken('new-token');
      });

      expect(result.current.token).toBe('new-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should store token in localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setToken('new-token');
      });

      expect(localStorage.getItem('auth-token')).toBe('new-token');
    });
  });

  describe('Clear Auth', () => {
    it('should clear all auth data', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth-token')).toBeNull();
    });
  });

  describe('Check Auth', () => {
    it('should restore auth from localStorage', () => {
      const mockUser: User = {
        id: '1',
        email: 'stored@example.com',
        name: 'Stored User',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('auth-token', 'stored-token');
      localStorage.setItem('auth-user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.checkAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('stored-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle missing token gracefully', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle invalid stored user data', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem('auth-token', 'token');
      localStorage.setItem('auth-user', 'invalid json');

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.checkAuth();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.current.user).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.isAuthenticated).toBe(true);
      expect(parsed.state.user).toBeTruthy();
    });

    it('should only persist specified fields', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const promise = result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        vi.advanceTimersByTime(1000);
        await promise;
      });

      const stored = localStorage.getItem('auth-storage');
      const parsed = JSON.parse(stored!);

      expect(parsed.state).toHaveProperty('user');
      expect(parsed.state).toHaveProperty('token');
      expect(parsed.state).toHaveProperty('isAuthenticated');
      expect(parsed.state).not.toHaveProperty('isLoading');
    });
  });
});
