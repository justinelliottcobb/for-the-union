import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Switch,
  Select,
  Button,
  Group,
  Divider,
  Alert,
} from '@mantine/core';
import { useColorScheme, useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconDownload, IconUpload, IconTrash } from '@tabler/icons-react';
import type { UserSettings } from '@/types';

const defaultSettings: UserSettings = {
  theme: 'auto',
  autoSave: true,
  showHints: true,
  preferredEditor: 'vscode',
  notifications: true,
};

export function SettingsPage() {
  const [settings, setSettings] = useLocalStorage<UserSettings>({
    key: 'typescript-exercises-settings',
    defaultValue: defaultSettings,
  });

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    notifications.show({
      message: 'Setting updated successfully',
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };

  const exportProgress = () => {
    const progress = localStorage.getItem('typescript-exercises-progress');
    if (progress) {
      const blob = new Blob([progress], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `typescript-exercises-progress-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.show({
        message: 'Progress exported successfully',
        color: 'green',
        icon: <IconDownload size={16} />,
      });
    }
  };

  const importProgress = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            JSON.parse(content); // Validate JSON
            localStorage.setItem('typescript-exercises-progress', content);
            notifications.show({
              message: 'Progress imported successfully',
              color: 'green',
              icon: <IconUpload size={16} />,
            });
          } catch {
            notifications.show({
              message: 'Invalid progress file',
              color: 'red',
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
      localStorage.removeItem('typescript-exercises-progress');
      notifications.show({
        message: 'All progress has been reset',
        color: 'orange',
        icon: <IconTrash size={16} />,
      });
    }
  };

  return (
    <Container size="md">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">
            Settings
          </Title>
          <Text size="lg" c="dimmed">
            Customize your learning experience
          </Text>
        </div>

        {/* Appearance */}
        <Card withBorder padding="lg">
          <Title order={3} mb="md">
            Appearance
          </Title>
          <Stack gap="md">
            <Select
              label="Theme"
              description="Choose your preferred color scheme"
              value={settings.theme}
              onChange={(value) => updateSetting('theme', value as UserSettings['theme'])}
              data={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'Auto (system)' },
              ]}
            />
          </Stack>
        </Card>

        {/* Learning */}
        <Card withBorder padding="lg">
          <Title order={3} mb="md">
            Learning
          </Title>
          <Stack gap="md">
            <Switch
              label="Show hints"
              description="Display hint buttons when available"
              checked={settings.showHints}
              onChange={(event) =>
                updateSetting('showHints', event.currentTarget.checked)
              }
            />
            <Switch
              label="Auto-save progress"
              description="Automatically save your progress as you complete exercises"
              checked={settings.autoSave}
              onChange={(event) =>
                updateSetting('autoSave', event.currentTarget.checked)
              }
            />
            <Switch
              label="Notifications"
              description="Show notifications for achievements and updates"
              checked={settings.notifications}
              onChange={(event) =>
                updateSetting('notifications', event.currentTarget.checked)
              }
            />
          </Stack>
        </Card>

        {/* Editor */}
        <Card withBorder padding="lg">
          <Title order={3} mb="md">
            Editor
          </Title>
          <Stack gap="md">
            <Select
              label="Preferred Editor"
              description="Default editor to open when clicking 'Open in Editor'"
              value={settings.preferredEditor}
              onChange={(value) =>
                updateSetting('preferredEditor', value as UserSettings['preferredEditor'])
              }
              data={[
                { value: 'vscode', label: 'Visual Studio Code' },
                { value: 'webstorm', label: 'WebStorm' },
                { value: 'vim', label: 'Vim/Neovim' },
                { value: 'emacs', label: 'Emacs' },
                { value: 'sublime', label: 'Sublime Text' },
                { value: 'atom', label: 'Atom' },
              ]}
            />
          </Stack>
        </Card>

        {/* Data Management */}
        <Card withBorder padding="lg">
          <Title order={3} mb="md">
            Data Management
          </Title>
          <Stack gap="md">
            <Alert color="blue" title="Backup Your Progress">
              Your progress is stored locally in your browser. Consider exporting it regularly to avoid losing your data.
            </Alert>

            <Group>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={exportProgress}
                variant="light"
              >
                Export Progress
              </Button>
              <Button
                leftSection={<IconUpload size={16} />}
                onClick={importProgress}
                variant="light"
              >
                Import Progress
              </Button>
            </Group>

            <Divider />

            <div>
              <Text fw={500} size="sm" mb="xs">
                Reset Progress
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                This will permanently delete all your progress and cannot be undone.
              </Text>
              <Button
                leftSection={<IconTrash size={16} />}
                onClick={resetProgress}
                color="red"
                variant="light"
              >
                Reset All Progress
              </Button>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}