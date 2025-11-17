import { useEffect, useState } from 'react';
import { Server, Play, Square, RefreshCw, Trash2, Settings, Plus, Activity } from 'lucide-react';
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
import { useToast } from '@/hooks/useToast';
import { MCPServer, MCPServerStatus } from '@/types';
import * as mcpAPI from '@/api/mcp';
import { formatRelativeTime } from '@/lib/utils';

export default function MCPServerPanel() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, error: showError } = useToast();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await mcpAPI.getMCPServers();
      setServers(response.data);
    } catch (err) {
      showError('Failed to load MCP servers', 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async (serverId: string, serverName: string) => {
    try {
      await mcpAPI.startMCPServer(serverId);
      toast({
        title: 'Server Started',
        description: `${serverName} has been started successfully`,
        variant: 'success',
      });
      await loadServers();
    } catch (err) {
      showError('Failed to start server', 'Please try again');
    }
  };

  const handleStop = async (serverId: string, serverName: string) => {
    try {
      await mcpAPI.stopMCPServer(serverId);
      toast({
        title: 'Server Stopped',
        description: `${serverName} has been stopped`,
      });
      await loadServers();
    } catch (err) {
      showError('Failed to stop server', 'Please try again');
    }
  };

  const handleRestart = async (serverId: string, serverName: string) => {
    try {
      await mcpAPI.restartMCPServer(serverId);
      toast({
        title: 'Server Restarted',
        description: `${serverName} has been restarted`,
      });
      await loadServers();
    } catch (err) {
      showError('Failed to restart server', 'Please try again');
    }
  };

  const handleDelete = async (serverId: string, serverName: string) => {
    if (!confirm(`Are you sure you want to delete "${serverName}"?`)) return;

    try {
      await mcpAPI.deleteMCPServer(serverId);
      toast({
        title: 'Server Deleted',
        description: 'The MCP server has been deleted',
      });
      await loadServers();
    } catch (err) {
      showError('Failed to delete server', 'Please try again');
    }
  };

  const getStatusBadge = (status: MCPServerStatus) => {
    const variants: Record<MCPServerStatus, any> = {
      online: 'success',
      offline: 'secondary',
      error: 'destructive',
      starting: 'warning',
      stopping: 'warning',
    };

    const labels: Record<MCPServerStatus, string> = {
      online: 'Online',
      offline: 'Offline',
      error: 'Error',
      starting: 'Starting',
      stopping: 'Stopping',
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status]}
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
          <h2 className="text-3xl font-bold tracking-tight">MCP Servers</h2>
          <p className="text-muted-foreground">Manage Model Context Protocol servers</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Server
        </Button>
      </div>

      {/* Servers Grid */}
      {servers.length === 0 ? (
        <Card className="p-12 text-center">
          <Server className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No MCP servers configured</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Server
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <Card key={server.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                    </div>
                    <CardDescription className="mt-1 line-clamp-2">
                      {server.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRestart(server.id, server.name)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restart
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Activity className="mr-2 h-4 w-4" />
                        View Metrics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(server.id, server.name)}
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
                  {/* Status & Type */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(server.status)}
                    <Badge variant="outline" className="capitalize">
                      {server.type}
                    </Badge>
                  </div>

                  {/* URL */}
                  <div className="text-xs">
                    <span className="text-muted-foreground">URL: </span>
                    <span className="font-mono">{server.url}</span>
                  </div>

                  {/* Health Check */}
                  {server.healthCheck && (
                    <div className="text-xs text-muted-foreground">
                      Latency: {server.healthCheck.latency}ms • Last check:{' '}
                      {formatRelativeTime(server.healthCheck.lastCheck)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {server.status === 'online' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStop(server.id, server.name)}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStart(server.id, server.name)}
                        disabled={server.status === 'starting'}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start
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
