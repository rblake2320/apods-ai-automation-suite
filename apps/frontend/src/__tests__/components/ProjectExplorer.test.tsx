import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectExplorer from '@/components/ProjectExplorer';
import { useProjectStore } from '@/store/useProjectStore';
import { FileNode } from '@/types';

// Mock dependencies
vi.mock('@/store/useProjectStore');

describe('ProjectExplorer Component', () => {
  const mockFileTree: FileNode[] = [
    {
      id: '1',
      name: 'src',
      type: 'directory',
      path: '/src',
      isExpanded: false,
      children: [
        {
          id: '2',
          name: 'components',
          type: 'directory',
          path: '/src/components',
          isExpanded: false,
          children: [],
        },
        {
          id: '3',
          name: 'index.ts',
          type: 'file',
          path: '/src/index.ts',
        },
      ],
    },
    {
      id: '4',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
    },
  ];

  const mockFetchFileTree = vi.fn();
  const mockSetSelectedFile = vi.fn();
  const mockExpandNode = vi.fn();
  const mockCollapseNode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useProjectStore as any).mockReturnValue({
      fileTree: mockFileTree,
      selectedFile: null,
      fetchFileTree: mockFetchFileTree,
      setSelectedFile: mockSetSelectedFile,
      expandNode: mockExpandNode,
      collapseNode: mockCollapseNode,
    });

    mockFetchFileTree.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render project explorer', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(screen.getByText('Explorer')).toBeInTheDocument();
      });
    });

    it('should render loading state', () => {
      mockFetchFileTree.mockImplementation(() => new Promise(() => {}));

      render(<ProjectExplorer projectId="test-project" />);
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    it('should render file tree after loading', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument();
        expect(screen.getByText('package.json')).toBeInTheDocument();
      });
    });

    it('should render empty state when no files', async () => {
      (useProjectStore as any).mockReturnValue({
        fileTree: [],
        selectedFile: null,
        fetchFileTree: mockFetchFileTree,
        setSelectedFile: mockSetSelectedFile,
        expandNode: mockExpandNode,
        collapseNode: mockCollapseNode,
      });

      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(screen.getByText('No files found')).toBeInTheDocument();
      });
    });

    it('should apply custom className', async () => {
      const { container } = render(
        <ProjectExplorer projectId="test-project" className="custom-class" />
      );
      await waitFor(() => {
        expect(container.firstChild).toHaveClass('custom-class');
      });
    });
  });

  describe('File Tree Interaction', () => {
    it('should fetch file tree on mount', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(mockFetchFileTree).toHaveBeenCalledWith('test-project');
      });
    });

    it('should expand directory when clicked', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument();
      });

      const srcButton = screen.getByText('src').closest('button');
      if (srcButton) {
        fireEvent.click(srcButton);
        expect(mockExpandNode).toHaveBeenCalledWith('1');
      }
    });

    it('should collapse expanded directory when clicked', async () => {
      const expandedTree = [
        {
          ...mockFileTree[0],
          isExpanded: true,
        },
        mockFileTree[1],
      ];

      (useProjectStore as any).mockReturnValue({
        fileTree: expandedTree,
        selectedFile: null,
        fetchFileTree: mockFetchFileTree,
        setSelectedFile: mockSetSelectedFile,
        expandNode: mockExpandNode,
        collapseNode: mockCollapseNode,
      });

      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument();
      });

      const srcButton = screen.getByText('src').closest('button');
      if (srcButton) {
        fireEvent.click(srcButton);
        expect(mockCollapseNode).toHaveBeenCalledWith('1');
      }
    });

    it('should select file when clicked', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(screen.getByText('package.json')).toBeInTheDocument();
      });

      const fileButton = screen.getByText('package.json').closest('button');
      if (fileButton) {
        fireEvent.click(fileButton);
        expect(mockSetSelectedFile).toHaveBeenCalled();
      }
    });

    it('should call onFileSelect when file is selected', async () => {
      const onFileSelect = vi.fn();
      render(<ProjectExplorer projectId="test-project" onFileSelect={onFileSelect} />);

      await waitFor(() => {
        expect(screen.getByText('package.json')).toBeInTheDocument();
      });

      const fileButton = screen.getByText('package.json').closest('button');
      if (fileButton) {
        fireEvent.click(fileButton);
        await waitFor(() => {
          expect(onFileSelect).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Visual Indicators', () => {
    it('should show chevron for directories', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        const srcButton = screen.getByText('src').closest('button');
        expect(srcButton?.querySelector('.lucide-chevron-right')).toBeInTheDocument();
      });
    });

    it('should show folder icon for collapsed directories', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        const srcButton = screen.getByText('src').closest('button');
        expect(srcButton?.querySelector('.lucide-folder')).toBeInTheDocument();
      });
    });

    it('should show open folder icon for expanded directories', async () => {
      const expandedTree = [
        {
          ...mockFileTree[0],
          isExpanded: true,
        },
        mockFileTree[1],
      ];

      (useProjectStore as any).mockReturnValue({
        fileTree: expandedTree,
        selectedFile: null,
        fetchFileTree: mockFetchFileTree,
        setSelectedFile: mockSetSelectedFile,
        expandNode: mockExpandNode,
        collapseNode: mockCollapseNode,
      });

      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        const srcButton = screen.getByText('src').closest('button');
        expect(srcButton?.querySelector('.lucide-folder-open')).toBeInTheDocument();
      });
    });

    it('should show file icon for files', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        const fileButton = screen.getByText('package.json').closest('button');
        expect(fileButton?.querySelector('.lucide-file')).toBeInTheDocument();
      });
    });

    it('should highlight selected file', async () => {
      const selectedFileNode = mockFileTree[1];
      (useProjectStore as any).mockReturnValue({
        fileTree: mockFileTree,
        selectedFile: selectedFileNode,
        fetchFileTree: mockFetchFileTree,
        setSelectedFile: mockSetSelectedFile,
        expandNode: mockExpandNode,
        collapseNode: mockCollapseNode,
      });

      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        const fileButton = screen.getByText('package.json').closest('button');
        expect(fileButton).toHaveClass('bg-accent');
      });
    });
  });

  describe('Nested Structure', () => {
    it('should render nested files when directory is expanded', async () => {
      const expandedTree = [
        {
          ...mockFileTree[0],
          isExpanded: true,
        },
        mockFileTree[1],
      ];

      (useProjectStore as any).mockReturnValue({
        fileTree: expandedTree,
        selectedFile: null,
        fetchFileTree: mockFetchFileTree,
        setSelectedFile: mockSetSelectedFile,
        expandNode: mockExpandNode,
        collapseNode: mockCollapseNode,
      });

      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
        expect(screen.getByText('index.ts')).toBeInTheDocument();
      });
    });

    it('should apply correct indentation for nested items', async () => {
      const expandedTree = [
        {
          ...mockFileTree[0],
          isExpanded: true,
        },
        mockFileTree[1],
      ];

      (useProjectStore as any).mockReturnValue({
        fileTree: expandedTree,
        selectedFile: null,
        fetchFileTree: mockFetchFileTree,
        setSelectedFile: mockSetSelectedFile,
        expandNode: mockExpandNode,
        collapseNode: mockCollapseNode,
      });

      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        const componentsButton = screen.getByText('components').closest('button');
        expect(componentsButton).toHaveStyle({ paddingLeft: '20px' });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchFileTree.mockRejectedValue(new Error('Failed to fetch'));

      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load file tree:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have keyboard accessible buttons', async () => {
      render(<ProjectExplorer projectId="test-project" />);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toHaveClass('focus-visible:outline-none');
        });
      });
    });
  });
});
