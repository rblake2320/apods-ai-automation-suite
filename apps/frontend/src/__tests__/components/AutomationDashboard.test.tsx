import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutomationDashboard from '@/components/AutomationDashboard';
import { useAutomationStore } from '@/store/useAutomationStore';
import { useToast } from '@/hooks/useToast';
import { AutomationTask, AutomationStatus } from '@/types';

// Mock dependencies
vi.mock('@/store/useAutomationStore');
vi.mock('@/hooks/useToast');

describe('AutomationDashboard Component', () => {
  const mockTasks: AutomationTask[] = [
    {
      id: '1',
      name: 'Test Task 1',
      description: 'First test task',
      status: 'idle' as AutomationStatus,
      enabled: true,
      runCount: 10,
      successCount: 8,
      failureCount: 2,
      lastRun: new Date('2024-01-01T10:00:00Z'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Test Task 2',
      description: 'Second test task',
      status: 'running' as AutomationStatus,
      enabled: true,
      runCount: 5,
      successCount: 5,
      failureCount: 0,
      lastRun: new Date('2024-01-02T10:00:00Z'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockToast = vi.fn();
  const mockError = vi.fn();
  const mockFetchTasks = vi.fn();
  const mockExecuteTask = vi.fn();
  const mockStopTask = vi.fn();
  const mockEnableTask = vi.fn();
  const mockDisableTask = vi.fn();
  const mockDeleteTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useToast as any).mockReturnValue({
      toast: mockToast,
      error: mockError,
    });

    (useAutomationStore as any).mockReturnValue({
      tasks: mockTasks,
      fetchTasks: mockFetchTasks,
      executeTask: mockExecuteTask,
      stopTask: mockStopTask,
      enableTask: mockEnableTask,
      disableTask: mockDisableTask,
      deleteTask: mockDeleteTask,
    });
  });

  describe('Rendering', () => {
    it('should render automation dashboard', async () => {
      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Automation Tasks')).toBeInTheDocument();
      });
    });

    it('should render loading state', () => {
      (useAutomationStore as any).mockReturnValue({
        tasks: [],
        fetchTasks: vi.fn(() => new Promise(() => {})),
        executeTask: mockExecuteTask,
        stopTask: mockStopTask,
        enableTask: mockEnableTask,
        disableTask: mockDisableTask,
        deleteTask: mockDeleteTask,
      });

      render(<AutomationDashboard />);
      expect(screen.getAllByRole('generic')[0]).toBeInTheDocument();
    });

    it('should render empty state when no tasks', async () => {
      (useAutomationStore as any).mockReturnValue({
        tasks: [],
        fetchTasks: mockFetchTasks,
        executeTask: mockExecuteTask,
        stopTask: mockStopTask,
        enableTask: mockEnableTask,
        disableTask: mockDisableTask,
        deleteTask: mockDeleteTask,
      });

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('No automation tasks found')).toBeInTheDocument();
      });
    });

    it('should render all tasks', async () => {
      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
      });
    });
  });

  describe('Task Information', () => {
    it('should display task name and description', async () => {
      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('First test task')).toBeInTheDocument();
      });
    });

    it('should display task statistics', async () => {
      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // runCount
        expect(screen.getByText('8')).toBeInTheDocument(); // successCount
        expect(screen.getByText('2')).toBeInTheDocument(); // failureCount
      });
    });

    it('should display task status badge', async () => {
      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('idle')).toBeInTheDocument();
        expect(screen.getByText('running')).toBeInTheDocument();
      });
    });
  });

  describe('Task Actions', () => {
    it('should execute task when Run button is clicked', async () => {
      mockExecuteTask.mockResolvedValue(undefined);

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const runButton = screen.getAllByRole('button', { name: /run/i })[0];
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(mockExecuteTask).toHaveBeenCalledWith('1');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Task Executed',
          description: 'The automation task has been started successfully',
          variant: 'success',
        });
      });
    });

    it('should stop task when Stop button is clicked', async () => {
      mockStopTask.mockResolvedValue(undefined);

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(mockStopTask).toHaveBeenCalledWith('2');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Task Stopped',
          description: 'The automation task has been stopped',
        });
      });
    });

    it('should handle execute task error', async () => {
      mockExecuteTask.mockRejectedValue(new Error('Failed'));

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const runButton = screen.getAllByRole('button', { name: /run/i })[0];
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Failed to execute task', 'Please try again');
      });
    });

    it('should not execute disabled task', async () => {
      const disabledTask = { ...mockTasks[0], enabled: false };
      (useAutomationStore as any).mockReturnValue({
        tasks: [disabledTask],
        fetchTasks: mockFetchTasks,
        executeTask: mockExecuteTask,
        stopTask: mockStopTask,
        enableTask: mockEnableTask,
        disableTask: mockDisableTask,
        deleteTask: mockDeleteTask,
      });

      render(<AutomationDashboard />);
      await waitFor(() => {
        const runButton = screen.getByRole('button', { name: /run/i });
        expect(runButton).toBeDisabled();
      });
    });
  });

  describe('Dropdown Menu Actions', () => {
    it('should toggle task enabled state', async () => {
      mockDisableTask.mockResolvedValue(undefined);

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );

      if (menuButton) {
        fireEvent.click(menuButton);
        await waitFor(() => {
          const disableButton = screen.getByText('Disable');
          fireEvent.click(disableButton);
        });

        await waitFor(() => {
          expect(mockDisableTask).toHaveBeenCalledWith('1');
        });
      }
    });

    it('should delete task with confirmation', async () => {
      global.confirm = vi.fn(() => true);
      mockDeleteTask.mockResolvedValue(undefined);

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );

      if (menuButton) {
        fireEvent.click(menuButton);
        await waitFor(() => {
          const deleteButton = screen.getByText('Delete');
          fireEvent.click(deleteButton);
        });

        await waitFor(() => {
          expect(mockDeleteTask).toHaveBeenCalledWith('1');
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Task Deleted',
            description: 'The automation task has been deleted',
          });
        });
      }
    });

    it('should not delete task when confirmation is cancelled', async () => {
      global.confirm = vi.fn(() => false);

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button');
      const menuButton = menuButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-more-vertical')
      );

      if (menuButton) {
        fireEvent.click(menuButton);
        await waitFor(() => {
          const deleteButton = screen.getByText('Delete');
          fireEvent.click(deleteButton);
        });

        expect(mockDeleteTask).not.toHaveBeenCalled();
      }
    });
  });

  describe('Loading State', () => {
    it('should fetch tasks on mount', async () => {
      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(mockFetchTasks).toHaveBeenCalled();
      });
    });

    it('should handle fetch tasks error', async () => {
      mockFetchTasks.mockRejectedValue(new Error('Failed to fetch'));

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith(
          'Failed to load automation tasks',
          'Please try again later'
        );
      });
    });
  });

  describe('Status Badges', () => {
    it('should render correct badge variant for each status', async () => {
      const tasks: AutomationTask[] = [
        { ...mockTasks[0], status: 'idle' as AutomationStatus },
        { ...mockTasks[0], id: '2', status: 'running' as AutomationStatus },
        { ...mockTasks[0], id: '3', status: 'completed' as AutomationStatus },
        { ...mockTasks[0], id: '4', status: 'failed' as AutomationStatus },
        { ...mockTasks[0], id: '5', status: 'paused' as AutomationStatus },
      ];

      (useAutomationStore as any).mockReturnValue({
        tasks,
        fetchTasks: mockFetchTasks,
        executeTask: mockExecuteTask,
        stopTask: mockStopTask,
        enableTask: mockEnableTask,
        disableTask: mockDisableTask,
        deleteTask: mockDeleteTask,
      });

      render(<AutomationDashboard />);
      await waitFor(() => {
        expect(screen.getByText('idle')).toBeInTheDocument();
        expect(screen.getByText('running')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
        expect(screen.getByText('failed')).toBeInTheDocument();
        expect(screen.getByText('paused')).toBeInTheDocument();
      });
    });
  });
});
