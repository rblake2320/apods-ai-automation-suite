import { useEffect, useState } from 'react';
import { Play, Pause, Trash2, Edit, MoreVertical, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAutomationStore } from '@/store/useAutomationStore';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime } from '@/lib/utils';
import { AutomationTask, AutomationStatus } from '@/types';

export default function AutomationDashboard() {
  const { tasks, fetchTasks, executeTask, stopTask, enableTask, disableTask, deleteTask } =
    useAutomationStore();
  const { toast, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        await fetchTasks();
      } catch (err) {
        showError('Failed to load automation tasks', 'Please try again later');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [fetchTasks, showError]);

  const handleExecute = async (taskId: string) => {
    try {
      await executeTask(taskId);
      toast({
        title: 'Task Executed',
        description: 'The automation task has been started successfully',
        variant: 'success',
      });
    } catch (err) {
      showError('Failed to execute task', 'Please try again');
    }
  };

  const handleStop = async (taskId: string) => {
    try {
      await stopTask(taskId);
      toast({
        title: 'Task Stopped',
        description: 'The automation task has been stopped',
      });
    } catch (err) {
      showError('Failed to stop task', 'Please try again');
    }
  };

  const handleToggleEnabled = async (task: AutomationTask) => {
    try {
      if (task.enabled) {
        await disableTask(task.id);
        toast({
          title: 'Task Disabled',
          description: `${task.name} has been disabled`,
        });
      } else {
        await enableTask(task.id);
        toast({
          title: 'Task Enabled',
          description: `${task.name} has been enabled`,
          variant: 'success',
        });
      }
    } catch (err) {
      showError('Failed to update task', 'Please try again');
    }
  };

  const handleDelete = async (taskId: string, taskName: string) => {
    if (!confirm(`Are you sure you want to delete "${taskName}"?`)) return;

    try {
      await deleteTask(taskId);
      toast({
        title: 'Task Deleted',
        description: 'The automation task has been deleted',
      });
    } catch (err) {
      showError('Failed to delete task', 'Please try again');
    }
  };

  const getStatusBadge = (status: AutomationStatus) => {
    const variants: Record<AutomationStatus, any> = {
      idle: 'secondary',
      running: 'default',
      completed: 'success',
      failed: 'destructive',
      paused: 'warning',
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-6 w-3/4 rounded bg-muted"></div>
              <div className="h-4 w-full rounded bg-muted"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="space-y-2">
                <div className="h-4 w-1/2 rounded bg-muted"></div>
                <div className="h-4 w-2/3 rounded bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Automation Tasks</h2>
          <p className="text-muted-foreground">Manage and monitor your automation workflows</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No automation tasks found</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Task
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {task.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleEnabled(task)}>
                        {task.enabled ? 'Disable' : 'Enable'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(task.id, task.name)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(task.status)}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold">{task.runCount}</p>
                      <p className="text-xs text-muted-foreground">Runs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{task.successCount}</p>
                      <p className="text-xs text-muted-foreground">Success</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{task.failureCount}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>

                  {/* Last Run */}
                  {task.lastRun && (
                    <div className="text-xs text-muted-foreground">
                      Last run: {formatRelativeTime(task.lastRun)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {task.status === 'running' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStop(task.id)}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleExecute(task.id)}
                        disabled={!task.enabled}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Run
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
