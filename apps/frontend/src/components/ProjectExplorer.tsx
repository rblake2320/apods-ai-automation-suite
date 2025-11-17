import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore } from '@/store/useProjectStore';
import { FileNode } from '@/types';

interface ProjectExplorerProps {
  projectId: string;
  onFileSelect?: (file: FileNode) => void;
  className?: string;
}

export default function ProjectExplorer({
  projectId,
  onFileSelect,
  className,
}: ProjectExplorerProps) {
  const { fileTree, selectedFile, fetchFileTree, setSelectedFile, expandNode, collapseNode } =
    useProjectStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFileTree = async () => {
      try {
        await fetchFileTree(projectId);
      } catch (error) {
        console.error('Failed to load file tree:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFileTree();
  }, [projectId, fetchFileTree]);

  const handleNodeClick = (node: FileNode) => {
    if (node.type === 'directory') {
      if (node.isExpanded) {
        collapseNode(node.id);
      } else {
        expandNode(node.id);
      }
    } else {
      setSelectedFile(node);
      onFileSelect?.(node);
    }
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isDirectory = node.type === 'directory';
    const isExpanded = node.isExpanded;
    const isSelected = selectedFile?.id === node.id;

    return (
      <div key={node.id}>
        <button
          onClick={() => handleNodeClick(node)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent',
            isSelected && 'bg-accent text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isDirectory && (
            <span className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <span className="shrink-0">
            {isDirectory ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <File className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {isDirectory && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn('border-r bg-background', className)}>
        <div className="p-4">
          <div className="space-y-2 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-6 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col border-r bg-background', className)}>
      <div className="border-b p-3">
        <h3 className="font-semibold">Explorer</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {fileTree.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No files found</p>
          ) : (
            fileTree.map((node) => renderNode(node))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
