import { useState } from 'react';
import { Save, User, Bell, Palette, Code, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/hooks/useToast';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    language: 'en',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h' as '12h' | '24h',
    timezone: 'UTC',
  });

  // Editor Settings
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    tabSize: 2,
    wordWrap: 'on' as 'on' | 'off',
    minimap: true,
    formatOnSave: true,
    autoSave: 'afterDelay' as 'off' | 'afterDelay' | 'onFocusChange',
  });

  // Automation Settings
  const [automationSettings, setAutomationSettings] = useState({
    maxConcurrentTasks: 5,
    defaultTimeout: 300,
    retryFailedTasks: true,
    maxRetries: 3,
    enableLogging: true,
    logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    desktop: true,
    email: false,
    sound: true,
    taskCompletion: true,
    taskFailure: true,
    systemAlerts: true,
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Settings Saved',
        description: 'Your settings have been saved successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="general">
            <User className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="editor">
            <Code className="mr-2 h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="mr-2 h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your basic application preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, language: value })
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, timezone: value })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={generalSettings.dateFormat}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, dateFormat: value })
                    }
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={generalSettings.timeFormat}
                    onValueChange={(value: '12h' | '24h') =>
                      setGeneralSettings({ ...generalSettings, timeFormat: value })
                    }
                  >
                    <SelectTrigger id="timeFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                  </div>
                  <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editor Settings */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Editor Settings</CardTitle>
              <CardDescription>Configure your code editor preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={editorSettings.fontSize}
                    onChange={(e) =>
                      setEditorSettings({ ...editorSettings, fontSize: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tabSize">Tab Size</Label>
                  <Input
                    id="tabSize"
                    type="number"
                    value={editorSettings.tabSize}
                    onChange={(e) =>
                      setEditorSettings({ ...editorSettings, tabSize: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Minimap</Label>
                    <p className="text-sm text-muted-foreground">Show code minimap</p>
                  </div>
                  <Switch
                    checked={editorSettings.minimap}
                    onCheckedChange={(checked) =>
                      setEditorSettings({ ...editorSettings, minimap: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Format on Save</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically format code on save
                    </p>
                  </div>
                  <Switch
                    checked={editorSettings.formatOnSave}
                    onCheckedChange={(checked) =>
                      setEditorSettings({ ...editorSettings, formatOnSave: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Configure automation execution preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentTasks">Max Concurrent Tasks</Label>
                  <Input
                    id="maxConcurrentTasks"
                    type="number"
                    value={automationSettings.maxConcurrentTasks}
                    onChange={(e) =>
                      setAutomationSettings({
                        ...automationSettings,
                        maxConcurrentTasks: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTimeout">Default Timeout (seconds)</Label>
                  <Input
                    id="defaultTimeout"
                    type="number"
                    value={automationSettings.defaultTimeout}
                    onChange={(e) =>
                      setAutomationSettings({
                        ...automationSettings,
                        defaultTimeout: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={automationSettings.maxRetries}
                    onChange={(e) =>
                      setAutomationSettings({
                        ...automationSettings,
                        maxRetries: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Select
                    value={automationSettings.logLevel}
                    onValueChange={(value: any) =>
                      setAutomationSettings({ ...automationSettings, logLevel: value })
                    }
                  >
                    <SelectTrigger id="logLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Retry Failed Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically retry failed automation tasks
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.retryFailedTasks}
                    onCheckedChange={(checked) =>
                      setAutomationSettings({ ...automationSettings, retryFailedTasks: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log automation execution details
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.enableLogging}
                    onCheckedChange={(checked) =>
                      setAutomationSettings({ ...automationSettings, enableLogging: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications from the app
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, enabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Desktop Notifications</Label>
                  <Switch
                    checked={notificationSettings.desktop}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, desktop: checked })
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Email Notifications</Label>
                  <Switch
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, email: checked })
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Sound</Label>
                  <Switch
                    checked={notificationSettings.sound}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, sound: checked })
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-sm font-medium">Notification Types</p>

                <div className="flex items-center justify-between">
                  <Label>Task Completion</Label>
                  <Switch
                    checked={notificationSettings.taskCompletion}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, taskCompletion: checked })
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Task Failure</Label>
                  <Switch
                    checked={notificationSettings.taskFailure}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, taskFailure: checked })
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>System Alerts</Label>
                  <Switch
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, systemAlerts: checked })
                    }
                    disabled={!notificationSettings.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your security and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" className="mt-2" />
                </div>

                <Button>Change Password</Button>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
