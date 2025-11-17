import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MCPServerPanel from '@/components/MCPServerPanel';
import { useToast } from '@/hooks/useToast';
import * as mcpAPI from '@/api/mcp';
import { MCPServer, MCPServerStatus } from '@/types';

// Mock dependencies
vi.mock('@/hooks/useToast');
vi.mock('@/api/mcp');

describe('MCPServerPanel Component', () => {
  const mockServers: MCPServer[] = [
    {
      id: '1',
      name: 'Filesystem Server',
      description: 'File system operations',
      type: 'filesystem',
      url: 'http://localhost:3001',
      status: 'online' as MCPServerStatus,
      healthCheck: {
        latency: 50,
        lastCheck: new Date('2024-01-01T10:00:00Z'),
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Playwright Server',
      description: 'Browser automation',
      type: 'playwright',
      url: 'http://localhost:3002',
      status: 'offline' as MCPServerStatus,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  const mockToast = vi.fn();
  const mockError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useToast as any).mockReturnValue({
      toast: mockToast,
      error: mockError,
    });

    (mcpAPI.getMCPServers as any).mockResolvedValue({ data: mockServers });
    (mcpAPI.startMCPServer as any).mockResolvedValue({ data: {} });
    (mcpAPI.stopMCPServer as any).mockResolvedValue({ data: {} });
    (mcpAPI.restartMCPServer as any).mockResolvedValue({ data: {} });
    (mcpAPI.deleteMCPServer as any).mockResolvedValue({ data: {} });
  });

  describe('Rendering', () => {
    it('should render MCP server panel', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('MCP Servers')).toBeInTheDocument();
      });
    });

    it('should render loading state', () => {
      (mcpAPI.getMCPServers as any).mockImplementation(() => new Promise(() => {}));

      render(<MCPServerPanel />);
      expect(screen.getAllByRole('generic')[0]).toBeInTheDocument();
    });

    it('should render all servers after loading', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
        expect(screen.getByText('Playwright Server')).toBeInTheDocument();
      });
    });

    it('should render empty state when no servers', async () => {
      (mcpAPI.getMCPServers as any).mockResolvedValue({ data: [] });

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('No MCP servers configured')).toBeInTheDocument();
      });
    });
  });

  describe('Server Information', () => {
    it('should display server name and description', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
        expect(screen.getByText('File system operations')).toBeInTheDocument();
      });
    });

    it('should display server URL', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('http://localhost:3001')).toBeInTheDocument();
      });
    });

    it('should display server type', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('filesystem')).toBeInTheDocument();
        expect(screen.getByText('playwright')).toBeInTheDocument();
      });
    });

    it('should display health check information', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText(/Latency: 50ms/)).toBeInTheDocument();
      });
    });
  });

  describe('Server Actions', () => {
    it('should start offline server', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Playwright Server')).toBeInTheDocument();
      });

      const startButton = screen.getAllByRole('button', { name: /start/i })[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mcpAPI.startMCPServer).toHaveBeenCalledWith('2');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Server Started',
          description: 'Playwright Server has been started successfully',
          variant: 'success',
        });
      });
    });

    it('should stop online server', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(mcpAPI.stopMCPServer).toHaveBeenCalledWith('1');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Server Stopped',
          description: 'Filesystem Server has been stopped',
        });
      });
    });

    it('should restart server', async () => {
      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
      });

      const settingsButton = screen.getAllByRole('button')[2];
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const restartButton = screen.getByText('Restart');
        fireEvent.click(restartButton);
      });

      await waitFor(() => {
        expect(mcpAPI.restartMCPServer).toHaveBeenCalledWith('1');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Server Restarted',
          description: 'Filesystem Server has been restarted',
        });
      });
    });

    it('should delete server with confirmation', async () => {
      global.confirm = vi.fn(() => true);

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
      });

      const settingsButton = screen.getAllByRole('button')[2];
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(mcpAPI.deleteMCPServer).toHaveBeenCalledWith('1');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Server Deleted',
          description: 'The MCP server has been deleted',
        });
      });
    });

    it('should not delete server when confirmation is cancelled', async () => {
      global.confirm = vi.fn(() => false);

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
      });

      const settingsButton = screen.getAllByRole('button')[2];
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      expect(mcpAPI.deleteMCPServer).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle start server error', async () => {
      (mcpAPI.startMCPServer as any).mockRejectedValue(new Error('Failed'));

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Playwright Server')).toBeInTheDocument();
      });

      const startButton = screen.getAllByRole('button', { name: /start/i })[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Failed to start server', 'Please try again');
      });
    });

    it('should handle stop server error', async () => {
      (mcpAPI.stopMCPServer as any).mockRejectedValue(new Error('Failed'));

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Failed to stop server', 'Please try again');
      });
    });

    it('should handle restart server error', async () => {
      (mcpAPI.restartMCPServer as any).mockRejectedValue(new Error('Failed'));

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Filesystem Server')).toBeInTheDocument();
      });

      const settingsButton = screen.getAllByRole('button')[2];
      fireEvent.click(settingsButton);

      await waitFor(() => {
        const restartButton = screen.getByText('Restart');
        fireEvent.click(restartButton);
      });

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Failed to restart server', 'Please try again');
      });
    });

    it('should handle fetch servers error', async () => {
      (mcpAPI.getMCPServers as any).mockRejectedValue(new Error('Failed'));

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith(
          'Failed to load MCP servers',
          'Please try again later'
        );
      });
    });
  });

  describe('Status Badges', () => {
    it('should render correct badge variant for each status', async () => {
      const servers: MCPServer[] = [
        { ...mockServers[0], status: 'online' as MCPServerStatus },
        { ...mockServers[0], id: '2', status: 'offline' as MCPServerStatus },
        { ...mockServers[0], id: '3', status: 'error' as MCPServerStatus },
        { ...mockServers[0], id: '4', status: 'starting' as MCPServerStatus },
        { ...mockServers[0], id: '5', status: 'stopping' as MCPServerStatus },
      ];

      (mcpAPI.getMCPServers as any).mockResolvedValue({ data: servers });

      render(<MCPServerPanel />);
      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument();
        expect(screen.getByText('Offline')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Starting')).toBeInTheDocument();
        expect(screen.getByText('Stopping')).toBeInTheDocument();
      });
    });

    it('should disable start button when server is starting', async () => {
      const servers: MCPServer[] = [{ ...mockServers[0], status: 'starting' as MCPServerStatus }];

      (mcpAPI.getMCPServers as any).mockResolvedValue({ data: servers });

      render(<MCPServerPanel />);
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /start/i });
        expect(startButton).toBeDisabled();
      });
    });
  });
});
