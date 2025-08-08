import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  Title,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  Divider,
  Alert,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconExternalLink,
  IconRefresh,
  IconBulb,
  IconCheck,
  IconX,
  IconClock,
} from '@tabler/icons-react';
import { useExercises } from '@/hooks/useExercises';
import { useProgress } from '@/hooks/useProgress';
import { ExerciseViewer } from '@components/ExerciseViewer';
import { TestRunner } from '@components/TestRunner';

export function ExercisePage() {
  const { categoryId, exerciseId } = useParams<{ categoryId: string; exerciseId: string }>();
  const navigate = useNavigate();
  const { getExercise } = useExercises();
  const { getExerciseProgress, updateExerciseProgress } = useProgress();
  const [isRunning, setIsRunning] = useState(false);

  const exercise = getExercise(categoryId!, exerciseId!);
  const progress = getExerciseProgress(exerciseId!);

  useEffect(() => {
    if (exercise && progress.status === 'not_started') {
      updateExerciseProgress(exercise.id, { status: 'in_progress', startTime: new Date() });
    }
  }, [exercise, progress.status]);

  if (!exercise) {
    return (
      <Container>
        <Alert color="red" title="Exercise Not Found">
          The requested exercise could not be found.
        </Alert>
      </Container>
    );
  }

  const handleOpenInEditor = () => {
    // In a real implementation, this would open the file in the user's preferred editor
    window.open(`file://${exercise.filePath}`, '_blank');
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    // Implement test running logic
    setTimeout(() => setIsRunning(false), 2000);
  };

  const handleResetExercise = () => {
    updateExerciseProgress(exercise.id, {
      status: 'not_started',
      startTime: undefined,
      completionTime: undefined,
      attempts: 0,
      timeSpent: 0,
      hintsUsed: [],
    });
  };

  const statusColor = {
    not_started: 'gray',
    in_progress: 'orange',
    completed: 'green',
    failed: 'red',
  }[progress.status];

  return (
    <Container size="xl" style={{ height: 'calc(100vh - 60px)' }}>
      <Grid style={{ height: '100%' }} gutter="md">
        {/* Left side - Instructions and details */}
        <Grid.Col span={{ base: 12, md: 6 }} style={{ height: '100%' }}>
          <Stack style={{ height: '100%' }}>
            <Card withBorder padding="lg" style={{ flexShrink: 0 }}>
              <Group justify="space-between" mb="md">
                <div>
                  <Title order={2}>{exercise.title}</Title>
                  <Text size="sm" c="dimmed" mt="xs">
                    {exercise.description}
                  </Text>
                </div>
                <Stack gap="xs" align="flex-end">
                  <Badge color={statusColor} variant="light">
                    {progress.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    Difficulty: {exercise.difficulty}/5
                  </Badge>
                </Stack>
              </Group>

              <Group mb="md">
                <Group gap="xs">
                  <IconClock size={16} />
                  <Text size="sm">~{exercise.estimatedTime} min</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Attempts: {progress.attempts}
                </Text>
                {progress.timeSpent > 0 && (
                  <Text size="sm" c="dimmed">
                    Time: {Math.round(progress.timeSpent)}m
                  </Text>
                )}
              </Group>

              <Group gap="xs">
                <Button
                  leftSection={<IconExternalLink size={16} />}
                  onClick={handleOpenInEditor}
                  variant="filled"
                >
                  Open in Editor
                </Button>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  onClick={handleRunTests}
                  loading={isRunning}
                  variant="light"
                >
                  Run Tests
                </Button>
                <Tooltip label="Reset exercise progress">
                  <ActionIcon
                    onClick={handleResetExercise}
                    variant="subtle"
                    color="gray"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Card>

            <Card withBorder padding="lg" style={{ flexGrow: 1, overflow: 'hidden' }}>
              <ExerciseViewer exercise={exercise} />
            </Card>

            {exercise.hints.length > 0 && (
              <Card withBorder padding="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={500} size="sm">
                    Hints ({exercise.hints.length})
                  </Text>
                  <ActionIcon size="sm" variant="subtle">
                    <IconBulb size={14} />
                  </ActionIcon>
                </Group>
                <Text size="xs" c="dimmed">
                  Click to reveal hints if you get stuck
                </Text>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Right side - Test results and output */}
        <Grid.Col span={{ base: 12, md: 6 }} style={{ height: '100%' }}>
          <TestRunner
            exercise={exercise}
            onStatusChange={(status) =>
              updateExerciseProgress(exercise.id, { status })
            }
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
}