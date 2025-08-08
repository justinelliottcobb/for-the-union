import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Progress,
  Stack,
  Table,
  Badge,
  RingProgress,
  Center,
} from '@mantine/core';
import { useProgress } from '@/hooks/useProgress';
import { useExercises } from '@/hooks/useExercises';

export function ProgressPage() {
  const { getOverallProgress, getAllExerciseProgress, getCategoryProgress } = useProgress();
  const { categories } = useExercises();
  const overallProgress = getOverallProgress();
  const allProgress = getAllExerciseProgress();

  const completionPercentage = Math.round(
    (overallProgress.completedExercises / overallProgress.totalExercises) * 100
  ) || 0;

  return (
    <Container size="lg">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">
            Learning Progress
          </Title>
          <Text size="lg" c="dimmed">
            Track your TypeScript learning journey
          </Text>
        </div>

        {/* Overall Progress */}
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          <Card withBorder padding="lg">
            <Center>
              <RingProgress
                size={120}
                thickness={12}
                sections={[
                  { value: completionPercentage, color: 'blue' },
                ]}
                label={
                  <Text ta="center" fw={700} size="xl">
                    {completionPercentage}%
                  </Text>
                }
              />
            </Center>
            <Text ta="center" mt="md" fw={500}>
              Overall Completion
            </Text>
          </Card>

          <Card withBorder padding="lg">
            <Stack gap="xs">
              <Text fw={500}>Total Time Spent</Text>
              <Text size="xl" fw={700} c="blue">
                {Math.floor(overallProgress.totalTimeSpent / 60)}h{' '}
                {overallProgress.totalTimeSpent % 60}m
              </Text>
              <Text size="sm" c="dimmed">
                Average: {Math.round(overallProgress.averageCompletionTime)}m per exercise
              </Text>
            </Stack>
          </Card>

          <Card withBorder padding="lg">
            <Stack gap="xs">
              <Text fw={500}>Exercises Completed</Text>
              <Text size="xl" fw={700} c="green">
                {overallProgress.completedExercises}
              </Text>
              <Text size="sm" c="dimmed">
                out of {overallProgress.totalExercises} total
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Category Progress */}
        <div>
          <Title order={2} mb="md">
            Category Progress
          </Title>
          
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            {categories.map((category) => {
              const progress = getCategoryProgress(category.id);
              const percentage = Math.round((progress.completed / progress.total) * 100) || 0;

              return (
                <Card key={category.id} withBorder padding="lg">
                  <Group justify="space-between" mb="md">
                    <Text fw={500}>{category.name}</Text>
                    <Badge variant="light">
                      {progress.completed}/{progress.total}
                    </Badge>
                  </Group>

                  <Progress value={percentage} size="lg" mb="md" />

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {percentage}% complete
                    </Text>
                    <Text size="sm" c="dimmed">
                      {category.exercises.reduce((acc, ex) => acc + ex.estimatedTime, 0)} min total
                    </Text>
                  </Group>
                </Card>
              );
            })}
          </SimpleGrid>
        </div>

        {/* Recent Activity */}
        <div>
          <Title order={2} mb="md">
            Recent Activity
          </Title>
          
          <Card withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Exercise</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Attempts</Table.Th>
                  <Table.Th>Time Spent</Table.Th>
                  <Table.Th>Last Activity</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {allProgress
                  .filter(p => p.status !== 'not_started')
                  .slice(0, 10)
                  .map((progress) => {
                    const exercise = categories
                      .flatMap(c => c.exercises)
                      .find(e => e.id === progress.exerciseId);

                    if (!exercise) return null;

                    const statusColor = {
                      in_progress: 'orange',
                      completed: 'green',
                      failed: 'red',
                      not_started: 'gray',
                    }[progress.status];

                    return (
                      <Table.Tr key={progress.exerciseId}>
                        <Table.Td>
                          <div>
                            <Text fw={500}>{exercise.title}</Text>
                            <Text size="xs" c="dimmed">
                              {categories.find(c => c.exercises.includes(exercise))?.name}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={statusColor} variant="light" size="sm">
                            {progress.status.replace('_', ' ')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{progress.attempts}</Table.Td>
                        <Table.Td>{Math.round(progress.timeSpent)}m</Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {progress.completionTime || progress.startTime
                              ? new Date(
                                  progress.completionTime || progress.startTime!
                                ).toLocaleDateString()
                              : 'Never'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
              </Table.Tbody>
            </Table>
          </Card>
        </div>
      </Stack>
    </Container>
  );
}