import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from '@/store/useThemeStore';

describe('useThemeStore', () => {
  let mockMatchMedia: vi.MockedFunction<typeof window.matchMedia>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Mock document.documentElement
    document.documentElement.classList.remove('light', 'dark');

    // Mock matchMedia
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    // Mock meta theme-color
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  });

  afterEach(() => {
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove());
  });

  describe('Initial State', () => {
    it('should have system theme as default', () => {
      const { result } = renderHook(() => useThemeStore());
      expect(result.current.theme).toBe('system');
    });

    it('should resolve system theme correctly', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useThemeStore());
      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  describe('Set Theme', () => {
    it('should set light theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should set dark theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should set system theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
    });

    it('should update meta theme-color for light theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('light');
      });

      const meta = document.querySelector('meta[name="theme-color"]');
      expect(meta?.getAttribute('content')).toBe('#ffffff');
    });

    it('should update meta theme-color for dark theme', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('dark');
      });

      const meta = document.querySelector('meta[name="theme-color"]');
      expect(meta?.getAttribute('content')).toBe('#0f172a');
    });
  });

  describe('Toggle Theme', () => {
    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('dark');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should toggle from system to opposite of system theme', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('system');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('Initialize Theme', () => {
    it('should apply theme on initialization', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.initializeTheme();
      });

      expect(document.documentElement.classList.length).toBeGreaterThan(0);
    });

    it('should listen for system theme changes', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('system');
        result.current.initializeTheme();
      });

      expect(mockMatchMedia).toHaveBeenCalled();
    });
  });

  describe('Persistence', () => {
    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('dark');
      });

      const stored = localStorage.getItem('theme-storage');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.theme).toBe('dark');
    });

    it('should restore theme from localStorage', () => {
      localStorage.setItem(
        'theme-storage',
        JSON.stringify({
          state: { theme: 'dark' },
          version: 0,
        })
      );

      const { result } = renderHook(() => useThemeStore());

      expect(result.current.theme).toBe('dark');
    });
  });

  describe('DOM Manipulation', () => {
    it('should remove old theme class before adding new one', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
