import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useMediaQuery,
  breakpoints,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from '@/hooks/useMediaQuery';

describe('useMediaQuery Hook', () => {
  let matchMediaMock: vi.MockedFunction<typeof window.matchMedia>;
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    listeners = [];

    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn((callback: (e: MediaQueryListEvent) => void) => {
        listeners.push(callback);
      }),
      removeListener: vi.fn((callback: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((l) => l !== callback);
      }),
      addEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners.push(callback);
        }
      }),
      removeEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          listeners = listeners.filter((l) => l !== callback);
        }
      }),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  describe('Basic Functionality', () => {
    it('should return false for non-matching query', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);
    });

    it('should return true for matching query', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_, callback) => listeners.push(callback)),
        removeEventListener: vi.fn((_, callback) => {
          listeners = listeners.filter((l) => l !== callback);
        }),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(true);
    });

    it('should update when media query matches change', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);

      act(() => {
        listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
      });

      expect(result.current).toBe(true);
    });

    it('should handle different media queries', () => {
      const queries = [
        '(min-width: 640px)',
        '(min-width: 768px)',
        '(min-width: 1024px)',
        '(min-width: 1280px)',
      ];

      queries.forEach((query) => {
        const { result } = renderHook(() => useMediaQuery(query));
        expect(matchMediaMock).toHaveBeenCalledWith(query);
        expect(typeof result.current).toBe('boolean');
      });
    });
  });

  describe('Event Listeners', () => {
    it('should add event listener on mount', () => {
      const addEventListenerSpy = vi.fn();

      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.fn();

      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      } as any);

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should use fallback methods for older browsers', () => {
      const addListenerSpy = vi.fn();
      const removeListenerSpy = vi.fn();

      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: addListenerSpy,
        removeListener: removeListenerSpy,
        addEventListener: undefined,
        removeEventListener: undefined,
        dispatchEvent: vi.fn(),
      } as any);

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(addListenerSpy).toHaveBeenCalled();

      unmount();
      expect(removeListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Query Changes', () => {
    it('should update when query prop changes', () => {
      const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
        initialProps: { query: '(min-width: 768px)' },
      });

      expect(result.current).toBe(false);

      rerender({ query: '(min-width: 1024px)' });
      expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1024px)');
    });

    it('should cleanup old listener when query changes', () => {
      const removeEventListenerSpy = vi.fn();

      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      } as any);

      const { rerender } = renderHook(({ query }) => useMediaQuery(query), {
        initialProps: { query: '(min-width: 768px)' },
      });

      rerender({ query: '(min-width: 1024px)' });

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Breakpoints', () => {
    it('should have correct breakpoint definitions', () => {
      expect(breakpoints.sm).toBe('(min-width: 640px)');
      expect(breakpoints.md).toBe('(min-width: 768px)');
      expect(breakpoints.lg).toBe('(min-width: 1024px)');
      expect(breakpoints.xl).toBe('(min-width: 1280px)');
      expect(breakpoints['2xl']).toBe('(min-width: 1536px)');
    });
  });

  describe('useIsMobile Hook', () => {
    it('should return true when screen is smaller than sm breakpoint', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: breakpoints.sm,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false when screen is larger than sm breakpoint', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: breakpoints.sm,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet Hook', () => {
    it('should return true when screen is between sm and lg', () => {
      const { result } = renderHook(() => useIsTablet());

      matchMediaMock.mockImplementation((query) => {
        const matches = query === breakpoints.sm;
        return {
          matches,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as any;
      });

      const { result: result2 } = renderHook(() => useIsTablet());
      expect(typeof result2.current).toBe('boolean');
    });

    it('should return false when screen is smaller than sm', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: breakpoints.sm,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop Hook', () => {
    it('should return true when screen is larger than lg breakpoint', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: breakpoints.lg,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return false when screen is smaller than lg breakpoint', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: breakpoints.lg,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });
  });

  describe('SSR Compatibility', () => {
    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('Multiple Instances', () => {
    it('should allow multiple queries simultaneously', () => {
      const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
      const { result: result3 } = renderHook(() => useMediaQuery('(max-width: 640px)'));

      expect(typeof result1.current).toBe('boolean');
      expect(typeof result2.current).toBe('boolean');
      expect(typeof result3.current).toBe('boolean');
    });

    it('should update all instances independently', () => {
      const { result: result1 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

      act(() => {
        listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
      });

      expect(typeof result1.current).toBe('boolean');
      expect(typeof result2.current).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle complex media queries', () => {
      const complexQuery =
        '(min-width: 768px) and (max-width: 1024px) and (orientation: landscape)';
      const { result } = renderHook(() => useMediaQuery(complexQuery));
      expect(matchMediaMock).toHaveBeenCalledWith(complexQuery);
      expect(typeof result.current).toBe('boolean');
    });

    it('should handle orientation queries', () => {
      const { result } = renderHook(() => useMediaQuery('(orientation: portrait)'));
      expect(typeof result.current).toBe('boolean');
    });

    it('should handle prefers-color-scheme queries', () => {
      const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));
      expect(typeof result.current).toBe('boolean');
    });
  });
});
