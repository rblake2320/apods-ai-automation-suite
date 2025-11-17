import { useEffect, useState } from 'react';
import { Activity, Zap, FolderKanban, Server, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/utils';
import * as automationAPI from '@/api/automation';
import * as mcpAPI from '@/api/mcp';
import * as projectsAPI from '@/api/projects';
import { ActivityItem } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeAutomations: 0,
    mcpServers: 0,
    tasksToday: 0,
    successRate: 0,
    averageExecutionTime: 0,
  });
  const [recentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [automationStats, mcpStats, projects] = await Promise.all([
        automationAPI.getAutomationStats(),
        mcpAPI.getMCPStats(),
        projectsAPI.getProjects({ limit: 1 }),
      ]);

      setStats({
        totalProjects: projects.totalCount,
        activeAutomations: automationStats.activeTasks,
        mcpServers: mcpStats.onlineServers,
        tasksToday: automationStats.completedToday,
        successRate: automationStats.successRate,
        averageExecutionTime: automationStats.averageExecutionTime,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      description: 'Active projects',
      trend: '+2 this week',
      trendUp: true,
    },
    {
      title: 'Active Automations',
      value: stats.activeAutomations,
      icon: Zap,
      description: 'Running tasks',
      trend: `${stats.tasksToday} completed today`,
      trendUp: true,
    },
    {
      title: 'MCP Servers',
      value: stats.mcpServers,
      icon: Server,
      description: 'Online servers',
      trend: 'All systems operational',
      trendUp: true,
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      description: 'Last 30 days',
      trend: '+2.5% from last month',
      trendUp: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-2 h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your automation suite.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp
                  className={`h-3 w-3 ${stat.trendUp ? 'text-success' : 'text-destructive'}`}
                />
                <span className={`text-xs ${stat.trendUp ? 'text-success' : 'text-destructive'}`}>
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events from your automation suite</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="automations">Automations</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="mcp">MCP</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  {recentActivity.length === 0 ? (
                    <div className="flex h-[400px] items-center justify-center">
                      <div className="text-center">
                        <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">No recent activity</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                        >
                          <div className="mt-0.5">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.timestamp)}
                            </p>
                          </div>
                          {activity.status && (
                            <Badge variant="outline" className="capitalize">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Performance metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Average Execution Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Avg. Execution Time</span>
                </div>
                <span className="text-sm font-bold">{stats.averageExecutionTime}s</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min((stats.averageExecutionTime / 60) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <span className="text-sm font-bold text-success">{stats.successRate}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${stats.successRate}%` }}
                />
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2 pt-4">
              <h4 className="text-sm font-semibold">Quick Actions</h4>
              <div className="grid gap-2">
                <a
                  href="/projects"
                  className="flex items-center gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>View Projects</span>
                </a>
                <a
                  href="/automation"
                  className="flex items-center gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <Zap className="h-4 w-4" />
                  <span>Manage Automations</span>
                </a>
                <a
                  href="/mcp-servers"
                  className="flex items-center gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <Server className="h-4 w-4" />
                  <span>Configure MCP Servers</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
