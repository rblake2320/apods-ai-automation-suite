import { useEffect, useRef, useState } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { useThemeStore } from '@/store/useThemeStore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value?: string;
  defaultValue?: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string | undefined) => void;
  height?: string;
  readOnly?: boolean;
  className?: string;
}

export default function CodeEditor({
  value,
  defaultValue,
  language = 'typescript',
  onChange,
  onSave,
  height = '600px',
  readOnly = false,
  className,
}: CodeEditorProps) {
  const { resolvedTheme } = useThemeStore();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Add save command (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue());
      }
    });

    // Format on paste
    editor.onDidPaste(() => {
      editor.getAction('editor.action.formatDocument')?.run();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value);
    }
  };

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      // Configure editor options
      editorRef.current.updateOptions({
        readOnly,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderWhitespace: 'boundary',
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
      });
    }
  }, [readOnly]);

  return (
    <div className={cn('relative overflow-hidden rounded-lg border', className)}>
      {!isEditorReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="w-full space-y-2 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      )}
      <Editor
        height={height}
        language={language}
        value={value}
        defaultValue={defaultValue}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={null}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderWhitespace: 'boundary',
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
        }}
      />
    </div>
  );
}
