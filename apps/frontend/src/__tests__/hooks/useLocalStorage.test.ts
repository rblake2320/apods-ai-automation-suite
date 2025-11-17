import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic Functionality', () => {
    it('should return initial value when key does not exist', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      expect(result.current[0]).toBe('initial');
    });

    it('should store value in localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(localStorage.getItem('test-key')).toBe('"updated"');
    });

    it('should read existing value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('existing'));

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      expect(result.current[0]).toBe('existing');
    });

    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('first update');
      });
      expect(localStorage.getItem('test-key')).toBe('"first update"');

      act(() => {
        result.current[1]('second update');
      });
      expect(localStorage.getItem('test-key')).toBe('"second update"');
    });

    it('should remove value from localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('stored');
      });
      expect(localStorage.getItem('test-key')).toBe('"stored"');

      act(() => {
        result.current[2]();
      });
      expect(localStorage.getItem('test-key')).toBeNull();
      expect(result.current[0]).toBe('initial');
    });
  });

  describe('Data Types', () => {
    it('should handle string values', () => {
      const { result } = renderHook(() => useLocalStorage('string-key', 'hello'));

      act(() => {
        result.current[1]('world');
      });

      expect(result.current[0]).toBe('world');
      expect(localStorage.getItem('string-key')).toBe('"world"');
    });

    it('should handle number values', () => {
      const { result } = renderHook(() => useLocalStorage('number-key', 42));

      act(() => {
        result.current[1](100);
      });

      expect(result.current[0]).toBe(100);
      expect(localStorage.getItem('number-key')).toBe('100');
    });

    it('should handle boolean values', () => {
      const { result } = renderHook(() => useLocalStorage('boolean-key', false));

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(localStorage.getItem('boolean-key')).toBe('true');
    });

    it('should handle object values', () => {
      const initialObject = { name: 'John', age: 30 };
      const updatedObject = { name: 'Jane', age: 25 };

      const { result } = renderHook(() => useLocalStorage('object-key', initialObject));

      act(() => {
        result.current[1](updatedObject);
      });

      expect(result.current[0]).toEqual(updatedObject);
      expect(JSON.parse(localStorage.getItem('object-key') || '')).toEqual(updatedObject);
    });

    it('should handle array values', () => {
      const initialArray = [1, 2, 3];
      const updatedArray = [4, 5, 6];

      const { result } = renderHook(() => useLocalStorage('array-key', initialArray));

      act(() => {
        result.current[1](updatedArray);
      });

      expect(result.current[0]).toEqual(updatedArray);
      expect(JSON.parse(localStorage.getItem('array-key') || '')).toEqual(updatedArray);
    });

    it('should handle null values', () => {
      const { result } = renderHook(() => useLocalStorage<string | null>('null-key', null));

      act(() => {
        result.current[1]('not null');
      });
      expect(result.current[0]).toBe('not null');

      act(() => {
        result.current[1](null);
      });
      expect(result.current[0]).toBeNull();
    });
  });

  describe('Function Updates', () => {
    it('should support functional updates', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1]((prev) => prev + 2);
      });
      expect(result.current[0]).toBe(3);
    });

    it('should support functional updates with objects', () => {
      const { result } = renderHook(() => useLocalStorage('user', { name: 'John', age: 30 }));

      act(() => {
        result.current[1]((prev) => ({ ...prev, age: 31 }));
      });

      expect(result.current[0]).toEqual({ name: 'John', age: 31 });
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('invalid-json', 'not valid json');

      const { result } = renderHook(() => useLocalStorage('invalid-json', 'default'));

      expect(result.current[0]).toBe('default');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading localStorage key'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle localStorage setItem errors', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error setting localStorage key'),
        expect.any(Error)
      );

      setItemSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle localStorage removeItem errors', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Remove error');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[2]();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error removing localStorage key'),
        expect.any(Error)
      );

      removeItemSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Storage Events', () => {
    it('should sync state when storage changes in another tab', () => {
      const { result } = renderHook(() => useLocalStorage('sync-key', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'sync-key',
          newValue: JSON.stringify('updated from another tab'),
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('updated from another tab');
    });

    it('should not update state for different key', () => {
      const { result } = renderHook(() => useLocalStorage('my-key', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'other-key',
          newValue: JSON.stringify('updated'),
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('initial');
    });

    it('should handle storage event with null newValue', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'test-key',
          newValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('initial');
    });

    it('should handle malformed JSON in storage event', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'test-key',
          newValue: 'invalid json',
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('initial');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Multiple Instances', () => {
    it('should allow multiple instances with different keys', () => {
      const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
      const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

      expect(result1.current[0]).toBe('value1');
      expect(result2.current[0]).toBe('value2');

      act(() => {
        result1.current[1]('updated1');
        result2.current[1]('updated2');
      });

      expect(result1.current[0]).toBe('updated1');
      expect(result2.current[0]).toBe('updated2');
    });

    it('should sync instances with same key', () => {
      const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'initial'));
      const { result: result2 } = renderHook(() => useLocalStorage('shared-key', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'shared-key',
          newValue: JSON.stringify('synced'),
        });
        window.dispatchEvent(event);
      });

      expect(result1.current[0]).toBe('synced');
      expect(result2.current[0]).toBe('synced');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid updates', () => {
      const { result } = renderHook(() => useLocalStorage('rapid-key', 0));

      act(() => {
        for (let i = 1; i <= 10; i++) {
          result.current[1](i);
        }
      });

      expect(result.current[0]).toBe(10);
      expect(JSON.parse(localStorage.getItem('rapid-key') || '0')).toBe(10);
    });

    it('should persist complex nested objects', () => {
      const complexObject = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        tasks: [
          { id: 1, title: 'Task 1' },
          { id: 2, title: 'Task 2' },
        ],
      };

      const { result } = renderHook(() => useLocalStorage('complex-key', complexObject));

      act(() => {
        result.current[1]({
          ...complexObject,
          user: {
            ...complexObject.user,
            settings: {
              ...complexObject.user.settings,
              theme: 'light',
            },
          },
        });
      });

      expect(result.current[0].user.settings.theme).toBe('light');
    });
  });
});
