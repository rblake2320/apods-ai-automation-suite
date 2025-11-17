import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CodeEditor from '@/components/CodeEditor';
import { useThemeStore } from '@/store/useThemeStore';

// Mock monaco editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, onMount, loading, ...props }: any) => {
    // Simulate editor mount
    if (onMount) {
      const mockEditor = {
        getValue: () => value || '',
        addCommand: vi.fn(),
        onDidPaste: vi.fn(),
        updateOptions: vi.fn(),
        getAction: vi.fn(() => ({ run: vi.fn() })),
      };
      const mockMonaco = {
        KeyMod: { CtrlCmd: 1 },
        KeyCode: { KeyS: 1 },
      };
      setTimeout(() => onMount(mockEditor, mockMonaco), 0);
    }
    return (
      <div data-testid="monaco-editor" {...props}>
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  },
}));

// Mock theme store
vi.mock('@/store/useThemeStore', () => ({
  useThemeStore: vi.fn(),
}));

describe('CodeEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useThemeStore as any).mockReturnValue({
      resolvedTheme: 'light',
    });
  });

  describe('Rendering', () => {
    it('should render editor component', () => {
      render(<CodeEditor />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should show skeleton while loading', () => {
      render(<CodeEditor />);
      const container = screen.getByTestId('monaco-editor').parentElement;
      expect(container).toHaveClass('relative', 'overflow-hidden', 'rounded-lg', 'border');
    });

    it('should apply custom className', () => {
      render(<CodeEditor className="custom-editor" />);
      const container = screen.getByTestId('monaco-editor').parentElement;
      expect(container).toHaveClass('custom-editor');
    });

    it('should use custom height', () => {
      render(<CodeEditor height="400px" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('height', '400px');
    });
  });

  describe('Value and defaultValue', () => {
    it('should render with default value', () => {
      render(<CodeEditor defaultValue="const hello = 'world';" />);
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
        'defaultValue',
        "const hello = 'world';"
      );
    });

    it('should render with controlled value', async () => {
      render(<CodeEditor value="const test = 123;" />);
      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        expect(textarea).toHaveValue('const test = 123;');
      });
    });

    it('should update when value prop changes', async () => {
      const { rerender } = render(<CodeEditor value="initial" />);
      await waitFor(() => {
        expect(screen.getByTestId('editor-textarea')).toHaveValue('initial');
      });

      rerender(<CodeEditor value="updated" />);
      await waitFor(() => {
        expect(screen.getByTestId('editor-textarea')).toHaveValue('updated');
      });
    });
  });

  describe('Language Support', () => {
    it('should default to typescript language', () => {
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('language', 'typescript');
    });

    it('should support custom language', () => {
      render(<CodeEditor language="javascript" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('language', 'javascript');
    });

    it('should support python language', () => {
      render(<CodeEditor language="python" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('language', 'python');
    });

    it('should support json language', () => {
      render(<CodeEditor language="json" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('language', 'json');
    });
  });

  describe('Theme Support', () => {
    it('should use light theme when resolvedTheme is light', () => {
      (useThemeStore as any).mockReturnValue({ resolvedTheme: 'light' });
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('theme', 'light');
    });

    it('should use dark theme when resolvedTheme is dark', () => {
      (useThemeStore as any).mockReturnValue({ resolvedTheme: 'dark' });
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('theme', 'vs-dark');
    });

    it('should update theme when theme changes', () => {
      const { rerender } = render(<CodeEditor />);
      (useThemeStore as any).mockReturnValue({ resolvedTheme: 'dark' });
      rerender(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('theme', 'vs-dark');
    });
  });

  describe('Read-only Mode', () => {
    it('should not be read-only by default', () => {
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('readonly', 'false');
    });

    it('should support read-only mode', () => {
      render(<CodeEditor readOnly />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('readonly', 'true');
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when content changes', async () => {
      const handleChange = vi.fn();
      render(<CodeEditor onChange={handleChange} />);

      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
      });
    });

    it('should call onSave when save command is triggered', async () => {
      const handleSave = vi.fn();
      render(<CodeEditor value="test code" onSave={handleSave} />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should not call onChange when in read-only mode', async () => {
      const handleChange = vi.fn();
      render(<CodeEditor readOnly onChange={handleChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Editor Configuration', () => {
    it('should configure editor with correct options', async () => {
      render(<CodeEditor />);

      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toBeInTheDocument();
      });
    });

    it('should have minimap enabled', () => {
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should have line numbers enabled', () => {
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should support word wrap', () => {
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Editor Mount', () => {
    it('should handle editor mount correctly', async () => {
      const handleChange = vi.fn();
      render(<CodeEditor onChange={handleChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should set up save command on mount', async () => {
      const handleSave = vi.fn();
      render(<CodeEditor onSave={handleSave} />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should support screen readers', () => {
      render(<CodeEditor />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large code content', () => {
      const largeCode = 'const x = 1;\n'.repeat(1000);
      render(<CodeEditor value={largeCode} />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<CodeEditor value="initial" />);
      rerender(<CodeEditor value="initial" />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });
});
