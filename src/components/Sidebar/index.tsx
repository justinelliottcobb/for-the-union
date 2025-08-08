import { useState } from 'react';
import {
  Stack,
  NavLink,
  Title,
  Progress,
  Badge,
  Group,
  Text,
  Accordion,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconDashboard,
  IconChartBar,
  IconSettings,
  IconBulb,
  IconCheck,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExercises } from '@/hooks/useExercises';
import { useProgress } from '@/hooks/useProgress';
import type { ExerciseStatus } from '@/types';

const statusIcons: Record<ExerciseStatus, React.ReactNode> = {
  not_started: <IconClock size={14} color="gray" />,
  in_progress: <IconBulb size={14} color="orange" />,
  completed: <IconCheck size={14} color="green" />,
  failed: <IconX size={14} color="red" />,
};

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories } = useExercises();
  const { getExerciseProgress, getCategoryProgress } = useProgress();
  const [openCategories, setOpenCategories] = useState<string[]>(['discriminated-unions']);

  const isActive = (path: string) => location.pathname === path;
  const isExerciseActive = (categoryId: string, exerciseId: string) => 
    location.pathname === `/exercise/${categoryId}/${exerciseId}`;

  return (
    <Stack gap="md" p="md" style={{ height: '100vh', overflow: 'auto' }}>
      <Title order={3} ta="center" c="blue">
        TypeScript Exercises
      </Title>

      <Stack gap="xs">
        <NavLink
          label="Dashboard"
          leftSection={<IconDashboard size={20} />}
          active={isActive('/dashboard')}
          onClick={() => navigate('/dashboard')}
        />
        
        <NavLink
          label="Progress"
          leftSection={<IconChartBar size={20} />}
          active={isActive('/progress')}
          onClick={() => navigate('/progress')}
        />
        
        <NavLink
          label="Settings"
          leftSection={<IconSettings size={20} />}
          active={isActive('/settings')}
          onClick={() => navigate('/settings')}
        />
      </Stack>

      <Accordion
        multiple
        value={openCategories}
        onChange={setOpenCategories}
        variant="separated"
      >
        {categories.map((category) => {
          const progress = getCategoryProgress(category.id);
          const progressPercentage = Math.round((progress.completed / progress.total) * 100) || 0;

          return (
            <Accordion.Item key={category.id} value={category.id}>
              <Accordion.Control>
                <Group justify="space-between" gap="xs">
                  <Group gap="xs">
                    <Text fw={500} size="sm">
                      {category.name}
                    </Text>
                    <Badge size="xs" variant="light">
                      {progress.completed}/{progress.total}
                    </Badge>
                  </Group>
                </Group>
                <Progress
                  value={progressPercentage}
                  size="xs"
                  mt="xs"
                  color={progressPercentage === 100 ? 'green' : 'blue'}
                />
              </Accordion.Control>

              <Accordion.Panel>
                <Stack gap="xs">
                  {category.exercises.map((exercise) => {
                    const exerciseProgress = getExerciseProgress(exercise.id);
                    const active = isExerciseActive(category.id, exercise.id);

                    return (
                      <NavLink
                        key={exercise.id}
                        label={
                          <Group justify="space-between">
                            <Text size="sm">{exercise.title}</Text>
                            <Group gap="xs">
                              <Tooltip label={`Difficulty: ${exercise.difficulty}/5`}>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={
                                    exercise.difficulty <= 2
                                      ? 'green'
                                      : exercise.difficulty <= 4
                                      ? 'yellow'
                                      : 'red'
                                  }
                                >
                                  {exercise.difficulty}
                                </Badge>
                              </Tooltip>
                              {statusIcons[exerciseProgress.status]}
                            </Group>
                          </Group>
                        }
                        active={active}
                        onClick={() => navigate(`/exercise/${category.id}/${exercise.id}`)}
                        pl="md"
                      />
                    );
                  })}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Stack>
  );
}