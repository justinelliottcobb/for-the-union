import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Progress,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconPlay, IconCheck, IconClock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useExercises } from '@/hooks/useExercises';
import { useProgress } from '@/hooks/useProgress';

export function DashboardPage() {
  const navigate = useNavigate();
  const { categories } = useExercises();
  const { getCategoryProgress, getOverallProgress } = useProgress();
  const overallProgress = getOverallProgress();

  const handleStartExercise = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      const firstIncompleteExercise = category.exercises.find(exercise => {
        const progress = getProgress().exercises.find(p => p.exerciseId === exercise.id);
        return !progress || progress.status !== 'completed';
      });
      
      if (firstIncompleteExercise) {
        navigate(`/exercise/${categoryId}/${firstIncompleteExercise.id}`);
      }
    }
  };

  return (
    <Container size="lg">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">
            Welcome to TypeScript Exercises
          </Title>
          <Text size="lg" c="dimmed">
            Master TypeScript through hands-on practice with our interactive exercise platform
          </Text>
        </div>

        <Card withBorder padding="xl">
          <Group justify="space-between" mb="md">
            <Title order={3}>Overall Progress</Title>
            <Badge size="lg" variant="light">
              {overallProgress.completedExercises}/{overallProgress.totalExercises} completed
            </Badge>
          </Group>
          
          <Progress
            value={(overallProgress.completedExercises / overallProgress.totalExercises) * 100}
            size="xl"
            radius="md"
            color="blue"
          />
          
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              Time spent: {Math.round(overallProgress.totalTimeSpent / 60)}h {overallProgress.totalTimeSpent % 60}m
            </Text>
            <Text size="sm" c="dimmed">
              {Math.round((overallProgress.completedExercises / overallProgress.totalExercises) * 100)}% complete
            </Text>
          </Group>
        </Card>

        <div>
          <Title order={2} mb="md">
            Exercise Categories
          </Title>
          
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
            {categories.map((category) => {
              const progress = getCategoryProgress(category.id);
              const progressPercentage = Math.round((progress.completed / progress.total) * 100) || 0;
              const isCompleted = progressPercentage === 100;

              return (
                <Card key={category.id} withBorder padding="lg" radius="md">
                  <Group justify="space-between" mb="md">
                    <Title order={4}>{category.name}</Title>
                    <Tooltip label={isCompleted ? 'Category completed!' : 'Start or continue'}>
                      <ActionIcon
                        size="lg"
                        variant="light"
                        color={isCompleted ? 'green' : 'blue'}
                        onClick={() => handleStartExercise(category.id)}
                      >
                        {isCompleted ? <IconCheck size={20} /> : <IconPlay size={20} />}
                      </ActionIcon>
                    </Tooltip>
                  </Group>

                  <Text size="sm" c="dimmed" mb="md">
                    {category.description}
                  </Text>

                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>
                        Progress
                      </Text>
                      <Badge size="sm" variant="light">
                        {progress.completed}/{progress.total}
                      </Badge>
                    </Group>
                    
                    <Progress
                      value={progressPercentage}
                      size="md"
                      color={isCompleted ? 'green' : 'blue'}
                    />
                  </Stack>

                  <Group justify="space-between" mt="md">
                    <Group gap="xs">
                      <IconClock size={16} color="gray" />
                      <Text size="xs" c="dimmed">
                        ~{category.exercises.reduce((acc, ex) => acc + ex.estimatedTime, 0)} min
                      </Text>
                    </Group>
                    <Badge
                      size="xs"
                      variant="dot"
                      color={
                        progress.completed === 0
                          ? 'gray'
                          : progress.completed === progress.total
                          ? 'green'
                          : 'blue'
                      }
                    >
                      {progress.completed === 0
                        ? 'Not Started'
                        : progress.completed === progress.total
                        ? 'Completed'
                        : 'In Progress'}
                    </Badge>
                  </Group>
                </Card>
              );
            })}
          </SimpleGrid>
        </div>
      </Stack>
    </Container>
  );
}

// Temporary placeholder for useProgress hook
function getProgress() {
  return { exercises: [] };
}