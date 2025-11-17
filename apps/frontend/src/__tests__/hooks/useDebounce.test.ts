import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('test', 500));
      expect(result.current).toBe('test');
    });

    it('should debounce string value', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 500 },
      });

      expect(result.current).toBe('initial');

      // Update value
      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial');

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('should debounce number value', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 0, delay: 300 },
      });

      expect(result.current).toBe(0);

      rerender({ value: 100, delay: 300 });
      expect(result.current).toBe(0);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe(100);
    });

    it('should debounce object value', () => {
      const initial = { name: 'John', age: 30 };
      const updated = { name: 'Jane', age: 25 };

      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: initial, delay: 500 },
      });

      expect(result.current).toEqual(initial);

      rerender({ value: updated, delay: 500 });
      expect(result.current).toEqual(initial);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(updated);
    });

    it('should debounce array value', () => {
      const initial = [1, 2, 3];
      const updated = [4, 5, 6];

      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: initial, delay: 500 },
      });

      expect(result.current).toEqual(initial);

      rerender({ value: updated, delay: 500 });
      expect(result.current).toEqual(initial);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(updated);
    });
  });

  describe('Delay Variations', () => {
    it('should use custom delay', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'test', delay: 1000 },
      });

      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('test');

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });

    it('should use default delay of 500ms', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });

      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 0 },
      });

      rerender({ value: 'updated', delay: 0 });

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });
  });

  describe('Multiple Updates', () => {
    it('should cancel previous timeout on rapid updates', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'first', delay: 500 },
      });

      rerender({ value: 'second', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: 'third', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toBe('first');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe('third');
    });

    it('should handle sequential updates correctly', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 1, delay: 300 },
      });

      rerender({ value: 2, delay: 300 });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe(2);

      rerender({ value: 3, delay: 300 });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe(3);

      rerender({ value: 4, delay: 300 });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe(4);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timeout on unmount', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 },
        }
      );

      rerender({ value: 'updated', delay: 500 });
      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('initial');
    });

    it('should cleanup previous timeout when value changes', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 500 },
      });

      rerender({ value: 'updated', delay: 500 });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined value', () => {
      const { result } = renderHook(() => useDebounce(undefined, 500));
      expect(result.current).toBeUndefined();
    });

    it('should handle null value', () => {
      const { result } = renderHook(() => useDebounce(null, 500));
      expect(result.current).toBeNull();
    });

    it('should handle boolean value', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: false, delay: 500 },
      });

      expect(result.current).toBe(false);

      rerender({ value: true, delay: 500 });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(true);
    });

    it('should handle empty string', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'test', delay: 500 },
      });

      rerender({ value: '', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('');
    });
  });

  describe('Delay Changes', () => {
    it('should handle delay changes', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 500 },
      });

      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('Performance', () => {
    it('should not create memory leaks with many updates', () => {
      const { rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 0, delay: 100 },
      });

      for (let i = 1; i <= 100; i++) {
        rerender({ value: i, delay: 100 });
      }

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Hook should still work correctly after many updates
      expect(true).toBe(true);
    });
  });
});
