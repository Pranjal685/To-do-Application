import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Settings as SettingsIcon, Bell, Flag, RefreshCw, Calendar as CalendarIcon, Download, Upload } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, resetSettings } = useSettings();
  const importInputRef = useRef<HTMLInputElement>(null);

  const dueDateOffsetPreview = useMemo(() => {
    const days = settings.defaultDueDateOffsetDays;
    if (!days && days !== 0) return 'None';
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleString();
  }, [settings.defaultDueDateOffsetDays]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your AI Todo experience</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Theme</p>
                <div className="flex gap-2">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Light</Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Dark</Button>
                  <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>System</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Data & Backup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ai-todo-settings-${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" /> Export Settings
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const imported = JSON.parse(text);
                      updateSettings(imported);
                    } catch (err) {
                      console.error('Failed to import settings', err);
                    } finally {
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button onClick={() => importInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Import Settings
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Export your preferences to a JSON file or import them later.</p>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Desktop notifications</p>
                  <p className="text-sm text-muted-foreground">Allow task reminders and updates</p>
                </div>
                <Switch
                  checked={settings.desktopNotifications}
                  onCheckedChange={(v) => updateSettings({ desktopNotifications: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2">Reminder minutes before due</label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.reminderMinutesBefore ?? ''}
                    placeholder="e.g. 30"
                    onChange={(e) =>
                      updateSettings({
                        reminderMinutesBefore: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">Leave empty to disable due-date reminders</p>
              </div>
            </CardContent>
          </Card>

          {/* Task view */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>Task View</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort by</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={settings.taskView.sortBy}
                    onChange={(e) =>
                      updateSettings({ taskView: { ...settings.taskView, sortBy: e.target.value as any } })
                    }
                  >
                    <option value="due_date">Due date</option>
                    <option value="priority">Priority</option>
                    <option value="created_at">Created</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Group by</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={settings.taskView.groupBy}
                    onChange={(e) =>
                      updateSettings({ taskView: { ...settings.taskView, groupBy: e.target.value as any } })
                    }
                  >
                    <option value="none">None</option>
                    <option value="status">Status</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-medium">Show completed</p>
                    <p className="text-sm text-muted-foreground">Include done tasks in lists</p>
                  </div>
                  <Switch
                    checked={settings.taskView.showCompleted}
                    onCheckedChange={(v) =>
                      updateSettings({ taskView: { ...settings.taskView, showCompleted: v } })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="w-5 h-5" />
                <span>Task Defaults</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Default priority</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={settings.defaultPriority}
                    onChange={(e) => updateSettings({ defaultPriority: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Default duration (min)</label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.defaultEstimatedDuration ?? ''}
                    placeholder="e.g. 30"
                    onChange={(e) =>
                      updateSettings({
                        defaultEstimatedDuration: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Default due in (days)</label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.defaultDueDateOffsetDays ?? ''}
                    placeholder="None"
                    onChange={(e) =>
                      updateSettings({
                        defaultDueDateOffsetDays: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">Preview: {dueDateOffsetPreview}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar & Pomodoro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Calendar & Pomodoro</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First day of week</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={settings.calendar.firstDayOfWeek}
                    onChange={(e) =>
                      updateSettings({ calendar: { ...settings.calendar, firstDayOfWeek: Number(e.target.value) as 0 | 1 } })
                    }
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Focus</label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.pomodoro.focusMinutes}
                      onChange={(e) =>
                        updateSettings({ pomodoro: { ...settings.pomodoro, focusMinutes: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Short</label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.pomodoro.shortBreakMinutes}
                      onChange={(e) =>
                        updateSettings({ pomodoro: { ...settings.pomodoro, shortBreakMinutes: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Long</label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.pomodoro.longBreakMinutes}
                      onChange={(e) =>
                        updateSettings({ pomodoro: { ...settings.pomodoro, longBreakMinutes: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Long break every (N focus)</label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.pomodoro.longBreakEvery}
                      onChange={(e) =>
                        updateSettings({ pomodoro: { ...settings.pomodoro, longBreakEvery: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cycles per block</label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.pomodoro.cyclesPerBlock}
                      onChange={(e) =>
                        updateSettings({ pomodoro: { ...settings.pomodoro, cyclesPerBlock: Number(e.target.value) } })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Auto-start next phase</p>
                    <p className="text-sm text-muted-foreground">Automatically start the next focus/break phase</p>
                  </div>
                </div>
                <Switch
                  checked={settings.pomodoro.autoStartNextPhase}
                  onCheckedChange={(v) =>
                    updateSettings({ pomodoro: { ...settings.pomodoro, autoStartNextPhase: v } })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-start next Pom</p>
                    <p className="text-sm text-muted-foreground">Start next Pomodoro block automatically</p>
                  </div>
                  <Switch
                    checked={settings.pomodoro.autoStartNextPom}
                    onCheckedChange={(v) =>
                      updateSettings({ pomodoro: { ...settings.pomodoro, autoStartNextPom: v } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">Show desktop alerts when a session ends</p>
                  </div>
                  <Switch
                    checked={settings.pomodoro.enableNotifications}
                    onCheckedChange={(v) =>
                      updateSettings({ pomodoro: { ...settings.pomodoro, enableNotifications: v } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sounds</p>
                    <p className="text-sm text-muted-foreground">Play chimes and ambient sounds</p>
                  </div>
                  <Switch
                    checked={settings.pomodoro.enableSounds}
                    onCheckedChange={(v) =>
                      updateSettings({ pomodoro: { ...settings.pomodoro, enableSounds: v } })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={resetSettings}>Reset to defaults</Button>
        </div>
      </motion.div>
    </div>
  );
}